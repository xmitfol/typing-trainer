# Sprint 0 · Active Blockers

> Все активные блокеры с эскалацией. Ника следит за ETA и таймерами.

---

## ✅ B-001 · GitHub аккаунт `xmitfol` suspended → RESOLVED via ADR-004

- **Type**: external (GitHub support)
- **Severity**: HIGH → переведён в active mitigation
- **Opened**: ~2026-06-03
- **Closed**: 2026-06-06 (decision-level; technical migration в процессе)
- **Resolution**: миграция на Yandex Cloud Code Repository + push-mirror на новый GitHub аккаунт. Decision: [ADR-004](../../../spec/backend/decisions/ADR-004.md). Runbook: [migration_runbook.md](migration_runbook.md).
- **Executor**: Дима (DevOps)
- **PO action required**: см. S0.0a/b на board

---

## 🔄 B-002 · YC organization + новый GH email — pending PO

- **Type**: internal (PO action required)
- **Severity**: MED (блокирует Дима для S0.1)
- **Opened**: 2026-06-06
- **Owner**: PO (Иван)
- **Waiting on**:
  - YC organization создана с billing
  - Дима получает IAM-role
  - Новый GH email готов (отдельный от заблокированного)
- **ETA**: today (после прочтения этого update)
- **Workaround**: нет, это критический путь к unblock'у Sprint 0

---

## Шаблон для будущих блокеров

```markdown
## 🚨 B-NNN · Заголовок

- **Type**: internal (cross-team) | external (vendor/3rd party) | technical (bug/dependency)
- **Severity**: HIGH | MED | LOW
- **Opened**: YYYY-MM-DD
- **Owner**: @имя
- **Waiting on**: что/кто
- **Escalation**: что сделано / следующий шаг
- **Workaround**: что делаем пока заблокировано
- **Re-eval**: когда переоценить
```
