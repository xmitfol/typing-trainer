# Sprint 1 · Board · Auth foundation

> **Status**: ⏸️ **Pending start** — ждёт закрытия Sprint 0 (CI green + scaffold готов)
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
| ⬜ S1.1 | Alembic migration: `users`, `oauth_accounts`, `user_settings` таблицы | Борис | 0.5d | `alembic upgrade head` на чистой БД | S0.3 (Docker Compose), S0.4 (scaffold) |
| ⬜ S1.2 | `app/models/user.py` SQLAlchemy 2.0 модели | Борис | 0.5d | unit test create_user | S1.1 |
| ⬜ S1.3 | `app/core/security.py` — Argon2 hash + JWT sign/verify | Борис | 1d | unit tests с известными векторами | S0.4 (scaffold) |
| ⬜ S1.4 | `POST /api/v1/auth/signup` — email/pass + auto-create settings | Борис | 1d | integration: happy path + duplicate email | S1.2, S1.3 |
| ⬜ S1.5 | `POST /api/v1/auth/signin` — login → JWT cookies | Борис | 0.5d | integration test | S1.3, S1.4 |
| ⬜ S1.6 | `POST /api/v1/auth/signout` + `POST /auth/refresh` | Борис | 0.5d | integration tests | S1.5 |
| ⬜ S1.7 | Email-провайдер (Yandex 360 SMTP) + welcome email | Борис | 1d | реальный email прилетает в gmail-тест | S1.4, PO action (Y360 creds) |
| ⬜ S1.8 | `POST /auth/verify-email` + `/auth/forgot` + `/auth/reset` | Борис | 1d | E2E через mailhog в dev | S1.7 |
| ⬜ S1.9 | **Frontend integration**: `<auth-modal>` или `auth.html` — wire к API | Алекс | 1d | verify_signup_flow.py зелёный | S1.4, S1.5; API contract от S1.4 |
| ⬜ S1.10 | **OpenAPI contract review** — Клод ревьюит signup/signin до implementation | Клод | 0.5d | контракт зафиксирован в `/openapi.yaml` | S0.6 |

### IN PROGRESS
— (sprint не стартовал)

### BLOCKED
— (предварительный список):
- ⛔ Все задачи S1.x BLOCKED Sprint 0 завершением
- ⛔ S1.7 потенциально BLOCKED PO action (Yandex 360 SMTP credentials)

### DONE
— нет

## Dependencies (cross-team)

- **Борис → Алекс**: OpenAPI контракт `/auth/signup` и `/auth/signin` — нужен на **day 3** sprint'а, иначе Алекс начинает с mocks
- **Борис → Клод**: OpenAPI skeleton ревью до implementation S1.4 (предотвращение rework)
- **PO → Борис**: Yandex 360 SMTP credentials к **day 4** (для S1.7)
- **Сергей → Борис**: подтверждение Argon2 параметров (memory cost, time cost) до S1.3 — security-relevant
- **Дима → Борис**: mailhog в Docker Compose dev (если ещё нет — добавить в S0.3 extension)

## Risks для этого sprint'а

См. [risks.md](../../../spec/backend/risks.md):
- **R-007** (бот-регистрация) — Sprint 1 mitigation: **Yandex SmartCaptcha с самого начала**. Добавлено в S1.4 acceptance criteria
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
- Sprint **не активирован**. Активация после прохождения Sprint 0 gate.
- Critical path: S1.1 → S1.2 → S1.3/S1.4 (parallel) → S1.5/S1.6 → S1.7 → S1.8 → S1.9
- Если S1.7 заблокируется Y360 creds — fallback на mailhog dev и перенос S1.7/S1.8 production-config в Sprint 2.
