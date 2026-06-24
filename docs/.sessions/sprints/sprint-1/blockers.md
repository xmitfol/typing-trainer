# Sprint 1 · Blockers

> Активные блокеры. Эскалация в течение 4 часов после появления.
> Sprint **активен**, **весь КОД Sprint 1 написан** (backend auth + frontend S1.9, d4ecf2e). Все 3 активных блокера — операционные (Docker/proxy/E2E-прогон), на критпути к зелёному gate, **все на Диме (+Квинн на прогоне)**. **Эскалация PO рекомендована: gate упирается только в инфра-прогон, нужен слот Димы сегодня.**

---

## Active blockers

### B1-003: нет same-origin reverse-proxy → auth-cookies не работают cross-origin, verify_signup_flow.py не пройдёт
- **Discovered**: 2026-06-24
- **Affects**: S1.9 E2E, gate `verify_signup_flow.py` (весь auth-поток в браузере)
- **Owner unblock**: **Дима** (reverse-proxy для dev/E2E-стека; часть Docker-прогона)
- **Описание**: httpOnly auth-cookies (access/refresh) выставлены `SameSite=Lax`. При cross-origin (фронт `:8001` ↔ api `:8000`) браузер **не прикрепит их к fetch** → после signup/signin сессия не держится, `verify_signup_flow.py` падает. Нужен **single origin**: reverse-proxy (nginx/caddy/uvicorn-mount), где `/api/v1/*` проксируется на uvicorn, статика (`auth.html`, `assets/`) отдаётся рядом с того же origin.
- **Workaround**: на время ручной проверки — поднять статику и API под одним origin (любой reverse-proxy); постоянное решение — зафиксировать proxy в dev docker-compose / CI E2E-стеке.
- **Escalation**: **Y — эскалация PO** (тот же owner Дима; последний инфра-шаг к зелёному gate).
- **ETA unblock**: не назначена → запросить у Димы (нужен сегодня).
- **Resolved**: —

### B1-001: testcontainers Postgres-фикстуры нет → integration acceptance auth-core не зелёный
- **Discovered**: 2026-06-11
- **Affects**: S1.4, **S1.5, S1.6** (все три имеют DB-зависимые `@requires_db` тесты: signup happy/duplicate, signin happy/invalid-cred, refresh-rotation) — снимается одной фикстурой
- **Owner unblock**: Дима (testcontainers postgres-16-alpine в `conftest.py` + CI service); fallback — Борис
- **Описание**: `backend/app/tests/conftest.py` всё ещё Sprint-0 sync `TestClient` без async db-session. DB-зависимые тесты в `test_auth.py` помечены `@requires_db` (skipif без `TEST_DATABASE_URL`) и **скипаются** локально. Runnable-зелёные: captcha-gate, signin captcha-gate, refresh no/garbage→401, signout→204. Весь код S1.4–S1.6 мержабелен — блокируется только integration-проверка gate.
- **Workaround**: запустить тесты против локального Postgres через `TEST_DATABASE_URL=...` вручную; постоянное решение — async `db_session` fixture на testcontainers.
- **Escalation**: **Y — эскалация PO**. Изначально запрошено у Димы (target day 2). Теперь блокирует acceptance уже 3 закрытых задач → нужна ETA сегодня или fallback на Бориса.
- **ETA unblock**: target day 2 Sprint 1 (нужно подтверждение от Димы).
- **Resolved**: —

### B1-002: mailhog отсутствует в docker-compose → S1.7/S1.8 E2E и welcome email не проверяемы
- **Discovered**: 2026-06-11
- **Affects**: S1.7 (E2E «письмо ловится в mailhog UI»), S1.8 (verify/forgot/reset E2E), gate `verify_signup_flow.py` (welcome email шаг)
- **Owner unblock**: Дима (D1 — mailhog в `backend/docker-compose.yml`, порты 1025 SMTP / 8025 web UI)
- **Описание**: `backend/docker-compose.yml` содержит только postgres/redis/adminer. Mailhog НЕТ. Email-service в `backend/app/` ещё не написан. Код S1.7 можно писать против SMTP-абстракции (aiosmtplib → localhost:1025) **не дожидаясь Димы**, но E2E-приёмка (письмо в UI) ждёт сервис.
- **Workaround**: Клод пишет email-service как SMTP-абстракцию + S1.7/S1.8 endpoints против неё; unit-тесты с mock-SMTP. E2E-gate откладывается до mailhog.
- **Escalation**: **Y — эскалация PO** (тот же owner Дима, что и B1-001 — оба на критпути, оба на одном человеке).
- **ETA unblock**: не назначена → запросить у Димы.
- **Resolved**: —

---

## Pre-emptive / waiting

| # | Blocker | Owner unblock | Waiting since | ETA unblock | Escalation |
|---|---|---|---|---|---|
| ~~B1-pre-1~~ | ~~Sprint 0 gate не закрыт~~ — ✅ снято: PR #25 merged (60677e0) | — | — | done | — |
| B1-pre-2 | Yandex 360 SMTP credentials для S1.7 | PO | — | day 4 of Sprint 1 | warning к day 2 если нет |
| B1-pre-3 | Argon2 params confirmation (Sergei security review) — код S1.3 уже использует Argon2, sign-off параметров нужен до S1.7/prod | Сергей | 2026-06-11 | до S1.7 | warning: код написан, params не подтверждены |

---

## Resolved (в этом sprint'е)

— нет

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
