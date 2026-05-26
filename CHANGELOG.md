# Changelog

Все значимые изменения в проекте Typing Trainer документируются в этом файле.

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.0.0/),
версионирование следует [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

Следующая фаза работы — Phase 2 фичи из [docs/planning/PHASE_2_BACKLOG.md](docs/planning/PHASE_2_BACKLOG.md). Каждая — отдельный квартал работы.

### Planned
- **P0:** Backend + accounts + multi-device sync (~6-8 недель)
- **P0:** Analytics / telemetry (~3-4 недели)
- **P1:** Tournament / multiplayer mode (~8-10 недель)
- **P1:** Mobile touch-keyboard layout (~4-5 недель)
- **P2:** Full UI localization (расширение PR #7 на весь UI) (~3-4 недели)
- **P3:** Lesson Builder, AI tutor (LLM), Premium tier (Stripe), Achievements/badges

---

## [0.2.0-parity] - 2026-05-26 — Full RU↔EN parity

11 PR замержено после v0.1-mvp. Полный паритет русских и английских курсов: 459 уроков в 7 тирах. Все остаточные находки закрыты, репо в чистом state.

### Added
- 🇷🇺 **tier1 расширен 39 → 99 уроков** ([PR #9](https://github.com/xmitfol/typing-trainer/pull/9))
  - B4 (L40-54): Скорость — биграммы, триграммы, панграммы (WPM 52→64)
  - B5 (L55-69): Точность — реальная проза, новости, диалоги (WPM 66→78)
  - B6 (L70-84): Практика — деловые тексты, OKR, маркетинг (WPM 80→92)
  - B7 (L85-99): Мастерство — литература, Чехов/Толстой (WPM 94→105)
  - L39 переименован в «БЛОК 3 ФИНАЛ», курс-финал теперь L99
- 🇷🇺 **ru_teen курс** — 75 уроков с Кнопычом ([PR #10](https://github.com/xmitfol/typing-trainer/pull/10))
  - B1 (L1-15): Основы (ФЫВА ОЛДЖ → алфавит)
  - B2 (L16-30): Поп-культура (кино-цитаты, песни, диалоги)
  - B3 (L31-45): Соц-сети (хэштеги, VK/Telegram, TikTok-комменты)
  - B4 (L46-60): Скорость (новости, блоги, форумы)
  - B5 (L61-75): Школа + турнир-финал на 95 WPM
- 🇷🇺 **ru_kids курс** — 50 уроков с Клавочкой ([PR #11](https://github.com/xmitfol/typing-trainer/pull/11))
  - Полный паритет с en_kids — Колобок, принцесса+дракон, Пип
- 🎨 **Tier-switcher polish** ([PR #2](https://github.com/xmitfol/typing-trainer/pull/2)) — column-layout с группировкой RU/EN, language badges (RU/EN), border-left accents (Junior/Kids/Diagnostic)
- 🌐 **Tier labels i18n структура** ([PR #3](https://github.com/xmitfol/typing-trainer/pull/3)) — `labels: { ru, en }` для всех тиров, перевод «EN Junior» → «Юниор»
- 🌐 **UI language switcher** ([PR #7](https://github.com/xmitfol/typing-trainer/pull/7)) — RU/EN toggle в Settings, persistence через localStorage
- 📋 **Phase 2 backlog** ([PR #8](https://github.com/xmitfol/typing-trainer/pull/8)) — детальный документ оставшихся фич с sizing/dependencies/stakeholders

### Changed
- `tierLessonCount.tier1`: 39 → **99**
- `tierLessonCount.ru_teen`: 0 → **75** (новый tier)
- `tierLessonCount.ru_kids`: 0 → **50** (новый tier)
- `pickInitialTier`: добавлена RU-маршрутизация по character (Кнопыч → ru_teen, Клавочка → ru_kids)
- `getTierMeta`: новая structure с `labels: { ru, en }` + UI-language picker через `getUiLanguage()`
- Сертификация теперь триггерится на финалах ВСЕХ 5 контент-курсов (L99 RU, L99 EN, L75 ru_teen, L75 en_teen, L50 ru_kids, L50 en_kids)
- L39 переименован: «🎉 ФИНАЛ: Мастер слепой печати» → «БЛОК 3 ФИНАЛ: Освоение алфавита и символов»

### Fixed
- 🐛 `errorLimitExceeded` срабатывал на (limit+1)-й ошибке вместо limit-й — исправлено `>` → `>=` ([в PR #1 уже]) 
- 🐛 **Filename padding** в en_teen/en_kids ([PR #2 inline]) — lesson_1.json → lesson_01.json, иначе L1-L9 не загружались (HTTP 404)
- 🐛 **keys-trained metadata** ([PR #6](https://github.com/xmitfol/typing-trainer/pull/6)) — 31 урок имели capitals в text без Shift в keys_trained
- 📝 **Content review pass** ([PR #4](https://github.com/xmitfol/typing-trainer/pull/4)) — Teen B5 L65/L75 + Kids B5 L47 (missing apostrophe)
- 🌐 `showCourseComplete` toast теперь показывает локализованный лейбл вместо raw tier ID

### Removed
- 5 orphan HTML-файлов из корня (debug-keyboard, keyboard-only, keyboard-size-test/-backup, modal-keyboard-test) — все были debris из initial commit ([PR #5](https://github.com/xmitfol/typing-trainer/pull/5))

### Infrastructure
- `.gitignore` создан + 12MB DOC-исходник «Соло на пишущей машинке» гитигнор'нут ([PR #5](https://github.com/xmitfol/typing-trainer/pull/5))
- Все project-артефакты в docs/, .claude/agents/, README, AGENTS.md, CHANGELOG.md, scripts/generate_lesson_sequence.py — массовый `git add` ([PR #5])
- 11 generator-скриптов в `scripts/gen_*.py` — переиспользуемая инфраструктура для будущих контент-итераций

### Stats
- Уроков: 50 → **459** (RU 235 + EN 224)
- Тиров: 5 → **7** (добавлены `ru_teen`, `ru_kids`)
- PR замержено: **11** (после v0.1-mvp)
- Лейн контента: 6 (3 возрастных × 2 языка)

---

## [0.1.0-mvp] - 2026-05-25 — MVP launch

Первый production-ready release. End-to-end client-only тренажёр с полным онбордингом, lesson picker, keyboard redesign, и сертификацией.

См. [PR #1 description](docs/.sessions/pr1_description.md) для полного списка.

### Added
- 🎓 **274 lessons across 5 courses**:
  - RU `tier1` (Основной) — 39 lessons
  - RU `block_1` (Мизинец) — 11 lessons (диагностический)
  - EN `en_tier1` (English) — 99 lessons (L1-99, финал WPM 105)
  - EN `en_teen` (Junior) — 75 lessons с Кнопычом
  - EN `en_kids` (Kids) — 50 lessons с Клавочкой
- 👤 **4-section онбординг** — имя + персонаж + клавиатура + язык
- 🤖 **4 наставника** с собственными голосами:
  - Анна (учительница), Максим (опытный) — для взрослых
  - Кнопыч (робот) — для подростков
  - Клавочка (добрая) — для детей
  - 10 character-сценариев на лесон (lessonStart, goodProgress, tooManyErrors, etc.)
  - Локализация RU+EN для всех персонажей
- 🎯 **Age-based routing**: Кнопыч+EN → en_teen, Клавочка+EN → en_kids, остальные → en_tier1
- ⌨️ **Keyboard redesign (7 phases)**:
  - Data-driven рендер из keyboard-data.js
  - 3 layouts: Classic / Laptop / Ergonomic (split)
  - 5 design-состояний (default/hover/active/highlight/error) через per-key CSS variables
  - Responsive unit (60/48/38/22px) + debounced resize
  - **Live RU↔EN keyboard switching** (ЙЦУКЕН ↔ QWERTY)
  - Dark theme через prefers-color-scheme
- 🏆 **Сертификация Bronze/Silver/Gold/Platinum**:
  - Bronze: ≥25 WPM, ≥85% точность
  - Silver: ≥40 WPM, ≥90%
  - Gold: ≥60 WPM, ≥93%
  - Platinum: ≥80 WPM, ≥96%
  - Ceremonial modal + грид в Settings → Достижения
  - Upgrade-only логика, триггерится на L99 EN
- 🔊 **Audio** — keystroke sound + metronome (Web Audio API, sine 800Hz)
- ⚙️ **Settings panel** — gear icon, character switch, progress reset
- 📊 **Lesson Picker** — sidebar со статусами (current/completed/available/locked) и звёздами
- 🎨 **Top toolbar** — Classic/Laptop/Ergonomic switcher + Символы/Shift/Звук/Метроном toggles + RU/EN pills

### Fixed
- `errorLimitExceeded` теперь срабатывает на limit-й ошибке (было limit+1)
- Onboarding: clear currentLesson при submit (edge case с language switch)
- CharacterSystem race condition на first-visit onboarding
- `process?.env` crash в браузере (нет process в global scope)

### Stats
- 274 lessons, 5 courses, 4 mentors, 3 keyboard layouts, 2 languages

---

## [0.0.5] - 2025-11-14 — Team formation & planning

Подготовительная фаза перед MVP-разработкой.

### Added
- 👥 Команда из 11 AI-агентов (Алекс/Борис/Ася/Катя/Полина/Марина/Юля/Квинн/Дима/Сергей/Тимофей)
- 📋 MVP Product Requirements Document
- 💰 Pricing strategy (Early Bird 299₽/мес, Regular 399₽/мес)
- 🎯 Мастер-план курсов (99 уроков для взрослых)
- 📚 Documentation structure (planning, architecture, requirements, Learning)

### Decisions
- ✅ No Lifetime subscription tier
- ✅ Desktop only в MVP
- ✅ Freemium from Day 1
- ✅ Russian market first

---

## [0.0.1] - 2025-11-03 — Initial commit

### Added
- 🎨 Базовая HTML/CSS/Vanilla JS структура
- 🎹 Виртуальная клавиатура (russian QWERTY layout)
- 📊 Система статистики (WPM, accuracy, errors)
- 💾 LocalStorage для persistence
- 📝 Первые 5 уроков
- ⚙️ `config/settings.js` — APP_CONFIG

---

## Roadmap

См. [docs/planning/PHASE_2_BACKLOG.md](docs/planning/PHASE_2_BACKLOG.md) для детального бэклога Phase 2 фич.

### v0.3 — Backend + Accounts (Phase 2 P0)
Multi-device sync, аккаунты, JWT, server-side прогресс. ~6-8 недель.

### v0.4 — Analytics + Mobile (Phase 2 P0-P1)
Event tracking, funnels, Metabase. Параллельно с mobile touch-keyboard.

### v0.5 — Tournament + Full i18n (Phase 2 P1-P2)
Multiplayer, leaderboards, ELO. Полная UI локализация.

### v1.0 — Phase 2 complete
Полный SaaS-стек: accounts + multi-device + analytics + tournament + mobile.

---

**Format:** Keep a Changelog 1.0.0
