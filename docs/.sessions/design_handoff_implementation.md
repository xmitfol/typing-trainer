# Design Handoff Implementation - Session Log

**Поток:** дизайн-апдейт от дизайнера, 8 фаз
**Источник:** `docs/design/update1/vanilla_handoff/`
**Архитектурный выбор PO:** вариант B — vanilla JS + Web Components (без React/build-step)
**Последнее обновление:** 2026-05-27

---

## Сводный статус

| Phase | Что | Статус | PR |
|---|---|---|---|
| 0 | Foundation (tokens, base, ui-primitives, portraits) | ✅ merged | #15 |
| 1 | Keyboard Web Component | ✅ merged | #15 |
| 2 | Onboarding redesign + focus-race fixes | ✅ merged | #16, #17 |
| 3 | Landing page (public marketing) | ✅ merged | #18 |
| 4 | Dashboard | 🚧 CSS готов локально, HTML pending | — |
| 5 | Course Roadmap | ⏳ pending | — |
| 6 | Lesson Reading | ⏳ pending | — |
| 7 | Task Execution | ⏳ pending | — |
| 8 | Pricing | ⏳ pending | — |

**Параллельно:** PR #19 — boundary-фикс `errorLimitExceeded`, открыт, ждёт мержа.

---

## 2026-05-27 — E2E-верификация + boundary-фикс

### Что делалось
1. **Полная E2E-верификация флоу онбординга и первого урока** через Playwright (headless Chromium).
   - Сценарий: имя «Тест», gender=M, audience=adult, mentor=Anna, lang=ru, keyboard=classic.
   - Проверены: рендер онбординга, заполнение формы, submit, превью урока 1 («Первые буквы: А, О, В, Н», target_wpm=10, error_limit=2), клик «Напечатать этот текст», все 4 character-toast'а Анны.
   - Welcome-модал из старого ТЗ **не существует** — был удалён в Phase 2 онбординга, превью открывается напрямую.

### Находки
1. ⚠️ **Boundary-конфликт `errorLimitExceeded` + `lessonCompleteSuccess`**: при `errors == error_limit` (типовой случай для первого урока с лимитом 2) пользователь видел **обе** взаимоисключающие фразы:
   - Во время typing: «Упс, Тест! Ошибок многовато (2 из 2). Попробуем еще раз? 💪»
   - В конце: «Тест, ты молодец! Переходим к следующему? 🚀»
   - Корень: `checkErrorThresholds()` использовал `errors >= limit`, `notifyLessonOutcome()` считал успехом `errors <= errorLimit`.
   - **Фикс:** PR #19, `errors > limit` во время typing. Success-критерий не трогали.

2. ⚠️ **WPM-критерий success де-факто отключён** для быстрых юзеров: с `target_wpm=10` любая разумная скорость даёт `wpm >= target_wpm == true`. Не блокер, но искажает оценку — открытый техдолг.

3. 🔍 Mentor pre-select по гендеру: при `gender=M` дефолтно подсвечивается Максим. Юзер должен явно кликнуть Анну. Возможно стоит вообще не пре-селектить — на усмотрение PO.

### Артефакты
- `scripts/verify_e2e_lesson1.py` — двухсценарный регрессионный тест (at-limit + over-limit), оба зелёные после фикса.
- Скриншоты: `scripts/screenshots/verify_e2e_lesson1/` (в gitignore).

### Чейнджи в коде
- `assets/js/main.js:914` — `errors >= limit` → `errors > limit` в `checkErrorThresholds()` + 3-строчный комментарий с объяснением «почему строгое сравнение».
- `.gitignore` — добавлен `scripts/screenshots/`.

---

## 2026-05-20..26 — Phase 0-3 (history)

### Phase 0 + 1 — Foundation + Keyboard (PR #15)
- `assets/css/tokens.css` (94 строки) — все design variables (palette, typography, radii, shadows, dark theme override).
- `assets/css/base.css` (193 строки) — primitive classes. **Не линкуется в index.html** чтобы не ломать существующий UI.
- `assets/js/ui-primitives.js` (163 строки) — `window.ui.{button,card,input,tabs,modal}`.
- `assets/js/portraits.js` — 10 SVG-портретов + `detectGender(name)` для русских имён.
- `assets/js/typing-keyboard.js` (560 строк) — Web Component с Shadow DOM, реактивные атрибуты.

### Phase 2 — Onboarding redesign (PR #16, #17)
- Старый 4-шаговый онбординг полностью переписан.
- Новый профиль: name, gender (m/f), audience (adult/teen/kid), mentor (anna/maxim для adult, fixed для teen/kid), keyboardType, language.
- Автодетект: language из navigator.language, keyboard из User-Agent.
- Удалён welcome modal — после submit пользователь сразу видит превью урока.
- **Фикс focus-race** (PR #17): `shouldStealFocus()` в main.js был привязан к селектору `.onboarding-overlay.active` (старый), новый класс — `.onboarding-v2.active`. Плюс убран `setTimeout(50ms)` в `show()`, который позволял main.js init() украсть фокус. После фикса verify_onboarding_v2.py показал 6/6 routing scenarios PASS.

### Phase 3 — Landing (PR #18)
- `landing.html` + `assets/css/landing.css` (~898 строк суммарно).
- 8 секций: Hero, Features, Curriculum, Mentors, Testimonials, Pricing teaser, FAQ, CTA.
- Anonymous/Authorized состояния через localStorage check профиля.
- URL: `http://localhost:8000/landing.html`.

---

## Следующие шаги

1. **Phase 4 — Dashboard HTML** (после мержа PR #19).
   - `dashboard.css` уже готов локально (не закоммичен).
   - Структура из `docs/design/update1/vanilla_handoff/_design_reference/dashboard/dashboard.jsx` (637 строк): Header → WelcomeStrip → 2-column grid (CourseCard+LessonList+QuickActions | MentorCard+StatsCard+AchievementsRow).
   - Нужно: HTML-разметка + JS чтения профиля из localStorage + ссылки на index.html для запуска урока.

2. **Phase 5-8** — по порядку, как договорились с PO.

3. **Housekeeping** (по мере необходимости):
   - Старые verify-скрипты (`verify_user_flow_local.py`, `verify_v02_smoke.py`, `verify_age_routing.py`) ссылаются на удалённый `#welcomeModal` — обновить.
   - WPM-критерий success для коротких уроков с низким target_wpm — обсудить с PO.
   - `docs/design/design_handoff_keyboard_layouts/`, `docs/design/pages/` — orphan-папки, удалены но unstaged.

---

## Ключевые контакты с дизайном

- **Handoff source:** `docs/design/update1/vanilla_handoff/`
- **Дизайн-референс компонентов:** `docs/design/update1/vanilla_handoff/_design_reference/{landing,dashboard,course,lesson,task,pricing}/*.jsx` — НЕ запускать как React (пути сломаны), использовать только как visual reference, портировать в vanilla вручную.
- **Финальный план:** `docs/design/full plan/` (untracked, локально).
- **Апдейты клавиатуры:** `docs/design/tasks/vanilla_handoff/`, `docs/design/tasks/update/keyboard_handoff/`, `docs/design/tasks/update_keyboard/keyboard_handoff/`, `docs/design/tasks/update_keyboard1/keyboard_handoff/` — серия инкрементов компонента + task screen.

---

## 2026-05-27..06-02 — Phase 4-8 + сборка + клавиатура

Фактически выполнено всё, что планировалось — плюс существенная сборка/полировка/интеграция клавиатуры.

### Phase 4-8 (5 PR открыто, ждут мержа)

- **PR #20 Phase 4 Dashboard** — личный кабинет (приветствие, карта курса, ближайшие уроки, QA, mentor, статистика, достижения)
- **PR #21 Phase 5 Course Roadmap** — все уроки с roadmap-визуализацией модулей; модули как accordion'ы
- **PR #22 Phase 6 Lesson Reading** — long-form страница теории с mentor-вставкой, narrative из tips и inline-exercise preview
- **PR #23 Phase 7 Task Execution** — typing-модал с success-экраном
- **PR #24 Phase 8 Pricing** — paywall + subscription + payment (DEMO)

Каждая фаза — отдельная ветка от master, регрессионный Playwright-скрипт.

### Шаг 1 — Сборка оболочки (ветка `integration/new-shell`)

После 8 фаз — собрали в единый поток:
- **`landing.html` → `index.html`** (точка входа), **`app.html`** — temporary fallback старого движка
- **`onboarding.html`** — standalone-страница (overlay + редирект на dashboard по событию завершения)
- **`assets/js/router-guard.js`** — единый guard (~30 строк): protected без профиля → index; onboarding с профилем → dashboard
- Прошита навигация: dashboard «Продолжить» → lesson; course → lesson; lesson «Открыть тренажёр» → task; success → lesson?lesson=N+1

### Фиксы навигации и прогрессии (по фидбэку PO)

- `fix(nav)`: task.html НЕ точка входа — только из lesson.html
- `feat(lesson)`: шорткат «Выполнить задание →» в топбаре; next-кнопка блокируется пока урок не пройден
- `fix(course)`: номера упражнений всегда видны (статус — отдельный значок слева); линейная прогрессия = доступен только первый непройденный
- `fix(progression)`: прямой URL на закрытый урок → экран-заглушка с кнопкой к доступному
- `fix(task)`: word-wrap — слова не рвутся по буквам

### Шаг 2 — Клавиатура дизайнера (серия handoff'ов)

1. **Базовая интеграция** `<typing-keyboard>` Web Component из `docs/design/tasks/vanilla_handoff` + наши lesson-loader/router-guard/прогресс/word-wrap. После — `app.html` удалён (старый движок больше не нужен).
2. **Эргономика с numpad/nav справа** (`update/keyboard_handoff`) — фидбэк PO: до этого ergo был alpha-only и подрезался
3. **format ANSI/ISO + 4 RU-раскладки + новая модель подсветки** (`update_keyboard/keyboard_handoff`)
4. **Новый тулбар + зум 70-150%** (`update_keyboard1/keyboard_handoff`) — подсветка пальцев / звук / метроном с дефолтами + масштаб «A→A» для слабовидящих
5. **Персистентность всех настроек** в профиле (`keyboardType`, `keyboardLayout`, `fingerHint`, `keySound`, `metronome`, `taskZoom`) по запросу PO
6. **flashActive на ЛЮБОЙ клавише** (модификаторы/Tab/Enter/стрелки) + **Caps Lock индикатор** над клавиатурой через `e.getModifierState`

### Стратегия мержа

1. PR #19-24 → master (конфликтов между ними нет)
2. `integration/new-shell` ребейзится → отдельный PR (assembly + nav-fixes + клавиатура — 14 коммитов)

### Открытые вопросы PO

- **Цены**: pricing.js (490/890 + Family) vs MVP_PRD (299/399 без Family) — нужно решение
- **Старые verify-скрипты** — обновить или удалить (ссылки на удалённый `#welcomeModal`)
- **Click мышью** по виртуальной клавише — отложено (display-only)
- **Дашборд QA-карточки** — `#` placeholder'ы
- **WPM-критерий** success практически отключён для коротких уроков с низким target_wpm
