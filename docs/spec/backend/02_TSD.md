# 02 · TSD — Backend Technical Specification

> **Technical Specification Document**
> **Версия:** 1.0 · **Дата:** 2026-06-06
> **Производный от:** [01_PRD.md](01_PRD.md) v1.0
> **Стек:** Python 3.12 + FastAPI + PostgreSQL 16 + Redis 7

---

## 1. Архитектура высокого уровня

### 1.1. Компоненты

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser (vanilla JS)                    │
│  index.html, dashboard, profile, task, lesson, ...           │
│  localStorage (offline) ⟷ API client (online)                │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTPS
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  Nginx (reverse proxy + TLS termination + static + rate limit) │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
┌──────────────┐      ┌────────────────┐
│  FastAPI (gunicorn + uvicorn worker × 4)             │
│  /api/v1/auth, /me, /lessons, /pricing,             │
│  /webhooks/yookassa, /events                        │
└──────┬───────────────────┬──────────┬───────────────┘
       │                   │          │
       ▼                   ▼          ▼
┌─────────────┐    ┌─────────────┐  ┌───────────────────┐
│  PostgreSQL │    │   Redis     │  │  YooKassa API     │
│  (primary)  │    │ (cache +    │  │  (платежи + WH)   │
│             │    │  sessions + │  └───────────────────┘
└─────────────┘    │  rate-lim)  │
                   └─────────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │  ARQ workers    │
                 │  (emails,       │
                 │   analytics)    │
                 └─────────────────┘
```

### 1.2. Принципы

1. **API-first** — все endpoints под `/api/v1/`, OpenAPI auto-generated
2. **Stateless API** — состояние только в БД и Redis, инстансы scale horizontally
3. **JWT для auth** — access (15 мин) + refresh (30 дней) в httpOnly cookies
4. **httpOnly + SameSite=Lax** cookies — защита от XSS/CSRF
5. **idempotency** для payments/webhooks через `Idempotency-Key` header
6. **Async везде** — `async def` endpoints, asyncpg, httpx для outbound
7. **Migrations через Alembic** — все изменения схемы версионированы
8. **No business logic в views** — слой `services/` отдельно от `api/`

### 1.3. Структура репо (новая директория)

```
backend/
├── alembic/                  # миграции
│   ├── versions/
│   └── env.py
├── app/
│   ├── main.py               # FastAPI app + middleware + routers
│   ├── config.py             # pydantic Settings (env vars)
│   ├── deps.py               # dependency injection (db session, current_user)
│   ├── api/
│   │   ├── v1/
│   │   │   ├── auth.py       # register, login, refresh, oauth callback
│   │   │   ├── me.py         # profile, progress, history, settings
│   │   │   ├── lessons.py    # GET tier/{tier}/lesson/{n}, list
│   │   │   ├── pricing.py    # plans, checkout-link создание
│   │   │   ├── webhooks.py   # YooKassa webhook
│   │   │   └── events.py     # analytics POST batch
│   │   └── router.py
│   ├── core/
│   │   ├── security.py       # JWT, password hashing (Argon2)
│   │   ├── oauth.py          # Yandex + VK OAuth flow
│   │   ├── rate_limit.py     # Redis-based rate limiter
│   │   └── emails.py         # SMTP (Yandex 360) + templates
│   ├── models/               # SQLAlchemy 2.0 declarative
│   │   ├── user.py
│   │   ├── progress.py
│   │   ├── subscription.py
│   │   ├── attempt.py
│   │   └── event.py
│   ├── schemas/              # pydantic v2 для request/response
│   ├── services/             # бизнес-логика
│   │   ├── auth_service.py
│   │   ├── progress_service.py
│   │   ├── achievement_service.py
│   │   ├── payment_service.py
│   │   └── lesson_service.py
│   ├── tasks/                # ARQ workers
│   └── tests/                # pytest, фабрики через factory_boy
├── data/lessons/             # symlink на frontend's data/lessons (read-only)
├── pyproject.toml
├── poetry.lock
└── Dockerfile
```

### 1.4. Окружения

| Env | Назначение | DB | Хост |
|---|---|---|---|
| `dev` | local разработка | Docker Postgres | localhost |
| `staging` | предпрод, прогон verify | managed Postgres (1 GB) | staging.typing-trainer.ru |
| `prod` | production | managed Postgres (high availability) | typing-trainer.ru |

---

## 2. ER-схема и DDL

### 2.1. Диаграмма

```
        ┌──────────┐         ┌──────────────┐         ┌─────────────────┐
        │  users   │1───────*│ progress     │         │ subscriptions   │
        │          │         │              │      ┌─*│                 │
        │ id (uuid)│         │ user_id      │      │  │ user_id         │
        │ email    │         │ tier         │      │  │ plan            │
        │ pass_hash│         │ lesson_num   │      │  │ status          │
        │ name     │         │ stars        │      │  │ started_at      │
        │ audience │         │ best_wpm     │      │  │ expires_at      │
        │ gender   │         │ best_acc     │      │  │ yookassa_id     │
        │ character│         │ completed_at │      │  └─────────────────┘
        │ language │         └──────────────┘      │
        │ created  │1───────*┌──────────────┐      │  ┌─────────────────┐
        └────┬─────┘         │ attempts     │      │  │ events          │
             │               │              │      │  │                 │
             │1              │ user_id      │      │  │ user_id (opt)   │
             │               │ tier         │      │  │ type            │
             │               │ lesson_num   │      │  │ payload (jsonb) │
             │               │ wpm/acc/dur  │      │  │ created_at      │
             │               │ created_at   │      │  └─────────────────┘
             │               └──────────────┘      │
             │                                      │
             │1                                     │
             ├──────────────────────────────────────┤
             │1                                     │1
             │                                      │
             │            ┌──────────────────┐      │
             └───────────*│ oauth_accounts   │      │
                          │                  │      │
                          │ user_id          │      │
                          │ provider (Y/VK)  │      │
                          │ external_id      │      │
                          │ raw_payload      │      │
                          └──────────────────┘      │
                                                    │
        ┌─────────────────┐                         │
        │ user_settings   │1────────────────────────┘
        │                 │
        │ user_id (PK)    │
        │ keyboard_type   │
        │ keyboard_layout │
        │ finger_hint     │
        │ key_sound       │
        │ metronome       │
        │ task_zoom       │
        │ hide_indicator  │
        │ preview_off     │
        │ updated_at      │
        └─────────────────┘
```

### 2.2. Основные таблицы

#### `users`
```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           CITEXT UNIQUE NOT NULL,            -- case-insensitive
    email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
    password_hash   VARCHAR(255),                       -- NULL для OAuth-only
    name            VARCHAR(80) NOT NULL,
    audience        VARCHAR(10) NOT NULL,               -- 'adult'|'teen'|'kid'
    gender          CHAR(1),                            -- 'm'|'f'|NULL
    character       VARCHAR(20) NOT NULL,               -- 'anna'|'maxim'|'knopych'|'klavochka'
    language        CHAR(2) NOT NULL DEFAULT 'ru',      -- 'ru'|'en'
    is_anonymous    BOOLEAN NOT NULL DEFAULT FALSE,     -- guest accounts
    parent_user_id  UUID REFERENCES users(id),          -- family sub-accounts
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ                          -- soft delete (GDPR)
);
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_parent ON users(parent_user_id) WHERE parent_user_id IS NOT NULL;
```

#### `user_settings`
```sql
CREATE TABLE user_settings (
    user_id          UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    keyboard_type    VARCHAR(20) NOT NULL DEFAULT 'classic',
    keyboard_layout  VARCHAR(20) NOT NULL DEFAULT 'standard',
    finger_hint      BOOLEAN NOT NULL DEFAULT TRUE,
    key_sound        BOOLEAN NOT NULL DEFAULT FALSE,
    metronome        BOOLEAN NOT NULL DEFAULT FALSE,
    task_zoom        SMALLINT NOT NULL DEFAULT 100 CHECK (task_zoom BETWEEN 70 AND 150),
    hide_indicator   BOOLEAN NOT NULL DEFAULT FALSE,
    preview_off      BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `oauth_accounts`
```sql
CREATE TABLE oauth_accounts (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider     VARCHAR(10) NOT NULL,           -- 'yandex'|'vk'|'google'(future)
    external_id  VARCHAR(255) NOT NULL,
    raw_payload  JSONB NOT NULL,                  -- ответ provider'а
    linked_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (provider, external_id)
);
CREATE INDEX idx_oauth_user ON oauth_accounts(user_id);
```

#### `progress`
```sql
CREATE TABLE progress (
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tier          VARCHAR(20) NOT NULL,           -- 'tier1'|'ru_teen'|...
    lesson_num    SMALLINT NOT NULL CHECK (lesson_num > 0),
    stars         SMALLINT NOT NULL CHECK (stars BETWEEN 0 AND 5),
    best_wpm      INTEGER NOT NULL CHECK (best_wpm BETWEEN 0 AND 1500),  -- cap из миграции
    best_accuracy SMALLINT NOT NULL CHECK (best_accuracy BETWEEN 0 AND 100),
    best_time     INTERVAL NOT NULL,
    completed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, tier, lesson_num)
);
CREATE INDEX idx_progress_user ON progress(user_id);
```

#### `attempts` (полная история, append-only)
```sql
CREATE TABLE attempts (
    id           BIGSERIAL PRIMARY KEY,
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tier         VARCHAR(20) NOT NULL,
    lesson_num   SMALLINT NOT NULL,
    wpm          INTEGER NOT NULL,
    accuracy     SMALLINT NOT NULL,
    duration_ms  INTEGER NOT NULL,
    errors       SMALLINT NOT NULL DEFAULT 0,
    rhythm       SMALLINT,                         -- nullable, не во всех попытках
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_attempts_user_date ON attempts(user_id, created_at DESC);
CREATE INDEX idx_attempts_user_tier ON attempts(user_id, tier, lesson_num);
```

#### `subscriptions`
```sql
CREATE TABLE subscriptions (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan                 VARCHAR(20) NOT NULL,    -- 'monthly_full'|'family_quarterly'|...
    status               VARCHAR(20) NOT NULL,    -- 'pending'|'active'|'expired'|'cancelled'|'failed'
    started_at           TIMESTAMPTZ,
    expires_at           TIMESTAMPTZ,
    yookassa_payment_id  VARCHAR(64) UNIQUE,
    amount_kopecks       INTEGER NOT NULL,
    currency             CHAR(3) NOT NULL DEFAULT 'RUB',
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_subs_user_active ON subscriptions(user_id, status) WHERE status = 'active';
```

#### `events` (аналитика)
```sql
CREATE TABLE events (
    id           BIGSERIAL PRIMARY KEY,
    user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id   UUID NOT NULL,                  -- браузерная сессия
    type         VARCHAR(40) NOT NULL,            -- 'signup'|'lesson_started'|...
    payload      JSONB NOT NULL DEFAULT '{}'::jsonb,
    user_agent   VARCHAR(255),
    ip_hash      VARCHAR(64),                     -- SHA256 IP, не plain (152-ФЗ)
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_events_type_time ON events(type, created_at DESC);
CREATE INDEX idx_events_user_time ON events(user_id, created_at DESC) WHERE user_id IS NOT NULL;
-- Partition by month для долгосрочного роста
```

### 2.3. JSON-схема урока (полная)

```jsonc
// GET /api/v1/lessons/tier1/1 — отдаёт нужный язык
{
  "id": "tier1_lesson_01",
  "tier": "tier1",
  "lesson_number": 1,
  "title": "Первые буквы: А, О, В, Н",
  "description": "Освоение базовых 4 букв основного ряда",
  "target_wpm": 10,
  "error_limit": 2,
  "error_limit_percent": 5,
  "text": "ааа ооо ввв ннн оно она он ан на",
  "text_sequence": [...],
  "keys_trained": ["А","О","В","Н","Space"],
  "new_keys": ["А","О","В","Н"],
  "finger_focus": "Указательные и средние пальцы",
  "tips": [
    {"type": "lead", "text": "..."},
    {"type": "drop", "text": "..."},
    {"type": "callout", "icon": "💡", "title": "...", "text": "..."},
    {"type": "exercise", "target": "ааа ооо ввв ннн", "finger": "blue", "hint": "..."},
    {"type": "p", "text": "..."},
    {"type": "pullquote", "text": "...", "by": "методика курса"},
    {"type": "exercise", "target": "оно она он ан на", "finger": "green"}
  ],
  "character_tips": {
    "anna": "...", "maxim": "...", "knopych": "...", "klavochka": "..."
  },
  "phase": 1,
  "version": "2.0"
}
```

---

## 3. REST API

### 3.1. Соглашения

- **Base URL**: `https://typing-trainer.ru/api/v1`
- **Format**: JSON, UTF-8
- **Auth**: httpOnly cookies (`access_token`, `refresh_token`) после login
- **Errors**: RFC 7807 (`application/problem+json`)
  ```json
  {"type":"about:blank","title":"Validation Error","status":422,"detail":"...","errors":[...]}
  ```
- **Pagination**: cursor-based (`?cursor=...&limit=50`)
- **Versioning**: `/v1/` в URL, breaking changes → `/v2/`
- **Headers обязательные**:
  - `Accept-Language: ru|en`
  - `X-Client-Version: 1.0.0` (для миграций)

### 3.2. Auth endpoints

| Метод | Path | Описание | Body / Query | Response |
|---|---|---|---|---|
| `POST` | `/auth/signup` | Регистрация email/pass | `{email, password, name, audience, gender?, character, language}` | `200 {user, access, refresh}` или `409` если email занят |
| `POST` | `/auth/signin` | Логин | `{email, password}` | `200 {user, access, refresh}` set-cookies или `401` |
| `POST` | `/auth/signout` | Выход | — | `204` + clear cookies |
| `POST` | `/auth/refresh` | Обновить access по refresh | (cookie) | `200 {access}` |
| `POST` | `/auth/forgot` | Запрос reset email | `{email}` | `202` всегда (защита от перебора) |
| `POST` | `/auth/reset` | Сменить пароль по токену | `{token, new_password}` | `200` или `400` |
| `POST` | `/auth/verify-email` | Подтверждение email | `{token}` | `200` |
| `GET`  | `/auth/oauth/{provider}/start` | Начать OAuth | `?redirect=` | `302` к provider |
| `GET`  | `/auth/oauth/{provider}/callback` | OAuth callback | `?code=&state=` | `302` к фронту + set cookies |
| `POST` | `/auth/migrate-guest` | Перенести localStorage в аккаунт | `{guest_data: {...}}` | `200 {user}` |

### 3.3. User endpoints (`/me`)

| Метод | Path | Описание |
|---|---|---|
| `GET`  | `/me` | Текущий профиль (+ subscription status) |
| `PATCH`| `/me` | Обновить профиль (name, character, language, ...) |
| `DELETE`| `/me` | GDPR — soft delete + email-чек через 30 дней |
| `GET`  | `/me/settings` | UserSettings |
| `PATCH`| `/me/settings` | Обновить (любое поле) |
| `GET`  | `/me/progress` | `[{tier, lesson_num, stars, best_wpm, ...}, ...]` |
| `POST` | `/me/progress` | Сохранить попытку (атомарно: progress + attempt + achievements check) |
| `GET`  | `/me/history?cursor=&limit=50` | Пагинированная история |
| `GET`  | `/me/achievements` | Server-computed список |
| `GET`  | `/me/family` | Список sub-account'ов (для родительского) |
| `POST` | `/me/family/add` | Создать sub-account |
| `GET`  | `/me/export` | GDPR — ZIP всех данных |

### 3.4. Lessons endpoints

| Метод | Path | Описание |
|---|---|---|
| `GET` | `/lessons/{tier}` | Список уроков (только метаданные: id, num, title, target_wpm) |
| `GET` | `/lessons/{tier}/{n}` | Полный JSON одного урока |
| `GET` | `/lessons/{tier}/{n}/access` | Проверка: открыт ли урок для юзера (paywall + progression) |

### 3.5. Pricing & payments

| Метод | Path | Описание |
|---|---|---|
| `GET`  | `/pricing/plans` | Список тарифов (price, periods, discount %) |
| `POST` | `/pricing/checkout` | Создать YooKassa-платёж | `{plan_id, period}` → `{checkout_url, payment_id}` |
| `POST` | `/webhooks/yookassa` | YooKassa webhook | signed payload | `200` или `400` |
| `GET`  | `/me/subscriptions` | История подписок юзера |
| `POST` | `/me/subscriptions/{id}/cancel` | Отмена авто-продления |

### 3.6. Analytics

| Метод | Path | Описание |
|---|---|---|
| `POST` | `/events/batch` | Принять до 100 событий за раз | `{events: [{type, payload}, ...]}` | `202` |

Принимаем как от анонимных так и авторизованных юзеров. Anti-flood через rate-limit + payload schema check.

### 3.7. Полный пример: завершение упражнения

```http
POST /api/v1/me/progress HTTP/1.1
Host: typing-trainer.ru
Cookie: access_token=eyJ...
Content-Type: application/json
Idempotency-Key: 7d2e0bfb-1c03-4e3d-...

{
  "tier": "tier1",
  "lesson_num": 6,
  "wpm": 42,
  "accuracy": 96,
  "duration_ms": 87000,
  "errors": 1,
  "rhythm": 78,
  "completed_at": "2026-06-06T14:21:30Z"
}
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "progress": {
    "tier": "tier1", "lesson_num": 6,
    "stars": 4, "best_wpm": 42, "best_accuracy": 96, "best_time": "00:01:27"
  },
  "newly_earned": [
    {"id": "wpm40", "label": "Lightning · 40 зн/мин", "earned_at": "..."}
  ],
  "next_unlocked": {"tier": "tier1", "lesson_num": 7}
}
```

---

## 4. Auth-flow в деталях

### 4.1. JWT-стратегия

- **access_token** — 15 мин, RS256, claims: `sub` (user_id), `exp`, `roles`
- **refresh_token** — 30 дней, rotation при каждом use, stored hashed в Redis
- **Cookies**: `httpOnly`, `Secure`, `SameSite=Lax`, `Domain=.typing-trainer.ru`
- **CSRF**: для state-changing endpoints — double-submit cookie token

### 4.2. Анонимный → авторизованный flow

```python
# Гость:
# Frontend генерирует guest_id (UUID v4) и хранит в localStorage
# При обращении к /api/v1/events/batch — sессии без user_id

# Регистрация:
POST /auth/signup {..., guest_data: {profile, progress, history}}
→ Создаём user
→ Создаём user_settings
→ INSERT INTO progress SELECT * FROM jsonb_to_recordset(guest_data->'progress')
→ INSERT INTO attempts ...
→ Возвращаем токены + user
```

### 4.3. OAuth (Yandex / VK)

Стандартный OAuth 2.0 code flow:

1. `GET /auth/oauth/yandex/start?redirect=/dashboard` → redirect к Yandex
2. Yandex → `GET /auth/oauth/yandex/callback?code=...&state=...`
3. Backend: exchange code → access token → fetch user info
4. Связываем по email (если есть) или создаём нового
5. INSERT INTO oauth_accounts
6. Set cookies + redirect к `?redirect`

Provider-specific client_id/secret в `.env`.

### 4.4. Password hashing

- **Argon2id** через `passlib`: time=2, mem=64MB, parallelism=2
- Re-hash при login если параметры обновились

### 4.5. Rate limits

| Endpoint | Limit |
|---|---|
| `/auth/signin` | 5 req / IP / минуту |
| `/auth/signup` | 3 req / IP / 10 минут |
| `/auth/forgot` | 1 req / email / час |
| `/me/progress` | 60 req / user / минуту |
| `/events/batch` | 100 events × 10 req / user / минуту |
| остальное | 1000 req / user / минуту |

Реализация: `slowapi` + Redis.

---

## 5. Payments / YooKassa

### 5.1. Поток оплаты

```
Юзер → /pricing → выбор plan + period → POST /pricing/checkout
       ↓
Backend → создаёт payment в YooKassa с capture=true
       ↓ возвращает {checkout_url, payment_id}
Frontend → window.location = checkout_url
       ↓
YooKassa форма оплаты → юзер платит
       ↓
YooKassa → POST /webhooks/yookassa (signed)
       ↓
Backend проверяет подпись, обновляет subscription.status = 'active'
       ↓ отправляет email-чек
       ↓
YooKassa → redirect юзера на /pricing?status=success
```

### 5.2. Идемпотентность

- На `POST /pricing/checkout` — генерируем `Idempotency-Key` и кешируем результат на 24ч в Redis
- Webhook'и YooKassa обрабатываем с проверкой `payment_id` — если уже видели, возвращаем 200 без действий

### 5.3. Failure handling

- Webhook не пришёл — cron каждые 5 мин проверяет `subscriptions` в `pending` статусе и тянет YooKassa API
- Платёж отклонён — email-уведомление + статус `failed`, юзер видит на /me/subscriptions

### 5.4. Recurring (auto-renewal)

YooKassa в РФ требует **«сохранённый платёжный метод»** — при первом платеже добавляем `save_payment_method: true` → получаем `payment_method_id`. На expiry+24h cron создаёт новый платёж по сохранённой карте.

---

## 6. Deployment

### 6.1. Целевая инфраструктура (start)

- **Хост**: Yandex Cloud (или Selectel — RU юрисдикция)
- **Compute**: 1 VM с 2 vCPU / 4GB RAM (≈ 1500₽/мес)
- **DB**: managed PostgreSQL 16, 1 GB RAM, 50GB SSD (≈ 1200₽/мес)
- **Redis**: managed Redis 7, 256MB (≈ 300₽/мес)
- **Object storage**: Yandex S3 для лесон-картинок и email-attachments
- **Email**: Yandex 360 SMTP relay
- **DNS + CDN**: Cloudflare (бесплатно)

### 6.2. CI/CD

- **GitHub Actions** (когда аккаунт разблокируется):
  - PR: lint (ruff), type-check (mypy), test (pytest), build Docker
  - merge to `main`: deploy to staging
  - tag `vX.Y.Z`: deploy to prod (с manual approval)

### 6.3. Сборка и старт

```dockerfile
# backend/Dockerfile (multi-stage)
FROM python:3.12-slim AS builder
WORKDIR /build
COPY pyproject.toml poetry.lock ./
RUN pip install poetry && poetry export -o requirements.txt

FROM python:3.12-slim
WORKDIR /app
COPY --from=builder /build/requirements.txt .
RUN pip install -r requirements.txt
COPY app/ ./app/
COPY alembic/ ./alembic/ alembic.ini ./
CMD ["gunicorn", "app.main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
```

### 6.4. Migration policy

- На старте контейнера — `alembic upgrade head` (idempotent)
- Blue-green deploy для безопасных миграций
- Breaking schema changes → multi-step: добавить колонку → ждать клиенты → удалить старую

---

## 7. Стратегия тестирования

### 7.1. Уровни

| Уровень | Покрытие | Инструмент |
|---|---|---|
| **Unit** | services/, core/ | pytest |
| **Integration** | api/ endpoint → DB | pytest + testcontainers postgres |
| **Contract** | API против OpenAPI | schemathesis |
| **E2E** | фронт + бекенд | Playwright (наши verify_*.py) |
| **Load** | критичные endpoints | k6 |

### 7.2. Coverage target

- Services: 90%+
- API endpoints: 100% happy path + main errors
- Critical paths (auth, payments): 100%

### 7.3. Тестовые фикстуры

- `pytest --reset-db` — пересоздаёт схему из миграций
- `factory_boy` — генерация User/Progress/Subscription
- VCR для записи/replay YooKassa API
- Webhook-симулятор для payment flow

### 7.4. Verify скрипты — фронт+бекенд E2E

Существующие 15 `scripts/verify_*.py` обновляем чтобы шли через backend (а не localStorage). Добавляем новые:

- `verify_signup_flow.py` — гость → анонимный → регистрация → миграция
- `verify_oauth_yandex.py`, `verify_oauth_vk.py` — mock provider'ов через httpx-mock
- `verify_payment_e2e.py` — checkout → webhook → subscription active
- `verify_sync_across_devices.py` — 2 контекста Playwright, прогресс синхронизирован

---

## 8. Безопасность

### 8.1. OWASP Top 10 — наши контр-меры

| Risk | Mitigation |
|---|---|
| Injection | SQLAlchemy parameterized, никаких raw f-string queries |
| Broken Auth | Argon2, JWT short-lived, rotation, rate-limit |
| Sensitive Data Exposure | TLS everywhere, no PII в логах, IP-hashing |
| XXE / SSRF | requests timeout, no XML parser |
| Broken Access Control | RBAC через `current_user` dependency, `subscription_required` decorator |
| Security Misconfig | env vars only, no defaults для secrets, CSP headers |
| XSS | httpOnly cookies, CSP `script-src 'self'` |
| Deserialization | только pydantic, никаких pickle |
| Vulnerable deps | dependabot + `pip-audit` weekly |
| Insufficient Logging | structlog + sentry для errors |

### 8.2. 152-ФЗ compliance

- Согласие на обработку PII — отдельный чекбокс в signup
- Хранение PII только в РФ (Yandex Cloud)
- IP не храним plain — SHA256 hash в events
- Право на забвение — `DELETE /me` + grace 30 дней, потом hard delete + tombstone

### 8.3. Защита payments

- YooKassa webhook signature validation (HMAC-SHA1)
- Idempotency keys для всех state-changing операций
- Audit log всех payment-events в отдельной партиции

---

## 9. Observability

### 9.1. Логирование

- **structlog** в JSON формат
- Поля: `request_id`, `user_id` (или null), `path`, `status`, `latency_ms`
- Уровни: INFO для нормальных операций, WARNING для retries, ERROR для крашей

### 9.2. Метрики

- **Prometheus client** в FastAPI
- Метрики: HTTP requests by status, DB query duration, payment success rate, active users (gauge)
- **Grafana** dashboard в staging+prod

### 9.3. Tracing

Опционально v1.1 — **OpenTelemetry + Jaeger** для distributed tracing.

### 9.4. Alerting

- Sentry для ошибок (free tier)
- Healthcheck `/health` + UptimeRobot
- Alert правила: error rate > 1%, p95 latency > 500ms, payment failure rate > 5%

---

## 10. Открытые технические решения

| # | Вопрос | Кандидаты | Решение к |
|---|---|---|---|
| T1 | Email-провайдер | Yandex 360 / Mailgun / SendGrid | Sprint 2 |
| T2 | Хранилище секретов | env / Vault / Yandex Lockbox | Pre-prod |
| T3 | Logs aggregation | self-hosted Loki / Yandex Cloud Logging | Sprint 5 |
| T4 | Где хранить sketches/uploads | Yandex S3 / Cloudflare R2 | Sprint 3 |
| T5 | Cron-планировщик | APScheduler / cronjob в k8s / Yandex Cloud Functions | Sprint 4 |

---

## Changelog

| Дата | Версия | Автор | Изменения |
|---|---|---|---|
| 2025-11-16 | 0.1 | Борис | Initial Backend_Architecture.md |
| 2026-06-06 | 1.0 | Клод + PO | Полная переработка под актуальные frontend-структуры и SDD методологию |
