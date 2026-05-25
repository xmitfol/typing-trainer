**📝**** GitHub Issues Templates**
**Typing Trainer SaaS - ****Готовые**** ****шаблоны**** ****задач**
**Версия:** 1.0
**Дата:** 09 октября 2025

**📋**** Как использовать**
**Скопируй шаблон** из этого документа
**Создай новый Issue** в GitHub
**Вставь шаблон** и заполни детали
**Добавь labels**: Priority, Type, Sprint
**Assign** себе или члену команды

**🏷****️**** Labels System**
**Priority**
P0: Critical   🔴 (блокирует всё)
P1: High       🟠 (важно для спринта)
P2: Medium     🟡 (желательно в спринте)
P3: Low        🟢 (можно отложить)
**Type**
feature     - Новая функция
bug         - Исправление бага
refactor    - Рефакторинг кода
docs        - Документация
test        - Тесты
devops      - CI/CD, deploy
design      - UI/UX дизайн
**Sprint**
sprint-1    - Недели 1-2
sprint-2    - Недели 3-4
...
sprint-6    - Недели 11-12
**Status**
todo        - Не начата
in-progress - В работе
review      - На ревью
blocked     - Заблокирована
done        - Завершена

**📝**** ****Шаблон**** #1: Feature Task**
## 📋 Описание

[Краткое описание функции]

## 🎯 Цель

[Какую проблему решаем? Какую ценность даём пользователю?]

## ✅ Acceptance Criteria

- [ ] Критерий 1
- [ ] Критерий 2
- [ ] Критерий 3
- [ ] Тестирование на 3+ браузерах
- [ ] Работает на мобильных

## 📐 Технические детали

**Файлы для изменения:**
- `path/to/file1.js`
- `path/to/file2.css`

**Зависимости:**
- Depends on #[номер issue]
- Blocks #[номер issue]

**API/Структуры:**
```javascript
// Пример кода/структуры
**🧪 Тестирование**
**Тест-кейсы:**
[Описание теста 1]
[Описание теста 2]
**Браузеры для проверки:**
[ ] Chrome
[ ] Firefox
[ ] Safari
**Устройства:**
[ ] Desktop (1920x1080)
[ ] Tablet (768x1024)
[ ] Mobile (375x667)
**📚**** Ресурсы**
[Ссылка на дизайн]
[Ссылка на документацию]
[Ссылка на похожий код]
**⏱️ Оценка**
**Estimate:** [X] hours
**Breakdown:**
Implementation: [Y] hours
Testing: [Z] hours
Documentation: [W] hours

**Labels:** feature, P1: High, sprint-1
**Assignee:** @username
**Milestone:** Sprint 1

---

## 📝 Шаблон #2: Bug Report

```markdown
## 🐛 Описание бага

[Что именно не работает?]

## 📍 Шаги воспроизведения

1. Открыть [страница]
2. Кликнуть [элемент]
3. Ввести [данные]
4. Наблюдать ошибку

## ❌ Ожидаемое поведение

[Что должно было произойти]

## ✅ Фактическое поведение

[Что произошло на самом деле]

## 🖥️ Окружение

**Browser:** Chrome 118  
**OS:** Windows 11  
**Screen:** 1920x1080  
**Device:** Desktop

## 📸 Скриншоты/Видео

[Вставить скриншот или GIF]

## 🔍 Console Errors

[Вставить ошибки из консоли браузера]

## 💡 Возможная причина

[Если есть предположение о причине]

## ⚠️ Severity

- [ ] Critical (блокирует работу)
- [ ] High (важный функционал не работает)
- [ ] Medium (неудобство)
- [ ] Low (косметический)

---

**Labels:** `bug`, `P0: Critical`  
**Assignee:** @username  
**Milestone:** Sprint X

**📝**** Шаблон #3: Refactoring Task**
## ♻️ Цель рефакторинга

[Почему нужен рефакторинг? Что улучшим?]

## 📂 Scope

**Файлы для изменения:**
- `file1.js`
- `file2.js`

**Затрагиваемые компоненты:**
- Компонент A
- Компонент B

## 🎯 Задачи

- [ ] Extract функцию X в utility
- [ ] Rename переменные для clarity
- [ ] Remove duplicate code
- [ ] Update comments
- [ ] Add JSDoc

## ⚠️ Risks

**Potential breaking changes:**
- [Что может сломаться]

**Mitigation:**
- [Как будем проверять]

## ✅ Success Criteria

- [ ] Код более читабелен
- [ ] Нет дублирования
- [ ] Все тесты проходят
- [ ] Performance не ухудшился

---

**Labels:** `refactor`, `P2: Medium`, `tech-debt`  
**Assignee:** @username  
**Milestone:** Sprint X

**📝**** ****Примеры**** ****реальных**** Issues**
**Example #1: Sprint 1, Task #4**
# #4 Виртуальная клавиатура - HTML/CSS

## 📋 Описание

Создать HTML разметку и CSS стили для виртуальной клавиатуры QWERTY раскладки с цветовой маркировкой по пальцам.

## 🎯 Цель

Дать пользователю визуальную подсказку о том, каким пальцем нажимать каждую клавишу. Клавиатура должна быть красивой, интуитивной и адаптивной.

## ✅ Acceptance Criteria

- [ ] Все клавиши QWERTY раскладки отображаются
- [ ] Клавиши окрашены по цветам пальцев (6 цветов)
- [ ] Responsive layout (работает от 320px до 1920px)
- [ ] Hover эффект на клавишах
- [ ] Корректное позиционирование (CSS Grid)
- [ ] Специальные клавиши (Space, Shift, Enter) корректного размера

## 📐 Технические детали

**Файлы для создания:**
- `assets/css/keyboard.css`
- HTML разметка в `index.html` (секция `.keyboard`)

**Цвета пальцев (из design doc):**
```css
--pinky: #ff7675;      /* Мизинец */
--ring: #fdcb6e;       /* Безымянный */
--middle: #00b894;     /* Средний */
--index-left: #74b9ff; /* Указательный левый */
--index-right: #0984e3;/* Указательный правый */
--thumb: #a29bfe;      /* Большой палец */
**Структура клавиш:**
<div class="keyboard">
  <div class="keyboard-row keyboard-row-1">
    <button class="key" data-key="`" data-finger="pinky-left">
      <span class="key-main">`</span>
      <span class="key-shift">~</span>
    </button>
    <!-- ... -->
  </div>
  <!-- ... остальные ряды -->
</div>
**CSS Grid layout:**
.keyboard {
  display: grid;
  gap: 4px;
  padding: 20px;
  background: var(--surface);
  border-radius: 12px;
}

.keyboard-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(40px, 1fr));
  gap: 4px;
}
**🧪 Тестирование**
**Визуальная проверка:**
Открыть index.html в браузере
Проверить, что все клавиши видны
Проверить цвета (должны соответствовать пальцам)
Hover эффект работает
Resize окна - клавиатура адаптируется
**Браузеры:**
[ ] Chrome 118+
[ ] Firefox 119+
[ ] Safari 17+
**Устройства:**
[ ] Desktop 1920x1080
[ ] Laptop 1366x768
[ ] Tablet 768x1024
[ ] Mobile 375x667
**📚**** Ресурсы**



**⏱️ Оценка**
**Estimate:** 16 hours
**Breakdown:**
HTML разметка: 4h
CSS базовые стили: 4h
Responsive адаптация: 4h
Полировка (hover, animations): 2h
Тестирование: 2h

**Labels:** feature, P0: Critical, sprint-1, design
**Assignee:** @username
**Milestone:** Sprint 1
**Dependencies:** #3 (CSS система)

---

### Example #2: Sprint 2, Task #7

```markdown
# #7 Keyboard Controller - обработка нажатий

## 📋 Описание

Реализовать класс `KeyboardController`, который обрабатывает нажатия клавиш на физической клавиатуре и синхронизирует их с виртуальной клавиатурой на экране.

## 🎯 Цель

Создать связь между физической и виртуальной клавиатурами: когда пользователь нажимает клавишу, она подсвечивается на экране. Это даёт визуальный feedback и помогает обучению.

## ✅ Acceptance Criteria

- [ ] При нажатии клавиши - она подсвечивается на виртуальной клавиатуре
- [ ] При отпускании - подсветка убирается
- [ ] Работает для всех буквенных клавиш (A-Z)
- [ ] Работает для цифр (0-9)
- [ ] Работает для специальных клавиш (Space, Enter, Shift)
- [ ] Корректная обработка Shift (показывает shifted символ)
- [ ] Корректная обработка Caps Lock
- [ ] FPS не падает ниже 55 (проверить в DevTools)
- [ ] Нет memory leaks (проверить при 100+ нажатий)

## 📐 Технические детали

**Файл для создания:**
- `assets/js/keyboard-controller.js`

**Класс структура:**
```javascript
class KeyboardController {
  constructor(keyboardElement) {
    this.keyboard = keyboardElement;
    this.activeKeys = new Set();
    this.shiftPressed = false;
    this.capsLockOn = false;

    this.init();
  }

  init() {
    // Attach event listeners
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
  }

  handleKeyDown(e) {
    // Prevent default for typing keys
    if (this.isTypingKey(e.key)) {
      e.preventDefault();
    }

    // Highlight key on virtual keyboard
    this.highlightKey(e.code);

    // Track active keys
    this.activeKeys.add(e.code);

    // Update shift/caps state
    if (e.key === 'Shift') this.shiftPressed = true;
    if (e.key === 'CapsLock') this.capsLockOn = !this.capsLockOn;
  }

  handleKeyUp(e) {
    // Remove highlight
    this.unhighlightKey(e.code);

    // Remove from active keys
    this.activeKeys.delete(e.code);

    // Update shift state
    if (e.key === 'Shift') this.shiftPressed = false;
  }

  highlightKey(keyCode) {
    const keyElement = this.keyboard.querySelector(`[data-code="${keyCode}"]`);
    if (keyElement) {
      keyElement.classList.add('key-active');
    }
  }

  unhighlightKey(keyCode) {
    const keyElement = this.keyboard.querySelector(`[data-code="${keyCode}"]`);
    if (keyElement) {
      keyElement.classList.remove('key-active');
    }
  }

  isTypingKey(key) {
    // Check if key should be prevented
    return key.length === 1 || key === 'Backspace' || key === 'Enter';
  }

  destroy() {
    // Cleanup event listeners
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
  }
}

export default KeyboardController;
**CSS ****для**** ****подсветки****:**
.key-active {
  transform: scale(0.95);
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
  background: var(--key-pressed-bg);
}
**Usage:**
// В main.js
import KeyboardController from './keyboard-controller.js';

const keyboardElement = document.querySelector('.keyboard');
const controller = new KeyboardController(keyboardElement);
**🧪 Тестирование**
**Функциональные тесты:**
**Basic highlighting:**
Нажать 'A' → клавиша 'A' подсвечена
Отпустить 'A' → подсветка ушла
**Shift behavior:**
Зажать Shift → клавиша Shift подсвечена
Нажать 'A' → показывает 'A' (большую букву)
Отпустить Shift → возврат к нижнему регистру
**Multiple keys:**
Зажать 'A' и 'S' одновременно → обе подсвечены
Отпустить 'A' → только 'S' подсвечена
**Caps Lock:**
Нажать Caps Lock → состояние переключено
Нажать 'A' → показывает большую 'A' без Shift
**Special keys:**
Space, Enter, Tab, Backspace работают
**Performance tests:**
Открыть DevTools → Performance tab
Записать сессию с быстрой печатью (20+ клавиш/сек)
FPS должен быть >55
Memory не должна расти (нет leaks)
**Browsers:**
[ ] Chrome
[ ] Firefox
[ ] Safari
[ ] Edge
**📚**** Ресурсы**



**⏱️ Оценка**
**Estimate:** 16 hours
**Breakdown:**
Класс KeyboardController: 6h
Event handling logic: 4h
Shift/Caps Lock logic: 3h
Performance optimization: 2h
Testing: 1h
**🔗**** Зависимости**
**Depends on:**
#4 Виртуальная клавиатура HTML/CSS
#6 Keyboard Layouts System
**Blocks:**
#8 Finger Highlighting
#11 Text Editor Component

**Labels:** feature, P0: Critical, sprint-2
**Assignee:** @username
**Milestone:** Sprint 2

---

## 📊 Issue Board Setup

### GitHub Projects Configuration

**Columns:**
1. **📋 Backlog** - Все задачи
2. **📌 Todo** - Запланированы на спринт
3. **🚧 In Progress** - В работе (limit: 3)
4. **👀 Review** - На ревью
5. **✅ Done** - Завершено

**Automation:**
- Issue created → Backlog
- Assigned → Todo
- PR created → Review
- PR merged → Done

**Views:**
1. **By Sprint** - Group by milestone
2. **By Priority** - Group by P0/P1/P2/P3
3. **By Assignee** - Group by person

---

## 📝 Daily Workflow

### Morning (планирование)
1. Проверь **In Progress** (что осталось)
2. Выбери **1-2 задачи** из Todo
3. Move в **In Progress**
4. Оцени, сколько часов займёт

### During Day (работа)
1. Работай над задачей
2. Коммить часто (atomic commits)
3. Если заблокирован - добавь comment
4. Если нужна помощь - упомяни @teammate

### Evening (закрытие дня)
1. Update issue progress (checklist)
2. Commit & push code
3. Если готово - move в **Review**
4. Plan завтрашний день

---

## ✅ Checklist перед Close Issue

### Before closing:
- [ ] Все acceptance criteria выполнены
- [ ] Код committed & pushed
- [ ] Тестирование пройдено
- [ ] Документация обновлена
- [ ] Нет regression bugs
- [ ] Screenshots добавлены (если UI)
- [ ] Reviewers approved (если нужно)

### After closing:
- [ ] Update related issues
- [ ] Update project board
- [ ] Notify team (if relevant)

---

**Статус:** ✅ Готово к использованию  
**Следующий шаг:** Создать Sprint 1 issues в GitHub  
**Дата:** 09 октября 2025
