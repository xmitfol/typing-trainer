# typing-trainer · Vanilla Handoff

Pure HTML/CSS/JS — **никакого build-step**, никакого React, никаких npm-зависимостей.
Открывается через `file://`, работает офлайн.

Этот пакет — реализация **Phase 0 + Phase 1** дизайна на vanilla-стеке. Используется как опорная точка для оставшихся 7 фаз — все следующие экраны строятся на этих же примитивах.

---

## Структура пакета

```
vanilla_handoff/
├── poc.html                          ← главная точка валидации; открывай в браузере
├── assets/
│   ├── css/
│   │   ├── tokens.css                 — все дизайн-переменные (палитра, типографика, радиусы, тени, dark theme)
│   │   └── base.css                   — сбросы, шрифты, primitives (.btn, .card, .field, .tabs, .modal)
│   └── js/
│       ├── portraits.js               — SVG-фабрика портретов + detectGender(name)
│       ├── ui-primitives.js           — template-функции ui.button() / ui.input() / ui.tabs() / ui.modal()
│       └── typing-keyboard.js         — <typing-keyboard> Web Component (core)
└── _design_reference/                  ← React-прототипы остальных 7 фаз для визуальной справки
    ├── keyboard/, onboarding/, auth/, landing/, dashboard/, course/, lesson/, task/, pricing/
    └── _shared/
```

**Важно:** файлы в `_design_reference/` — это **визуальные референсы**, реализованные на React+inline styles. **Не копируй их в production**. Используй как «как это должно выглядеть и вести себя» — смотри пиксели, копируй цвета/размеры/тексты, но реализуй на vanilla по примеру `poc.html`.

---

## Что внутри POC (что уже сделано)

### Phase 0 · Foundation

1. **CSS-токены** в `assets/css/tokens.css`. Все цвета, шрифты, радиусы, спейсинг как `:root` переменные. Палитра пальцев — `--f-pink`, `--f-orange`, `--f-green`, `--f-blue`, `--f-indigo`, `--f-purple` плюс готовые градиенты `--grad-*`. Dark theme переопределяется через `[data-theme="dark"]` на `<html>`.

2. **Базовые стили** в `assets/css/base.css`. Классы:
   - `.btn` + `.btn--secondary` / `.btn--ghost` / `.btn--sm` / `.btn--lg` / `.btn--block`
   - `.card` + `.card--accent` / `.card--success` / `.card--warm`
   - `.field` + `.field__label` / `.field__input` / `.field__hint` / `.field__error`
   - `.tabs` + `.tabs__item[aria-selected]`
   - `.modal-backdrop` + `.modal` + `.modal__close`
   - Утилиты: `.row`, `.col`, `.mono`, `.serif`, `.label-cap`, `.brand-logo`

3. **UI primitives** в `assets/js/ui-primitives.js`. Глобальный namespace `window.ui`:
   ```js
   ui.button({ label, variant, size, block, disabled, icon, onClick })  // → HTML string
   ui.card({ variant, padding, children })
   ui.input({ label, type, placeholder, value, hint, error, name, id, suffix })
   ui.tabs({ items: [{id, label}], active })       // emits 'tabchange' CustomEvent
   ui.modal({ title, children, footer, id })
   ui.openModal(id), ui.closeModal(id)
   ui.init()  // re-bind after dynamic HTML inserts
   ```
   Все возвращают **HTML-строки**. Вставляй через `element.innerHTML = ...`. После вставки вызывай `ui.init()` чтобы привязать события на новые `.tabs` и `.modal-backdrop`.

4. **Портреты** в `assets/js/portraits.js`. Глобальный namespace `window.portraits`:
   ```js
   portraits.user(audience, gender, size)   // 'adult'|'teen'|'kid' × 'm'|'f'
   portraits.mentor(id, size)                // 'anna'|'maxim'|'knopych'|'klavochka'
   portraits.detectGender(name)              // 'm'|'f'|null
   ```
   Возвращают SVG-строки. Вставляй через innerHTML.

### Phase 1 · Keyboard Web Component

В `assets/js/typing-keyboard.js`. Регистрирует custom element `<typing-keyboard>`.

**Атрибуты (реактивные):**

| Атрибут | Значения | По умолчанию |
|---|---|---|
| `type` | `classic` / `laptop` / `ergonomic` | `classic` |
| `intensity` | `full` / `strip` / `highlight` | `full` |
| `modifier-style` | `solid` / `hatched` | `solid` |
| `theme` | `light` / `dark` | inherited |
| `unit` | px | `56` |
| `angle` | degrees (ergo) | `14` |
| `gap` | px (ergo) | `96` |
| `thumb` | `minimal` / `full` (ergo) | `minimal` |
| `active-key` | KeyCode (e.g. `KeyF`) | none |
| `highlight-char` | one char (e.g. `а`) | none |
| `error-key` | KeyCode | none |

**JS API:**
```js
const kb = document.querySelector('typing-keyboard');
kb.flashActive('KeyF', 140);    // подсветить как активную на 140мс
kb.flashError('KeyG');           // мигнуть красным на 280мс
kb.setAttribute('type', 'ergonomic');     // переключить тип
kb.setAttribute('highlight-char', 'а');   // подсказка следующей клавиши
```

Изоляция через Shadow DOM — внутренние стили не конфликтуют с внешними.

---

## Что нужно сделать дальше (Phase 2 → Phase 8)

Каждая следующая фаза реализуется по тому же паттерну, что и POC:

1. **Создай `<phase>.html`** с такой же head-секцией: подключи `tokens.css`, `base.css`, `portraits.js`, `ui-primitives.js`, `typing-keyboard.js`.
2. **Скомпонуй экран** через template-литералы и `ui.*` функции.
3. **Открой `_design_reference/<phase>/<phase>.html`** в браузере — там точный визуал, что нужно воспроизвести.
4. **Копируй из референса:** размеры, цвета, тексты, расстояния. **Не копируй:** JSX-синтаксис, React-state, inline-styles буква в букву — переноси в CSS-классы.

### Подробный порядок фаз (см. также `_design_reference/README.md`)

#### Phase 2 — Auth + Onboarding (2-3 дня)
- `auth.html` — табы Войти / Регистрация / Забыли пароль / Email verify
- `onboarding.html` — minimal flow (Имя + М/Ж + аудитория + наставник для adult)
- Регистрация = email+пароль или соцсеть. Имя/возраст — в онбординге, **не на регистрации**.
- Используй `ui.tabs()` для переключателей, `ui.input()` для полей, `portraits.user()` для аватаров аудиторий, `portraits.mentor()` для наставников.

#### Phase 3 — Landing (2 дня)
- `index.html` (anonymous) — Hero + 3 секции (клавиатуры, аудитории, тарифы) + footer
- Шапка реактивна на состояние авторизации (если есть `localStorage.user` — показывай профиль)
- Hero может использовать `<typing-keyboard type="ergonomic" intensity="full">` как визуал

#### Phase 4 — Dashboard (2 дня)
- `dashboard.html` — главный экран после входа
- В шапке — переключатель языка раскладки + дропдаун профиля
- Тело: карточка курса + ближайшие уроки + наставник + статистика + достижения
- **Русский курс по умолчанию.** Переключение языков — только через топ-меню, не в теле.

#### Phase 5 — Course Roadmap (1-2 дня)
- `course.html` — roadmap + список всех уроков по модулям
- 5 модулей как accordion'ы, активный раскрыт
- Уроки: пройдено (звёзды + точность) / текущий / заблокировано (paywall)

#### Phase 6 — Lesson + Profile (3 дня)
- `lesson.html` — лонгрид урока (Source Serif) с вставками упражнений
- `profile.html` — карточка пользователя + табы + список курсов + bar-chart активности
- MentorIntro карточка с цветом наставника (Anna pink / Maxim blue / Кнопыч green / Клавочка yellow)

#### Phase 7 — Task Execution + Success (3 дня)
- `task.html` — модал-overlay с клавиатурой + live-метриками
- График скорости — `<canvas>` + `requestAnimationFrame`, ~50 строк
- Mentor bubble с **РЕАЛЬНЫМИ советами**, не цитатами автора
- Toolbar: скрыть индикатор / звук / метроном / переключатель раскладки (Стандартная / Фонетическая / Машинопись / МАС)
- Success screen — заголовок «Всё верно.» в Serif + ★½ + конфетти + метрики

#### Phase 8 — Pricing + Payment (2 дня)
- `pricing.html` — paywall (урок 6 закрыт) + subscription modal + payment step
- Period segmented: 1 неделя / 1 мес / 3 мес / **6 мес ⭐HIT** / 1 год (скидки 0/0/15/25/35%)
- 3 плана: Free / Полный / Семейный

---

## Критические правила

### 1. Палитра пальцев — НЕ менять
6 цветов из `tokens.css` фиксированы (пользовательская инструкция). Если кажется что цвет «не очень» — это не повод его менять.

### 2. Раскладка ЙЦУКЕН — деление по палитре, не по тексту
Левая половина: Й Ц У К Е / Ф Ы В А П / Я Ч С М И
Правая половина: Н Г Ш Щ З Х Ъ / Р О Л Д Ж Э / Т Ь Б Ю .
Home keys: **А** (KeyF, левый указ.) и **О** (KeyJ, правый указ.)

### 3. Split-Space на эргономике
Две независимые половины пробела, обе purple. Зависимость от спеки 008.

### 4. Mentor system
4 наставника с разной тональностью (заготавливать фразы в 4 версиях — задача контент-команды):
- `anna` — мягко, методично
- `maxim` — энергично, по делу
- `knopych` — гейминг/мемы (для подростков)
- `klavochka` — сказочный (для детей)

### 5. Tech (что НЕ использовать)
- ❌ React, Vue, Angular, любые SPA-фреймворки
- ❌ npm-пакеты, package.json, node_modules
- ❌ Build-инструменты (Vite, webpack, Parcel, esbuild)
- ❌ CSS-препроцессоры (SASS, Less)
- ❌ TypeScript
- ✅ Чистый HTML + CSS + JS, открывается через `file://`

### 6. Совместимость
- Все современные браузеры с поддержкой Web Components (Chrome/Edge/Safari/Firefox 2020+)
- ES2020 syntax — async/await, optional chaining, template literals
- Без полифиллов

---

## Тесты приёмки для Phase 0+1 (уже зелёные)

- ✅ `poc.html` открывается через `file://` без ошибок в консоли
- ✅ Все 6 цветов пальцев видны в палитре
- ✅ Переключение типа клавиатуры (Classic / Laptop / Ergonomic) работает без перезагрузки
- ✅ Поле «практика» — печатаешь, текущая клавиша мигает active-цветом, ошибки — красным
- ✅ Highlight следующей клавиши работает (буква подсвечивается в нужном цвете пальца)
- ✅ Theme toggle переключает светлую / тёмную
- ✅ Портреты: 6 пользователей + 4 наставника, все рендерятся
- ✅ Gender detect: Анна → ж, Алексей → м, Илья → м, Любовь → ж

## Тесты для следующих фаз

См. acceptance criteria в `_design_reference/README.md` под каждой фазой.

---

## Контакты и вопросы

Дизайн-референсы в `_design_reference/` — если что-то неясно по визуалу, открой соответствующий `<phase>.html` в браузере и смотри как должно выглядеть.

Если возникает соблазн добавить build-step «ради удобства» — стоп. Архитектура решена в пользу vanilla именно ради простоты деплоя и file://-совместимости. Все паттерны в POC масштабируются на оставшиеся фазы без проблем.
