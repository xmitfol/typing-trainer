# Sprint 1 · Daily Standup Log

> Async standup. Каждый агент описывает yesterday/today/blockers.
> Ника обновляет этот файл и sprint board каждый день.
> Sprint **не стартовал** — ждёт закрытия Sprint 0.

---

## 2026-06-11 (Sprint 1 kickoff — auth vertical)

### Ника (PM)
- Yesterday: дала GO на S1.4 + sequencing (DB wiring → schemas → service → challenge → signup).
- Today: board-sync с фактом кода (ab9db6f) — S1.0/S1.1/S1.2/S1.3/S1.4/S1.4b → DONE (scaffold/код готов, integration pending). Завёл блокер **B1-001** (testcontainers). Снял B1-pre-1 (Sprint 0 закрыт).
- Blockers: B1-001 — нужна testcontainers-фикстура (owner Дима). Эскалация Диме.
- Next: Клоду → S1.5 signin (на критпути gate, зависит от готового S1.4).

### Клод (Architect)
- Yesterday: реализовал S1.0 DB/Redis wiring + S1.4 signup vertical + S1.4b challenge (schemas/service/exceptions/endpoint, honeypot+PoW, httpOnly cookies). Syntax-OK.
- Today (план): S1.5 signin → login → JWT cookies (reuse security.py verify + cookie-helper из signup).
- Blockers: полный pytest не прогнан — backend-стек не установлен локально; integration с Postgres ждёт B1-001.

### Дима (DevOps)
- Запрос от Ники: (1) testcontainers postgres-15-alpine fixture в conftest + CI service → разблокирует S1.4/S1.5 acceptance (**B1-001**); (2) статус mailhog в docker-compose dev (нужно к S1.7).

### Сергей (Security)
- Запрос: sign-off Argon2 параметров (memory/time cost) — код S1.3 уже использует Argon2, нужно подтверждение до S1.7/prod (B1-pre-3).

---

## Шаблон записи

```markdown
## YYYY-MM-DD

### Ника (PM)
- Yesterday: ...
- Today: ...
- Blockers: ...

### Борис (Backend)
- Yesterday: ...
- Today: ...
- Blockers: ...

### Клод (Architect)
- Yesterday: ...
- Today: ...
- Blockers: ...

### Алекс (Frontend)
- Yesterday: ...
- Today: ...
- Blockers: ...

### Сергей (Security)
- Yesterday: ...
- Today: ...
- Blockers: ...

### Дима (DevOps)
- Yesterday: ...
- Today: ...
- Blockers: ...
```

---

## Pre-sprint kickoff (когда Sprint 0 закроется)

Pre-sprint планинг 30 мин с участием Бориса, Клода, Алекса, Сергея. Agenda:
1. Sprint 0 retro быстрый — что узнали
2. Подтверждение estimate'ов S1.1-S1.10
3. Подтверждение dependency map (см. [../dependency_map.md](../dependency_map.md))
4. PO action checklist (Y360 creds)
5. Sprint goal формулировка одним предложением
