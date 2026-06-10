# Sprint 1 · Board · Auth foundation

> **Status**: 🟢 **In progress** — auth vertical стартовала (Клод, ветка `sprint-1/auth-foundation`, коммит ab9db6f)
> **Цель**: пользователь может зарегистрироваться, войти, выйти; email-верификация работает
> **Source**: [03_IMPL_PLAN.md §3 Sprint 1](../../../spec/backend/03_IMPL_PLAN.md)
> **Estimate duration**: week 1 (5 days)
> **Owner**: Борис (Backend) + Клод (review) + Алекс (frontend integration), координация — Ника
> **Cross-team deps**: см. [dependency_map.md](../dependency_map.md)

## Gate
✅ Юзер может: signup → получить welcome email → подтвердить → войти → выйти → восстановить пароль.
✅ `verify_signup_flow.py` зелёный.

## Tasks

### TODO (not started)

| ID | Task | Owner | Estimate | Verify | Depends on |
|---|---|---|---|---|---|
| ⬜ S1.5 | `POST /api/v1/auth/signin` — login → JWT cookies | Клод/Борис | 0.5d | integration test | S1.3, S1.4 |
| ⬜ S1.6 | `POST /api/v1/auth/signout` + `POST /auth/refresh` | Клод/Борис | 0.5d | integration tests | S1.5 |
| ⬜ S1.7 | Email через **mailhog** (dev) + welcome email; Y360 prod-креды отложены PO | Борис | 1d | письмо ловится в mailhog web UI | S1.4 |
| ⬜ S1.8 | `POST /auth/verify-email` + `/auth/forgot` + `/auth/reset` | Борис | 1d | E2E через mailhog в dev | S1.7 |
| ⬜ S1.9 | **Frontend integration**: `<auth-modal>` или `auth.html` — wire к API + PoW-solver (Web Worker) + honeypot | Алекс | 1d | verify_signup_flow.py зелёный | S1.4, S1.5; контракт `openapi.yaml` (S1.10 ✅) |

### IN PROGRESS
- 🟡 **S1.4 acceptance** — код вертикали готов (signup endpoint + service + challenge), но integration «happy path + duplicate email» НЕ зелёный: happy/duplicate тесты под `@requires_db`, skip без `TEST_DATABASE_URL`. Блокирует **B1-001** (testcontainers-фикстура). Captcha-gate (honeypot/PoW→403, enum→422) — runnable и проходит.

### BLOCKED
- 🟡 **S1.4 acceptance** частично BLOCKED **B1-001** — нет testcontainers Postgres-фикстуры в `conftest.py` (всё ещё Sprint-0 sync `TestClient`). Owner unblock: Дима (testcontainers в conftest+CI), fallback Борис. См. [blockers.md](blockers.md). Код S1.4/S1.4b мержабелен; gate по integration ждёт фикстуру.
- ✅ ~~Все задачи S1.x BLOCKED Sprint 0~~ — снято: Sprint 0 закрыт (PR #25 merged 60677e0).
- ✅ ~~S1.7 BLOCKED Y360 creds~~ — снято: PO отложил Y360, dev на mailhog (ADR/handoff 2026-06-11)

### DONE
- ✅ **S1.0** DB/Redis wiring (находка Ники — `deps.py` был заглушкой): `core/db.py` (async engine+sessionmaker), `core/redis.py` (async Redis), `deps.py` подключён к реальным `db_session`/`redis_client`, `main.py` lifespan закрывает пулы. Клод, 2026-06-11 (ab9db6f). **Был неявной prerequisite для S1.4.**
- ✅ **S1.1** Alembic migration `users`/`oauth_accounts`/`user_settings` — scaffold готов (`backend/alembic/`). _Pending_: `alembic upgrade head` на чистой БД (выполнится с testcontainers/CI у Бориса/Димы).
- ✅ **S1.2** `app/models/` SQLAlchemy 2.0 модели (`user.py` + 7 моделей, CHECK-constraints). Клод/Борис. _Pending_: unit `test_models` прогон в CI.
- ✅ **S1.3** `core/security.py` — Argon2 hash + JWT sign/verify; `core/captcha.py` (PoW). `test_security`/`test_captcha` runnable. _Pending_: Argon2 params sign-off (Сергей).
- ✅ **S1.4** `POST /api/v1/auth/signup` — `schemas/auth.py` (Pydantic v2, enum=CHECK), `services/auth_service.py` (dup-check active email → Argon2 → INSERT user+user_settings, IntegrityError-защита от гонки), `core/exceptions.py` (DomainError/EmailTakenError), endpoint с honeypot+PoW gate + httpOnly access/refresh cookies. Клод, 2026-06-11 (ab9db6f). _Acceptance integration — см. IN PROGRESS / B1-001._
- ✅ **S1.4b** `GET /api/v1/auth/challenge` (PoW issue, ADR-006) — реализован, router подключён, shape-тест проходит. Клод, 2026-06-11 (ab9db6f).
- ✅ **S1.10** OpenAPI contract review — `backend/openapi.yaml` зафиксирован (8 endpoints, captcha по ADR-006, JWT в httpOnly cookies). Клод, 2026-06-11. Разблокирует Алекса (S1.9).

## Dependencies (cross-team)

- ✅ **Клод → Алекс/Борис**: OpenAPI контракт `auth/*` зафиксирован в `backend/openapi.yaml` (S1.10 done 2026-06-11) — Алекс может начинать без mocks
- ~~**PO → Борис**: Yandex 360 SMTP credentials~~ — снято: Y360 отложен PO, dev на mailhog
- **Сергей → Борис**: подтверждение Argon2 параметров (memory cost, time cost) до S1.3 — security-relevant
- **Дима → Борис**: mailhog в Docker Compose dev — теперь **обязательно** (основной email-транспорт на dev, не fallback)

## Risks для этого sprint'а

См. [risks.md](../../../spec/backend/risks.md):
- **R-007** (бот-регистрация) — Sprint 1 mitigation: **self-hosted honeypot + PoW ([ADR-006](../../../spec/backend/decisions/ADR-006.md))**, без внешнего провайдера. Acceptance S1.4: бот без решения → 403, валидное решение → 200, replay → 403
- **R-005** (потеря localStorage) — частично адресуется через S1.9 (CTA «Сохрани прогресс»)

## Pre-sprint checklist (Ника проверяет в pre-planning)

- [ ] Sprint 0 gate зелёный (`make lint test` + CI зелёный)
- [ ] Docker Compose с postgres+redis+mailhog работает на машине Бориса
- [ ] PO передал Y360 SMTP creds (или email-fallback на mailhog для dev)
- [ ] Sergei подтвердил Argon2 параметры
- [ ] OpenAPI skeleton (S0.6) готов и Клод его ревьюнул
- [ ] Frontend (Алекс) ознакомился с TSD §3.2 (auth endpoints)

## Daily updates
- См. [standup.md](standup.md)

## Notes
- Sprint **активирован** (Sprint 0 gate закрыт, PR #25 merged). Auth vertical в работе.
- Critical path: ~~S1.0~~ → ~~S1.1~~ → ~~S1.2~~ → ~~S1.3/S1.4 (parallel)~~ → **S1.5/S1.6** → S1.7 → S1.8 → S1.9. Параллельно — **B1-001** (testcontainers) разблокирует S1.4 integration acceptance.
- Если S1.7 заблокируется Y360 creds — fallback на mailhog dev и перенос S1.7/S1.8 production-config в Sprint 2.
