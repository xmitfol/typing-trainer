# Sprint 3 · Daily Standup Log

> Async standup. Каждый агент описывает yesterday/today/blockers.
> Ника каждый день обновляет этот файл и sprint board.
> **Status**: pending start (ждёт Sprint 2 gate)

---

## Шаблон записей

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

### Алекс
- Yesterday: ...
- Today: ...
- Blockers: ...

### Клод
- Yesterday: ...
- Today: ...
- Blockers: ...

### Квинн
- Yesterday: ...
- Today: ...
- Blockers: ...

### PO (Иван)
- Action items: ...

### Остальные (Дима, Сергей, Полина, ...)
- idle / status
```

---

## Записи появятся при активации Sprint 3.

Активация = после Sprint 2 gate green:
- `verify_oauth_yandex.py` + `verify_oauth_vk.py` зелёные
- `verify_guest_to_account.py` зелёный (миграция localStorage в БД работает)
- `cleanup_anonymous_sessions` cron unit + integration test зелёные (TTL 3д по [ADR-001](../../../spec/backend/decisions/ADR-001.md))
- Sprint 2 retro проведён, retro notes зафиксированы

После активации первая запись — `## YYYY-MM-DD Sprint 3 KICKOFF` с goal-statement от Ники и owner-распределением (см. board.md §Notes critical path по дням).
