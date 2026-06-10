# Frontend localStorage schema — actual state

> **Date**: 2026-06-07
> **Owner**: Алекс (Frontend) / делал Клод в его роли
> **Purpose**: контракт между текущим (Phase 1) фронтом и будущим (Phase 2) backend'ом.
> Каждая строка `localStorage[key]` имеет:
> - **shape** — поля и типы
> - **writers** — модули, которые пишут
> - **readers** — модули, которые читают
> - **lifecycle** — когда создаётся, когда чистится
> - **backend mapping** — на какую таблицу/endpoint мигрирует в Sprint 2-3

Зачем: Sprint 2 (`migrate-guest`) и Sprint 3 (`/me/progress` sync) нужны точные shape'ы для INSERT/PATCH запросов. Без этого dump'а — Борис потратит ~0.5d на reverse-engineering. Это критический-path артефакт из [dependency_map](../../../.sessions/sprints/dependency_map.md) D2-5 + D3-7.

---

## TL;DR — 10 ключей по категориям

| Категория | Keys | Sync to backend? |
|---|---|---|
| **User identity** | `typing_trainer_user_profile` | ✅ Sprint 1-3 (users + user_settings) |
| **Curriculum progress** | `typing_trainer_lesson_progress`, `typing_trainer_test_history` | ✅ Sprint 3 (progress + attempts) |
| **User-generated content** | `typing_trainer_user_lessons`, `typing_trainer_certifications` | ⚠️ Sprint 9+ (отложено до beta) |
| **UI ephemeral state** | `typing_trainer_current_lesson`, `typing_trainer_display_toggles` | ❌ остаётся local-only |
| **Backward-compat / migration** | `typing_trainer_ui_language`, `typing_trainer_migration_bestwpm_v1` | ❌ legacy, deprecate |
| **API client config** | `typing_trainer_api_client_config` | ❌ local-only (config адаптера) |

---

## 1. `typing_trainer_user_profile` (CORE)

Главная сущность фронта. Содержит **профиль + настройки + auth-флаг + кастомные toggle'ы**. На backend разделится на 3 таблицы (`users`, `user_settings`, `oauth_accounts`).

### Shape

```typescript
{
  // Identity (→ backend users table)
  name:                string;                // 1-80 chars, обязательно
  gender:              'm' | 'f' | null;      // null до явного выбора
  genderManual:        boolean;               // флаг: юзер сам нажал М/Ж (vs autodetect по имени)
  audience:            'adult' | 'teen' | 'kid';
  character:           'anna' | 'maxim' | 'knopych' | 'klavochka';
  mentor:              'anna' | 'maxim' | 'knopych' | 'klavochka';  // = character (legacy duplicate)
  language:            'ru' | 'en';

  // Auth state (→ backend session/jwt)
  onboardingCompleted: boolean;
  createdAt:           string;                 // ISO 8601, проставляется в момент complete

  // Keyboard preferences (→ backend user_settings)
  keyboardType:        'classic' | 'laptop' | 'ergonomic';
  keyboardLayout:      'standard' | 'phonetic' | 'typewriter' | 'mac';

  // Task toolbar toggles (→ backend user_settings)
  fingerHint?:         boolean;                // дефолт true
  keySound?:           boolean;                // дефолт false
  metronome?:          boolean;                // дефолт false
  taskZoom?:           number;                 // 70-150, дефолт 100
  hideIndicator?:      boolean;                // дефолт false (ADR-?? Sprint 0 Polish pack)
  previewOff?:         boolean;                // дефолт false
}
```

### Writers
- `onboarding.js:407-411` — финальный `submit()` пишет полный объект
- `dashboard.js:130-132` — `lpLogout` flow восстанавливает после миграции
- `settings.js` (все handler'ы) — patch'ит индивидуальные поля
- `settings-panel.js` (legacy fallback)
- `task.js` через `saveKbPref()` — keyboardType/Layout, fingerHint, keySound, metronome, taskZoom, hideIndicator, previewOff

### Readers
- **Все** page-script'ы (читают на старте для роутинга и UI)
- `router-guard.js` — гейт защищённых страниц
- `character-system.js` — readUserLanguage() для подгрузки нужного {ru,en}.json
- `i18n.js` — `language` для выбора локали
- `keyboard.js` — раскладка для виртуальной клавиатуры
- `portraits.js` — gender для аватара

### Lifecycle
- Создаётся: в момент `submit()` онбординга
- Уничтожается: `dashboard.js:lpLogout()` → `localStorage.removeItem()`
- Не TTL'ится, не expirится

### Backend mapping (Sprint 1-3)

| LS field | Backend table | Backend column | Notes |
|---|---|---|---|
| `name` | `users` | `name` | 1-80 chars |
| `gender` | `users` | `gender` | `CHAR(1)` nullable |
| `genderManual` | `users` | (не хранится) | Это transient UI state, backend не нужен |
| `audience` | `users` | `audience` | `VARCHAR(10)` |
| `character` | `users` | `character` | `VARCHAR(20)` |
| `mentor` | (legacy duplicate) | — | Игнорируется при миграции (= character) |
| `language` | `users` | `language` | `CHAR(2)` |
| `onboardingCompleted` | `users.email_verified` или session | — | На backend подразумевается из факта существования user'а |
| `createdAt` | `users.created_at` | `created_at` | ISO 8601 → TIMESTAMPTZ |
| `keyboardType` | `user_settings` | `keyboard_type` | |
| `keyboardLayout` | `user_settings` | `keyboard_layout` | |
| `fingerHint` | `user_settings` | `finger_hint` | дефолт TRUE |
| `keySound` | `user_settings` | `key_sound` | дефолт FALSE |
| `metronome` | `user_settings` | `metronome` | дефолт FALSE |
| `taskZoom` | `user_settings` | `task_zoom` | SMALLINT 70-150 |
| `hideIndicator` | `user_settings` | `hide_indicator` | |
| `previewOff` | `user_settings` | `preview_off` | |

### Migration risks
- ⚠️ **`mentor` ≠ `character`?** В коде они синхронизированы (`profile.mentor = profile.character`), но backend hardcode на `character` — при миграции игнорировать `mentor` (legacy).
- ⚠️ **`genderManual` НЕ мигрируется.** Это UX state онбординга, не backend контракт.
- ⚠️ Если на момент signin'а у юзера есть оба `typing_trainer_user_profile` (от прошлой анонимной сессии) и creds от account'а — `POST /auth/migrate-guest` решает конфликт по [ADR-001](../decisions/ADR-001.md).

---

## 2. `typing_trainer_lesson_progress`

Прогресс по урокам — звёзды + best metrics + completed_at per lesson.

### Shape

```typescript
{
  [lessonNumber: string]: {  // ключ — String(N), не number
    stars:        0 | 1 | 2 | 3 | 4 | 5;
    bestWPM:      number;     // [0, 1500] после cap из ADR R-WPM (router-guard migration)
    bestAccuracy: number;     // [0, 100]
    bestTime:     number;     // секунды (float)
    completedAt:  string;     // ISO 8601, последнее обновление
  }
}
```

⚠️ **Tier НЕ хранится** — урок 1 в `tier1` и в `ru_kids` пишутся в одну строку. При миграции на backend мы это разделяем: схема `progress` keyed by `(user_id, tier, lesson_num)`.

### Writers
- `task.js:finishExercise()` — единственная точка записи

### Readers
- `dashboard.js` — для метрик и top-card
- `course.js` — для прогресс-баров модулей
- `lesson-page.js` — для гейта линейной прогрессии
- `task.js` — для firstUncompleted check
- `achievements.js` — `computeStats(progress, history, totalLessons)`
- `profile.js` — для info-карточек

### Lifecycle
- Создаётся: после первого `finishExercise()`
- Уничтожается: `settings.js` reset flow

### Backend mapping (Sprint 3)

→ Table `progress` (TSD §2.2). При миграции:
```sql
-- В POST /auth/migrate-guest:
INSERT INTO progress (user_id, tier, lesson_num, stars, best_wpm, best_accuracy, best_time, completed_at)
SELECT
  $user_id,
  $current_tier,         -- pickTier(profile) — server reconstructs
  CAST(key AS INTEGER),
  (value->>'stars')::SMALLINT,
  LEAST((value->>'bestWPM')::INTEGER, 1500),       -- safety cap
  (value->>'bestAccuracy')::SMALLINT,
  ((value->>'bestTime')::FLOAT * INTERVAL '1 second'),
  (value->>'completedAt')::TIMESTAMPTZ
FROM jsonb_each($guest_data->'lessonProgress');
```

### Migration risks
- 🔴 **Tier-shift** — если юзер менял `character/language` в LS, прогресс в LS уже «грязный» (мешанина двух tier'ов в одном dict). При миграции на backend по умолчанию вешаем на `current_tier`. Сообщение юзеру: «прогресс мигрирован для текущего курса; если ты раньше был на другом — пиши support».
- ⚠️ **bestWPM cap**: ADR-fix `router-guard.js` мигрирует >1500 → 1500. После миграции бекенд тоже capит. Двойная защита.

---

## 3. `typing_trainer_test_history`

Полный history попыток (append-only). Используется для streaks, statistics, achievements.

### Shape

```typescript
Array<{
  lesson:      number;
  completedAt: string;    // ISO 8601
  duration:    number;    // секунды (float)
  wpm:         number;    // capped to 1500
  accuracy:    number;    // [0, 100]
  // rhythm: ?            // НЕ хранится сейчас (Sprint 0 Polish pack добавил rhythm в UI но не в LS)
}>
```

### Writers
- `task.js:finishExercise()` — append каждой attempt'ы
- `router-guard.js` — миграция wpm > 1500 → 1500 (one-shot)

### Readers
- `achievements.js:computeStats()` — для streaks, attempts count, errors-approx
- `dashboard.js` — для trend pills (D-W-trend)
- `profile.js` — для bar-chart активности (14 days)

### Lifecycle
- Append-only, никогда не truncate
- Удаляется: `settings.js` reset flow

### Backend mapping (Sprint 3)

→ Table `attempts` (TSD §2.2). При миграции:
```sql
INSERT INTO attempts (user_id, tier, lesson_num, wpm, accuracy, duration_ms, errors, rhythm, created_at)
SELECT
  $user_id,
  $current_tier,
  (item->>'lesson')::SMALLINT,
  LEAST((item->>'wpm')::INTEGER, 1500),
  (item->>'accuracy')::SMALLINT,
  ((item->>'duration')::FLOAT * 1000)::INTEGER,
  0,                                          -- errors не было в LS, дефолт 0
  NULL,                                       -- rhythm не было в LS
  (item->>'completedAt')::TIMESTAMPTZ
FROM jsonb_array_elements($guest_data->'testHistory') AS item;
```

### Migration risks
- ⚠️ Старые attempts не имеют `errors` и `rhythm` — на backend defaults (0 / NULL).
- ⚠️ Tier тот же риск, что у `lesson_progress`.

---

## 4. `typing_trainer_user_lessons`

Кастомные уроки из Lesson Builder. **Sprint 9+** — пока остаётся local-only.

### Shape

```typescript
Array<{
  id:          number;        // Date.now() при создании
  title:       string;
  text:        string;
  target_wpm:  number;        // 5-200
  error_limit: number;        // 0-20
  createdAt:   string;        // ISO 8601
}>
```

### Writers / Readers
- `builder.js` — единственный модуль работающий с этим ключом

### Lifecycle
- CRUD через UI Builder

### Backend mapping
- **Sprint 9** или позже. Низкий приоритет, не критично для launch.

### Migration risks
- Backend для custom lessons добавит новые поля (`user_id`, `is_public`, etc) — миграция должна быть аккуратной по schema versioning.

---

## 5. `typing_trainer_certifications`

Заглушка для будущей системы сертификатов. Сейчас почти не пишется.

### Shape
```typescript
Array<{
  course:   string;
  awardedAt: string;
  // ... TBD
}>
```

### Writers
- `certification.js` (legacy stub, фактически только читается)
- `settings.js` reset flow

### Backend mapping
- **Sprint 9** или позже. Пока — не migrate (нет данных в LS у реальных юзеров).

---

## 6. `typing_trainer_current_lesson`

UI state: «какой урок открыт прямо сейчас» — для redirect после login или resume.

### Shape

```typescript
{
  tier:         string;     // 'tier1', 'ru_teen', ...
  lessonNumber: number;
  lastSaved:    string;     // ISO 8601
}
```

### Writers
- `task.js:finishExercise()` — обновляет после каждого упражнения
- `course.js`, `lesson-page.js` — при выборе урока

### Lifecycle
- Перезаписывается, не растёт

### Backend mapping
- ❌ **NOT MIGRATED.** Это чисто UI state, не нужен на бекенде. На server-side юзер всегда знает «последний пройденный + 1» — это computable из `progress`.

---

## 7. `typing_trainer_display_toggles`

Состояние toolbar тогглов на task.html (`fingerHint`, `keySound`, `metronome`).

### Shape

```typescript
{
  fingerHint?: boolean;
  keySound?:   boolean;
  metronome?:  boolean;
}
```

### Writers / Readers
- `audio.js`, `keyboard.js` — legacy

### Backend mapping
- ❌ **NOT MIGRATED.** Дублирует поля в `typing_trainer_user_profile` (которые → `user_settings`). При миграции — DEPRECATE этот ключ.

---

## 8. `typing_trainer_ui_language`

Legacy дубль `profile.language` из старого монолитного UI. Сейчас почти не используется.

### Writers / Readers
- `main.js:357,369` — legacy

### Backend mapping
- ❌ **NOT MIGRATED.** Дублирует `users.language`. DEPRECATE.

---

## 9. `typing_trainer_migration_bestwpm_v1`

Migration flag для one-shot фикса bestWPM > 1500 (router-guard.js).

### Shape
```typescript
'1' // строка-маркер, наличие = миграция прошла
```

### Writers / Readers
- `router-guard.js` — pre-всего, on startup

### Backend mapping
- ❌ **NOT MIGRATED.** Это пер-устройство flag, фронтенд-internal.

---

## 10. `typing_trainer_api_client_config`

Config адаптера `api-client.js` (Sprint 0 deliverable). Управляет toggle `useApi` и baseUrl.

### Shape

```typescript
{
  baseUrl: string;
  useApi:  boolean;
  timeout: number;
  debug:   boolean;
}
```

### Writers / Readers
- `api-client.js` только

### Backend mapping
- ❌ Local-only client config.

---

## Что Борису нужно реализовать (cheat-sheet для Sprint 2-3)

### Endpoint `POST /auth/migrate-guest` (Sprint 2, S2.5)

```python
@router.post("/migrate-guest", response_model=UserResponse)
async def migrate_guest(payload: MigrateGuestRequest, ...) -> UserResponse:
    """Принимает guest_data (LS dump) → создаёт user + INSERT progress/attempts.

    payload.guest_data shape:
    {
      "profile": {...},          # см. §1 этого документа
      "lessonProgress": {...},   # см. §2
      "testHistory": [...],      # см. §3
    }
    """
    # 1. Создать users + user_settings (см. mapping §1)
    user = await create_user_from_guest(payload.guest_data["profile"])
    # 2. Reconstruct tier из (language, character)
    tier = pick_tier(user)
    # 3. INSERT progress (см. SQL §2)
    await insert_progress_from_guest(user.id, tier, payload.guest_data["lessonProgress"])
    # 4. INSERT attempts (см. SQL §3)
    await insert_attempts_from_guest(user.id, tier, payload.guest_data["testHistory"])
    # 5. Issue JWT, set cookie
    return user
```

### Endpoint `POST /me/progress` (Sprint 3, S3.4)

Принимает одну attempt:

```typescript
// Request (по TSD §3.7)
{
  tier: "tier1",
  lesson_num: 6,
  wpm: 42,
  accuracy: 96,
  duration_ms: 87000,
  errors: 1,
  rhythm: 78,
  completed_at: "2026-06-07T14:21:30Z"
}
```

Backend:
1. Server-side compute `stars` (зеркало `task.js` формулы: 0→5, ≤2→4, ≤5→3, ≤10→2, иначе 1)
2. UPSERT в `progress` с `Math.max(stars, prev.stars)`, etc
3. INSERT в `attempts`
4. Compute `newly_earned` через achievement_service
5. Return per TSD §3.7

---

## Open questions для Sprint 2-3 planning

1. **Кому достанется `bestWPM` при tier-shift'е после миграции?** Юзер мигрировал с tier1 lesson_progress[6].bestWPM=45 в `ru_teen`. На server-side эта строка должна попасть в `(user_id, 'tier1', 6)` или в `(user_id, 'ru_teen', 6)`? Текущее решение: используем `current_tier` (на момент signup). Это означает, что если юзер был на ru_teen анонимом, потом сменил character на anna → его LS-прогресс попадёт в `tier1`, и tier1 для него «начнётся со звёздами». Принимаем как известную trade-off (mass tier-switching — edge case).

2. **`onboardingCompleted=false` гость может ли мигрировать?** Сейчас migrate-guest рассчитан на «существующий профиль завершённого онбординга». Если юзер сделал онбординг частично (имя ввёл, но не submit'нул) — у него `profile.name`, но `onboardingCompleted=false`. **Решение**: backend требует `onboardingCompleted=true` в guest_data, иначе 422 `INCOMPLETE_ONBOARDING`.

3. **Дубль `mentor` ≠ `character`** — если в LS они почему-то рассинхронизированы, берём `character` (есть в TSD), игнорируем `mentor`.

4. **`createdAt` в guest_data** — использовать или server now()? **Решение**: использовать guest's `createdAt` (юзер «зарегистрировался когда онбординг прошёл», иначе ему обнулится «возраст аккаунта»).

---

## Changelog

| Date | Author | Change |
|---|---|---|
| 2026-06-07 | Алекс (играл Клод) | Initial dump; покрывает все 10 LS keys |
