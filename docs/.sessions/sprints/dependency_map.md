# Cross-team Dependency Map · Sprints 0-3

> **Owner**: Ника (PM)
> **Updated**: 2026-06-07
> **Цель**: предотвратить «Алекс ждёт API контракт от Бориса» сюрпризы. Каждая запись = контракт между ролями с явным сроком.

## Как читать таблицу

- **From** — кто производит артефакт
- **To** — кто его потребляет
- **What** — что именно
- **When needed** — когда последний срок без блокировки
- **Critical path?** — Yes = задержка двигает сроки sprint'а / релиза
- **Status** — 🟢 in time / 🟡 at risk / 🔴 blocked / ✅ delivered

---

## Sprint 0 (week 0, инфраструктура)

| # | From | To | What | When needed | Critical | Status |
|---|---|---|---|---|---|---|
| D0-1 | PO | Дима | YC organization + billing + IAM role | day 1 | Yes | 🟡 in flight |
| D0-2 | PO | Дима | Новый GH email для mirror | day 1 | Yes | 🟡 in flight |
| D0-3 | PO | команда | Домен `typing-trainer.ru` зарегистрирован | day 2 | No (поздний deadline) | 🔴 not started |
| D0-4 | Дима | Борис | YC Code Repo доступен + SSH key | day 2 | Yes | 🔴 blocked by D0-1 |
| D0-5 | Дима | Борис | Docker image base (Python 3.12-slim) confirmed | day 3 | Yes | 🟢 known |
| D0-6 | Борис | Алекс + Клод | Docker Compose `docker-compose.yml` (postgres+redis+adminer) рабочий | day 3 | No (parallel work OK) | 🔴 not started |
| D0-7 | Борис | Дима | Scaffold backend/ (`pyproject.toml`, `ruff`, `mypy`, `pytest`) | day 4 | Yes (CI ждёт) | 🔴 not started |
| D0-8 | Дима | команда | `.cloudbuild/lint-and-test.yaml` зелёный на тестовом коммите | day 5 | Yes (Sprint 0 gate) | 🔴 blocked by D0-7 |
| D0-9 | Борис | Алекс | OpenAPI skeleton с `/health` (опубликован в `docs/spec/backend/openapi.yaml`) | day 5 | Yes (контракт для Sprint 1) | 🔴 not started |
| D0-10 | Клод (scaffold локально) | Борис | Структура `backend/app/` (директории, conftest, базовый main.py) | day 3 (workaround R-001) | Yes | 🟢 in progress (Клод параллельно) |

## Sprint 1 (week 1, Auth foundation)

| # | From | To | What | When needed | Critical | Status |
|---|---|---|---|---|---|---|
| D1-1 | Борис | Алекс | API contract `POST /auth/signup` в OpenAPI | Sprint 1 day 3 | Yes | pending |
| D1-2 | Борис | Алекс | API contract `POST /auth/signin` в OpenAPI | Sprint 1 day 3 | Yes | pending |
| D1-3 | Борис | Алекс | Cookie схема (httponly, samesite=lax) и refresh flow | Sprint 1 day 3 | Yes | pending |
| D1-4 | Клод | Борис | Review OpenAPI до implementation (S1.10 в Sprint 1 board) | Sprint 1 day 2 | Yes (предотвращает rework) | pending |
| D1-5 | PO | Борис | Yandex 360 SMTP credentials в env | Sprint 1 day 4 (для S1.7) | Yes | pending |
| D1-6 | Сергей | Борис | Argon2 params (memory cost, time cost) подтверждены | Sprint 1 day 1 (до S1.3) | Yes | pending |
| D1-7 | Сергей | Борис | reCAPTCHA / Yandex SmartCaptcha integration spec (R-007 mitigation) | Sprint 1 day 2 | Yes | pending |
| D1-8 | Дима | Борис | mailhog в Docker Compose (для S1.7/S1.8 dev test) | Sprint 1 day 4 | No (можно sidecar добавить) | pending |
| D1-9 | Алекс | Квинн | `auth.html` / `<auth-modal>` готов к verify_signup_flow.py | Sprint 1 day 5 | Yes (gate) | pending |
| D1-10 | Клод | Борис | ADR-002 (mutation policy) impl-hints для `users.tier_shift` | Sprint 1 day 1 reference | No (только AGE_DOWNGRADE relevant в Sprint 3) | pending |

## Sprint 2 (week 2, OAuth + миграция гостя)

| # | From | To | What | When needed | Critical | Status |
|---|---|---|---|---|---|---|
| D2-1 | PO | Борис | Yandex OAuth app — `client_id` / `secret` | Sprint 2 day 1 | Yes | pending |
| D2-2 | PO | Борис | VK OAuth app — `client_id` / `secret` | Sprint 2 day 3 | Yes | pending |
| D2-3 | Борис | Алекс | API contract `POST /auth/migrate-guest` (localStorage → progress/attempts) | Sprint 2 day 3 | Yes | pending |
| D2-4 | Борис | Алекс | OAuth redirect URLs (`/auth/oauth/yandex/callback`) | Sprint 2 day 2 | Yes | pending |
| D2-5 | Алекс | Борис | localStorage schema dump (что именно хранится сейчас на фронте) | Sprint 2 day 1 | Yes (без этого Борис не напишет migration logic) | pending |
| D2-6 | Клод | Борис | ADR-001 anonymous TTL impl-clarification (APScheduler cron details) | Sprint 2 day 1 | Yes (только этот sprint) | 🟢 ADR-001 готов |
| D2-7 | Дима | Борис | APScheduler в Docker Compose dev environment | Sprint 2 day 2 | No (можно in-process workaround) | pending |
| D2-8 | Юля (UX Research) | Алекс | UX-проход модал «Зарегистрируйся, чтобы не потерять прогресс» (S2.6) | Sprint 2 day 4 | No (можно после) | pending |

## Sprint 3 (week 3, Profile + Progress sync)

| # | From | To | What | When needed | Critical | Status |
|---|---|---|---|---|---|---|
| D3-1 | Борис | Алекс | API contract `GET /me/progress` + `POST /me/progress` | Sprint 3 day 1 | Yes | pending |
| D3-2 | Борис | Алекс | API contract `GET /me`, `PATCH /me`, `DELETE /me` | Sprint 3 day 2 | Yes | pending |
| D3-3 | Борис | Алекс | API contract `GET /me/settings`, `PATCH /me/settings` | Sprint 3 day 2 | Yes | pending |
| D3-4 | Борис | Алекс | API contract `GET /me/history?cursor=&limit=` cursor pagination | Sprint 3 day 3 | Yes | pending |
| D3-5 | Клод | Борис | ADR-002 (mutation policy) **полная impl-guide** — tier-shift logic, AGE_DOWNGRADE reject | Sprint 3 day 1 | Yes | 🟢 ADR-002 готов, нужно дочитать |
| D3-6 | Клод | Борис | ADR-003 (Family read-only) — relevant только для Sprint 9, ссылка для контекста | Sprint 3 reference | No | 🟢 готов |
| D3-7 | Алекс | Борис | Текущий localStorage shape: progress (по уроку/test), achievements, settings | Sprint 3 day 1 | Yes | 🟢 закрыт в Sprint 0 (Клод сделал [`localStorage_schema.md`](../../spec/backend/legacy/localStorage_schema.md)) |
| D3-8 | Алекс | Квинн | `assets/js/api-client.js` adapter pattern документирован | Sprint 3 day 5 | Yes (gate verify_sync_across_devices) | pending |
| D3-9 | Борис | Дима | Concurrency test infrastructure (2 параллельных connections) для S3.4 | Sprint 3 day 3 | No (можно basic asyncio) | pending |
| D3-10 | Сергей | Борис | RBAC review для `GET /me` — что отдавать своему юзеру vs admin | Sprint 3 day 2 | No (relevant позже) | pending |

## Sprint 4 (week 4, Achievements engine + server-side enforcement)

| # | From | To | What | When needed | Critical | Status |
|---|---|---|---|---|---|---|
| D4-1 | Алекс | Борис | **Каталог 22 ачивок из [`assets/js/achievements.js`](../../../assets/js/achievements.js)** — id, group, icon, label, threshold, metric formula. Алекс отдаёт structured snapshot (JSON или MD-таблица), Борис транслирует в Python (`services/achievement_service.py` S4.1) | Sprint 4 day 1 | Yes (без этого S4.1 не стартует) | pending |
| D4-2 | Алекс | Борис | **`computeStats(progress, history, totalLessons)` semantics** — формула `streakDays`, `perfectFive`, `totalStars` (что считается за «5★»). Inline в каталоге или отдельный документ. | Sprint 4 day 1 | Yes (для S4.2 unit tests) | pending |
| D4-3 | Борис | Алекс | API contract `GET /me/achievements` — список earned + progress по unearned | Sprint 4 day 3 | Yes | pending |
| D4-4 | Борис | Алекс | **Response shape `POST /me/progress` теперь возвращает `newly_earned: [achievement_id, ...]`** для toast'а на task.html. Изменение vs Sprint 3! Алекс правит [task.js](../../../assets/js/task.js). | Sprint 4 day 2 | Yes (нужен для S4.5 frontend wire) | pending |
| D4-5 | Клод | Борис | **Anti-cheat thresholds**: WPM hard cap (рекомендация: 1500 знаков/мин), accuracy ∈ [0, 100], duration_sec ≥ text_length/15. Зафиксировать в коде S4.6, не в DB. | Sprint 4 day 2 | Yes (gate `verify_anti_cheat.py`) | pending |
| D4-6 | Борис | Дима | Achievement trigger на `POST /me/progress` должен оставаться atomic (одна транзакция: progress + attempt + new_achievements). Может потребоваться SAVEPOINT — Дима ревьюит query plan. | Sprint 4 day 3 | No (можно sequential при медленном rollout) | pending |
| D4-7 | Сергей | Борис | **Security review для S4.7 (migration script localStorage achievements → DB)**: предотвратить подделку «уже заработанных» 100★ при signup. Должны быть верифицируемые progress/attempts, иначе reject. | Sprint 4 day 4 | Yes (без этого open hole в anti-cheat) | pending |
| D4-8 | Алекс | Квинн | Frontend [achievements-page.js](../../../assets/js/achievements-page.js) переключён на `GET /me/achievements` (вместо локального getAchievements) | Sprint 4 day 5 | Yes (gate verify_server_achievements.py) | pending |
| D4-9 | PO + Полина | Борис | **Решение по «ретроактивным» ачивкам**: если каталог расширится в Sprint 4+ (новые 22→25 ачивок) — выдавать «задним числом» юзерам, прошедшим threshold ранее? Yes/No с обоснованием. | Sprint 4 day 1 (для S4.2 design) | No (можно решить ad-hoc после релиза) | pending |
| D4-10 | Катя | Борис | **Лесозональные ачивки**: при росте tier-каталога (tier3/tier4 lessons) — нужны ли tier-specific ачивки? Пока ачивки tier-agnostic. Катя подтверждает. | Sprint 4 day 1 reference | No (опционально) | pending |
| D4-11 | Клод | Борис | **ADR**: для S4.6 anti-cheat правил — нужен ли отдельный ADR-006 или достаточно inline в коде? Решение Клода. | Sprint 4 day 2 | No (можно code-only пока) | pending |

## Sprint 5 (week 5, Lessons API + paywall)

| # | From | To | What | When needed | Critical | Status |
|---|---|---|---|---|---|---|
| D5-1 | Катя | Борис | **Все 459 lesson JSON в `data/lessons/`** finalized — Борис их кеширует, изменения после Sprint 5 day 1 = cache invalidation cost | Sprint 5 day 1 | Yes | 🟢 готово (459 уроков мигрированы на rich tip schema, commit 91a1f8b) |
| D5-2 | Катя | Борис | **Lesson rich-tip schema** — список валидных `type` (`lead`, `drop`, `callout`, `exercise`, `p`, `pullquote`, ...). Борис валидирует JSON Schema при `LessonRepository` load (S5.1). Пример: [`data/lessons/tier1/lesson_01.json`](../../../data/lessons/tier1/lesson_01.json). | Sprint 5 day 1 | Yes | 🟢 готов (rich tip schema внедрён в Sprint frontend) |
| D5-3 | Борис | Алекс | **API contract `GET /lessons/{tier}/{n}`** — точная transparent передача JSON с диска + i18n через `Accept-Language` header. Алекс ничего не меняет в [`lesson-loader.js`](../../../assets/js/lesson-loader.js) кроме base URL | Sprint 5 day 2 | Yes | pending |
| D5-4 | Борис | Алекс | **API contract `GET /lessons/{tier}/{n}/access`** — paywall response shape: `{allowed: bool, reason: 'free'|'paywall'|'progression', plan_required: 'monthly'}`. Алекс показывает модал когда `allowed=false` + reason=paywall | Sprint 5 day 3 | Yes | pending |
| D5-5 | Полина | Борис | **Константа `FREE_LESSON_LIMIT=5`** подтверждена (или другое). Также: что входит во «free» — только первые 5 lesson tier1, или с каждого tier'а? | Sprint 5 day 1 | Yes (для S5.4) | pending |
| D5-6 | Полина | Алекс | **UX paywall модала**: copy, CTA («оплатить», «продолжить бесплатно»), компонент. Алекс делает на основе [pricing.html](../../../pricing.html) | Sprint 5 day 4 | Yes (для verify gate) | pending |
| D5-7 | Дима | Борис | Redis в Docker Compose работает (cache backend для S5.1) — должен быть уже из Sprint 0/2, но подтверждение | Sprint 5 day 1 | Yes | pending |
| D5-8 | Борис | Квинн | `verify_lesson_loader_api.py` — Playwright тест: все 459 уроков читаемы из API, rich-tip schema корректна, paywall работает на уроке 6+ | Sprint 5 day 5 | Yes (gate) | pending |
| D5-9 | Алекс | Борис | **Frontend behaviour при 403 paywall**: должен закрывать lesson-loader, показывать модал, НЕ ломать SPA navigation. Контракт обоюдный — frontend reads `reason`, backend гарантирует семантику | Sprint 5 day 4 | Yes | pending |
| D5-10 | Клод | Борис | **Linear progression rules**: «нельзя открыть урок N+1 пока N не завершён» — Борис проверяет на `/access` endpoint. Нужно подтверждение что в TSD §3 это закодировано или нужен mini-ADR? | Sprint 5 day 1 | Yes (для S5.4 logic) | pending |
| D5-11 | Алекс | Борис | **Cache key strategy**: lesson JSON key = `lesson:{tier}:{n}:{lang}`, paywall response уникальный per-user `paywall:user:{id}:{tier}:{n}`. Согласование TTL: lesson=∞ (manual invalidate), paywall=300s | Sprint 5 day 2 | No (можно решить ad-hoc) | pending |
| D5-12 | Тимофей | команда | **Документация Lessons API в OpenAPI** + миграция-гид «как frontend разработчик подключает API» в `docs/spec/backend/api_guide.md` | Sprint 5 day 5 | No (post-sprint OK) | pending |

---

## Critical-path summary (Sprint 4-5)

**Top-5 контрактов, задержка которых = задержка sprint'а:**

1. **D4-1** (achievements каталог от Алекса) — Sprint 4 day 1 — без этого S4.1/S4.2 заглохнут
2. **D4-4** (response shape `POST /me/progress` с `newly_earned`) — Sprint 4 day 2 — двойной касается frontend toast и backend trigger
3. **D5-3/D5-4** (Lessons API + paywall contracts) — Sprint 5 day 2-3 — критический поворот: frontend больше не fetch'ит static JSON
4. **D5-5** (`FREE_LESSON_LIMIT` от Полины) — Sprint 5 day 1 — без числа paywall logic не пишется
5. **D4-7** (security review migration) — Sprint 4 day 4 — без него open hole в anti-cheat

---

## Рекомендации по уменьшению cross-team lag (Sprint 4-5 specific)

### 1. **Achievements catalog snapshot до Sprint 4 kickoff**

Алекс делает single PR за **3 дня до Sprint 4 start**: `docs/spec/backend/legacy/achievements_catalog.md` — таблица 22 ачивок (id, group, threshold, metric formula, edge cases). Аналог `localStorage_schema.md` для Sprint 2.

**Effect**: D4-1 + D4-2 закрываются преэмптивно. Борис стартует S4.1 в день 1 без блокеров.

### 2. **Paywall constants в shared config до Sprint 5**

Полина утверждает `FREE_LESSON_LIMIT` + paywall-tier стратегию **за неделю до Sprint 5** в `docs/spec/backend/pricing_constants.md`. Источник истины для bekend (S5.4) и frontend ([pricing.js](../../../assets/js/pricing.js)).

**Effect**: D5-5 закрывается до старта sprint'а. Борис сразу пишет paywall logic с известными числами.

### 3. **Lessons API contract заранее (Sprint 4 параллельно)**

Борис в **Sprint 4 day 5** (когда achievements engine стабилизируется) пишет OpenAPI stub для `GET /lessons/*` endpoints. Алекс читает в выходные перед Sprint 5. День 1 Sprint 5 уже идёт implementation без contract-discovery.

**Effect**: D5-3 + D5-4 сокращают lag с 2 дней до ~0. Sprint 5 теряет 0 дней на API stabilization.

---

## Что НЕ покрыто этим документом

- **Sprint 6-7** (payments — YooKassa + Hybrid renewal) — preview добавится перед Sprint 5 closing. Самая сложная связка (ADR-005 + 6 ARQ задач), нужен отдельный sub-документ
- **Sprint 8** (analytics) — добавится после Sprint 6 kickoff
- **Sprint 9-10** (family / GDPR / production) — добавится по мере приближения

---

## Critical-path summary (Sprint 0-3)

**Top-5 контрактов, задержка которых = задержка sprint'а:**

1. **D0-9** (OpenAPI skeleton, day 5 Sprint 0) → разблокирует D1-1, D1-2, D1-3
2. **D1-1/D1-2** (auth contracts, Sprint 1 day 3) → разблокирует Алекса (frontend integration)
3. **D2-5** (localStorage schema dump от Алекса) → без этого Борис не напишет migrate-guest
4. **D3-1** (progress API contract, Sprint 3 day 1) → core sync feature
5. **D3-7** (текущий localStorage shape от Алекса) → нужен для совместимой схемы БД

---

## Рекомендации по уменьшению cross-team lag

### 1. **API-first development** (highest impact)
Борис делает OpenAPI stub **до** implementation. Поток:
- День 1 sprint'а: Борис обновляет `openapi.yaml` с новыми endpoints (request/response schemas)
- День 1-2: Клод ревьюит контракт (D1-4 паттерн повторяется для каждого sprint'а)
- День 2-3: Алекс начинает делать UI против OpenAPI mock (Prism / msw) **параллельно** с implementation
- День 4-5: integration

**Effect**: cross-team lag фронт↔бек схлопывается с ~3 дней до ~0.5 дня.

### 2. **Frontend artifact dump в Sprint 0**
Алекс делает single PR: `docs/spec/backend/legacy/localStorage_schema.md` — описание всех текущих keys и shape'ов. Доступ есть у Бориса в любой sprint без re-asking. Закрывает D2-5 + D3-7 разом.

### 3. **PO action checklist на ~Friday прошлой недели**
Все credentials (Y360 SMTP, Yandex OAuth, VK OAuth, YooKassa) идут в PO action checklist **в пятницу предыдущего sprint'а**, не на day-of. Это даёт buffer на ответы от провайдеров (Yandex обычно 1-2 дня).

### 4. **Daily 3-question check от Ники**
Каждое утро Ника проверяет 3 вопроса по dep map:
- Какие D-N должны быть delivered сегодня?
- У какого есть risk?
- Какой escalation шаг (если 🟡 не сдвинулся за день)?

---

## Что НЕ покрыто этим документом

- **Sprint 4-10** dependencies — будут добавлены по мере приближения (preview за 1 sprint до)
- **Контентные deps** (Катя — уроки) — на Sprint 5 critical, добавится позже
- **Marketing deps** (Марина) — на Sprint 10-11, отдельная таблица будет

---

## Changelog

| Date | Author | Change |
|---|---|---|
| 2026-06-07 | Ника | Initial cross-team dependency map для Sprint 0-3 (33 записи) |
| 2026-06-07 | Ника | Sprint 4-5 расширение: +11 deps Sprint 4 (achievements engine) +12 deps Sprint 5 (Lessons API + paywall); 3 новые рекомендации; D3-7 помечен как закрытый (legacy/localStorage_schema.md) |
