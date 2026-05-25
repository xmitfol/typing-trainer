## MVP launch: 274 lessons, 5 courses (RU + EN Adult/Junior/Kids) + certification

Этот PR — фактически вся MVP-работа от первоначального онбординга до полной системы курсов. Объём (~28k строк, 43 коммита) отражает то, что ветка `timofey/documentation` была единственной активной для всей feature-разработки в течение нескольких месяцев. Merge как **merge commit** для сохранения 43 коммитов в истории (нужны для bisect).

## Summary

### Content (274 lessons across 5 courses)
| Курс | Уроков | WPM range | Финал |
|------|--------|-----------|-------|
| **RU `tier1`** — Основной | 39 | 10→? | существовал |
| **RU `block_1`** — Мизинец (диагностика) | 11 | — | существовал |
| **EN `en_tier1`** — Adult (English) | 99 | 10→105 | L99 (Platinum gate) |
| **EN `en_teen`** — Junior (12-17) с Кнопычом | 75 | 18→95 | L75 (tournament) |
| **EN `en_kids`** — Kids (6-11) с Клавочкой | 50 | 8→50 | L50 (adventure) |

EN-курсы построены по 5-7-блочной структуре (мастер-план в [docs/planning/](docs/planning/Мастер-план%20системы%20курсов.md)) с rhythm-уроками в каждом блоке, milestone-checkpoints, и финальными экзаменами.

### Onboarding + character system
- 4-section онбординг: имя + персонаж/наставник + клавиатура + язык
- 4 наставника с собственными голосами: Анна (учительница), Максим (опытный), Кнопыч (робот, для подростков), Клавочка (добрая, для детей)
- Character-tips на 7 ситуаций (lessonStart, goodProgress, tooManyErrors, lessonCompleteSuccess, errorLimitExceeded, levelUnlocked, breakReminder) — на RU и EN
- **Age-based routing**: при EN-онбординге Кнопыч → `en_teen`, Клавочка → `en_kids`, остальные → `en_tier1`. Применяется только на свежем профиле, смена персонажа в Settings tier не трогает.

### Lesson Picker + progress system
- Sidebar со списком уроков, статусами (current/completed/available/locked) и звёздами
- Per-tier прогресс с миграцией со старого flat-формата
- Lesson controls (Retry / Next) + cancellable auto-advance после успешной сдачи
- Tier-switcher с 5 тирами (Основной/Мизинец/English/EN Junior/EN Kids)

### Keyboard redesign (7 фаз)
- Data-driven рендер из [keyboard-data.js](assets/js/keyboard-data.js)
- 3 layout'а: Classic / Laptop (без numpad) / Ergonomic (split с rotation)
- 5 design-состояний (default/hover/active/highlight/error) через per-key CSS-variables
- Responsive unit (60/48/38/22px) + debounced resize re-render
- **EN QWERTY layout**: live ЙЦУКЕН ↔ QWERTY switching по выбору языка
- Dark theme через `prefers-color-scheme` + page-level dark tokens
- Top toolbar: Classic/Laptop/Ergonomic switcher + Символы/Shift/Звук/Метроном toggles + RU/EN pills

### Certification system
- 4 уровня: **Bronze** (25 WPM, 85%), **Silver** (40 WPM, 90%), **Gold** (60 WPM, 93%), **Platinum** (80 WPM, 96%)
- Триггерится автоматически на финале тира из `notifyLessonOutcome` через `Certification.maybeAwardCertification`
- Upgrade-only логика (новый ранг должен быть выше предыдущего)
- Ceremonial modal с badge + next-level hint
- Грид сертификатов в Settings → Достижения

### Audio
- Web Audio API: keystroke sound (sine 800Hz) + metronome (configurable BPM)
- Toggles в keyboard toolbar (Звук / Метроном)

### Settings panel
- Gear icon в правом верхнем (#settingsGearBtn)
- Modal с: смена персонажа без перезагрузки, сертификаты (грид), сброс прогресса, полный сброс (запуск онбординга)

### Bug fixes этой ветки
- `errorLimitExceeded`: `errors > limit` → `errors >= limit` (тост ровно при достижении лимита, не на limit+1)
- Filename padding в `en_teen`/`en_kids` (lesson_1.json → lesson_01.json) — без этого L1-L9 не загружались
- Onboarding: clear `currentLesson` storage при submit (edge case с language switch)
- CharacterSystem race condition: listener на `typingtrainer:onboardingComplete` для первого визита
- `process?.env` crash в браузере (нет `process` в global scope)

## Test plan

E2E через Playwright (запускались локально на каждой ключевой стадии):
- [scripts/verify_user_flow_local.py](scripts/verify_user_flow_local.py) — полный flow онбординг → урок 1 RU (8 stages с скриншотами)
- [scripts/verify_age_routing.py](scripts/verify_age_routing.py) — 4 сценария age-routing (Кнопыч/Клавочка/Anna в EN + Anna в RU)

Финальный прогон обоих скриптов на текущем HEAD: **8/8 stages PASS, 4/4 routing scenarios PASS** (последний прогон перед merge).

Manual testing: проверены 5 milestone-уроков по каждому курсу, transitions между tier'ами, dark/light режимы, RU↔EN switching, все 3 keyboard layouts.

## Post-merge follow-ups (отдельные мелкие PR)

- **UI: tier-switcher polish** — 5 тиров могут визуально перегружать sidebar; нужна визуальная иерархия RU vs EN
- **Tier-switcher UX**: добавить характерные эмодзи или цвета по тирам
- **Content review pass 2**: kids B5 + teen B5 (B3 уже пройден, B5 не аудитился)
- **Tier label translation**: «EN Junior»/«EN Kids» — пока EN-only лейблы для RU-сайта; нужно решить i18n стратегию

## Out of scope / not included
- Backend / accounts / multi-device sync (только localStorage)
- Tournament/multiplayer features (мастер-план фаза 2)
- Analytics / telemetry
- Mobile touch-keyboard layout
- Word-level error highlighting (есть только char-level)

---

🤖 Generated with [Claude Code](https://claude.com/claude-code) (Opus 4.7, 1M context). PR consists of solo work + AI pairing.
