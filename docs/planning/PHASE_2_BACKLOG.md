# Phase 2 Backlog

**Статус:** документация (не план реализации). Каждый пункт — отдельный квартал работы.

**Created:** 2026-05-26 (после v0.1-mvp)
**Owner:** Иван (PO), Claude-архитектор + AI-команда агентов

---

## Контекст

После v0.1-mvp ([PR #1](https://github.com/xmitfol/typing-trainer/pull/1)) у нас стабильная клиентская SaaS на 274 уроках в 5 курсах с локальным прогрессом. Все мелкие фиксы и polish-задачи закрыты (PR #2-#7).

Phase 2 — это качественный скачок: переход от standalone-приложения к SaaS-платформе с пользовательскими аккаунтами, telemetry, и multiplayer. Каждый пункт ниже самостоятелен и может быть начат независимо, но между ними есть зависимости (например, **Tournament требует Backend**).

---

## P0 — Backend + accounts + multi-device sync

**Размер:** ~6-8 недель (или 1 квартал с командой 2-3 разработчика)

**Почему важно:** localStorage-only model = пользователь теряет прогресс при смене устройства/браузера. Это блокер для серьёзного SaaS.

**Что нужно:**
- API backend (Node.js/Ruby/Go — выбрать) с endpoints: auth, users, lesson-progress, certifications, profile
- DB: Postgres (users, lesson_progress, certifications) + Redis (session cache)
- JWT/session auth — email+password как minimum, OAuth (Google/GitHub) опционально
- Frontend client layer: миграция StorageUtils → API client с offline-first fallback
- Migration tooling: импорт текущего localStorage прогресса в backend account при первом sign-up
- DevOps: deploy infra (Docker + cloud), CI/CD, backups, monitoring

**Зависимости:**
- Никаких; стартовая Phase 2 фича

**Стейкхолдеры:**
- Алекс (Backend Architect) — design
- Дима (DevOps) — deploy infra
- Борис (Backend Dev) — implementation
- Сергей (Security) — auth review + GDPR/data retention

**Acceptance criteria:**
- Юзер может зарегистрироваться, прогресс сохраняется на сервере
- Login на другом устройстве восстанавливает все 274 уроков + сертификаты + профиль
- Offline-режим работает: запись в localStorage + sync при появлении сети
- < 200ms p95 latency на progress save endpoint

---

## P0 — Analytics / telemetry

**Размер:** ~3-4 недели (можно параллельно с Backend)

**Почему важно:** мы не знаем, на каких уроках юзеры застревают, какой WPM peak у average user, какие тиры популярны. Без данных — слепой product roadmap.

**Что нужно:**
- Event tracking: lesson_started, lesson_completed, lesson_failed, certification_earned, tier_switched, character_changed, ui_language_changed, settings_opened, onboarding_completed
- Per-event payload: user_id (или anonymous_id если без accounts), lesson_id, tier, wpm, accuracy, errors, duration, ageGroup, language
- Backend: events table (Postgres или ClickHouse если масштаб), API endpoint для bulk-ingest
- Dashboard: Metabase / Grafana / custom — funnel onboarding → first lesson → 5th lesson → certification
- Privacy: opt-in consent (GDPR), pseudonymous IDs, data retention policy (90 дней default)

**Зависимости:**
- Backend (рекомендуется, но можно стартовать standalone analytics service)

**Стейкхолдеры:**
- Полина (UX Research) — event design, hypothesis-driven instrumentation
- Марина (Marketing) — conversion funnels
- Сергей (Security) — privacy review

**Acceptance criteria:**
- Funnel chart: % юзеров, дошедших до L15, L50, L99
- WPM distribution histogram по тирам и age-groups
- Tier-switching patterns (какие тиры скипают)
- Drop-off lessons identified (где >30% юзеров бросают)

---

## P1 — Tournament / multiplayer mode

**Размер:** ~8-10 недель

**Почему важно:** мастер-план эксплицитно упоминает tournament-mode для подросткового курса (Block 4) — мотивация через соревнование. Также повышает engagement и retention.

**Что нужно:**
- Realtime layer: WebSocket (Socket.io / native ws) для синхронизации typing-state между N юзерами на одном lesson_id
- Lobby UI: создание/присоединение к комнате, выбор lesson'а, countdown 3-2-1
- Live leaderboard: WPM в реальном времени для всех участников
- Match results: place, WPM, accuracy, ELO-rating (опционально)
- Anti-cheat: server-side validation of timing (нельзя «paste» текст), rate limit на reset attempts
- Spectator mode (опционально): watch top players

**Зависимости:**
- **Backend + accounts (P0)** — нужны юзеры для leaderboards
- Analytics (P0) — для measuring tournament engagement

**Стейкхолдеры:**
- Алекс (Architect)
- Юля (Frontend) — Lobby + leaderboard UI
- Ася (AI/ML) — anti-cheat heuristics
- Полина (UX) — gamification balance

**Acceptance criteria:**
- 2-8 юзеров могут одновременно гонять урок в realtime
- Leaderboard обновляется < 500ms latency
- ELO рейтинг сохраняется между матчами
- Anti-cheat блокирует обнаруженный paste (typing-speed > 250 WPM = sus)
- Tournament-режим открывается из главного меню; есть «public lobby» и «invite-only»

---

## P1 — Mobile touch-keyboard layout

**Размер:** ~4-5 недель

**Почему важно:** ~50% web-traffic — mobile. Сейчас сайт работает на mobile, но без virtual keyboard на экране — юзер использует системную touch-keyboard, что не соответствует training-сценарию.

**Что нужно:**
- Дизайн: touch-friendly keyboard layout (key size > 40x40px на mobile)
- Адаптивный layout: split keyboard для tablets (landscape), single для phones (portrait)
- Native input handling: touch events vs keyboard events
- New `keyboardType: 'mobile'` в onboarding (опционально — авто-detect через mediaquery)
- Lesson UI: показ виртуальной клавы поверх native keyboard (или замена native через `inputmode="none"`)
- Тестирование на iOS Safari, Android Chrome (минимум)

**Зависимости:**
- Нет блокеров; работает с current frontend stack

**Стейкхолдеры:**
- Юля (Frontend) — implementation
- Полина (UX) — mobile UX research
- Квинн (Design) — keyboard layout dimensions

**Acceptance criteria:**
- Сайт usable на iPhone 12+ / Android Pixel 4+
- Touch keyboard аккуратно появляется и не перекрывает текст урока
- Speed/accuracy stats работают корректно с touch input
- Lighthouse mobile score > 85

---

## P2 — Full UI localization (i18n)

**Размер:** ~3-4 недели

**Почему важно:** PR #7 локализовал только tier-labels. Остальной UI (заголовки, кнопки, welcome-сообщения, character-tips) Russian-only. Если хотим английских юзеров — нужна полная локализация.

**Что нужно:**
- i18n framework: i18next, FormatJS, или custom (для project size — custom OK)
- Locale files: `data/locales/ru.json`, `data/locales/en.json` с всеми UI strings
- Audit existing code: extract hardcoded strings в locale references (~150-200 strings estimated)
- Plural/format rules: `{count} lessons` vs `{count} урока/уроков` (Russian plurals)
- Welcome-messages в onboarding.js — переписать на template-based (зависят от character)
- Character_tips: уже в data/characters/anna_en.json, нужна consistency

**Зависимости:**
- Никаких блокеров; полностью frontend работа

**Стейкхолдеры:**
- Юля (Frontend) — i18n integration
- Катя (Content) — translation review
- Тимофей (Technical Writer) — strings audit

**Acceptance criteria:**
- Switch RU↔EN в Settings меняет весь интерфейс (не только tier-labels)
- Все 274 lesson character_tips в обоих языках
- Plural rules корректны для обоих языков
- Нет fallback к hardcoded строкам в production коде

---

## P3 — Дополнительные mvp+1 идеи (low priority, не критично для phase 2)

### Lesson Builder UI
**Размер:** ~2 недели
Позволить юзерам/teachers создавать собственные кастомные уроки. Использует existing JSON schema.

### AI typing tutor (LLM integration)
**Размер:** ~4 недели
Анализ паттернов ошибок юзера через LLM → персонализированные drill-recommendations.
Зависит от Backend (нужен event history). Ася (AI/ML) — design.

### Premium tier / monetization
**Размер:** ~3-4 недели (после Backend)
Stripe integration, premium content (advanced courses, AI tutor unlock), pricing page.
Зависит от Backend + Analytics. Марина (Marketing) — pricing strategy.

### Achievements / badges system
**Размер:** ~2 недели
Расширение certification system. Master Plan уже описывает: 🔥 Speed Demon, 🎯 Sniper, ⚡ Lightning Fingers, 🏆 Champion, 📚 Bookworm.

---

## Не делаем (intentional non-goals)

- **Russian-only or English-only mode** — мы supportим оба, не делаем split products
- **Native mobile apps (iOS/Android)** — web-only стратегия для MVP+phase 2. React Native — Phase 3+
- **Offline-first PWA** — пока не приоритет; standard web app
- **Voice training / dictation** — типинг trainer, не voice. Out of scope

---

## Когда стартует Phase 2

Решение PO. Сейчас репо в стабильном state v0.1-mvp. Phase 2 фичи требуют:
1. Customer validation: реально ли пользователям нужен tournament/multiplayer? Полина может провести интервью с current users.
2. Resource allocation: какие из агентов команды доступны (Алекс/Борис/Дима для Backend; Юля для Mobile)
3. Funding: backend hosting + Stripe + monitoring инфраструктура — операционные расходы

См. также:
- [Мастер-план системы курсов](Мастер-план%20системы%20курсов.md) — изначальная контент-дорожная карта
- [MVP_PRD.md](MVP_PRD.md) — оригинальный PRD
- [PR #1 description](../../docs/.sessions/pr1_description.md) — что было сделано в MVP
