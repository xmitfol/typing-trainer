# Backend Specification — Typing Trainer

> **Метод:** Spec-Driven Development (SDD)
> **Версия:** v1.0 (MVP) — 2026-06-06
> **Цель:** перевести typing-trainer из чистого client-side приложения
> (localStorage) в полноценный SaaS с аккаунтами, синхронизацией прогресса,
> подписками и аналитикой.

## Структура

| Документ | Назначение | Когда читать |
|---|---|---|
| [01_PRD.md](01_PRD.md) | **WHAT** — продуктовые требования: цели, ЦА, фичи, use cases, метрики успеха | Перед стартом любой бекенд-работы |
| [02_TSD.md](02_TSD.md) | **HOW** — архитектура, ER-схема, REST API, auth-flow, deploy | Когда есть PRD-согласие |
| [03_IMPL_PLAN.md](03_IMPL_PLAN.md) | **WHEN** — пофазный план, deliverables, гейты приёмки | Чтобы вести разработку |

## Зафиксированные решения

1. **Scope MVP** — Auth + Sync + Payments + Lessons API + Analytics (полный)
2. **Стек** — Python 3.12 + FastAPI + PostgreSQL 16 (+ Redis для кеша/очередей)
3. **Auth** — email/password + Yandex OAuth + VK OAuth (без Google в v1.0)
4. **Платежи** — YooKassa (только RU-рынок в v1.0)

## Что НЕ входит в v1.0 (отложено в backlog)

- Google OAuth / Apple Sign In
- Stripe / международные платежи
- AI-powered recommendations (separate AIML spec)
- Mobile native apps (React Native / Flutter) — PWA достаточно
- Multiplayer / соревнования / лидерборды
- Партнёрская программа / реферралы
- Сертификаты с QR (только UI-stub в Profile page)

## Контекст: что уже есть на фронте

После 21 коммита на ветке `integration/new-shell`:

- **Pages**: index (landing), onboarding, dashboard, course, lesson, task, builder, settings, achievements, profile, pricing
- **Persistence**: всё в localStorage (`typing_trainer_user_profile`, `typing_trainer_lesson_progress`, `typing_trainer_test_history`, `typing_trainer_user_lessons`, `typing_trainer_certifications`)
- **i18n**: RU + EN, runtime switching
- **Curriculum**: 459 уроков (7 tier'ов: tier1, ru_teen, ru_kids, en_tier1, en_teen, en_kids, block_1)
- **Mentor system**: 4 character (anna/maxim/knopych/klavochka), JSON-based реплики
- **Achievements**: 22 ачивки в 5 группах
- **Verify suite**: 15 Playwright-скриптов покрывают все ключевые flow

## Связанные документы (legacy — пере-используем как референс)

- [docs/planning/MVP_PRD.md](../../planning/MVP_PRD.md) — старый PRD (2025-11-14, до фронт-редизайна)
- [docs/architecture/Backend_Architecture.md](../../architecture/Backend_Architecture.md) — драфт от Бориса (2025-11-16)
- [docs/architecture/Database Schema.md](../../architecture/Database%20Schema.md) — ER-схема первой версии
- [docs/architecture/Deployment Strategy.md](../../architecture/Deployment%20Strategy.md)
- [docs/design/AUDIT_2026-06-04.md](../../design/AUDIT_2026-06-04.md) — дизайн-аудит фронта (актуальный)

## Принципы SDD в этом проекте

1. **PRD меняется только с согласием PO** (Иван). Изменения версионируем.
2. **TSD производный от PRD** — любой новый API endpoint требует обоснования в PRD.
3. **Implementation Plan — живой документ.** Каждый завершённый блок отмечается ✅.
4. **Каждый артефакт имеет verify-критерий.** Без acceptance test задача не считается готовой.
5. **Backwards compatibility** — фронт не ломаем. Backend постепенно заменяет localStorage с graceful fallback.
