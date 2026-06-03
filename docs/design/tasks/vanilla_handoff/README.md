# typing-trainer · Vanilla Handoff (Phase 0 + 1 + Task screen)

Чистый **HTML / CSS / JS** — без build-step, без React, без npm. Открывается через `file://`, работает офлайн.

Этот пакет — **рабочая реализация** дизайн-системы, клавиатуры и экрана упражнения. Используй как фундамент и образец для остальных страниц.

---

## Файлы

```
vanilla_handoff/
├── poc.html                       ← демо Phase 0 + 1 (токены, примитивы, портреты, клавиатура)
├── task.html                      ← ГОТОВЫЙ экран упражнения (clone-and-go)
├── assets/
│   ├── css/
│   │   ├── tokens.css             — все дизайн-переменные (палитра, типографика, dark theme)
│   │   └── base.css               — .btn / .card / .field / .tabs / .modal + утилиты
│   └── js/
│       ├── portraits.js           — portraits.user() / .mentor() / .detectGender()
│       ├── ui-primitives.js       — ui.button() / .input() / .tabs() / .modal()
│       ├── typing-keyboard.js     — <typing-keyboard> Web Component (CORE)
│       ├── lesson-data.js         — контент уроков + парсинг ?tier=&lesson=
│       └── task.js                — логика экрана упражнения
```

Открой `task.html?tier=tier1&lesson=6` в браузере — это полностью рабочий экран.

---

# Часть 1. Клавиатура `<typing-keyboard>` — как устроена и как использовать

## 1.1 Подключение

```html
<script src="assets/js/typing-keyboard.js"></script>
<typing-keyboard id="kb" type="classic" unit="40"></typing-keyboard>
```

Всё. Компонент сам себя регистрирует (`customElements.define`), рисует в Shadow DOM (стили изолированы — не конфликтуют со страницей).

## 1.2 Атрибуты (все реактивные — меняешь атрибут, клавиатура перерисовывается)

| Атрибут | Значения | Default | Что делает |
|---|---|---|---|
| `type` | `classic` / `laptop` / `ergonomic` | `classic` | Тип раскладки. Classic = полная с numpad и nav. Laptop = только alpha-блок (без numpad/стрелок). Ergonomic = split с поворотом половин. |
| `unit` | число (px) | `56` | Базовый размер клавиши. Вся клавиатура масштабируется от него. **Classic ≈ 24 × unit в ширину.** Для контейнера ~1000px бери `unit=40`. |
| `intensity` | `full` / `strip` / `highlight` | `full` | Насколько ярко показывать цвета пальцев. `full` — клавиша целиком в цвете. `strip` — нейтральная клавиша + цветная полоска сверху. `highlight` — нейтральная, цвет появляется только на подсвеченной клавише (режим «вслепую»). |
| `modifier-style` | `solid` / `hatched` | `solid` | Модификаторы (Shift/Tab/...) сплошные или в диагональную штриховку. |
| `theme` | `light` / `dark` | light | Тёмная тема клавиатуры. |
| `angle` | число (град) | `14` | Угол поворота половин (только ergonomic). |
| `gap` | число (px) | `96` | Разрыв между половинами (только ergonomic). |
| `active-key` | KeyCode (`KeyF`) | — | Клавиша, подсвеченная как «нажата» (зелёная вспышка). |
| `highlight-char` | один символ (`а`) | — | Клавиша, подсвеченная как «нажми следующей». |
| `error-key` | KeyCode | — | Клавиша, мигающая красным (ошибка). |

## 1.3 JS-методы

```js
const kb = document.querySelector('#kb');

kb.flashActive('KeyF');         // зелёная вспышка на 160мс (правильное нажатие)
kb.flashActive('KeyF', 140);    // с кастомной длительностью
kb.flashError('KeyG');          // красная вспышка на 280мс (ошибка)

kb.setAttribute('highlight-char', 'а');  // подсветить след. клавишу
kb.removeAttribute('highlight-char');    // убрать подсветку
kb.setAttribute('type', 'ergonomic');    // сменить тип на лету
```

`flashActive` / `flashError` сами снимают подсветку по таймеру — вызывай их прямо в обработчике `keydown`.

## 1.4 Как клавиатура связана с реальным вводом

Браузерное событие `keydown` даёт `e.code` (физическая клавиша, напр. `KeyF`) и `e.key` (символ, напр. `а`). Маппинг **физическая раскладка → русская буква уже зашит** в компоненте через поле `code` у каждой клавиши. Поэтому:
- для `flashActive`/`flashError` передавай `e.code` (универсально, не зависит от языка ОС)
- для `highlight-char` передавай ожидаемый символ из текста урока

---

# Часть 2. Экран упражнения `task.html` — что внутри

Уже собран и работает. Структура:

```
task.html
 ├─ Наставник (.mentor)         — портрет + speech bubble с советом (анимация bobble)
 ├─ Активное состояние (#task-body, 3 колонки):
 │   ├─ Слева: номер «1.1» + легенда 6 пальцев
 │   ├─ Центр: прогресс-бар + блок набираемого текста (.target) + скрытый <input>
 │   └─ Справа: Время / Скорость / Точность
 ├─ Success-состояние (#success) — заголовок «Всё верно», оценка, кнопки Повторить/Далее
 ├─ Toolbar — скрыть индикатор / звук / метроном / селектор раскладки / селектор типа
 └─ <typing-keyboard>
```

## 2.1 Поток данных

1. `task.js` читает `?tier=tier1&lesson=6` из URL (`lessonData.getParams()`)
2. Достаёт контент урока из `lesson-data.js` (`lessonData.getLesson(tier, lesson)`)
3. Урок = массив `exercises`, каждое — `{ id, target, hint }`
4. Пользователь печатает в скрытый `<input class="capture">` → `handleKey()`:
   - правильно → `kb.flashActive(e.code)`, `typed++`
   - ошибка → `kb.flashError(e.code)`, `errors++`
   - на каждый символ обновляется `highlight-char` для следующей клавиши
5. WPM / точность / время считаются в `updateStats()` (чистый JS, `setInterval`)
6. Когда `target` допечатан → `finishExercise()` показывает success-экран с оценкой
7. «Продолжить» → следующее упражнение; на последнем → возврат в `course.html`

## 2.2 Что переносить из старого движка СЮДА

Это места, помеченные в `task.js` — подключай к ним существующую логику:
- **`updateStats()`** — если у вас есть своя формула WPM/рейтинга, замени тело
- **`finishExercise()`** — здесь считается оценка (звёзды). Подставь свою градацию
- **Сохранение прогресса** — добавь `localStorage.setItem(...)` в `finishExercise()`
- **Звук/метроном** — повесь `playSound('hit')` в ветку правильного нажатия, `playSound('miss')` в ветку ошибки внутри `handleKey()`

## 2.3 Чего НЕ делать
- ❌ Не подключай старый клавиатурный engine — `<typing-keyboard>` его полностью заменяет
- ❌ Не делай task.html точкой входа в урок — на него ведёт только кнопка из `lesson.html`

---

# Часть 3. Маршрутизация (важно — была ошибка)

Правильный флоу урока:

```
course.html  →  lesson.html  →  task.html  →  (success)  →  следующий урок
 (список)        (теория)        (практика)
```

- **`lesson.html` всегда ПЕРВЫЙ** экран урока (обучающий текст).
- **`task.html` — только из кнопки «Начать упражнение»** в lesson.html. Никогда не открывается напрямую из списка.
- И dashboard, и course при клике на урок ведут на **`lesson.html?tier=...&lesson=...`**, НЕ на task.html.
- Параметры (`tier`, `lesson`) одинаковы на обоих экранах — меняется только имя файла.

Guard на каждой странице (10 строк):
```js
const user = getUser();
const path = location.pathname;
if (!user && needsAuth(path)) location.href = '/auth?mode=login';
else if (user && !user.profileComplete && path !== '/onboarding') location.href = '/onboarding';
else if (user && user.profileComplete && path === '/onboarding') location.href = '/dashboard';
```

---

# Часть 4. Дизайн-система (Phase 0) — для всех остальных страниц

## 4.1 Токены (`tokens.css`)
Все цвета/шрифты/радиусы — CSS-переменные. Палитра пальцев `--f-pink … --f-purple` + градиенты `--grad-*` — **ФИКСИРОВАНА (user instruction), не менять**. Dark theme через `[data-theme="dark"]` на `<html>`.

## 4.2 Примитивы (`base.css` + `ui-primitives.js`)
Классы: `.btn` (+`--secondary`/`--ghost`/`--sm`/`--lg`/`--block`), `.card`, `.field`, `.tabs`, `.modal`.
JS-функции возвращают HTML-строки:
```js
ui.button({ label, variant, size, onClick })
ui.input({ label, type, placeholder, hint, error })
ui.tabs({ items: [{id,label}], active })   // emits 'tabchange'
ui.modal({ title, children, footer, id }); ui.openModal(id); ui.closeModal(id)
```
После вставки динамического HTML вызывай `ui.init()`.

## 4.3 Портреты (`portraits.js`)
```js
portraits.user('adult'|'teen'|'kid', 'm'|'f', size)   // → SVG строка
portraits.mentor('anna'|'maxim'|'knopych'|'klavochka', size)
portraits.detectGender(name)                           // → 'm'|'f'|null
```

## 4.4 Типографика
- UI: **Manrope**
- Клавиши/метрики/моно: **JetBrains Mono**
- Лонгрид уроков: **Source Serif 4**

---

# Часть 5. План остальных страниц

Каждую страницу собирай по образцу `task.html`: тот же `<head>` (подключение tokens.css, base.css + нужные js), композиция через примитивы и шаблонные литералы. Визуальный референс — React-прототипы (если есть доступ) или скриншоты.

| Страница | Ключевое |
|---|---|
| `auth.html` | табы Войти/Регистрация/Забыли. Минимум полей: email+пароль ИЛИ соцсеть |
| `onboarding.html` | имя + М/Ж (`detectGender`) + аудитория + наставник (для adult). Отдельная страница, НЕ модал |
| `index.html` (landing) | hero + секции; шапка реактивна на `localStorage.user` |
| `dashboard.html` | русский курс по умолчанию; переключатель языка в шапке; карточка курса + уроки + статистика |
| `course.html` | roadmap 5 модулей + accordion со списком уроков; клик → `lesson.html` |
| `lesson.html` | лонгрид (Serif) с вставками упражнений; кнопка «Начать» → `task.html` |
| `task.html` | ✅ ГОТОВ |
| `pricing.html` | paywall (урок 6) + модал подписки (периоды нед/мес/3/6/год) + оплата |

---

# Критические правила (не нарушать)

1. **Палитра пальцев фиксирована** — 6 цветов из tokens.css, менять нельзя.
2. **Раскладка ЙЦУКЕН — деление рук по палитре** (Н/Р/Т = правый указательный), home keys А (KeyF) и О (KeyJ).
3. **Split-Space на эргономике** — две половины пробела (спека 008).
4. **Mentor system** — 4 наставника, фразы в 4 тональностях (контент-команда).
5. **Tech-стек:** только vanilla HTML/CSS/JS. ❌ React/Vue, ❌ npm/build, ❌ препроцессоры, ❌ TypeScript. Всё должно открываться через `file://`.

# Тесты приёмки (Phase 0+1+task — уже зелёные)
- ✅ Открывается через `file://` без ошибок консоли
- ✅ 3 типа клавиатуры переключаются; все ряды на единой сетке; правый край выровнен
- ✅ Печать в task.html: active/error вспышки, highlight следующей клавиши, live WPM/точность/время
- ✅ Success-экран с оценкой; «Повторить» / «Далее»
- ✅ Тёмная тема; портреты; gender-detect
