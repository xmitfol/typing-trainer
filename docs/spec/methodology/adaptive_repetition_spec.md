# Adaptive Repetition & Weak-Keys Engine — спецификация

> **Owner:** Ася (AI/ML)
> **Status:** Phase 1 spec (rule-based, client-side, offline). Не финальный код — контракт для реализации.
> **Date:** 2026-06-25
> **Зона:** weak-keys analysis + adaptive difficulty (адаптация числа повторов гайдед-шагов).
> **Связанные доки:** [SOLO_methodology_brief.md](SOLO_methodology_brief.md), [localStorage_schema.md](../backend/legacy/localStorage_schema.md), профиль [ai-ml-agent.md](../../../.claude/agents/ai-ml-agent.md).
> **Числа помечены `[TUNE]`** — дефолты для запуска, подлежат калибровке на реальных данных.

---

## 1. Цель и принцип

**Запрос PO:** тренажёр должен адаптировать число повторов — где у человека получается, сокращать; где не получается, добавлять/повторять точечно.

**Принцип (в рамках методики СОЛО):**
- **Меньше повторов там, где освоено** — не давать заскучать (методика: «объём можно сокращать 15→10»).
- **Больше / точечно там, где слабо** — мышечная память через повторы (методика: «гаммы пианиста», «одна клавиша — много повторов»).
- **Точность важнее скорости.** Адаптация управляется в первую очередь error-rate, не WPM. На ранних уроках WPM не штрафуем (методический брифинг §6.4).
- **Не фрустрировать.** Жёсткие границы повторов (min/max), мягкий тон для детей, нормализация ошибок. Адаптация невидима пользователю (никаких «ты слабый на Н»).
- **Объяснимость (explainable):** любое решение движка трассируется до конкретного сигнала и порога (требование профиля: «Explain predictions»).

Зона действия Phase 1: **число повторов внутри гайдед-шагов** (`type:"step"`) + **точечный remediation-дрилл** на проблемную клавишу. Адаптация всего курса/последовательности уроков — вне Phase 1.

---

## 2. Сигналы (фичи)

### 2.1 Per-key (главный источник для weak-keys)
| Фича | Описание | Доступно сейчас? |
|---|---|---|
| `attempts` | сколько раз клавиша встречалась как `expected` | ❌ копить (в `handleKey` известен `expected`) |
| `errors` | сколько раз `e.key !== expected` на этой `expected`-клавише | ⚠️ есть общий `errors++`, **не per-key** |
| `errorRate` | `errors / attempts` | ❌ derived |
| `latencyMs` | время от предыдущего нажатия до текущего (hesitation) | ⚠️ есть `keyIntervals`, но **не привязаны к клавише** |
| `medianLatency` | устойчивее среднего к выбросам | ❌ derived |
| `correctStreak` | подряд верных за последние N касаний клавиши | ❌ копить |
| `confusedWith` | какая клавиша нажата вместо ожидаемой (для пар-конфузий) | ❌ копить (`e.key` известен) |

**В `handleKey` (task.js:300-349) уже есть всё необходимое для сбора:** `expected = targetText[typed]`, фактический `e.key`, `now`/`lastKeyTime` для латентности. Не хватает только **накопления per-key и записи** — это первый кусок реализации.

### 2.2 Per-step / per-lesson агрегаты
- `step.errorRate`, `step.medianLatency`, `step.passes` (сколько заходов на шаг).
- `lesson.accuracy`, `lesson.wpm`, `lesson.errors` — уже считаются (`calcAcc`, `calcWpm`).
- `rhythm` (CV интервалов) — уже считается в `calcRhythm()`, хороший прокси «автоматизма».

### 2.3 Speed plateau (тренд)
- Берём последние `N=5` [TUNE] значений `bestWPM`/attempt `wpm` из `test_history`.
- Плато = относительный рост `< 5%` [TUNE] за окно при `accuracy ≥ 95%`. Плато → сигнал «можно ускорять / усложнять», НЕ повод добавлять повторы (повторы лечат точность, не скорость).

> **Нормализация латентности.** Абсолютная мс зависит от человека/устройства. Используем **z-score внутри сессии/пользователя** или отношение к личной медиане, а не глобальный порог. Холодный старт см. §9.

---

## 3. Модель данных и хранение

### 3.1 Новый localStorage-ключ
Следуем паттерну `exercise-progress.js` (Вариант A: отдельный ключ, композит по tier — не ломает legacy-контракты и backend-маппинг).

- **Ключ:** `typing_trainer_key_stats` → добавить в `config/settings.js` → `storage.keys.keyStats`.
- **Композит:** `${tier}` верхним уровнем (как и в `lessonExercises` — чтобы tier1 vs ru_kids не смешивались).

```jsonc
// typing_trainer_key_stats
{
  "tier1": {
    "version": 1,
    "updatedAt": "2026-06-25T10:00:00Z",
    "keys": {
      "а": {
        "attempts": 120, "errors": 4,
        "latencies": [180,170,210, ...],   // ring buffer, max 30 [TUNE]
        "correctStreak": 18,
        "lastSeenAt": "2026-06-25T10:00:00Z",
        "confused": { "о": 2, "в": 1 }      // что нажимали вместо 'а'
      }
      // ... per key
    }
  }
}
```

Производные (`errorRate`, `medianLatency`, `mastery`) **не хранятся** — вычисляются on-read (дёшево, избегаем рассинхрона).

### 3.2 Per-step адаптивное состояние
Расширяем существующий `typing_trainer_lesson_exercises` (не плодим ключей):
```jsonc
{ "tier1:1": { "steps": { "5": { "done": true, "at": "...",
                                 "reps": 3,            // фактически выданное число повторов
                                 "lastErrorRate": 0.0 } } } }
```

### 3.3 Privacy / анонимизация
- Только агрегаты per-key (счётчики, латентности). **Не** храним полные keystroke-логи с таймстампами текста (можно реконструировать ввод) — ring buffer латентностей без привязки к позиции в тексте.
- Local-only в Phase 1. Backend-зеркало — Sprint 8 (event analytics): тот же shape уедет в `key_stats(user_id, tier, key, attempts, errors, median_latency_ms, updated_at)`. PII не содержит.

---

## 4. Адаптивные правила (Phase 1, rule-based — ГЛАВНОЕ)

Все пороги — дефолты `[TUNE]`. Движок чистая функция: `(keyStats, baseReps, audience) → reps`.

### 4.1 Mastery score клавиши
Нужен «достаточный сигнал», иначе не судим (холодный старт):
```
если attempts < MIN_SAMPLE (=15 [TUNE]) → status = "unknown"
errorRate     = errors / attempts
latRatio      = medianLatency / personalMedianLatency   // 1.0 = норма
mastered  := errorRate < 0.03  AND correctStreak >= 10  AND latRatio <= 1.2   [TUNE]
weak      := errorRate > 0.10  OR  (errorRate > 0.06 AND latRatio > 1.6)      [TUNE]
// между ними → "learning" (базовые повторы)
```
- `mastered`: <3% ошибок, ≥10 верных подряд, латентность в пределах +20% личной медианы.
- `weak`: >10% ошибок, **или** >6% ошибок при заметной hesitation.

### 4.2 Множитель повторов шага
Шаг привязан к набору клавиш (`finger`/`new_keys`/символы `target`). Считаем по **самой слабой** клавише шага (bottleneck):
```
baseReps = step.baseReps (из JSON, см. §5)
factor:
  все клавиши mastered      → 0.5   → меньше повторов
  есть learning             → 1.0   → базовые
  есть weak                 → 1.6   → больше
  есть weak + высокий latency→ 2.0   → максимум
reps = clamp( round(baseReps * factor), REPS_MIN, REPS_MAX )
REPS_MIN = 2   [TUNE]  // никогда не 0 — хотя бы закрепить
REPS_MAX = baseReps * 2.5  [TUNE]  // не бесконечный дрилл — анти-фрустрация
```
«Повтор» = одна группа `target` (например `"ааааа"`); движок масштабирует число групп, не отдельные символы.

### 4.3 Точечный weak-key remediation
Если по итогам шага клавиша осталась `weak`:
- Вставить **один** remediation-шаг (kind `"drill"`) на эту клавишу: короткий target (`REMEDIATION_REPS = 3` групп [TUNE]) с изоляцией проблемной буквы + чередование с ближайшей mastered (`"нанана"` если путают Н/А).
- **Cap:** не более `MAX_REMEDIATION_PER_LESSON = 2` [TUNE] за урок (анти-фрустрация, не превращаем урок в наказание).
- Если remediation не помог за 2 захода → НЕ зацикливать, пропустить вперёд (методика: «не ругай себя», плюс explainability — логируем «persisted weak: Н»).

### 4.4 Decay (затухание мастерства)
Навык деградирует без практики:
```
daysIdle = (now - lastSeenAt) / 1d
если daysIdle > 7  [TUNE]:
    effectiveStreak = correctStreak * 0.5   // half-life ~7 дней
    // mastered может откатиться в learning → вернутся базовые повторы (re-warmup)
```
Decay применяется **на чтение**, не переписывает хранимые счётчики.

---

## 5. Интеграция с гайдед-шагами

### 5.1 Изменения в lesson JSON-схеме
Сейчас reps зашиты в `target` статикой (`"ааааа ааааа ааааа ааааа"` = 4 группы). Заменяем на декларативный контракт:
```jsonc
{ "type": "step", "kind": "drill",
  "unit": "ааааа",          // одна группа-повтор
  "baseReps": 4,            // базовое число групп (было неявно зашито)
  "keys": ["а"],            // клавиши шага → ключ к key_stats
  "finger": "blue", "hint": "...", "title": "..." }
```
- **Backward-compat:** если `unit`/`baseReps` нет, а есть legacy `target` — движок не адаптирует (берёт `target` как есть). Контент мигрируется постепенно.
- `target` собирается рантайм: `Array(reps).fill(unit).join(' ')`.

### 5.2 Точки подключения (контракт, без реализации)
**Новый модуль `assets/js/ai/adaptive-repetition.js`** (IIFE, как `exercise-progress.js`), экспорт в `window.adaptiveReps`:
```
adaptiveReps.recordKey(tier, expectedKey, actualKey, latencyMs)  // вызвать из task.js handleKey
adaptiveReps.flushSession(tier)                                  // вызвать на finishStep/finishExercise
adaptiveReps.computeReps(tier, step) -> int                      // вызвать в lesson-page.js / task.js при сборке target
adaptiveReps.weakKeys(tier, limit) -> [{key, errorRate, ...}]    // для remediation + будущего дашборда
adaptiveReps.remediationStep(tier, lesson, doneSteps) -> step|null
```

**`task.js`:**
- `handleKey` (≈ строки 331-345): после сравнения `e.key` vs `expected` → `adaptiveReps.recordKey(tier, expected, e.key, dtSinceLast)`. Латентность уже есть (`now - lastKeyTime`).
- Сборка `targetText` для шага (≈ строка 140): если step содержит `unit/baseReps` → `target = buildTarget(unit, adaptiveReps.computeReps(tier, step))`.
- `finishStep`/`finishExercise`: `adaptiveReps.flushSession(tier)` + сохранить фактический `reps` в `lesson_exercises`.

**`lesson-page.js`:**
- `makeGuidedStep` (≈ 286-334): preview-target тоже строить из адаптивного `reps` (чтобы превью совпадало с тем, что в тренажёре).
- После рендера шагов: если `adaptiveReps.remediationStep(...)` вернул шаг → вставить его в лестницу как обычный `active` step.

Адаптация **не трогает** `lesson_progress` (звёзды) и backend-контракт миграции — изолирована в новых/расширенных local-ключах.

---

## 6. Дети vs взрослые

Разные тиры (`ru_kids`/`ru_teen`/`tier1`) → разные профили порогов:
| Параметр | kids | teen | adult (tier1) |
|---|---|---|---|
| `REPS_MIN` | 3 | 2 | 2 |
| `REPS_MAX множитель` | ×2.0 (мягче) | ×2.5 | ×3.0 |
| `weak errorRate` порог | 0.15 (терпимее) | 0.12 | 0.10 |
| `MAX_REMEDIATION` / урок | 1 | 2 | 2 |
| тон / видимость | полностью невидимо, без «ошибок» | мягко | можно показать weak-keys в профиле |

Дети: приоритет «не заскучать и не фрустрировать» → охотнее сокращаем, осторожнее добавляем. Взрослые: допускаем более длинный дрилл и (опционально) explainable-вывод «слабые клавиши: …».

---

## 7. Уровни внедрения

### Phase 1 — rule-based client (СЕЙЧАС, offline) — MVP-cut
**Входит минимально:**
1. Сбор per-key статистики (`recordKey` + `key_stats` ключ).
2. `computeReps` с правилами §4.1–4.2 (mastery/weak → множитель, clamp).
3. Декларативный `unit/baseReps/keys` в JSON урока 1 + backward-compat.
4. Подключение в `task.js` (сбор + сборка target) и `lesson-page.js` (превью).

**Можно отложить внутри Phase 1:** remediation-шаг (§4.3), decay (§4.4), weak-keys в профиле. Сначала «адаптивное число повторов работает», потом точечный дрилл.

### Phase 2 — ML (Python, Sprint 13-18)
Backend-аналитика (Sprint 8) копит события → модель предсказания ошибок (scikit-learn), персонализированный подбор `baseReps`, кластеризация паттернов конфузий.

### Phase 3 — LLM-тьютор (Sprint 19-24)
Натуральные объяснения («ты путаешь Н и А, потому что…»), генерация таргет-дриллов под слабые пары, conversational adaptive curriculum.

---

## 8. Метрики валидации

**Гипотеза:** адаптация сокращает время до mastery без потери точности и без роста дропа.
| Метрика | Как измеряем | Цель |
|---|---|---|
| Mastery-time | касаний/время до `mastered` по клавише | ↓ vs baseline |
| Accuracy-тренд | errorRate по уроку через N дней | не хуже / лучше |
| Retention | возврат через 1/7 дней | ↑ или = |
| Boredom-proxy | доля досрочных выходов на mastered-шагах | ↓ |
| Frustration-proxy | retry-rate, выходы на weak-шагах | не растёт |

**A/B-дизайн:** сплит по `hash(profile.createdAt)` (детерминированный, offline-friendly), control = статичные reps, treatment = adaptive. Логируем фактический `reps` и итоговый `errorRate` шага в `lesson_exercises` — основа для оффлайн-анализа. Полноценный A/B — после backend-событий (Sprint 8).

---

## 9. Риски и non-goals

**Риски:**
- **Холодный старт** — нет данных. Митигация: `MIN_SAMPLE`, статус `unknown` → базовые повторы; адаптация включается только при достаточном сигнале.
- **Overfitting к шуму** — случайная опечатка ≠ слабая клавиша. Митигация: пороги по rate+streak, ring buffer, median вместо mean.
- **Фрустрация / «наказание дриллом»** — `REPS_MAX`, `MAX_REMEDIATION`, не зацикливать persisted-weak.
- **Геймление** — юзер замечает паттерн и фармит. Митигация: адаптация невидима (особенно kids), скачки reps сглажены.
- **Explainability** — каждое решение трассируемо (signal + threshold), логируется для оффлайн-разбора.
- **Latency-шум** — устройство/паузы. Митигация: личная нормализация, отсев outliers (как уже `>2000ms` в task.js).

**Non-goals (Phase 1):**
- Не перестраиваем порядок/последовательность уроков (только reps внутри шага + remediation).
- Не трогаем `lesson_progress`/звёзды/backend-миграцию.
- Не WPM-driven сложность (точность ведёт; плато — отдельный пассивный сигнал).
- Не ML/LLM, не сетевые вызовы — чистый offline rule-based.

---

## Phase 1 implementation checklist

1. **`config/settings.js`** — добавить `storage.keys.keyStats = 'typing_trainer_key_stats'`.
2. **`assets/js/ai/adaptive-repetition.js`** — новый IIFE-модуль (`window.adaptiveReps`): `recordKey`, `flushSession`, `computeReps`, `weakKeys`; mastery/weak правила §4.1–4.2 с константами `[TUNE]`; чтение/запись `key_stats` (паттерн `exercise-progress.js`); audience-профиль порогов §6.
3. **`data/lessons/tier1/lesson_01.json`** — мигрировать `step`-шаги на `unit`/`baseReps`/`keys`; сохранить `target` как fallback.
4. **`task.js`** — подключить `recordKey` в `handleKey`; собирать `targetText` шага из `computeReps`; `flushSession` + запись фактических `reps` на финише шага.
5. **`lesson-page.js`** — строить preview-target шага из адаптивного `reps`; (после п.1-4) вставлять `remediationStep` в лестницу.
6. **Тест-фикстура** — синтетический `key_stats` (mastered/weak/unknown) → проверить clamp, factor, холодный старт.
7. Подключить скрипт `adaptive-repetition.js` в `task.html` и `lesson.html` до `task.js`/`lesson-page.js`.

> Decay (§4.4), remediation (§4.3) и weak-keys в профиле — следующая итерация Phase 1 после того, как базовая адаптация reps подтверждена данными.
