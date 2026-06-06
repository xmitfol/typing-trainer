# Sprint 0 · Daily Standup Log

> Async standup. Каждый агент описывает yesterday/today/blockers.
> Ника каждый день обновляет этот файл и sprint board.

---

## 2026-06-07 — Ника координационная работа (Клод scaffold'ит локально)

### Ника
- **Yesterday**: PO timeline консультация, ADR-004 recommendation, migration_runbook
- **Today** (параллельно с локальным scaffold'ом Клода):
  - Sprint 1 board pre-fill (10 задач S1.1-S1.10 с owner/estimate/verify/deps) + пустые standup/blockers — [`sprint-1/board.md`](../sprint-1/board.md)
  - Cross-team dependency map для Sprint 0-3 (33 dep-записей, 5 critical-path, 4 рекомендации) — [`dependency_map.md`](../dependency_map.md)
  - ADR-005 DRAFT (YooKassa recurring fallback): 3 опции, рекомендация Hybrid, 10 open questions для Клода — [`ADR-005-DRAFT.md`](../../../spec/backend/decisions/ADR-005-DRAFT.md)
- **Blockers**: всё ещё жду PO action S0.0a/b для разблокировки миграции (но не критично пока Клод scaffold'ит локально)

### Клод (Architect)
- **Yesterday**: ADR-004 + risks update
- **Today**: scaffold backend/ локально (Variant 1 из 5-вариантного analysis) — pyproject, app/, models, basic security, OpenAPI skeleton с /health. Push отложен до S0.1 миграции.
- **Next**: ответ на 10 open questions в ADR-005-DRAFT когда дойдёт очередь

### PO (Иван)
- **Today**: «PO actions YC org / GH email / IAM сделаю позже». Подтвердил «продолжай» для Клода scaffold
- **Pending**: S0.0a/b к завтра-послезавтра желательно

### Дима (DevOps)
- ожидание PO action для миграции
- может начать `docker-compose.yml` черновик локально (S0.3) если синхронизируется с Клодом по scaffold

### Борис (Backend)
- idle, может ознакомиться со scaffold'ом Клода когда тот закоммитит локально
- pre-read TSD §3 (auth endpoints) перед Sprint 1

### Алекс, Катя, остальные
- idle

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
