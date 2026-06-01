# Changelog

Все значимые изменения в проекте Typing Trainer документируются в этом файле.

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.0.0/),
версионирование следует [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

Параллельно с Phase 2 (бекенд) идёт **дизайн-апдейт** — 8-фазный handoff от дизайнера (`docs/design/update1/vanilla_handoff/`). Архитектура: vanilla JS + Web Components, без React/build-step.

### Прогресс дизайн-апдейта (8 фаз — все открыты как PR)
- ✅ **Phase 0+1 — Foundation + Keyboard Web Component** ([PR #15](https://github.com/xmitfol/typing-trainer/pull/15) merged) — `tokens.css`, `base.css`, `ui-primitives.js`, `portraits.js`, `<typing-keyboard>` с Shadow DOM
- ✅ **Phase 2 — Onboarding redesign** ([PR #16](https://github.com/xmitfol/typing-trainer/pull/16), [#17](https://github.com/xmitfol/typing-trainer/pull/17) merged) — минимальный 3-секционный флоу, фикс focus-race
- ✅ **Phase 3 — Landing page** ([PR #18](https://github.com/xmitfol/typing-trainer/pull/18) merged) — публичная маркетинг-страница
- ✅ **Phase 4 — Dashboard** ([PR #20](https://github.com/xmitfol/typing-trainer/pull/20) open) — личный кабинет
- ✅ **Phase 5 — Course Roadmap** ([PR #21](https://github.com/xmitfol/typing-trainer/pull/21) open) — список уроков с модулями
- ✅ **Phase 6 — Lesson Reading** ([PR #22](https://github.com/xmitfol/typing-trainer/pull/22) open) — long-form чтение урока
- ✅ **Phase 7 — Task Execution** ([PR #23](https://github.com/xmitfol/typing-trainer/pull/23) open) — typing-модал + success
- ✅ **Phase 8 — Pricing** ([PR #24](https://github.com/xmitfol/typing-trainer/pull/24) open) — paywall + подписка + оплата (DEMO)

### Fixed (Unreleased)
- 🐛 **Boundary-конфликт тостов** ([PR #19](https://github.com/xmitfol/typing-trainer/pull/19) open) — `errorLimitExceeded` срабатывал при `errors >= limit`, а success — при `errors <= limit`. Юзер видел «попробуй ещё раз» + «молодец» на одном исходе. Ужесточил условие во время typing до `errors > limit`. `scripts/verify_e2e_lesson1.py` гейтит.

### Shell assembly + полировка + клавиатура дизайнера (локальная ветка `integration/new-shell`, НЕ запушена)

Поверх 8 фаз — единый поток приложения, навигация-фиксы, интеграция клавиатуры дизайнера. 14 коммитов:

#### Сборка оболочки
- `landing.html` → `index.html` (точка входа), `app.html` (старый движок) → удалён после интеграции клавиатуры
- `onboarding.html` — отдельная standalone-страница (онбординг-overlay + редирект на dashboard по событию)
- `assets/js/router-guard.js` — единый guard (~30 строк): protected без профиля → index; onboarding с профилем → dashboard
- Прошивка навигации между всеми новыми страницами

#### Навигация и линейная прогрессия
- 🐛 `fix(nav)`: `task.html` — НЕ точка входа в урок; и dashboard, и course ведут на `lesson.html` (теория), оттуда «Открыть тренажёр» → `task.html`. Success-«Продолжить» → `lesson.html?lesson=N+1` (снова с теории)
- ✨ Шорткат «Выполнить задание →» в топбаре lesson.html (быстрый повтор без прокрутки)
- 🔒 Блокировка кнопки следующего урока на lesson.html пока текущий не пройден
- 🐛 `fix(course)`: номера упражнений видны всегда (статус done/locked — отдельным значком слева, не подменяет номер); линейная прогрессия = доступен только первый непройденный
- 🔒 Прямой URL на закрытый урок → экран-заглушка «Рановато для этого урока» с кнопками «Продолжить · урок N» и «Список уроков»

#### Тренажёр / клавиатура дизайнера
- ⌨️ Интеграция `<typing-keyboard>` Web Component из `docs/design/tasks/vanilla_handoff` — полная виртуальная ЙЦУКЕН с цветами пальцев, home-bump на А/О, split-Space на эргономике, классы layout/format
- 🐛 `fix(task)`: word-wrap target — слова не рвутся по буквам (была «лит|ь»); `<span class="word">` nowrap + breakable spaces
- ⌨️ Обновления клавиатуры от дизайнера:
  - эргономика теперь полная (numpad+nav вертикально справа, не подрезается)
  - `format="ansi|iso"` (L-образный Enter), `layout` 4 RU-раскладки (standard/phonetic/typewriter/mac)
  - новая модель подсветки: блёклая база + яркая следующая со штриховкой
- 💾 Персистентность настроек тулбара — в профиле сохраняются `keyboardType`, `keyboardLayout`, `fingerHint`, `keySound`, `metronome`, `taskZoom` (по запросу PO «запоминать»)
- 🔧 Новый тулбар: подсветка пальцев (ВКЛ), звук/метроном (ВЫКЛ, красные точки), масштаб «A→A» с поповером ± шаг 10%, 70-150% — зум всей `.task-card` для слабовидящих
- 👆 flashActive на ЛЮБОЙ клавише (Shift/Ctrl/Alt/Tab/Enter/Backspace/стрелки/F-keys) — палец виден; **Caps Lock индикатор** 🔒 над клавиатурой через `e.getModifierState`

#### Регрессионные тесты
- `verify_navigation_flow.py` 18/18 — landing → onboarding → dashboard → course → lesson → task → success
- `verify_task_keyboard.py` 25/25 — клавиатура, эргономика, модификаторы, Caps badge, layout, URL-lock
- `verify_kb_prefs.py` 17/17 — персистентность всех настроек тулбара
- `verify_course_gating.py` 11/11, `verify_lesson_gating.py` 10/10, `verify_lesson_url_lock.py` 12/12
- `verify_all_pages_smoke.py` — smoke по всем страницам

### Открытые вопросы PO
- ⚠️ **Цены**: `pricing.js` использует 490/890₽ + «Семейный», а `docs/planning/MVP_PRD.md` — 299/399₽ без Family. Нужно решение какие канонические.
- **Старые verify-скрипты** (`verify_v02_smoke.py`, `verify_age_routing.py`, `verify_user_flow_local.py`) ссылаются на удалённый `#welcomeModal` и старый поток — нужно обновить или удалить.
- **Click мышью по виртуальной клавиатуре** — отложено (display-only сейчас); полезно для touch-устройств.

### Planned (Phase 2 backend, отдельный поток)
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
