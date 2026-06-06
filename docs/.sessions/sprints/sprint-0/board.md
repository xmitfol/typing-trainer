# Sprint 0 · Board

> **Status**: 🟢 **Active** — стартует с миграции GitHub → YC Code Repo (см. [ADR-004](../../../spec/backend/decisions/ADR-004.md) + [migration_runbook.md](migration_runbook.md))
> **Цель**: pre-sprint инфраструктура (см. [03_IMPL_PLAN.md §2](../../../spec/backend/03_IMPL_PLAN.md))
> **Estimate duration**: week 0 (5 days)
> **Owner**: Ника (PM) + Борис (Backend) + Дима (DevOps)

## Gate
✅ К концу week 0 любой коммит в `backend/` проходит CI (lint + test stub).

## Tasks

### TODO (not started)
- ⬜ **S0.0a** · **PO action**: создать YC organization + billing + новый GH email · @PO · today
- ⬜ **S0.0b** · **PO action**: дать Диме IAM-role на YC organization · @PO · today
- ⬜ **S0.1** · Миграция GitHub → YC Code Repo + GH mirror (по [migration_runbook.md](migration_runbook.md)) · @Дима · 3-4ч после S0.0
- ⬜ S0.2 · Зарегистрировать домен `typing-trainer.ru` · @PO · day 2
- ⬜ S0.3 · Docker Compose для local dev (postgres + redis + adminer) · @Борис · day 3
- ⬜ S0.4 · Scaffold backend/ репо (pyproject, ruff, mypy, pytest) · @Борис · day 4
- ⬜ S0.5 · ~~Git workflow~~ → **YC Cloud Build pipeline** (`.cloudbuild/lint-and-test.yaml`) + branch protection · @Дима · day 5 (часть в S0.1)
- ⬜ S0.6 · OpenAPI skeleton с `/health` endpoint · @Борис · day 5

### IN PROGRESS
- 🔄 S0.0a/b — ожидание PO action для разблокировки migration

### BLOCKED
— нет (R-001 переведён в active mitigation через ADR-004)

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
