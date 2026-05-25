# Unified Terminology System - Typing Trainer

> **Назначение:** Ubiquitous Language для ВСЕХ участников проекта
> **Версия:** 1.0
> **Дата:** 16 ноября 2025
> **Адаптировано из:** Valera Bot Domain Terminology + Best Practices Study
> **Для:** 11 AI-агентов + Иван + Клод + будущие пользователи

---

## 🎯 Цель этого документа

**Проблема:** Команда из 11 AI-агентов + 2 людей должна говорить на ОДНОМ языке. Без unified terminology возникают недопонимания, ошибки в коде, путаница в документации.

**Решение:** Этот документ определяет **ЕДИНСТВЕННЫЙ** правильный термин для каждого понятия в проекте Typing Trainer.

**Правило:** Все документы, код, комментарии, UI тексты MUST use EXACTLY эти термины.

---

## 👥 Персоны (Actors)

### Пользователь (User)
**Определение:** Любой человек, использующий Typing Trainer для обучения слепой печати.

**Синонимы (НЕ ИСПОЛЬЗОВАТЬ):** ❌ юзер, клиент, посетитель

**Используется в:**
- UI тексты
- Документация
- Analytics events
- LocalStorage keys: `user_*`

**Примеры:**
- "Пользователь начал урок Block 1, Lesson 3"
- `localStorage.getItem('user_best_wpm')`
- "User completed 15 lessons this week"

---

### Начинающий (Beginner)
**Определение:** Пользователь, который только начинает учиться слепой печати. Обычно проходит Block 1 (pinky и ring finger exercises).

**Характеристики:**
- WPM: 0-30
- Accuracy: < 85%
- Completed Lessons: < 10
- Difficulty Levels: Pinky, Ring Finger

**Синонимы (НЕ ИСПОЛЬЗОВАТЬ):** ❌ новичок, ученик, студент

**Используется в:**
- Lesson content targeting
- UI messaging
- Progress categorization

---

### Продвинутый (Advanced)
**Определение:** Пользователь с высокими навыками слепой печати. Обычно работает с Block 3+ (all fingers + numbers).

**Характеристики:**
- WPM: > 60
- Accuracy: > 95%
- Completed Lessons: > 30
- Difficulty Levels: All fingers, Numbers, Advanced

**Синонимы (НЕ ИСПОЛЬЗОВАТЬ):** ❌ профи, эксперт, мастер

---

## 📚 Объекты (Entities)

### Урок (Lesson)
**Определение:** Одно учебное упражнение, focused на конкретном наборе клавиш или навыке.

**Формат naming:** `Block_X_Lesson_Y` (где X = номер блока, Y = номер урока)

**Примеры:**
- `Block_1_Lesson_1` - первый урок первого блока (pinky finger)
- `Block_2_Lesson_5` - пятый урок второго блока (middle finger)

**Структура Lesson:**
```javascript
{
  id: "block_1_lesson_3",
  title: "Тренировка мизинца: клавиши А и Я",
  difficulty: "pinky",
  targetKeys: ["а", "я", "ф", "щ"],
  targetWPM: 15,
  maxErrors: 5,
  text: "...",
  duration: 300 // seconds
}
```

**Синонимы (НЕ ИСПОЛЬЗОВАТЬ):** ❌ упражнение, задание, практика

**Используется в:**
- Data files: `data/texts/ru.json`
- UI labels: "Урок 1 из 15"
- Analytics: `lesson_started`, `lesson_completed`
- LocalStorage: `lesson_progress_*`

---

### Блок (Block)
**Определение:** Группа уроков, объединенных общей темой или уровнем сложности.

**Структура Blocks:**
- **Block 1:** Pinky & Ring Finger (уроки 1-10)
- **Block 2:** Middle Finger (уроки 11-15)
- **Block 3:** Index Fingers (уроки 16-25)
- **Block 4:** All Fingers Combined (уроки 26-35)
- **Block 5:** Numbers & Symbols (уроки 36-45)
- **Block 6:** Advanced Practice (уроки 46+)

**Синонимы (НЕ ИСПОЛЬЗОВАТЬ):** ❌ модуль, раздел, глава

**Используется в:**
- Navigation: "Вы в Блоке 2"
- Progress tracking: "Завершено 3 из 6 блоков"

---

### Упражнение (Exercise)
**Определение:** Единица текста внутри урока. Один урок может содержать несколько упражнений.

**Отличие от Lesson:**
- **Lesson** = весь урок (может быть 5 минут)
- **Exercise** = один текст для набора (1-2 минуты)

**Пример:**
```
Lesson "Block_1_Lesson_3" contains:
  - Exercise 1: "фыва фыва фыва"
  - Exercise 2: "яфяф вава фыва"
  - Exercise 3: "фывафыва яфяф"
```

**Синонимы (НЕ ИСПОЛЬЗОВАТЬ):** ❌ текст, практика, drill

**Используется в:**
- Internal code
- Progress tracking per exercise

---

### Уровень сложности (Difficulty Level)
**Определение:** Категория урока, определяющая какие пальцы и клавиши тренируются.

**6 уровней сложности:**
1. **Pinky (Мизинец)** - клавиши: а, ф, я, щ (pink color)
2. **Ring (Безымянный)** - клавиши: ы, в, ч, э (orange color)
3. **Middle (Средний)** - клавиши: с, а, м, и (green color)
4. **Index Left (Указательный левый)** - клавиши: к, е, п, р (cyan color)
5. **Index Right (Указательный правый)** - клавиши: н, г, т, о (blue color)
6. **Advanced (Продвинутый)** - все клавиши + цифры (purple color)

**Синонимы (НЕ ИСПОЛЬЗОВАТЬ):** ❌ сложность, левел, лвл

**Используется в:**
- `config/settings.js`: `APP_CONFIG.difficultyLevels`
- Lesson metadata: `difficulty: "pinky"`
- UI filters: "Показать только уроки уровня Pinky"

---

## 📊 Метрики (Metrics)

### WPM (Words Per Minute / Слов в минуту)
**Определение:** Скорость печати, измеряемая в словах по 5 символов в минуту.

**Формула:**
```javascript
WPM = (totalCharacters / 5) / (timeInSeconds / 60)
```

**Категории WPM:**
- **Beginner:** 0-30 WPM
- **Intermediate:** 30-60 WPM
- **Advanced:** 60-90 WPM
- **Expert:** 90+ WPM

**Синонимы (НЕ ИСПОЛЬЗОВАТЬ):** ❌ скорость, speed, символов в минуту

**Используется в:**
- Real-time stats display: "Текущий WPM: 45"
- Best results: `bestWPM: 67`
- Target goals: `targetWPM: 50`

---

### Accuracy (Точность)
**Определение:** Процент правильно напечатанных символов.

**Формула:**
```javascript
Accuracy = ((totalCharacters - totalErrors) / totalCharacters) * 100
```

**Категории Accuracy:**
- **Poor:** < 85%
- **Fair:** 85-90%
- **Good:** 90-95%
- **Excellent:** 95-98%
- **Perfect:** 98-100%

**Синонимы (НЕ ИСПОЛЬЗОВАТЬ):** ❌ правильность, корректность, точность ввода

**Используется в:**
- Stats display: "Точность: 92%"
- Star rating calculation
- LocalStorage: `accuracy: 92.5`

---

### Error Rate (Частота ошибок)
**Определение:** Количество ошибок на 100 символов.

**Формула:**
```javascript
ErrorRate = (totalErrors / totalCharacters) * 100
```

**Категории Error Rate:**
- **Excellent:** < 2%
- **Good:** 2-5%
- **Fair:** 5-10%
- **Poor:** > 10%

**Синонимы (НЕ ИСПОЛЬЗОВАТЬ):** ❌ процент ошибок, количество ошибок

**Используется в:**
- Analytics
- Weak keys detection
- Progress reports

---

### Weak Keys (Слабые клавиши)
**Определение:** Клавиши, на которых пользователь делает больше всего ошибок (> 3 ошибок за сессию).

**Алгоритм определения:**
```javascript
weakKeys = keys.filter(key =>
  key.errors > 3 &&
  key.errorRate > 10%
).sort((a, b) => b.errors - a.errors)
```

**Примеры:**
- Weak Keys: [ф, ы, в] - пользователю нужно тренировать эти клавиши
- Weak Keys Analysis: "Ваши слабые клавиши: Ф (12 ошибок), Ы (8 ошибок)"

**Синонимы (НЕ ИСПОЛЬЗОВАТЬ):** ❌ проблемные клавиши, ошибочные клавиши

**Используется в:**
- AI Weak Keys Analyzer (Spec 001)
- Progress reports
- Personalized recommendations

---

## 🔄 Процессы (Processes)

### Тренировка (Training)
**Определение:** Процесс прохождения урока с целью улучшения навыков слепой печати.

**Этапы Training:**
1. **Start** - пользователь начинает урок
2. **Practice** - активный набор текста
3. **Complete** - урок завершен (все упражнения пройдены)

**Синонимы (НЕ ИСПОЛЬЗОВАТЬ):** ❌ обучение, практика, упражнение

**Events:**
- `training_started`
- `training_in_progress`
- `training_completed`

---

### Тест (Test)
**Определение:** Проверка навыков печати в режиме без подсказок и feedback. Usually timed (1-5 minutes).

**Отличие от Training:**
- **Training:** есть подсказки, виртуальная клавиатура, real-time feedback
- **Test:** нет подсказок, оценка только в конце, time limit

**Типы Tests:**
- **1-minute test** - быстрая проверка WPM
- **3-minute test** - стандартный тест
- **5-minute test** - выносливость

**Синонимы (НЕ ИСПОЛЬЗОВАТЬ):** ❌ экзамен, проверка, контроль

**Используется в:**
- Test mode (future feature)
- Certification (future)

---

### Анализ прогресса (Progress Analysis)
**Определение:** Процесс оценки улучшения навыков пользователя за период времени.

**Метрики Progress Analysis:**
- WPM Growth: +X WPM за период
- Accuracy Improvement: +Y% за период
- Lessons Completed: Z уроков
- Weak Keys Identified: список ключей
- Time Spent: total minutes

**Синонимы (НЕ ИСПОЛЬЗОВАТЬ):** ❌ оценка прогресса, анализ результатов

**Используется в:**
- Progress Dashboard
- Weekly reports
- AI recommendations

---

## 🎨 UI/UX Термины

### Виртуальная клавиатура (Virtual Keyboard)
**Определение:** HTML-визуализация физической клавиатуры с color-coded finger positions.

**Цвета пальцев:**
- **Pink (розовый):** Pinky finger (мизинец)
- **Orange (оранжевый):** Ring finger (безымянный)
- **Green (зеленый):** Middle finger (средний)
- **Cyan (голубой):** Index finger left (указательный левый)
- **Blue (синий):** Index finger right (указательный правый)
- **Purple (фиолетовый):** Thumbs (большие пальцы)

**Синонимы (НЕ ИСПОЛЬЗОВАТЬ):** ❌ клавиатура, keyboard, экранная клавиатура

**Используется в:**
- UI component: `VirtualKeyboard.vue` (future)
- CSS classes: `.virtual-keyboard`

---

### Подсветка клавиши (Key Highlight)
**Определение:** Визуальное выделение следующей клавиши, которую нужно нажать.

**Типы подсветки:**
- **Next Key:** следующая клавиша (bright highlight)
- **Current Finger:** палец для этой клавиши (color glow)
- **Error Flash:** красная вспышка при ошибке

**Синонимы (НЕ ИСПОЛЬЗОВАТЬ):** ❌ выделение клавиши, highlight

---

### Статистика в реальном времени (Real-time Stats)
**Определение:** Display WPM, Accuracy, Errors во время тренировки (обновляется каждые 500ms).

**Отображаемые метрики:**
- Current WPM
- Current Accuracy
- Total Errors
- Time Elapsed

**Синонимы (НЕ ИСПОЛЬЗОВАТЬ):** ❌ живая статистика, онлайн статистика

---

### Система звезд (Star Rating)
**Определение:** Оценка результата урока от 1 до 5 звезд на основе WPM и Accuracy.

**Алгоритм:**
```javascript
if (wpm >= targetWPM && accuracy >= 98) return 5;
if (wpm >= targetWPM * 0.9 && accuracy >= 95) return 4;
if (wpm >= targetWPM * 0.8 && accuracy >= 90) return 3;
if (wpm >= targetWPM * 0.7 && accuracy >= 85) return 2;
return 1;
```

**Синонимы (НЕ ИСПОЛЬЗОВАТЬ):** ❌ рейтинг, оценка, звезды

---

## 💾 Технические термины

### LocalStorage
**Определение:** Browser storage для сохранения прогресса и настроек пользователя (client-side only).

**Ключи LocalStorage:**
- `user_best_wpm` - лучший WPM
- `user_best_accuracy` - лучшая точность
- `lesson_progress_{lessonId}` - прогресс урока
- `weak_keys_data` - данные о слабых клавишах
- `user_settings` - настройки пользователя

**Синонимы (НЕ ИСПОЛЬЗОВАТЬ):** ❌ хранилище, storage, локальное хранилище

---

### Session (Сессия)
**Определение:** Один непрерывный период использования приложения (от открытия до закрытия браузера/вкладки).

**Session Metrics:**
- Session Duration (время сессии)
- Lessons Completed (уроков завершено за сессию)
- Average WPM (средний WPM за сессию)
- Total Errors (всего ошибок за сессию)

**Синонимы (НЕ ИСПОЛЬЗОВАТЬ):** ❌ визит, посещение

---

### Config (Конфигурация)
**Определение:** Настройки приложения в `config/settings.js` через объект `APP_CONFIG`.

**Основные конфиги:**
- `difficultyLevels` - уровни сложности
- `keyFingerMap` - mapping клавиш на пальцы
- `ratingSystem` - система оценки звезд
- `uiSettings` - настройки интерфейса

**Синонимы (НЕ ИСПОЛЬЗОВАТЬ):** ❌ настройки, конфиг, configuration

---

## 📝 Content Terms

### Текст для набора (Typing Text)
**Определение:** Text content который пользователь должен напечатать во время урока.

**Требования к Typing Text:**
- Корректный русский язык
- Focused на target keys
- Progressive difficulty
- No offensive content
- Culturally appropriate

**Источники:**
- `data/texts/ru.json` - embedded texts
- `data/quotes.json` - inspirational quotes

**Синонимы (НЕ ИСПОЛЬЗОВАТЬ):** ❌ текст, контент, материал

---

## 🔧 Development Terms

### Component (Компонент)
**Определение:** Reusable JavaScript module в проекте.

**Основные компоненты:**
- `TypingTrainer` (main.js) - core logic
- `VirtualKeyboard` (keyboard.js) - keyboard display
- `StatsManager` (stats.js) - statistics calculation
- `StorageUtils` (utils.js) - LocalStorage operations

**Синонимы (НЕ ИСПОЛЬЗОВАТЬ):** ❌ модуль, файл, скрипт

---

### Event (Событие)
**Определение:** User action или system trigger в приложении.

**Типы Events:**
- **User Events:** keypress, click, focus
- **System Events:** lesson_start, lesson_complete, stats_update
- **Analytics Events:** для tracking (future)

**Синонимы (НЕ ИСПОЛЬЗОВАТЬ):** ❌ событие, ивент, action

---

## 🎯 Использование терминологии

### ✅ ПРАВИЛЬНО:

**В коде:**
```javascript
const user = getCurrentUser();
const lesson = lessons.find(l => l.id === 'block_1_lesson_3');
const wpm = calculateWPM(totalCharacters, timeInSeconds);
const accuracy = calculateAccuracy(totalCharacters, totalErrors);
const weakKeys = analyzeWeakKeys(keyPresses);
```

**В документации:**
```markdown
User starts Lesson "Block_1_Lesson_3" (Difficulty: Pinky).
During Training, system tracks WPM and Accuracy in real-time.
After completing 5 Exercises, user receives Star Rating (1-5 stars).
Weak Keys are identified: [ф, ы, в].
```

**В UI:**
```html
<h1>Урок 3: Тренировка мизинца</h1>
<p>Ваш WPM: 45</p>
<p>Точность: 92%</p>
<p>Слабые клавиши: Ф, Ы, В</p>
```

---

### ❌ НЕПРАВИЛЬНО:

**Избегать:**
- ❌ "Юзер начал практику 3 левела"
- ❌ "Скорость: 45 символов/мин"
- ❌ "Правильность ввода: 92%"
- ❌ "Проблемные кнопки: Ф, Ы"

---

## 📚 Связанные документы

- **Specification Workflow:** [../processes/Specification_Workflow.md](../processes/Specification_Workflow.md)
- **Implementation Plans:** [../implementation/README.md](../implementation/README.md)
- **Architecture:** [../architecture/](../architecture/)
- **Learning Best Practices:** [../Learning_Best_Practices_Analysis.md](../Learning_Best_Practices_Analysis.md)

---

## 🔄 Обновления терминологии

**Процесс добавления нового термина:**
1. Предложить термин с четким определением
2. Проверить на конфликты с existing terms
3. Обсудить с командой (Katya для content terms, Alex для UI, Claude для technical)
4. Добавить в этот документ
5. Обновить все релевантные specs и код

**Version History:**
| Date | Version | Change | Author |
|------|---------|--------|--------|
| 2025-11-16 | 1.0 | Initial creation | Тимофей |

---

**Maintained by:** Тимофей (Technical Writer) + Катя (Content)
**Last Updated:** 16 ноября 2025
**Version:** 1.0
**Adapted from:** Valera Bot Domain Terminology + Typing Trainer requirements
