# Phase 2 Backlog

**Статус:** документация (не план реализации). Каждый пункт — отдельный квартал работы.

**Created:** 2026-05-26 (после v0.1-mvp)
**Updated:** 2026-06-02 — после дизайн-апдейта (8 фаз) + сборки оболочки + клавиатуры дизайнера
**Owner:** Иван (PO), Claude-архитектор + AI-команда агентов

---

## Что изменилось за месяц (контекст для backlog)

После v0.1-mvp + v0.2-parity появилось много frontend-работы:
- **Phase 0-3 уже в master:** дизайн-система, `<typing-keyboard>` Web Component, новый онбординг, лендинг
- **Phase 4-8 как PR #20-24** (открыты, ждут мержа): dashboard, course, lesson (теория), task (тренажёр на новой клавиатуре), pricing
- **Локальная `integration/new-shell`** (16 коммитов поверх): сшита навигация landing→onboarding→dashboard→course→lesson→task, router-guard, линейная прогрессия с locked-screen, persist всех настроек тулбара, Caps Lock индикатор и flashActive на модификаторах
- **Старый движок** (`app.html` + main.js/keyboard.js) удалён — заменён task.html + Web Component
- **Pricing UI** полностью построен в `pricing.html` (DEMO без бекенда)

Из-за этого приоритеты Phase 2 переосмыслены — см. отметки ⚠️/✅ в каждом пункте.

---

## Контекст

После v0.1-mvp + v0.2-parity у нас стабильная клиентская SaaS на 459 уроках в 7 курсах (RU+EN, adult+teen+kids) с локальным прогрессом и полностью спроектированным UI (8 фаз дизайн-апдейта). Все мелкие фиксы и polish-задачи закрыты.

Phase 2 — это качественный скачок: переход от standalone-приложения к SaaS-платформе с пользовательскими аккаунтами, telemetry, и multiplayer. Каждый пункт ниже самостоятелен и может быть начат независимо, но между ними есть зависимости (например, **Tournament требует Backend**).

---

## P0 — Backend + accounts + multi-device sync ⚠️ ВСЁ ЕЩЁ БЛОКЕР

**Размер:** ~6-8 недель (или 1 квартал с командой 2-3 разработчика)

**Почему важно:** localStorage-only model = пользователь теряет прогресс при смене устройства/браузера. Это блокер для серьёзного SaaS. **Дополнительно:** в новом потоке (`onboarding.html` отдельная страница, `router-guard.js` использует localStorage профиля как proxy для «пользователь авторизован»). Когда появится реальный auth — `getUser()` в router-guard меняется на серверную проверку, остальное не трогается.

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

## P1 — Mobile touch-keyboard layout 🟢 МОЖНО ДЕЛАТЬ ЛОКАЛЬНО (frontend-only)

**Размер:** ~4-5 недель (сократилось — уже есть `<typing-keyboard>` Web Component, нужно только touch-режим и адаптив)

**Почему важно:** ~50% web-traffic — mobile. Сейчас сайт работает на mobile, но без virtual keyboard на экране — юзер использует системную touch-keyboard, что не соответствует training-сценарию.

**Текущее состояние:**
- `<typing-keyboard>` уже есть в 3 типах (classic/laptop/ergonomic), Shadow DOM, реактивные атрибуты
- Виртуальная клавиатура **display-only** — клик/тап мышью/пальцем не подключен (отмечено в верификации)
- task.js использует скрытый `#capture <input>` для перехвата физических keydown — на мобильных это вызывает системную клавиатуру (нежелательно для тренажёра)

**Что нужно:**
- Подключить click/touchstart на `.key` внутри `<typing-keyboard>` Shadow DOM → диспатчить synthetic KeyboardEvent на `#capture`
- `inputmode="none"` на `#capture` чтобы не вылазила системная клавиатура на touch-устройствах
- Респонсив-юниты: `unit` адаптивно, либо `transform: scale()` обёртки под ширину
- Опционально: новый `keyboardType: 'mobile'` (упрощённый компактный layout)
- Тестирование на iOS Safari, Android Chrome

**Зависимости:**
- Нет блокеров; работает с current frontend stack
- Самый «созревший» из Phase 2 — много уже сделано

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

## P2 — Full UI localization (i18n) 🟢 МОЖНО ДЕЛАТЬ ЛОКАЛЬНО — ОБЪЁМ ВЫРОС

**Размер:** ~4-5 недель (вырос — все новые страницы Phase 4-8 + сборка добавили строк; теперь ~300-400 строк к локализации)

**Почему важно:** PR #7 локализовал только tier-labels. Остальной UI (новые dashboard/course/lesson/task/pricing) — Russian-only. profile.language = ru/en уже сохраняется, но не используется для UI text. Если хотим английских юзеров — нужна полная локализация.

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

## P3 — Дополнительные mvp+1 идеи

### Lesson Builder UI  🟢 frontend-only
**Размер:** ~2 недели
Позволить юзерам/teachers создавать собственные кастомные уроки. Использует existing JSON schema. Сохранять в localStorage (или Backend если есть).

### AI typing tutor (LLM integration)  🔴 нужен Backend + LLM API
**Размер:** ~4 недели
Анализ паттернов ошибок юзера через LLM → персонализированные drill-recommendations.
Зависит от Backend (нужен event history). Ася (AI/ML) — design.

### Premium tier / monetization  ⚠️ UI готов, не хватает только бекенда
**Размер:** ~2-3 недели (после Backend) — **сократилось**
- ✅ Pricing UI готов в `pricing.html` (3 view'а: paywall + subscription modal + payment step, всё в DEMO-режиме)
- ✅ Прайс-калькулятор работает (5 периодов × 3 плана с правильными скидками)
- Что осталось: реальный платёжный шлюз (Stripe/ЮКасса), привязка к аккаунту, paywall-триггер на lesson 6 для free-юзеров
- **Цены канонизированы 2026-06-02:** Полный 490₽/мес, Семейный 890₽/мес (см. assets/js/pricing.js)
- Марина (Marketing) — финальная pricing strategy / промо

### Achievements / badges system  🟢 КАРКАС УЖЕ ЕСТЬ
**Размер:** ~1-2 недели (сократилось)
- ✅ Дашборд имеет секцию «Достижения» с 6 бейджами (Первый урок / 7 дней подряд / 40 зн/мин / 95% точность / Половина курса / Завершить курс) — логика unlock'а уже привязана к lessonProgress + history
- Что осталось: расширить набор бейджей (Master Plan описывает 🔥 Speed Demon, 🎯 Sniper, ⚡ Lightning Fingers, 🏆 Champion, 📚 Bookworm), сделать страницу/модал «все достижения», unlock-анимации/тосты
- Pure frontend, без бекенда

### Settings page  🟢 frontend-only (новый пункт)
**Размер:** ~1 неделя
- Сейчас «Настройки» в dashboard profile menu — placeholder («СКОРО»). Тип/раскладка/звук/метроном/зум меняются только из toolbar тренажёра. Юзер не может поменять профиль/наставника/язык интерфейса вне онбординга.
- Что нужно: отдельная `settings.html` — name/gender/audience/mentor + язык интерфейса + дефолты клавиатуры. Чтение/запись `profile`. Кнопка «Сбросить прогресс».
- Закрывает placeholder в профиль-меню.

### Click мышью / touch по виртуальной клавиатуре  🟢 (вынесено сюда из верификации)
**Размер:** ~3-5 дней
- Подключить click/touchstart на `.key` в Shadow DOM `<typing-keyboard>` → dispatchEvent KeyboardEvent на `#capture` с правильным `key`+`code`
- Без `inputmode="none"` (это уже Mobile keyboard item) — просто для desktop click
- Перекрывается с **Mobile touch-keyboard** (P1) — можно сделать частью того пункта

---

## Не делаем (intentional non-goals)

- **Russian-only or English-only mode** — мы supportим оба, не делаем split products
- **Native mobile apps (iOS/Android)** — web-only стратегия для MVP+phase 2. React Native — Phase 3+
- **Offline-first PWA** — пока не приоритет; standard web app
- **Voice training / dictation** — типинг trainer, не voice. Out of scope

---

## Что можно делать ПРЯМО СЕЙЧАС (без бекенда)

Сводка по статусам — что можно двигать локально пока ждём Backend:

| Пункт | Размер | Готовность | Зависимости |
|---|---|---|---|
| **Mobile touch-keyboard** | 4-5 нед | компонент уже есть, нужен touch-режим + адаптив | нет |
| **Click мышью по on-screen клавише** | 3-5 дней | подмножество предыдущего | нет |
| **Achievements expansion** | 1-2 нед | каркас на дашборде уже есть, расширить | нет |
| **Settings page** | 1 нед | закрывает placeholder в профиль-меню | нет |
| **Full UI i18n** | 4-5 нед | profile.language уже есть, нужны locale-файлы | нет |
| **Lesson Builder UI** | 2 нед | JSON schema есть, нужно UI | нет |

🔴 **Блокировано Backend'ом:** Accounts/sync, Analytics, Tournament, AI tutor, реальный платёжный шлюз для Premium.

## Когда стартует Phase 2

Решение PO. Сейчас репо в стабильном state v0.2-parity + дизайн-апдейт (16 локальных коммитов в `integration/new-shell`). Phase 2 фичи требуют:
1. Customer validation: реально ли пользователям нужен tournament/multiplayer? Полина может провести интервью с current users.
2. Resource allocation: какие из агентов команды доступны (Алекс/Борис/Дима для Backend; Юля для Mobile)
3. Funding: backend hosting + Stripe + monitoring инфраструктура — операционные расходы

См. также:
- [Мастер-план системы курсов](Мастер-план%20системы%20курсов.md) — изначальная контент-дорожная карта
- [MVP_PRD.md](MVP_PRD.md) — оригинальный PRD (цены обновлены 2026-06-02 под дизайнерскую модель)
- [PR #1 description](../../docs/.sessions/pr1_description.md) — что было сделано в MVP
- [design_handoff_implementation.md](../.sessions/design_handoff_implementation.md) — хронология Phase 0-8 + сборка + клавиатура
