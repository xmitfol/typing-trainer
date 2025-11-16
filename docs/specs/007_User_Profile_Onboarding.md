# [007] User Profile & Onboarding - Спецификация

> **Статус:** 🟡 draft
> **Создано:** 2025-11-16
> **Обновлено:** 2025-11-16
> **Автор:** Тимофей (Technical Writer)
> **Reviewers:** Клод (Architect), Иван (Product Owner)
> **Priority:** 🔴 High
> **Estimated Effort:** 12 часов

---

## 📋 Краткое описание

Система первичной настройки профиля пользователя (onboarding) с выбором персонажа-наставника и персонализацией обучения. При первом запуске пользователь заполняет имя, выбирает профиль (мужчина/женщина/ребенок), тип клавиатуры и язык. Система автоматически подбирает подходящего персонажа-наставника, который сопровождает обучение персонализированными советами.

**Используйте термины из:** [Terminology System](../domain/typing-terminology.md)

---

## 🎯 Цели и ценность

### Для пользователя:
- **Персонализация с первой минуты** — система обращается по имени, создает ощущение "моего" тренажера
- **Подходящий наставник** — автоматический выбор персонажа по полу/возрасту обеспечивает психологический комфорт
- **Адаптированные советы** — рекомендации учитывают тип клавиатуры (ноутбук vs классическая)
- **Быстрый старт** — все данные на одном экране, можно начать за 30 секунд
- **Мотивация** — дружелюбный персонаж снижает стресс от ошибок и поддерживает прогресс

### Для бизнеса:
- **Retention** — персонализация увеличивает эмоциональную привязанность (+15-25% retention по исследованиям)
- **Engagement** — персонажи делают обучение интереснее, пользователи возвращаются
- **Onboarding Completion Rate** — цель >85% (один экран vs многошаговые формы)
- **Differentiation** — персонажи-наставники — уникальная фича среди клавиатурных тренажеров
- **Foundation для Phase 2** — профиль пользователя — основа для будущей авторизации и синхронизации

---

## 👥 Целевая аудитория

**Primary:**
- **Новые пользователи (впервые открыли приложение)** — 100% аудитория
- Use case: Заполняют профиль один раз при первом запуске, выбирают наставника, начинают обучение

**Secondary:**
- **Returning users (очистили данные браузера)** — редко, но возможно
- Use case: Проходят онбординг заново, восстанавливают профиль

**Tertiary:**
- **Existing users (хотят сменить персонажа)** — через настройки
- Use case: Открывают Settings → меняют наставника/тип клавиатуры

---

## 📐 Функциональные требования

### Основной функционал

#### FR-1: Onboarding Screen — Единый экран настройки профиля

**Описание:** При первом запуске приложения (если `user.onboardingCompleted !== true` в LocalStorage) показывается экран онбординга с 4 секциями: имя (текстовое поле), профиль (4 карточки с иконками), тип клавиатуры (3 карточки), язык (2 карточки, Русский preselected).

**Acceptance Criteria:**
- [ ] При первом запуске (LocalStorage пуст) автоматически показывается onboarding screen
- [ ] Все 4 секции видны на одном экране без скролла (на экранах ≥1280x720)
- [ ] Поле "Имя" имеет placeholder "Введите имя" и валидацию (2-30 символов, только буквы)
- [ ] 4 карточки профиля (Мужчина, Женщина, Кнопыч, Клавочка) кликабельны, визуально показывают какого наставника получит пользователь
- [ ] 3 карточки клавиатуры (Классическая, Ноутбук, Эргономическая) с иконками и подзаголовками
- [ ] 2 карточки языка (Русский active, Английский disabled с badge "скоро")
- [ ] Кнопка "Начать обучение!" активна только если все обязательные поля заполнены (имя + профиль + клавиатура)
- [ ] При клике на "Начать обучение!" данные сохраняются в LocalStorage и показывается приветствие от персонажа

**Accessibility Requirements:** (WCAG 2.1 Level AA)
- [ ] Keyboard navigation: Tab для перехода между полями, Enter/Space для выбора карточек, Enter для кнопки "Начать обучение!"
- [ ] Screen reader: Все карточки имеют `role="radio"`, `aria-label="Выберите профиль"`, `aria-selected="true"` для выбранной
- [ ] Contrast: Минимум 4.5:1 для текста, визуальное выделение выбранных карточек (border 3px #2196F3)
- [ ] Focus indicators: Visible outline для всех интерактивных элементов

**Priority:** 🔴 High

**Estimated Effort:** 6 часов (HTML/CSS/JS)

---

#### FR-2: User Profile Data Structure — Структура данных профиля в LocalStorage

**Описание:** После завершения онбординга в LocalStorage сохраняется объект `user` с полями: name, character, gender, ageGroup, keyboardType, language, onboardingCompleted, createdAt.

**Acceptance Criteria:**
- [ ] Данные сохраняются в ключ `user` в LocalStorage как JSON строка
- [ ] Поля соответствуют схеме:
  ```json
  {
    "name": string (2-30 chars),
    "character": "anna" | "maxim" | "knopych" | "klavochka",
    "gender": "male" | "female" | "child",
    "ageGroup": "adult" | "child",
    "keyboardType": "classic" | "laptop" | "ergonomic",
    "language": "ru" | "en",
    "onboardingCompleted": true,
    "createdAt": ISO 8601 timestamp
  }
  ```
- [ ] `gender` определяется автоматически из `character` (anna→male, maxim→female, knopych/klavochka→child)
- [ ] `ageGroup` определяется автоматически (anna/maxim→adult, knopych/klavochka→child)
- [ ] При повторном открытии приложения если `onboardingCompleted === true`, онбординг не показывается
- [ ] Если LocalStorage недоступен (инкогнито), показывается warning и предлагается session-only режим

**Accessibility Requirements:** N/A (backend logic)

**Priority:** 🔴 High

**Estimated Effort:** 2 часа (JavaScript logic + LocalStorage API)

---

#### FR-3: Character System — Система персонажей-наставников

**Описание:** Система загружает JSON файлы с фразами персонажей (anna.json, maxim.json, knopych.json, klavochka.json) и показывает персонализированные советы в ключевых моментах обучения (начало урока, завершение, ошибки, level up).

**Acceptance Criteria:**
- [ ] Создано 4 JSON файла в `data/characters/` с библиотекой фраз для каждого персонажа
- [ ] Класс `CharacterSystem` загружает нужный файл на основе `user.character`
- [ ] Метод `getMessage(situation, variables)` возвращает случайную фразу из массива для данной ситуации
- [ ] Поддерживается интерполяция переменных: `{name}`, `{wpm}`, `{accuracy}`, `{errors}`, `{limit}`, `{level}`, `{key}`
- [ ] Фразы показываются как toast notifications (правый верхний угол, 3-5 сек auto-dismiss)
- [ ] Поддерживается минимум 7 ситуаций: lessonStart, goodProgress, tooManyErrors, lessonCompleteSuccess, errorLimitExceeded, levelUnlocked, breakReminder

**Accessibility Requirements:**
- [ ] Toast notifications имеют `role="status"` или `aria-live="polite"` для screen readers
- [ ] Можно закрыть toast через Escape или кликом
- [ ] Toast не перекрывает критичный UI (текстовый редактор, виртуальную клавиатуру)

**Priority:** 🔴 High

**Estimated Effort:** 4 часа (JSON files + CharacterSystem.js + UI integration)

---

#### FR-4: Keyboard Layout Variants — Варианты виртуальной клавиатуры по типу

**Описание:** Виртуальная клавиатура в основном интерфейсе меняет визуальный стиль в зависимости от выбранного `user.keyboardType`: классическая (как сейчас), ноутбук (компактная), эргономическая (split layout).

**Acceptance Criteria:**
- [ ] При загрузке приложения читается `user.keyboardType` из LocalStorage
- [ ] Виртуальной клавиатуре добавляется CSS класс `.layout-{keyboardType}` (layout-classic, layout-laptop, layout-ergonomic)
- [ ] **Classic layout (P0 — Must Have):** стандартный макет, уже реализован
- [ ] **Laptop layout (P1 — Should Have):** CSS модификации:
  - Клавиши меньше на 15% (font-size: 0.85em)
  - Отступы между клавишами уменьшены на 30%
  - Меньше shadow и border-radius (плоский стиль)
- [ ] **Ergonomic layout (P2 — Nice to Have, Phase 2):** раздельный макет (split keyboard):
  - Левая и правая части разделены на 2 блока
  - Расстояние между блоками ~50px
  - Небольшой наклон для эргономики (transform: rotate)
- [ ] Смена типа клавиатуры в Settings мгновенно обновляет layout без перезагрузки

**Accessibility Requirements:** N/A (визуальный стиль не влияет на доступность)

**Priority:** 🟠 Medium (P0 — High, P1 — Medium, P2 — Low)

**Estimated Effort:** Classic (0 ч — готово), Laptop (2 ч), Ergonomic (6 ч — Phase 2)

---

#### FR-5: Welcome Message from Character — Приветствие от персонажа после онбординга

**Описание:** После клика "Начать обучение!" показывается модальное окно с приветственным сообщением от выбранного персонажа (3-5 сек auto-dismiss или клик "Поехали!").

**Acceptance Criteria:**
- [ ] После сохранения профиля показывается centered modal с приветствием
- [ ] Приветствие использует переменные: `{name}`, `{keyboardType}`
- [ ] Пример (Анна): "Привет, Саша! Я Анна — твой персональный наставник по печати. Вижу, у тебя ноутбук — учту это в своих советах! Готов начать свой путь к мастерству слепой печати? Помни: точность важнее скорости! 🎯"
- [ ] Кнопка "Поехали! 🚀" или auto-dismiss через 5 секунд
- [ ] После закрытия — переход к основному интерфейсу (уровень "Мизинец", Урок 1)

**Accessibility Requirements:**
- [ ] Modal имеет `role="dialog"`, `aria-modal="true"`
- [ ] Focus trap внутри модального окна (Tab не выходит за пределы)
- [ ] Escape закрывает модальное окно

**Priority:** 🟠 Medium

**Estimated Effort:** 1 час (Modal component + integration)

---

#### FR-6: Profile Settings — Редактирование профиля в настройках

**Описание:** В главном меню (⚙️ Settings) пользователь может изменить имя, сменить персонажа, тип клавиатуры или пройти онбординг заново.

**Acceptance Criteria:**
- [ ] В Settings есть секция "Профиль" с полями:
  - Имя (inline редактирование, валидация как при онбординге)
  - Персонаж (dropdown или modal с 4 вариантами + preview стиля)
  - Тип клавиатуры (dropdown с 3 вариантами)
  - Кнопка "Пройти онбординг заново" (danger button)
- [ ] При смене персонажа показывается preview его стиля (пример фразы)
- [ ] Изменения сохраняются в LocalStorage мгновенно
- [ ] При смене типа клавиатуры виртуальная клавиатура обновляется без перезагрузки
- [ ] "Пройти онбординг заново" показывает confirmation dialog → очищает `user.onboardingCompleted` → перезагружает страницу

**Accessibility Requirements:**
- [ ] Все поля доступны через Tab
- [ ] Dropdowns работают через Space/Enter/Arrow keys
- [ ] Confirmation dialog имеет `role="alertdialog"`

**Priority:** 🟢 Low (Phase 1.5)

**Estimated Effort:** 3 часа (Settings UI + logic)

---

### Дополнительный функционал (Phase 2+)

- **Аватары персонажей** — визуальные иллюстрации вместо эмодзи
- **Голосовые подсказки** — озвучка фраз персонажей (опционально, настройка)
- **Анимации персонажей** — эмоции (радость, огорчение) при разных событиях
- **Статистика персонажей** — какие персонажи популярнее, корреляция с retention
- **Кастомизация персонажей** — выбор имени, внешности (Phase 3)

---

## 🎨 UI/UX требования

### Макеты и wireframes

**Onboarding Screen (один экран):**
```
┌───────────────────────────────────────────────────────┐
│       👋 Добро пожаловать в Typing Trainer!           │
├───────────────────────────────────────────────────────┤
│  Я помогу тебе научиться печатать быстро и точно      │
│                                                       │
│  ┌─────────────────────────────────────────────┐      │
│  │  Как тебя зовут?                            │      │
│  │  [Введите имя___________________________]   │      │
│  └─────────────────────────────────────────────┘      │
│                                                       │
│  ┌─────────────────────────────────────────────┐      │
│  │  Выбери свой профиль:                       │      │
│  │  [👨 Мужчина] [👩 Женщина] [🤖 Кнопыч] [🎨] │      │
│  └─────────────────────────────────────────────┘      │
│                                                       │
│  ┌─────────────────────────────────────────────┐      │
│  │  Тип клавиатуры:                            │      │
│  │  [⌨️ Классич.] [💻 Ноутбук] [🎯 Эргоном.]   │      │
│  └─────────────────────────────────────────────┘      │
│                                                       │
│  ┌─────────────────────────────────────────────┐      │
│  │  Язык: [🇷🇺 Русский] [🇬🇧 English (скоро)]  │      │
│  └─────────────────────────────────────────────┘      │
│                                                       │
│                        [Начать обучение! 🚀]          │
└───────────────────────────────────────────────────────┘
```

**Welcome Modal:**
```
┌─────────────────────────────────────┐
│                                     │
│         👩‍🏫 Анна говорит:           │
│                                     │
│  "Привет, Саша! Я Анна — твой      │
│   персональный наставник по печати. │
│                                     │
│   Вижу, у тебя ноутбук — учту это  │
│   в своих советах!                  │
│                                     │
│   Готов начать свой путь к         │
│   мастерству слепой печати?         │
│                                     │
│   Помни: точность важнее скорости!  │
│   🎯"                               │
│                                     │
│               [Поехали! 🚀]         │
└─────────────────────────────────────┘
```

**Toast Notification (пример):**
```
┌────────────────────────────────┐
│ 👩‍🏫 Анна:                      │
│ "Отлично, Саша! Уже 45 WPM! 🚀"│
│                           [×]  │
└────────────────────────────────┘
```

### User Flow

**Первый запуск:**
```
[Открытие приложения] →
[LocalStorage проверка: пуст?] →
[Показ Onboarding Screen] →
[Пользователь заполняет: имя + профиль + клавиатура + язык] →
[Клик "Начать обучение!"] →
[Сохранение в LocalStorage] →
[Welcome Modal от персонажа (5 сек)] →
[Переход к основному интерфейсу: Уровень "Мизинец", Урок 1]
```

**Returning user (онбординг пройден):**
```
[Открытие приложения] →
[LocalStorage проверка: user.onboardingCompleted === true?] →
[Пропуск онбординга] →
[Загрузка CharacterSystem(user.character)] →
[Основной интерфейс]
```

**Урок с персонажем:**
```
[Начало урока] →
[Toast: "Привет, {name}! Готов? 💪" (3 сек)] →
[Пользователь печатает...] →
[WPM > target] → [Toast: "Отлично! {wpm} WPM! 🚀"] →
[Завершение урока] →
[Если ошибки ≤ лимит] → [Toast: "Красава! ✅ Переходим дальше?"]
[Если ошибки > лимит] → [Toast: "Попробуем еще раз? 💪"]
```

### Состояния UI

**Onboarding Screen:**
- **Default state:** Все поля пустые, кнопка "Начать обучение!" disabled (серая)
- **Filling state:** Пользователь заполняет поля, кнопка становится active (зеленая) когда все заполнено
- **Error state:** Если имя <2 символов, показывается red border + shake animation
- **Submitting state:** Клик "Начать обучение!" → loading spinner 0.5 сек → сохранение → переход

**Карточки профиля/клавиатуры/языка:**
- **Default:** border: 2px solid #e0e0e0, background: white
- **Hover:** border: 2px solid #2196F3, cursor: pointer
- **Selected:** border: 3px solid #2196F3, background: #E3F2FD, box-shadow
- **Disabled (English):** opacity: 0.5, grayscale, cursor: not-allowed

**Toast Notifications:**
- **Appearing:** Slide-in from right (0.3s)
- **Visible:** 3-5 сек
- **Dismissing:** Fade-out (0.2s) или slide-out при клике [×]
- **Stacking:** Если несколько toast — стек вертикально (max 3 одновременно)

---

## 🛠 Технические требования

### Frontend

**Технологии:**
- HTML5 + CSS3 (без фреймворков)
- Vanilla JavaScript (ES6+)
- LocalStorage API для персистентности

**Файлы:**
- `onboarding.html` — экран онбординга (или встроен в index.html как hidden modal)
- `assets/css/onboarding.css` — стили онбординга
- `assets/js/onboarding.js` — логика онбординга
- `assets/js/character-system.js` — класс CharacterSystem
- `data/characters/anna.json` — фразы Анны
- `data/characters/maxim.json` — фразы Максима
- `data/characters/knopych.json` — фразы Кнопыча
- `data/characters/klavochka.json` — фразы Клавочки

**LocalStorage Schema:**
```javascript
{
  "user": {
    "name": "Саша",
    "character": "anna",
    "gender": "male",
    "ageGroup": "adult",
    "keyboardType": "laptop",
    "language": "ru",
    "onboardingCompleted": true,
    "createdAt": "2025-11-16T23:45:00Z"
  }
}
```

**CharacterSystem API:**
```javascript
class CharacterSystem {
  constructor(characterId) { ... }

  // Получить сообщение для ситуации
  getMessage(situation, variables = {}) { ... }

  // Показать toast notification
  showToast(message, duration = 3000) { ... }

  // Загрузить персонажа из JSON
  loadCharacter(characterId) { ... }
}
```

**Ситуации (situations):**
- `lessonStart` — начало урока
- `goodProgress` — хороший прогресс (WPM > target, accuracy > 90%)
- `tooManyErrors` — много ошибок (errors > 70% от лимита)
- `lessonCompleteSuccess` — урок пройден успешно
- `errorLimitExceeded` — превышен лимит ошибок
- `levelUnlocked` — новый уровень разблокирован
- `weakKeysDetected` — обнаружены weak keys (Phase 2)
- `breakReminder` — напоминание об отдыхе (25 минут)
- `welcome` — приветствие после онбординга

### Backend (Phase 2)

**N/A для Phase 1** — все хранится локально.

**Phase 2 план:**
- FastAPI endpoint: `POST /api/users/profile` — сохранение профиля
- PostgreSQL таблица `user_profiles`:
  ```sql
  CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    name VARCHAR(30),
    character VARCHAR(20),
    gender VARCHAR(10),
    age_group VARCHAR(10),
    keyboard_type VARCHAR(20),
    language VARCHAR(5),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );
  ```

---

## 🧪 Тестирование

### Unit Tests

**onboarding.js:**
- [ ] Валидация имени (2-30 символов, только буквы)
- [ ] Автоматическое определение gender/ageGroup из character
- [ ] Сохранение в LocalStorage с правильной схемой
- [ ] Проверка `onboardingCompleted` флага

**character-system.js:**
- [ ] Загрузка JSON файла персонажа
- [ ] Интерполяция переменных `{name}`, `{wpm}`, `{accuracy}` и т.д.
- [ ] Случайный выбор фразы из массива (не всегда одна и та же)
- [ ] Обработка отсутствующих ситуаций (fallback)

### Integration Tests

- [ ] Полный флоу онбординга: заполнение → сохранение → welcome modal → переход к уроку
- [ ] Toast notifications показываются в правильные моменты (lesson start, completion, errors)
- [ ] Смена типа клавиатуры в Settings обновляет layout виртуальной клавиатуры
- [ ] Смена персонажа в Settings обновляет CharacterSystem и фразы меняются

### Manual QA Checklist

- [ ] **Первый запуск:** Онбординг показывается, все поля работают
- [ ] **Валидация:** Нельзя сохранить с именем <2 символов или без выбора профиля
- [ ] **Персонажи:** Каждый из 4 персонажей показывает свои уникальные фразы
- [ ] **Keyboard layouts:** Classic/Laptop/Ergonomic визуально различаются
- [ ] **LocalStorage:** Данные сохраняются, при перезагрузке онбординг не показывается повторно
- [ ] **Settings:** Можно изменить имя, персонажа, тип клавиатуры
- [ ] **Accessibility:** Все работает через Tab/Enter/Space, screen reader читает ARIA labels
- [ ] **Responsiveness:** Онбординг корректно отображается на экранах 1280x720 и выше

---

## 📊 Метрики успеха

### Ключевые метрики:

| Метрика | Целевое значение | Как измерять |
|---------|------------------|--------------|
| **Onboarding Completion Rate** | >85% | (users completed / users started) × 100% |
| **Time to Complete Onboarding** | <60 секунд | Среднее время от показа до клика "Начать обучение!" |
| **Character Distribution** | Равномерное (~25% каждый) | % выбора каждого персонажа |
| **Toast Engagement** | >30% кликов на toast | (toast clicks / toast shows) × 100% |
| **Profile Edit Rate** | <10% в первую неделю | % пользователей, редактирующих профиль после создания |

### A/B тесты (Phase 2):

- **Один экран vs Multi-step** — измерить Completion Rate
- **С персонажами vs Без персонажей** — измерить Retention Day 7 и Day 30
- **Частота toast** — часто (каждый урок) vs редко (только достижения) → Engagement

---

## 🚧 Риски и ограничения

### Технические риски:

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| LocalStorage недоступен (incognito mode) | Medium | High | Показать warning, предложить session-only режим |
| LocalStorage очищен пользователем | Low | Medium | Восстановление через sessionStorage (частично), повторный онбординг |
| JSON файлы персонажей не загружаются (CORS, 404) | Low | High | Fallback на дефолтные фразы в коде, error logging |
| Очень длинное имя (30+ символов) | Low | Low | Валидация max 30 символов, truncation в UI |

### UX риски:

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Пользователь не понимает зачем заполнять профиль | Medium | Medium | Добавить explanation: "Это поможет подобрать персонажа" |
| Дети не могут выбрать между Кнопыч/Клавочка | Medium | Low | Таймаут 30 сек → авто-выбор случайного, кнопка "Выбрать позже" |
| Персонажи раздражают (слишком часто) | Low | High | Настройка частоты toast в Settings, возможность отключить |
| Эргономическая клавиатура сложна в реализации | High | Low | Отложить на Phase 2, сначала Classic + Laptop |

### Бизнес риски:

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Персонажи не увеличивают retention | Medium | Medium | A/B тест, измерить метрики, при негативе — опциональность |
| Высокий drop-off на онбординге | Low | High | Мониторинг Completion Rate, упрощение если <85% |

---

## 📅 План реализации

### Phase 1: MVP (12 часов)

**Week 1 (6 часов):**
- [ ] **Onboarding Screen UI** (HTML/CSS) — 3 часа
  - Создать onboarding.html или modal в index.html
  - 4 секции: имя, профиль, клавиатура, язык
  - Responsive layout (1280x720+)
- [ ] **Onboarding Logic** (JavaScript) — 2 часа
  - Валидация полей
  - Сохранение в LocalStorage
  - Проверка onboardingCompleted при загрузке
- [ ] **Welcome Modal** — 1 час
  - Centered modal с приветствием от персонажа

**Week 2 (6 часов):**
- [ ] **Character JSON files** — 2 часа
  - 4 файла: anna.json, maxim.json, knopych.json, klavochka.json
  - Минимум 7 ситуаций × 3-5 фраз каждая
- [ ] **CharacterSystem class** — 2 часа
  - Загрузка JSON
  - getMessage(situation, variables)
  - Интерполяция переменных
- [ ] **Toast Notifications UI** — 2 часа
  - Компонент toast
  - Slide-in/fade-out анимации
  - Auto-dismiss через 3-5 сек
  - Integration в TypingTrainer

### Phase 1.5: Keyboard Layouts (4 часа)

- [ ] **Laptop Layout CSS** — 2 часа
  - .layout-laptop класс
  - Уменьшенные клавиши и отступы
  - Плоский стиль
- [ ] **Profile Settings** — 2 часа
  - Settings секция "Профиль"
  - Редактирование имени, персонажа, клавиатуры

### Phase 2: Enhancements (12+ часов)

- [ ] **Ergonomic Keyboard Layout** — 6 часов
- [ ] **Character Avatars** (иллюстрации) — 4 часа
- [ ] **Voice/Sound Effects** — 2 часа
- [ ] **Backend Sync** (FastAPI + PostgreSQL) — 8 часов
- [ ] **Analytics** (Completion Rate, Character Distribution) — 2 часа

---

## 🔗 Связанные документы

- [Onboarding Flow](../ux/Onboarding_Flow.md) — детальный UX дизайн онбординга
- [Character System](../ux/Character_System.md) — описание всех персонажей и фраз
- [Quick Start Guide](../user/Quick_Start_Guide.md) — пользовательская документация
- [Terminology System](../domain/typing-terminology.md) — термины
- [C4 Architecture](../architecture/c4-model.md) — архитектура приложения

---

## 📝 Changelog

| Дата | Версия | Изменения | Автор |
|------|--------|-----------|-------|
| 2025-11-16 | 1.0 | Initial draft — Phase 1 specification | Тимофей |

---

**Maintained by:** Тимофей (Technical Writer)
**Last Updated:** 16 ноября 2025
**Version:** 1.0 (Draft)
**Next Review:** Awaiting Иван (Product Owner) approval
