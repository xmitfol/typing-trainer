# Sprint 1 · Board · Auth foundation

> **Status**: 🟢 **In progress** — backend auth complete (Клод, ветка `sprint-1/auth-foundation`, коммит 4e95ee9)
> **Цель**: пользователь может зарегистрироваться, войти, выйти; email-верификация работает
> **Source**: [03_IMPL_PLAN.md §3 Sprint 1](../../../spec/backend/03_IMPL_PLAN.md)
> **Estimate duration**: week 1 (5 days)
> **Owner**: Борис (Backend) + Клод (review) + Алекс (frontend integration), координация — Ника
> **Cross-team deps**: см. [dependency_map.md](../dependency_map.md)

## Gate
✅ Юзер может: signup → получить welcome email → подтвердить → войти → выйти → восстановить пароль.
✅ `verify_signup_flow.py` зелёный.

**Gate progress (2026-06-24): ~80%.** Backend auth **код-готовность 100%**: полный поток signup→welcome+verify→verify-email→signin→signout→refresh→forgot→reset, все **8 endpoints** совпадают с `openapi.yaml`. Инфра-блокеры **сняты как код**: B1-001 (testcontainers postgres-фикстура в `conftest.py`) и B1-002/mailpit (dev SMTP в `docker-compose.yml`) wired в коммите 6bc572f. До зелёного gate осталось: **S1.9** (frontend, Алекс — auth-modal/auth.html + PoW-solver в Web Worker + honeypot, wire к 8 endpoints) + **Docker-прогон** (запуск testcontainers + mailpit E2E на Docker-машине — фикстура есть, нужен только реальный прогон). Критпуть к gate: **S1.9 (Алекс) ∥ Docker-прогон (Дима/Борис) → зелёный gate**.

## Tasks

### TODO (not started)

| ID | Task | Owner | Estimate | Verify | Depends on |
|---|---|---|---|---|---|
| ⬜ S1.9 | **Frontend integration**: `<auth-modal>` или `auth.html` — wire к 8 endpoints + PoW-solver (Web Worker) + honeypot | Алекс | 1d | verify_signup_flow.py зелёный | S1.4, S1.5; контракт `openapi.yaml` (S1.10 ✅) |

### IN PROGRESS
- 🟡 **Integration/E2E acceptance всего auth (S1.4–S1.8)** — весь backend-код готов и мержабелен. Runnable и зелёные: captcha-gate (honeypot/PoW→403, enum→422), signin captcha-gate, refresh no/garbage→401, signout→204, email-рендер + мок-SMTP (test_email 7). DB-зависимые happy-path (signup→verify→signin→refresh-rotation, forgot→reset) под `@requires_db` и E2E «письмо в mailpit» ждут **Docker-прогон** (фикстуры готовы, см. BLOCKED/PENDING). Снимается одним прогоном на Docker-машине.

### BLOCKED
- 🟡 **Integration acceptance всего auth (S1.4–S1.8)** PENDING **Docker-прогон** — фикстуры написаны (testcontainers postgres в `conftest.py`, mailpit dev SMTP в `docker-compose.yml`, коммит 6bc572f), но DB-зависимые и E2E-тесты **скипаются без живого Docker-демона**. Нужен реальный прогон на Docker-машине (Дима/Борис, CI). Это единственный pending для зелёного integration-acceptance бэкенда.
- ✅ ~~Integration acceptance S1.4–S1.6 BLOCKED B1-001~~ — снято как **код**: testcontainers postgres-фикстура wired в `conftest.py` (6bc572f). Остаётся только Docker-прогон (см. PENDING выше).
- ✅ ~~S1.7 E2E BLOCKED D1 (mailhog)~~ — снято: B1-002 mailpit (преемник mailhog) добавлен в `docker-compose.yml` (6bc572f). E2E ждёт Docker-прогон.
- ✅ ~~Все задачи S1.x BLOCKED Sprint 0~~ — снято: Sprint 0 закрыт (PR #25 merged 60677e0).
- ✅ ~~S1.7 BLOCKED Y360 creds~~ — снято: PO отложил Y360, dev на mailpit (ADR/handoff 2026-06-11)

### DONE
- ✅ **S1.0** DB/Redis wiring (находка Ники — `deps.py` был заглушкой): `core/db.py` (async engine+sessionmaker), `core/redis.py` (async Redis), `deps.py` подключён к реальным `db_session`/`redis_client`, `main.py` lifespan закрывает пулы. Клод, 2026-06-11 (ab9db6f). **Был неявной prerequisite для S1.4.**
- ✅ **S1.1** Alembic migration `users`/`oauth_accounts`/`user_settings` — scaffold готов (`backend/alembic/`). _Pending_: `alembic upgrade head` на чистой БД (выполнится с testcontainers/CI у Бориса/Димы).
- ✅ **S1.2** `app/models/` SQLAlchemy 2.0 модели (`user.py` + 7 моделей, CHECK-constraints). Клод/Борис. _Pending_: unit `test_models` прогон в CI.
- ✅ **S1.3** `core/security.py` — Argon2 hash + JWT sign/verify; `core/captcha.py` (PoW). `test_security`/`test_captcha` runnable. _Pending_: Argon2 params sign-off (Сергей).
- ✅ **S1.4** `POST /api/v1/auth/signup` — `schemas/auth.py` (Pydantic v2, enum=CHECK), `services/auth_service.py` (dup-check active email → Argon2 → INSERT user+user_settings, IntegrityError-защита от гонки), `core/exceptions.py` (DomainError/EmailTakenError), endpoint с honeypot+PoW gate + httpOnly access/refresh cookies. Клод, 2026-06-11 (ab9db6f). _Acceptance integration — см. IN PROGRESS / B1-001._
- ✅ **S1.4b** `GET /api/v1/auth/challenge` (PoW issue, ADR-006) — реализован, router подключён, shape-тест проходит. Клод, 2026-06-11 (ab9db6f).
- ✅ **S1.5** `POST /api/v1/auth/signin` — `auth_service.signin` (anti-timing dummy-hash, re-hash при усилении Argon2), endpoint с conditional-captcha (3 неудачи/IP/час → 403 `CAPTCHA_REQUIRED`, fail-счётчик в Redis TTL 1ч), httpOnly cookies; `SigninRequest` schema. Клод, 2026-06-11 (33a422e). _Acceptance integration (happy/invalid-cred) — см. IN PROGRESS / B1-001._
- ✅ **S1.6** `POST /api/v1/auth/refresh` (one-time-use ротация: старый jti → Redis blocklist, новая пара; replay → 401) + `POST /api/v1/auth/signout` (отзыв jti + clear cookies, 204); `auth_service.get_active_user`. Клод, 2026-06-11 (33a422e). Runnable-зелёные: refresh no/garbage→401, signout→204. _Happy/rotation integration — B1-001._
- ✅ **S1.7** Email-service (dev mailpit / prod Y360 конфиг): `app/core/emails/` (renderer + 6 Jinja2-шаблонов welcome/verify_email/password_reset × ru/en), `app/services/email_service.py` (aiosmtplib async SMTP; send_welcome/send_verification/send_password_reset), `EmailServiceDep`, config `frontend_base_url`, pyproject +aiosmtplib +jinja2. signup шлёт welcome best-effort. Клод, 2026-06-24 (cbb0be5). _E2E «письмо в mailpit» — pending Docker-прогон._
- ✅ **S1.8** `POST /auth/verify-email` + `/auth/forgot` + `/auth/reset` — `app/core/email_tokens.py` (одноразовые токены в Redis, GETDEL), `auth_service.mark_email_verified`/`set_password`, captcha-gate вынесен в `_require_captcha` (signup+forgot). signup теперь выдаёт verify-токен + verification email. Всего **8 auth-endpoints**, совпадают с `openapi.yaml`. test_auth=20 (gate-тесты runnable + verify/forgot→reset happy под requires_db), test_email=7. Клод, 2026-06-24 (4e95ee9). _DB-integration acceptance — pending Docker-прогон._
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
- Critical path: ~~S1.0~~ → ~~S1.1~~ → ~~S1.2~~ → ~~S1.3/S1.4~~ → ~~S1.5/S1.6~~ → ~~S1.7~~ → ~~S1.8~~ (весь backend auth done, 4e95ee9) → **S1.9 (Алекс, frontend) ∥ Docker-прогон (Дима/Борис)** → зелёный gate. Backend Клода по Sprint 1 фактически закончен.
- Y360 prod-config (SMTP creds) отложен PO в Sprint 2; dev полностью на mailpit.
