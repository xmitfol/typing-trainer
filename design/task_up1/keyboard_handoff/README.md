# typing-trainer · Клавиатура + Экран упражнения · Handoff

Vanilla HTML/CSS/JS. **Без build-step, без React, без npm.** Открывается через статик-сервер.

---

## Файлы

```
keyboard_handoff/
├── task.html                  ← ЭКРАН УПРАЖНЕНИЯ (готов к интеграции)
├── poc.html                   ← песочница: все режимы клавиатуры
└── assets/
    ├── css/
    │   ├── tokens.css          — дизайн-переменные (палитра, типографика, dark theme)
    │   └── base.css            — примитивы (.btn .card .field .tabs .modal)
    └── js/
        ├── typing-keyboard.js  — <typing-keyboard> Web Component (ЯДРО)
        ├── task.js             — логика экрана: ввод, метрики, тулбар, масштаб, success
        ├── lesson-data.js      — данные уроков
        ├── portraits.js        — SVG-наставники + detectGender()
        └── ui-primitives.js    — template-функции для прочих экранов
```

## Запуск

```bash
cd keyboard_handoff
python3 -m http.server 8000
# http://localhost:8000/task.html?tier=tier1&lesson=1
# http://localhost:8000/poc.html   (песочница)
```

Через сервер, не `file://` (query-параметры + загрузка скриптов).

---

## 1. `<typing-keyboard>` — ядро

```html
<script src="assets/js/typing-keyboard.js"></script>
<typing-keyboard id="kb" type="classic" unit="40"></typing-keyboard>
```

### Атрибуты (реактивные)

| Атрибут | Значения | Default | Назначение |
|---|---|---|---|
| `type` | `classic` / `laptop` / `ergonomic` | `classic` | Тип клавиатуры |
| `format` | `ansi` / `iso` | `ansi` | Физический формат (ISO = L-образный Enter) |
| `layout` | `standard` / `phonetic` / `typewriter` / `mac` | `standard` | Раскладка RU (метки, не цвета) |
| `unit` | px | `56` | Базовый размер клавиши |
| `intensity` | `full` / `strip` / `highlight` | `full` | Насыщенность цвета |
| `modifier-style` | `solid` / `hatched` | `solid` | Заливка модификаторов |
| `theme` | `light` / `dark` | inherited | Тема |
| `angle` / `gap` | deg / px | `14` / `96` | Разворот и разрыв половин (ergonomic) |
| `active-key` | KeyCode | — | Клавиша «нажата» |
| `highlight-char` | символ (`а`, ` `) | — | Подсветка следующей клавиши |
| `error-key` | KeyCode | — | Клавиша мигает красным |

### JS API

```js
const kb = document.querySelector('#kb');
kb.flashActive('KeyF');                   // зелёная вспышка ~160мс (верно)
kb.flashError('KeyG');                    // красная вспышка ~280мс (ошибка)
kb.setAttribute('highlight-char', 'а');   // подсветка след. клавиши (штриховка + яркость)
kb.setAttribute('highlight-char', ' ');   // подсветка пробела целиком
kb.removeAttribute('highlight-char');
```

### Визуальная модель подсветки
- **База — БЛЁКЛАЯ** (пастель + тёмный текст своего цвета), чтобы не рябило.
- **Следующая клавиша (`highlight-char`)** — яркая заливка + диагональная штриховка + тёмная обводка + пульсация. Единственный акцент.
- **Пробел** — единая клавиша, подсвечивается целиком только когда он следующий (не делится визуально).
- **active** — заливка цветом при верном нажатии; **error** — красная вспышка + shake.

### unit под типы (чтобы влезало без скролла)
| Тип | Ширина | unit | доп. |
|---|---|---|---|
| classic | ~24×unit | **40** | — |
| laptop | ~16×unit | **46** | — |
| ergonomic | ~27×unit | **38** | `gap=52`, `angle=10` |

Зашито в `task.js` (обработчик `#type-select`). Под планшет/мобайл — уменьшай unit или оборачивай в `transform: scale()`.

### ISO/ANSI, раскладки
- `format="iso"` → L-образный Enter (clip-path), `\` на ряд Caps, короткий Backspace. `ansi` → прямой широкий Enter.
- `layout`: standard (ЙЦУКЕН) / phonetic (ЯВЕРТЫ) / typewriter / mac. Меняются **только метки**, цвета пальцев остаются по физическим позициям.

### Изоляция
Shadow DOM. ⚠️ html-to-image скриншот-тулзы НЕ видят его содержимое (клавиатура выйдет пустой). Проверять — живым браузером.

---

## 2. Экран `task.html`

URL: `task.html?tier=tier1&lesson=1` → `task.js` читает параметры, берёт урок из `lesson-data.js`.

### Состояния
1. **Active** — печатаешь. Live: прогресс-бар, время, скорость (зн/мин), точность; текущий символ подсвечен, клавиша через `highlight-char`.
2. **Success** (`#success.show`, `#task-body.hide`) — «Всё верно.» (Serif) + ★ + финальные метрики + портрет наставника с конфетти + Повторить / Продолжить.

### Ввод
Скрытый `<input id="capture">` держит фокус. На `keydown`: совпал → `kb.flashActive(e.code)` + позиция вперёд; не совпал → `kb.flashError(e.code)` + ошибка. `highlight-char` обновляется на след. символ. WPM/точность/время — чистый JS.

### Тулбар (функциональные кнопки)
- **Подсветка пальцев** (`#finger-hint-btn`) — ВКЛ по умолчанию; без чёрной заливки, просто кнопка. При выключении — `data-off="true"` (приглушается, как метроном). Снимает `highlight-char`.
- **Звук нажатия** (`#sound-btn`) — **ВЫКЛ по умолчанию** (`data-off="true"`). Подключи свои SFX к `keydown`.
- **Метроном** (`#metro-btn`) — ВЫКЛ по умолчанию.
- **Масштаб** (`#zoom-btn`) — иконка «A→A» (большая/малая буквы), по клику раскрывается поповер `#zoom-pop` со степпером **− 100% +**. Шаг 10%, диапазон 70-150%, default 100. Кнопки блокируются на границах. **Масштабирует всю карточку** через `.task-card { zoom }` — режим для слабовидящих, увеличивает весь экран (текст+клавиатура+метрики), как зум браузера.
- **Раскладка-select** (`#layout-select`) — standard / phonetic / typewriter / mac.
- **Тип-select** (`#type-select`) — classic / laptop / ergonomic (+ подбор unit).

Селекты раскладки/типа — минималистичные (прозрачный фон, серый текст, hover подсвечивает). Не выделяются на тулбаре.

### Метрики справа
Колонка ВРЕМЯ / СКОРОСТЬ / ТОЧНОСТЬ — узкие карточки, не растянутые.

---

## 3. Маршрутизация уроков (КРИТИЧНО)

```
course.html / dashboard.html  ── клик ──▶  lesson.html?…  (ТЕОРИЯ, всегда первая)
                                                │ «Начать упражнение»
                                                ▼
                                           task.html?…   (ПРАКТИКА — этот экран)
                                                │ success → «Продолжить»
                                                ▼
                                           lesson.html?…&lesson=N+1
```
⚠️ `task.html` — НЕ точка входа из списка. И dashboard, и course ведут на `lesson.html`.

---

## 4. Миграция со старого движка
Старую клавиатуру **переписать на `<typing-keyboard>`**. Перенести бизнес-логику на новый `keydown`: подсчёт WPM/точности/времени, localStorage (ключи сохранить!), звук/метроном, сертификацию. Тип читать из профиля: `kb.setAttribute('type', profile.keyboardType)`.

---

## 5. НЕ менять
1. **Палитра пальцев** — 6 цветов в `tokens.css` (`--f-*`), в Shadow DOM как `--kb-*`. Фиксированы (user instruction).
2. **ЙЦУКЕН — деление рук по палитре**: лев. Й Ц У К Е / Ф Ы В А П / Я Ч С М И; прав. Н Г Ш Щ З Х Ъ / Р О Л Д Ж Э / Т Ь Б Ю. Home keys **А** (`KeyF`) + **О** (`KeyJ`) с bump-индикаторами.
3. **Split-Space (эргономика)** — две независимые половины purple (спека 008).
4. **Эргономика** — развёрнутые половины + numpad/nav вертикальными блоками справа, основной блок приподнят на 30px.
5. **Стек** — только HTML+CSS+JS. ❌ React/Vue, ❌ npm/build, ❌ TS, ❌ препроцессоры.

---

## 6. Чеклист интеграции
- [ ] Скопировать/смержить `assets/`
- [ ] Подключить `typing-keyboard.js`, поставить `<typing-keyboard>` (тип из профиля)
- [ ] Привязать ввод к `flashActive` / `flashError` + `highlight-char` (пример — `task.js`)
- [ ] Перенести логику старого движка (метрики, localStorage, звук, сертификат)
- [ ] Дефолты тулбара: подсветка пальцев ВКЛ, звук ВЫКЛ, метроном ВЫКЛ, масштаб 100%
- [ ] Масштаб → `.task-card { zoom }` (весь экран), степпер ±10%, 70-150%
- [ ] Маршрут lesson→task (не напрямую)
- [ ] Проверить classic/laptop/ergonomic + ansi/iso + 4 раскладки в РЕАЛЬНОМ браузере (хард-рефреш — Shadow DOM кэшируется)

Песочница `poc.html` — для проверки всех режимов перед интеграцией.
