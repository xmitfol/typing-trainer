# Sprint 0 · Board

> **Status**: ✅ **CLOSED 2026-06-11** — GitHub разблокирован, PR #25 создан, scaffold pushed
> **Цель**: pre-sprint инфраструктура (см. [03_IMPL_PLAN.md §2](../../../spec/backend/03_IMPL_PLAN.md))
> **Actual duration**: week 0 (5 дней, ускорено по сравнению с estimate)
> **Owner**: Ника (PM) + Борис (Backend) + Дима (DevOps)

## Gate
✅ К концу week 0 любой коммит в `backend/` проходит CI (lint + test stub).

## Tasks

### DONE ✅
- ✅ **S0.0** · PO actions (DEPRECATED — GitHub разблокирован, миграция не нужна)
- ✅ **S0.1** · Push 43 коммитов на origin/integration/new-shell + PR #25 · @PO + @Клод · 2026-06-11
- ⬜ S0.2 · Зарегистрировать домен `typing-trainer.ru` · @PO · отложено
- ✅ S0.3 · Docker Compose для local dev (postgres + redis + adminer) · @Клод (за Бориса) · 2026-06-07
- ✅ S0.4 · Scaffold backend/ репо (pyproject, ruff, mypy, pytest, app/, models, security, alembic) · @Клод (за Бориса) · 2026-06-07
- ⬜ S0.5 · CI pipeline — GitHub Actions (вместо YC Cloud Build, т.к. ADR-004 deferred) · @Дима · Sprint 1 setup
- ✅ S0.6 · OpenAPI skeleton с `/health` endpoint · @Клод (за Бориса) · 2026-06-07

### Sprint 0 status: 6/7 closed (S0.2 домен — отдельный поток PO)

### BLOCKED
— нет

### DONE
— нет

## Dependencies (cross-team)
- @PO blocker для S0.0a/b — нужны кредитные данные YC + новый GH email
- @Дима зависит от S0.0 для старта миграции
- @Борис зависит от S0.1 (миграция) для S0.3/S0.4 (scaffold + push)

## Risks открытые
См. [risks.md](../../../spec/backend/risks.md):
- ~~R-001 (GitHub блокировка)~~ → переведён в active mitigation через ADR-004
- R-003 (Backend dev заболеет) — accepted
- R-007 (бот-регистрация) — Sprint 1 mitigation

## Daily updates
- См. [standup.md](standup.md)

## Notes
Sprint **активный**. Critical path: S0.0 (PO) → S0.1 (Дима migration) → S0.2-S0.6 (parallel).
Decision ADR-004 принят: YC Code Repo primary + GH mirror.
Runbook готов: [migration_runbook.md](migration_runbook.md).

**2026-06-07 update**: PO отложил S0.0a/b. Клод параллельно scaffold'ит backend/ локально (без push) — Variant 1. Ника параллельно координационную работу:
- [Sprint 1 board pre-fill](../sprint-1/board.md) — S1.1-S1.10 готовы к активации
- [Cross-team dependency map Sprint 0-3](../dependency_map.md) — 33 контракта между ролями
- [ADR-005-DRAFT YooKassa fallback](../../../spec/backend/decisions/ADR-005-DRAFT.md) — prep для Клода
- [standup.md](standup.md) — daily лог обновлён
