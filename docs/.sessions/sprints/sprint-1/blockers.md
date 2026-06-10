# Sprint 1 · Blockers

> Активные блокеры. Эскалация в течение 4 часов после появления.
> Sprint **не стартовал** — все блокеры пока pre-emptive.

---

## Active blockers

### B1-001: testcontainers Postgres-фикстуры нет → S1.4 integration acceptance не зелёный
- **Discovered**: 2026-06-11
- **Affects**: S1.4 (acceptance «integration: happy path + duplicate email»), косвенно S1.5/S1.6 (тоже потребуют живую БД)
- **Owner unblock**: Дима (testcontainers postgres-15-alpine в `conftest.py` + CI service); fallback — Борис
- **Описание**: `backend/app/tests/conftest.py` всё ещё Sprint-0 sync `TestClient` без async db-session. Happy-path и duplicate-email тесты в `test_auth.py` помечены `@requires_db` (`pytest.mark.skipif(not os.getenv("TEST_DATABASE_URL"))`) и **скипаются** локально. Captcha-gate (honeypot/PoW→403, enum→422) runnable и зелёный. Код S1.4/S1.4b готов и мержабелен — блокируется только integration-проверка gate.
- **Workaround**: запустить тесты против локального Postgres через `TEST_DATABASE_URL=...` вручную; постоянное решение — async `db_session` fixture на testcontainers (как заложено в комментарии conftest «Sprint 1+»).
- **Escalation**: Y, Диме — нужна оценка/ETA фикстуры. Если Дима занят S1.7 mailhog/docker — fallback Борис.
- **ETA unblock**: запрошено у Димы (target day 2 Sprint 1).
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
