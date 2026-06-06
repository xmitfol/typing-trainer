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
| D3-7 | Алекс | Борис | Текущий localStorage shape: progress (по уроку/test), achievements, settings | Sprint 3 day 1 | Yes | pending |
| D3-8 | Алекс | Квинн | `assets/js/api-client.js` adapter pattern документирован | Sprint 3 day 5 | Yes (gate verify_sync_across_devices) | pending |
| D3-9 | Борис | Дима | Concurrency test infrastructure (2 параллельных connections) для S3.4 | Sprint 3 day 3 | No (можно basic asyncio) | pending |
| D3-10 | Сергей | Борис | RBAC review для `GET /me` — что отдавать своему юзеру vs admin | Sprint 3 day 2 | No (relevant позже) | pending |

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
