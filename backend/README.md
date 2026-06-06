# typing-trainer backend

Python 3.12 + FastAPI + PostgreSQL 16 + Redis 7.

> **Scaffold** (Sprint 0). Бизнес-логики ещё нет — только каркас.
> Полная спека: [../docs/spec/backend/](../docs/spec/backend/).
> Обязательно прочти [02_TSD.md](../docs/spec/backend/02_TSD.md) и
> [03_IMPL_PLAN.md](../docs/spec/backend/03_IMPL_PLAN.md) перед стартом.

---

## Quickstart (для Бориса)

### 1. Зависимости

Установлены:
- Python 3.12+
- Docker + docker-compose (для local PG + Redis)
- `make`
- [uv](https://docs.astral.sh/uv/) (рекомендую) или pip

```bash
cd backend
cp .env.example .env
# Открой .env и сгенерируй JWT_SECRET_KEY:
# python -c "import secrets; print(secrets.token_urlsafe(64))"

make install     # uv sync --all-extras --dev
```

### 2. Запустить локальную инфру

```bash
make docker-up   # postgres + redis + adminer (на :8080)
```

Adminer: http://localhost:8080 (server `postgres`, user/pass из `.env`).

### 3. Запустить backend

```bash
make dev         # uvicorn с hot-reload на :8000
```

Проверка: http://localhost:8000/api/v1/health → `{"status":"ok",...}`
OpenAPI docs: http://localhost:8000/docs

### 4. Smoke check

```bash
make lint        # ruff check
make type        # mypy
make test        # pytest (Sprint 0 — 9 stub-тестов на /health и config)
```

---

## Структура

```
backend/
├── pyproject.toml      — deps, ruff, mypy, pytest config
├── Makefile            — install / lint / test / dev / run / docker-up
├── Dockerfile          — multi-stage, production-ready
├── docker-compose.yml  — local dev (postgres + redis + adminer)
├── .env.example        — все настройки (PRD/TSD-зашитые дефолты)
├── alembic.ini         — миграции config
├── alembic/
│   ├── env.py          — читает URL из app.config
│   ├── script.py.mako  — template новой миграции
│   └── versions/       — миграции (пусто на Sprint 0)
├── scripts/
│   └── start.sh        — prod entrypoint (миграции → gunicorn)
└── app/
    ├── main.py         — FastAPI factory + lifespan + CORS + routers
    ├── config.py       — pydantic Settings (env vars)
    ├── deps.py         — DI: settings_dep, db_session (stub), current_user (stub)
    ├── core/
    │   └── logging.py  — structlog JSON-в-prod / pretty-в-dev
    ├── api/
    │   ├── router.py   — корневой /api router
    │   └── v1/
    │       ├── __init__.py — собирает auth/me/lessons/pricing routers
    │       └── health.py   — GET /api/v1/health
    ├── models/
    │   └── base.py     — Base, UUIDPkMixin, TimestampMixin
    ├── schemas/        — pydantic v2 (Sprint 1+)
    ├── services/       — бизнес-логика (Sprint 1+)
    ├── tasks/          — APScheduler + ARQ workers (Sprint 2+)
    └── tests/
        ├── conftest.py — TestClient + override settings fixture
        ├── test_health.py — sanity (4 теста)
        └── test_config.py — Settings + ADR-инварианты (6 тестов)
```

---

## Roadmap по Sprint'ам

См. [03_IMPL_PLAN.md](../docs/spec/backend/03_IMPL_PLAN.md).

| Sprint | Что делаем | Gate |
|---|---|---|
| **0** | Scaffold (этот документ) | `make lint test` зелёный |
| 1 | Auth foundation: User/UserSettings/OAuthAccount модели, JWT, signup/signin/email-verify | `verify_signup_flow.py` |
| 2 | OAuth (Yandex + VK) + migrate-guest | `verify_guest_to_account.py` |
| 3 | Profile + Progress sync + ADR-002 mutation policy | `verify_sync_across_devices.py` |
| 4 | Achievements engine (server-side) | `verify_anti_cheat.py` |
| 5 | Lessons API + paywall (FREE_LESSON_LIMIT=5) | 100% API access |
| 6 | YooKassa happy path | `verify_payment_e2e.py` |
| 7 | Payment edge cases + recurring (ADR-005) | `verify_payment_lifecycle.py` |
| 8 | Analytics / telemetry / BI | PO funnel queries |
| 9 | Family read-only (ADR-003) + GDPR | 3 verify-скрипта |
| 10 | Production-ready (Sentry, Grafana, k6) | p95 < 200ms |
| 11-12 | Open beta + iteration | 100 users / 10 paying |

---

## Архитектурные принципы (выжимка из TSD)

1. **API-first** — все endpoints под `/api/v1/`, OpenAPI auto-generated. Borisov OpenAPI stub до implementation → Алекс работает против моков параллельно (cross-team dep map).
2. **Stateless API** — состояние в БД и Redis, инстансы scale horizontally.
3. **JWT** в httpOnly cookies — access 15мин + refresh 30д с rotation.
4. **Async** везде — `async def` endpoints, asyncpg, httpx для outbound.
5. **No business logic в views** — слой `services/` отдельно от `api/`.
6. **Migrations через Alembic** — все изменения схемы версионированы. NAMING_CONVENTION в `models/base.py` для consistent constraints.
7. **Settings через env vars** — никаких defaults для secrets, `pydantic-settings` валидирует на старте.

---

## Зафиксированные бизнес-инварианты (PRD/ADR)

| Инвариант | Значение | Источник |
|---|---|---|
| `FREE_LESSON_LIMIT` | 5 | PRD Q1 |
| `ANONYMOUS_TTL_DAYS` | 3 | ADR-001 |
| `FAMILY_MAX_SUBACCOUNTS` | 4 | ADR-003 |
| `WPM_MAX_CAP` | 1500 | task.js bestWPM migration (см. fronend `router-guard.js`) |
| Поддерживаемые языки | `ru`, `en` | i18n архитектура |
| Поддерживаемые characters | `anna`, `maxim`, `knopych`, `klavochka` | Frontend onboarding |

Эти значения попадают в `app/config.py` как defaults и **проверяются в тестах**
(`test_config.py::test_default_business_rules_match_adrs`).

---

## CI / CD

[ADR-004](../docs/spec/backend/decisions/ADR-004.md): primary git = Yandex Cloud Code Repo, mirror = GitHub.
Pipeline в `.cloudbuild/lint-and-test.yaml` (создаст Дима в Sprint 0 S0.1 после миграции).

Минимальный gate Sprint 0: `make ci` (= `ci-lint` + `ci-test`).

---

## Troubleshooting

### `make install` падает на argon2-cffi
В Windows нужен Visual Studio Build Tools. На macOS/Linux — OK из коробки.

### `make docker-up` — `port already in use`
PostgreSQL уже запущен где-то. Остановите local PG или измените порт в `docker-compose.yml`.

### Тесты падают на `JWT_SECRET_KEY too short`
В `conftest.py::test_settings` ключ `"x" * 64` — этого достаточно. Если меняли в `.env` — длина должна быть ≥ 32.

---

## Связанные документы

- [Backend SDD README](../docs/spec/backend/README.md) — навигация
- [PRD](../docs/spec/backend/01_PRD.md) — продуктовые требования
- [TSD](../docs/spec/backend/02_TSD.md) — техническая спека
- [IMPL_PLAN](../docs/spec/backend/03_IMPL_PLAN.md) — sprint roadmap
- [ADR-001…005](../docs/spec/backend/decisions/) — architecture decisions
- [Risk register](../docs/spec/backend/risks.md) — owned by Ника (PM)
- [Sprint boards](../docs/.sessions/sprints/) — текущие sprint'ы
- [Cross-team dependency map](../docs/.sessions/sprints/dependency_map.md) — кто кого ждёт

---

**Owner**: Борис (Backend). Архитектурные решения — Клод. Координация / risks / sprint planning — Ника.
