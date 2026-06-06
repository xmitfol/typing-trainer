# Sprint 0 · Active Blockers

> Все активные блокеры с эскалацией. Ника следит за ETA и таймерами.

---

## 🚨 B-001 · GitHub аккаунт `xmitfol` suspended

- **Type**: external (GitHub support)
- **Severity**: HIGH (блокирует весь sprint)
- **Opened**: ~2026-06-03 (по логам разговоров)
- **Owner**: PO (Иван)
- **Waiting on**: GitHub support response
- **Escalation**: PO написал в support; пока не ответили — продолжаем локально
- **Workaround**:
  - Локальные коммиты не теряются (текущая ветка: `integration/new-shell`, 23 коммита)
  - Если > 7 дней — рассмотреть запасной remote (Bitbucket / GitLab)
- **Re-eval**: weekly Friday digest

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
