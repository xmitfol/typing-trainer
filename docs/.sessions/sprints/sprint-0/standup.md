# Sprint 0 · Daily Standup Log

> Async standup. Каждый агент описывает yesterday/today/blockers.
> Ника каждый день обновляет этот файл и sprint board.

---

## 2026-06-06 PM — Sprint 0 АКТИВИРОВАН (ADR-004 accepted)

### Ника
- **Yesterday**: nothing
- **Today**: проконсультировала PO по timeline (PERT P80 = 17 окт), по альтернативам GH; PO принял миграцию на YC Code Repo; обновила board, blockers, risks; runbook для Димы готов
- **Blockers**: жду PO action S0.0a/b (YC org + GH email)

### Клод (Architect)
- **Today**: написал ADR-004 (single-vendor YC), обновил risks.md (R-001 → mitigation, R-011 strengthened), board.md, blockers.md
- **Next**: ждать завершения миграции для дальнейших ADR (R-002 YooKassa fallback strategy в очереди)

### PO (Иван)
- **Today**: принял решения по timeline + миграции
- **Action items до конца дня**: создать YC organization + новый GH email + IAM-role Диме

### Дима (DevOps)
- **Today**: ожидание PO action для старта миграции (по runbook)
- **Estimate**: 3-4 часа на саму миграцию, +1 день на CI pipeline

### Борис, Алекс, остальные
- idle до завершения миграции, могут продолжать локально

---

## 2026-06-06 (Ника прибыла, sprint не стартовал) — earlier

### Ника
- **Yesterday**: nothing (это мой первый день)
- **Today**: пройти onboarding ([../../nika_onboarding.md](../../nika_onboarding.md)), создать risk register, подготовить пустой sprint board
- **Blockers**: весь sprint заблокирован R-001 (GitHub аккаунт)

### Борис
- **Yesterday**: ещё не подключился к проекту
- **Today**: —
- **Blockers**: ожидание разблокировки GitHub, чтобы можно было начать scaffold

### PO (Иван)
- **Yesterday**: написал в GitHub support
- **Today**: ждёт ответ
- **Blockers**: GitHub support response time

### Остальные
- Frontend (Алекс): sprint 0 не его — следующая работа после старта backend
- Контент (Катя): закончила Phase 1, ждёт Phase 2 заказов
- QA (Квинн): дежурит на verify-suite (15 скриптов зелёные)
- DevOps (Дима): ждёт S0.5 в очереди после S0.4
- Другие: idle

---

## Шаблон будущих записей

```markdown
## YYYY-MM-DD

### Ника
- Yesterday: ...
- Today: ...
- Blockers: ...

### Борис
- Yesterday: ...
- Today: ...
- Blockers: ...

...
```
