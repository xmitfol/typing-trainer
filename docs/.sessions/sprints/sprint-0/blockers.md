# Sprint 0 · Active Blockers

> Все активные блокеры с эскалацией. Ника следит за ETA и таймерами.

---

## ✅ B-001 · GitHub аккаунт `xmitfol` suspended → FULLY RESOLVED

- **Type**: external (GitHub support)
- **Severity**: HIGH
- **Opened**: ~2026-06-03
- **Closed**: 2026-06-11
- **Resolution**: GitHub support разблокировал аккаунт. PO прошёл 2FA. Git Credential Manager закэшировал credentials. Push 43 коммитов выполнен → [PR #25](https://github.com/xmitfol/typing-trainer/pull/25).
- **Impact на ADR-004**: миграция на YC стала optional. Решение PO: оставляем GitHub primary, YC рассматриваем opt-in для prod-pipeline позже.

---

## ✅ B-002 · YC organization + новый GH email → CANCELLED

- **Status**: больше не нужно (cancelled by superseding event)
- **Reason**: GitHub разблокирован 2026-06-11, миграция на YC отложена. Если в будущем решим вернуться к YC primary — re-open этот блокер.

---

## Active blockers

— нет. Все блокеры Sprint 0 закрыты.

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
