# Specification 008: Split Space Bar Visualization

**Версия:** 1.0
**Дата:** 2025-11-17
**Автор:** Клод (Architect)
**Статус:** Draft
**Приоритет:** High (Phase 1 — MVP)

---

## 1. Overview

### Проблема:
В классической технике слепого набора **пробел нажимается большим пальцем ПРОТИВОПОЛОЖНОЙ руки** от последней набранной клавиши. Это критически важно для:
- **Скорости:** Руки чередуются → нет задержки
- **Ритма:** Плавное чередование левой/правой руки
- **Muscle Memory:** Формируется правильная автоматика

**Текущая реализация:** Space bar отображается как единая клавиша без указания какой рукой нажимать.

### Решение:
Разделить визуально Space bar на **две половины** (левую и правую) и подсвечивать нужную половину в зависимости от контекста.

---

## 2. Functional Requirements

### FR-1: Визуальное разделение Space Bar

**Требование:** Space bar должен отображаться как **две отдельные визуальные зоны**:
- **Левая половина** (для левого большого пальца)
- **Правая половина** (для правого большого пальца)

**Acceptance Criteria:**
- ✅ Space bar визуально разделен на 2 части
- ✅ Между половинами видимая граница (1-2px)
- ✅ Каждая половина может подсвечиваться независимо
- ✅ Ширина обеих половин одинакова (50%/50%)

---

### FR-2: Динамическая подсветка нужной половины

**Требование:** При наведении на следующий символ (пробел) должна подсвечиваться **правильная половина** Space bar.

**Логика:**
```javascript
// Псевдокод
function getSpaceSide(textSequence, currentIndex) {
  // Найти последний НЕ-пробельный символ перед текущим
  let lastChar = null;
  for (let i = currentIndex - 1; i >= 0; i--) {
    if (textSequence[i].char !== ' ') {
      lastChar = textSequence[i];
      break;
    }
  }

  // Если последний символ левой рукой → пробел правой
  if (lastChar.hand === 'left') return 'right';
  // Если последний символ правой рукой → пробел левой
  if (lastChar.hand === 'right') return 'left';

  // По умолчанию (первый символ в тексте) → правая
  return 'right';
}
```

**Acceptance Criteria:**
- ✅ Подсветка зависит от `space_side` из `text_sequence`
- ✅ Если `space_side === 'left'` → подсвечивается левая половина
- ✅ Если `space_side === 'right'` → подсвечивается правая половина
- ✅ Цвет подсветки: **фиолетовый** (`#9b59b6` или текущий цвет для большого пальца)

---

### FR-3: Обработка нажатий клавиши

**Требование:** При физическом нажатии пробела система должна **визуально показывать нажатие правильной половины**.

**Поведение:**
- Пользователь нажимает Space (физическая клавиша)
- Система знает, какая половина должна быть (из `text_sequence[currentIndex].space_side`)
- Подсвечивается **только нужная половина** эффектом "нажатия"

**Acceptance Criteria:**
- ✅ При нажатии Space подсвечивается только нужная половина
- ✅ Анимация нажатия (scale down + цвет) применяется только к нужной половине
- ✅ Если пользователь ошибся (набрал что-то другое) — обе половины не подсвечиваются

---

### FR-4: Визуальные индикаторы для обучения

**Требование:** Пользователь должен **понимать интуитивно**, что Space bar разделен и зачем.

**Реализация:**
1. **Tooltip при наведении:**
   - Наведение на левую половину → "Левый большой палец"
   - Наведение на правую половину → "Правый большой палец"

2. **Первое использование:**
   - При первом уроке показать hint: "Пробел нажимается большим пальцем ПРОТИВОПОЛОЖНОЙ руки!"

3. **Цветовая кодировка:**
   - Обе половины фиолетовые (цвет большого пальца)
   - При подсветке — более яркий фиолетовый

**Acceptance Criteria:**
- ✅ Tooltip отображается корректно
- ✅ Hint показывается один раз (сохраняется в LocalStorage)
- ✅ Цвет согласован с общей цветовой схемой

---

## 3. Technical Specification

### HTML Structure

**Текущая структура (предположительная):**
```html
<div class="keyboard">
  <!-- ... другие клавиши ... -->
  <div class="key" data-key=" ">Space</div>
</div>
```

**Новая структура:**
```html
<div class="keyboard">
  <!-- ... другие клавиши ... -->
  <div class="key key-space" data-key=" ">
    <div class="space-half space-left" data-space-side="left">
      <span class="space-label">Space (L)</span>
    </div>
    <div class="space-divider"></div>
    <div class="space-half space-right" data-space-side="right">
      <span class="space-label">Space (R)</span>
    </div>
  </div>
</div>
```

**Пояснение:**
- `.key-space` — контейнер для Space bar
- `.space-half` — половина Space bar (left или right)
- `.space-divider` — визуальная граница между половинами
- `data-space-side` — атрибут для CSS-селекторов

---

### CSS Styling

```css
/* Space bar container */
.key-space {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  width: 400px; /* Ширина Space bar */
  height: 60px;
  background: transparent; /* Фон на половинах */
  border: none; /* Убираем общую границу */
  padding: 0;
  gap: 0;
}

/* Половины Space bar */
.space-half {
  flex: 1; /* Равная ширина */
  display: flex;
  align-items: center;
  justify-content: center;
  background: #9b59b6; /* Фиолетовый */
  border: 2px solid #34495e; /* Граница */
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  color: white;
  font-size: 14px;
  font-weight: 600;
}

/* Левая половина */
.space-left {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  border-right: none; /* Убираем правую границу */
}

/* Правая половина */
.space-right {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  border-left: none; /* Убираем левую границу */
}

/* Разделитель между половинами */
.space-divider {
  width: 2px;
  background: #34495e;
  align-self: stretch;
}

/* Подсветка активной половины (следующая клавиша) */
.space-half.highlight {
  background: #c39bd3; /* Более светлый фиолетовый */
  box-shadow: 0 0 15px rgba(155, 89, 182, 0.8);
  transform: scale(1.05);
}

/* Эффект нажатия */
.space-half.pressed {
  background: #7d3c98; /* Темнее */
  transform: scale(0.95);
  box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.3);
}

/* Tooltip */
.space-half::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: -30px;
  left: 50%;
  transform: translateX(-50%);
  background: #2c3e50;
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
}

.space-half:hover::after {
  opacity: 1;
}

/* Responsive (для ноутбуков — компактнее) */
.keyboard.laptop .key-space {
  width: 340px; /* Уменьшенная ширина для laptop */
  height: 50px;
}
```

---

### JavaScript Logic

**Инициализация:**
```javascript
class TypingTrainer {
  constructor() {
    this.currentIndex = 0;
    this.textSequence = []; // Загружается из lesson JSON
    // ...
  }

  loadLesson(lessonData) {
    this.textSequence = lessonData.text_sequence;
    this.renderText();
    this.highlightNextKey();
  }

  highlightNextKey() {
    const currentChar = this.textSequence[this.currentIndex];

    // Если следующий символ — пробел
    if (currentChar.char === ' ') {
      this.highlightSpace(currentChar.space_side);
    } else {
      this.highlightKey(currentChar.key);
    }
  }

  highlightSpace(spaceSide) {
    // Убираем все highlight
    document.querySelectorAll('.space-half').forEach(half => {
      half.classList.remove('highlight');
    });

    // Подсвечиваем нужную половину
    const halfSelector = `.space-${spaceSide}`;
    const half = document.querySelector(halfSelector);
    if (half) {
      half.classList.add('highlight');
    }
  }

  handleKeyPress(event) {
    if (event.key === ' ') {
      const currentChar = this.textSequence[this.currentIndex];

      // Проверяем, что это действительно пробел
      if (currentChar.char === ' ') {
        this.pressSpace(currentChar.space_side);
        this.currentIndex++;
        this.highlightNextKey();
      } else {
        this.handleError();
      }
    } else {
      // Обработка других клавиш
      this.handleCharacter(event.key);
    }
  }

  pressSpace(spaceSide) {
    const halfSelector = `.space-${spaceSide}`;
    const half = document.querySelector(halfSelector);

    if (half) {
      // Анимация нажатия
      half.classList.add('pressed');
      setTimeout(() => {
        half.classList.remove('pressed');
      }, 150);
    }
  }
}
```

---

## 4. Integration with Existing Code

### Изменения в существующем коде:

**1. Lesson Data Loading**

В `main.js` (или модуль загрузки уроков):
```javascript
async function loadLesson(lessonId) {
  const response = await fetch(`/data/lessons/block_1/${lessonId}.json`);
  const lessonData = await response.json();

  // Валидация text_sequence
  if (!lessonData.text_sequence) {
    console.error('Missing text_sequence in lesson data!');
    return;
  }

  typingTrainer.loadLesson(lessonData);
}
```

**2. Virtual Keyboard HTML Update**

В `index.html` (или шаблон клавиатуры):
```html
<!-- Заменить текущий Space bar на: -->
<div class="key key-space" data-key=" ">
  <div class="space-half space-left" data-space-side="left" data-tooltip="Левый большой палец">
    <span class="space-label">Space</span>
  </div>
  <div class="space-divider"></div>
  <div class="space-half space-right" data-space-side="right" data-tooltip="Правый большой палец">
    <span class="space-label">Space</span>
  </div>
</div>
```

**3. CSS Import**

Добавить новый файл `assets/css/split-space.css` или добавить стили в `keyboard.css`.

---

## 5. Testing Checklist

### Manual Testing:

- [ ] **Visual Check:** Space bar визуально разделен на 2 части
- [ ] **Highlight Check:** Подсветка правильной половины работает
  - [ ] Урок 1: `ФЫВА ОЛДЖА` → после ФЫВА (левая рука) подсвечивается правая половина ✅
  - [ ] Урок 2: `А О` → после А (левая) подсвечивается правая половина ✅
  - [ ] Урок 3: `ФЖ ЖФ` → после ФЖ (левая) подсвечивается правая половина ✅
- [ ] **Press Animation:** Нажатие пробела анимирует только нужную половину
- [ ] **Tooltip Check:** Tooltip отображается при наведении
- [ ] **Responsive:** На laptop-клавиатуре Space bar уменьшен пропорционально

### Automated Testing (опционально):

```javascript
// Тест в Jest/Mocha
describe('Split Space Bar', () => {
  it('should highlight right half after left hand key', () => {
    const trainer = new TypingTrainer();
    trainer.loadLesson({
      text_sequence: [
        {char: 'А', hand: 'left'},
        {char: ' ', hand: 'right', space_side: 'right'}
      ]
    });

    trainer.highlightNextKey(); // Index 0 (А)
    trainer.currentIndex = 1;
    trainer.highlightNextKey(); // Index 1 (Space)

    const rightHalf = document.querySelector('.space-right');
    expect(rightHalf.classList.contains('highlight')).toBe(true);
  });
});
```

---

## 6. UX Considerations

### First-Time User Experience:

**Onboarding Hint (показать один раз):**
```
💡 Совет: Пробел нажимается большим пальцем противоположной руки!
   После слова левой рукой → пробел ПРАВЫМ большим 👍
   После слова правой рукой → пробел ЛЕВЫМ большим 👍

   [Понятно!]
```

**Где показать:**
- В начале Урока 1 (lesson_01) после выбора персонажа
- Или в виде tooltip при первом наведении на Space bar

**Сохранение в LocalStorage:**
```javascript
if (!localStorage.getItem('space_hint_shown')) {
  showSpaceBarHint();
  localStorage.setItem('space_hint_shown', 'true');
}
```

---

## 7. Phase 1 vs Phase 2

### Phase 1 (MVP) — Minimum:
- ✅ Визуальное разделение Space bar
- ✅ Подсветка правильной половины
- ✅ Анимация нажатия

### Phase 2 (Enhanced):
- ⏳ Статистика ошибок по пробелу (левый vs правый)
- ⏳ AI-персонализация: "Ты часто ошибаешься с пробелом левой рукой"
- ⏳ Настройка: возможность отключить разделение Space bar

---

## 8. Related Documents

- [Lesson 01 JSON](../../data/lessons/block_1/lesson_01.json) — пример с `text_sequence`
- [Terminology System](../domain/typing-terminology.md) — определение терминов
- [Quick Start Guide](../user/Quick_Start_Guide.md) — объяснение для пользователей

---

## 9. Implementation Timeline

| Задача | Исполнитель | Время | Статус |
|--------|-------------|-------|--------|
| HTML структура | Alex (Frontend) | 1 час | ⏳ Pending |
| CSS styling | Alex (Frontend) | 2 часа | ⏳ Pending |
| JS logic | Alex (Frontend) | 3 часа | ⏳ Pending |
| Testing | Quinn (QA) | 2 часа | ⏳ Pending |
| **Total** | | **8 часов** | |

---

## 10. Approval

**Статус:** Draft
**Требует approval от:**
- [ ] Иван (Product Owner)
- [ ] Клод (Architect)
- [ ] Алекс (Frontend Developer)

**Версия:** 1.0
**Дата создания:** 2025-11-17
**Автор:** Клод (Architect)

---

**Следующие шаги:**
1. Иван утверждает спецификацию
2. Алекс реализует Split Space Bar
3. Катя продолжает создание Уроков 4-15 с `text_sequence`
4. Quinn тестирует на Уроках 1-3
