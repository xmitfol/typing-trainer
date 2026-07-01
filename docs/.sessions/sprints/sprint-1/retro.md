# Sprint 1 · Retro / Sprint-end report · Auth foundation

> **Status**: ✅ CLOSED — gate GREEN (8/8) · **Дата закрытия**: 2026-06-24
> **Ветка**: `sprint-1/auth-foundation` (до коммита `de92edd`)
> **Owner**: Борис (Backend) + Алекс (Frontend) + Клод (review/импл) + Дима (infra), PM — Ника
> **Source gate**: [03_IMPL_PLAN.md §3](../../../spec/backend/03_IMPL_PLAN.md)

## 1. Итог по gate-критериям (§3)

**Gate**: «Юзер может зарегистрироваться, получить welcome email, войти, выйти, восстановить пароль.» → ✅ **ПРОЙДЕН**.

Подтверждено реальным E2E-прогоном `verify_signup_flow.py` на VM против Dockerized стека (не моки), через single-origin nginx `:8090`:

| # | Сценарий | Результат |
|---|---|---|
| 1 | signup → dashboard (PoW в браузере, капча, httpOnly cookie) | ✅ |
| 2 | signout → signin → dashboard | ✅ |
| 3 | неверный пароль → 401 | ✅ |
| 4 | forgot → подтверждение (капча + письмо) | ✅ |
| 5 | verify-email по РЕАЛЬНОМУ токену из mailpit → подтверждён | ✅ |
| 6 | reset по токену → вход новым паролём → dashboard | ✅ |
| — | **verify_signup_flow** | **8/8** |

Дополнительно: 3 письма реально доставлены в mailpit (welcome + verify + reset), `/api/v1/health` ok, `alembic upgrade` прошёл на чистой БД.

## 2. Что сделано (S1.0–S1.10 + инфра)

| ID | Задача | Статус |
|---|---|---|
| S1.0 | DB/Redis wiring (находка Ники — `deps.py` был заглушкой): async engine/sessionmaker, Redis, lifespan | ✅ |
| S1.1 | Alembic migration `users`/`oauth_accounts`/`user_settings` — **`upgrade` прошёл на чистой БД (прогон)** | ✅ |
| S1.2 | SQLAlchemy 2.0 модели (8 моделей, CHECK-constraints) | ✅ |
| S1.3 | `core/security.py` (Argon2 + JWT), `core/captcha.py` (PoW) | ✅ |
| S1.4 | `POST /auth/signup` + `GET /auth/challenge` (PoW issue, ADR-006) | ✅ |
| S1.5 | `POST /auth/signin` — conditional-captcha, anti-timing dummy-hash | ✅ |
| S1.6 | `POST /auth/refresh` (one-time-use ротация + blocklist) + `/auth/signout` | ✅ |
| S1.7 | Email-service (aiosmtplib + Jinja2 ×6 шаблонов ru/en, dev mailpit / prod Y360) | ✅ |
| S1.8 | `/auth/verify-email` + `/auth/forgot` + `/auth/reset` (одноразовые токены Redis GETDEL) | ✅ |
| S1.9 | Frontend auth (`auth.html`/`auth.js`/`auth.css`, PoW Web Worker, honeypot, wire к 8 endpoints) | ✅ |
| S1.10 | OpenAPI contract review (`openapi.yaml`, 8 endpoints) | ✅ |
| Инфра | testcontainers postgres (B1-001), mailpit (B1-002), same-origin nginx-proxy профиль `app` (B1-003) | ✅ |

**Итого**: 8 auth-endpoints ↔ `openapi.yaml`, фронт-поток signin/signup/forgot/reset, PoW кросс-язык консистентен (JS Worker ↔ Python backend).

## 3. Lessons learned (3 бага, найденных прогоном)

> **Главный вывод: билд/деплой-баги ловятся ТОЛЬКО реальным прогоном, не статикой и не unit-тестами.** Все три ниже были невидимы до Docker-прогона и заблокировали бы деплой.

1. 🔴 **Dockerfile `RUN <(...)`** — process substitution не работает в `dash` → билд падал. Блокировал любой build/deploy. (fix `de5a3a6`)
2. 🔴 **Нет `psycopg2-binary`** → `alembic upgrade` падал (sync engine в `env.py`). Блокировал миграции/deploy. (fix `f76f85f`)
3. 🟡 **verify-скрипт**: извлечение токенов из mailpit — JSON-тело + HTML-escape (`&amp;`) + фильтр по получателю. (fix `a9aa80c`/`85778a9`/`de92edd`)

**Action item → Sprint 2 / DoD**: добавить **CI-стадию с реальным Docker-прогоном стека** (build image + `alembic upgrade` на чистой БД + smoke E2E), а не только lint+unit. Два из трёх багов были чисто инфраструктурными и проходили бы зелёный unit-CI. Owner: Дима (CI pipeline). Кандидат в первый блокер Sprint 2-инфры.

## 4. Velocity-заметка

- План §3: 8 задач, ~6 человеко-дней (S1.1–S1.8).
- Факт: scope расширился сверх плана — добавлены **S1.0** (DB/Redis wiring, не был в плане — находка Ники, неявный prerequisite), **S1.9** (полный frontend), **S1.10** (контракт), плюс 3 инфра-блокера (testcontainers/mailpit/nginx-proxy).
- Реальный bottleneck оказался **не в коде, а в операционном прогоне**: весь код был готов и мержабелен на ~97% gate за ~3 дня до закрытия; финальные ~3% (Docker-прогон + 3 фикса) держали gate из-за отсутствия Docker-хоста у Клода.
- **Вывод для планирования Sprint 2**: операционный/инфра-прогон закладывать как явную задачу с owner и Docker-хостом ДО конца спринта, а не как «последний шаг». Недооценка «запустить на живом стеке» = главный источник скрытого скоупа.

## 5. Что перенесено / отложено

- Y360 prod SMTP creds — отложено PO в Sprint 2 (dev полностью на mailpit).
- Argon2 params sign-off (Сергей) — параметры в коде, формальный sign-off можно закрыть в начале Sprint 2.
