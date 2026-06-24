# Sprint 1 · Blockers

> Активные блокеры. Эскалация в течение 4 часов после появления.
> Sprint **активен**, **весь КОД Sprint 1 написан** (backend auth + frontend S1.9, d4ecf2e). **B1-003 закрыт кодом (same-origin nginx-proxy, e18a95d).** Оставшиеся 2 «блокера» (B1-001/B1-002) сняты как код — фикстуры и mailpit в compose; они уже не блокируют код, а ждут одного операционного Docker-прогона. **До зелёного gate — единственный шаг: прогнать стек на Docker-хосте (у Клода его нет). Эскалация PO: нужен слот Димы/Квинна сегодня.**

---

## Active blockers

— нет активных кодовых/конфигурационных блокеров. Остаток — один операционный Docker-прогон (см. «Operational pending» ниже).

---

## Operational pending (не блокеры кода — нужен Docker-хост)

### OP-1: финальный Docker-прогон стека → зелёный gate
- **Owner**: **Дима/Борис** (прогон стека) + **Квинн** (verify_signup_flow.py).
- **Что сделать (один заход на машине с Docker-демоном)**:
  ```
  cd backend && docker compose --profile app up -d
  pytest                                              # снимет @requires_db happy-path (B1-001)
  BASE=http://localhost:8090 python scripts/verify_signup_flow.py   # E2E через same-origin proxy (B1-003)
  ```
- **Что проверяется прогоном**: (1) `alembic upgrade head` на чистой БД (S1.1); (2) DB-зависимые integration-тесты — signup happy/duplicate, signin happy/invalid-cred, refresh-rotation, verify→forgot→reset (B1-001); (3) welcome/verify email ловится в mailpit (B1-002, S1.7/S1.8); (4) E2E браузер-поток через single-origin nginx :8090 — cookies SameSite=Lax держатся (B1-003, S1.9).
- **Почему не закрыто**: у Клода нет Docker-демона. Это операционный шаг, не код.
- **ETA**: запросить слот Димы/Квинна сегодня.

---

## Снято как код (ждут только Docker-прогон — см. OP-1)

### B1-001: testcontainers Postgres-фикстуры — СНЯТО КОДОМ (6bc572f)
- **Affects**: S1.4–S1.6, S1.8 (DB-зависимые `@requires_db` тесты).
- **Статус**: async `db_session` fixture на testcontainers postgres-16-alpine wired в `conftest.py` (6bc572f). Код-часть закрыта; `@requires_db` happy-path снимутся при `pytest` на Docker-хосте (OP-1).
- **Owner прогона**: Дима/Борис.

### B1-002: mailpit (преемник mailhog) в docker-compose — СНЯТО КОДОМ (6bc572f)
- **Affects**: S1.7/S1.8 E2E «письмо ловится», gate welcome email.
- **Статус**: mailpit добавлен в `backend/docker-compose.yml` (SMTP 1025 / UI 8025), email_service пишет через aiosmtplib. Код-часть закрыта; E2E-приёмка письма — при прогоне на Docker-хосте (OP-1).
- **Owner прогона**: Дима/Борис.

---

## Pre-emptive / waiting

| # | Blocker | Owner unblock | Waiting since | ETA unblock | Escalation |
|---|---|---|---|---|---|
| ~~B1-pre-1~~ | ~~Sprint 0 gate не закрыт~~ — ✅ снято: PR #25 merged (60677e0) | — | — | done | — |
| B1-pre-2 | Yandex 360 SMTP credentials для S1.7 | PO | — | day 4 of Sprint 1 | warning к day 2 если нет |
| B1-pre-3 | Argon2 params confirmation (Sergei security review) — код S1.3 уже использует Argon2, sign-off параметров нужен до S1.7/prod | Сергей | 2026-06-11 | до S1.7 | warning: код написан, params не подтверждены |

---

## Resolved (в этом sprint'е)

### B1-003: нет same-origin reverse-proxy → auth-cookies cross-origin не работают
- **Discovered**: 2026-06-24
- **Affects**: S1.9 E2E, gate `verify_signup_flow.py`
- **Owner unblock**: Дима
- **Описание**: httpOnly auth-cookies `SameSite=Lax` не прикреплялись при cross-origin (фронт :8001 ↔ api :8000) → сессия не держалась.
- **Resolution**: доставлено **кодом/конфигом** (коммит **e18a95d**): `backend/docker-compose.yml` профиль `app` — контейнер `backend` (Dockerfile, start.sh = alembic upgrade + gunicorn) + `proxy` (nginx :8090 → статика репо + `/api`→backend:8000), `backend/nginx/dev-proxy.conf`; frontend same-origin fix — `api-client.js` baseUrl относительный `/api/v1`, `auth.js` не подменяет baseUrl; `verify_signup_flow.py` BASE default `:8090`. Inner-loop hot-reload (`make dev`) не сломан — новые сервисы только под `--profile app`. Compose провалидирован (6 сервисов), JS прошли `node --check`.
- **Resolved**: 2026-06-24 (e18a95d). Single-origin прогон закрывается операционным OP-1.

---

## Шаблон записи

```markdown
### B1-NNN: Краткое название
- **Discovered**: YYYY-MM-DD HH:MM
- **Affects**: S1.X
- **Owner unblock**: <роль>
- **Описание**: ...
- **Workaround**: ...
- **Escalation**: <Y/N + кому>
- **Resolved**: YYYY-MM-DD (если закрыт)
```
