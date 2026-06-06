# Sprint 0 · Board

> **Status**: ⏸️ **Pending start** — ждёт разблокировки GitHub аккаунта
> **Цель**: pre-sprint инфраструктура (см. [03_IMPL_PLAN.md §2](../../../spec/backend/03_IMPL_PLAN.md))
> **Estimate duration**: week 0 (5 days)
> **Owner**: Ника (PM) + Борис (Backend) + Дима (DevOps)

## Gate
✅ К концу week 0 любой коммит в `backend/` проходит CI (lint + test stub).

## Tasks

### TODO (not started)
- ⬜ S0.1 · Зарегистрировать домен `typing-trainer.ru` · @PO · day 1
- ⬜ S0.2 · Создать Yandex Cloud организацию + billing · @PO · day 2
- ⬜ S0.3 · Docker Compose для local dev (postgres + redis + adminer) · @Борис · day 3
- ⬜ S0.4 · Scaffold backend/ репо (pyproject, ruff, mypy, pytest) · @Борис · day 4
- ⬜ S0.5 · Git workflow `backend/main` branch protected + PR templates · @Дима · day 5
- ⬜ S0.6 · OpenAPI skeleton с `/health` endpoint · @Борис · day 5

### IN PROGRESS
— нет (sprint не стартовал)

### BLOCKED
- 🚨 **Весь sprint** — заблокирован R-001 (GitHub аккаунт `xmitfol` suspended)
  - Owner разблокировки: PO (Иван)
  - ETA: unknown (ждём ответ GitHub support)
  - Fallback: если > 7 дней — запасной remote (Bitbucket / GitLab)

### DONE
— нет

## Dependencies (cross-team)
- @PO blocker для S0.1, S0.2 — нужны его кредитные данные
- @Борис ждёт @PO завершить S0.2 чтобы получить доступ к Yandex Cloud
- @Дима ждёт @Борис завершить S0.4 чтобы настроить branch protection

## Risks открытые
См. [risks.md](../../../spec/backend/risks.md):
- R-001 (GitHub блокировка) — основной блокер sprint'а
- R-003 (Backend dev заболеет) — accepted

## Daily updates
- См. [standup.md](standup.md)

## Notes
Sprint stalled до разблокировки. Использовать время продуктивно:
1. PO продолжает писать в GitHub support
2. Борис может локально готовить scaffold (без push)
3. Ника поддерживает risk register актуальным
