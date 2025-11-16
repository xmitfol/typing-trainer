# C4 Architecture Model - Typing Trainer

> **Назначение:** Архитектурная документация проекта Typing Trainer по модели C4
> **Версия:** 1.0
> **Дата:** 16 ноября 2025
> **Автор:** Тимофей (Technical Writer)
> **Статус:** ✅ Готово к review

---

## 📚 Содержание

1. [О модели C4](#о-модели-c4)
2. [Level 1: System Context](#level-1-system-context)
3. [Level 2: Container](#level-2-container)
4. [Level 3: Component](#level-3-component)
5. [Level 4: Code](#level-4-code)
6. [Архитектурные решения](#архитектурные-решения)
7. [Migration Path (Phase 1 → Phase 2)](#migration-path-phase-1--phase-2)
8. [Связанные документы](#связанные-документы)

---

## О модели C4

**C4 Model** — это иерархический подход к визуализации архитектуры программного обеспечения, состоящий из 4 уровней абстракции:

- **Level 1: Context** — система в контексте окружения (Пользователи + внешние системы)
- **Level 2: Container** — основные технические блоки (Frontend, Backend, Database, etc.)
- **Level 3: Component** — модули внутри каждого Container
- **Level 4: Code** — детализация ключевых компонентов (классы, интерфейсы)

**Документация проекта Typing Trainer** покрывает все 4 уровня, отражая текущую архитектуру (Phase 1 - Client-Side) и планируемую архитектуру (Phase 2 - Full-Stack).

---

## Level 1: System Context

### Описание

System Context показывает **Typing Trainer как черный ящик** в контексте внешнего окружения:
- Кто использует систему (Пользователи)
- С какими внешними системами взаимодействует

### Текущая архитектура (Phase 1)

```mermaid
C4Context
    title System Context - Typing Trainer (Phase 1)

    Person(user, "Пользователь", "Человек, изучающий слепую печать на русской раскладке")

    System(typingTrainer, "Typing Trainer", "SaaS клавиатурный тренажер для обучения слепой печати")

    System_Ext(browser, "Web Browser", "Chrome, Firefox, Safari, Edge - клиентский браузер")

    Rel(user, typingTrainer, "Проходит Уроки, получает статистику WPM/Accuracy", "HTTPS")
    Rel(typingTrainer, browser, "Работает внутри браузера", "JavaScript + LocalStorage")

    UpdateLayoutConfig($c4ShapeInRow="2", $c4BoundaryInRow="1")
```

### Планируемая архитектура (Phase 2)

```mermaid
C4Context
    title System Context - Typing Trainer (Phase 2)

    Person(user, "Пользователь", "Человек, изучающий слепую печать")
    Person(admin, "Администратор", "Управляет контентом и пользователями")

    System(typingTrainer, "Typing Trainer", "SaaS клавиатурный тренажер")

    System_Ext(paymentGateway, "Payment Gateway", "Stripe/YooKassa - обработка платежей")
    System_Ext(emailService, "Email Service", "SendGrid - уведомления пользователям")
    System_Ext(analyticsService, "Analytics", "Google Analytics / Yandex Metrica")
    System_Ext(aiService, "AI Service", "OpenAI API - анализ Weak Keys")

    Rel(user, typingTrainer, "Проходит Уроки, оплачивает подписку", "HTTPS")
    Rel(admin, typingTrainer, "Управляет системой", "HTTPS + Admin Panel")
    Rel(typingTrainer, paymentGateway, "Обрабатывает платежи", "REST API")
    Rel(typingTrainer, emailService, "Отправляет email", "SMTP/API")
    Rel(typingTrainer, analyticsService, "Отправляет события", "JavaScript SDK")
    Rel(typingTrainer, aiService, "Запрашивает AI анализ", "REST API")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="2")
```

### Основные actors

| Actor | Описание | Роль в системе |
|-------|----------|----------------|
| **Пользователь** | Человек, обучающийся слепой печати | Основной пользователь - проходит Уроки, получает статистику WPM/Accuracy |
| **Начинающий** | Пользователь с WPM < 30 | Проходит Блоки 1-2 (Pinky, Ring Finger) |
| **Продвинутый** | Пользователь с WPM > 60 | Проходит Блоки 4-6 (All fingers, Numbers, Advanced) |
| **Администратор** (Phase 2) | Управляет системой | Создает контент, управляет пользователями, мониторинг |

---

## Level 2: Container

### Описание

Container diagram показывает **основные технические блоки** системы и их взаимодействие.

**Важно:** Container ≠ Docker container. Здесь Container = отдельное приложение/процесс/хранилище.

### Phase 1: Client-Side Architecture (Текущая)

```mermaid
C4Container
    title Container Diagram - Typing Trainer (Phase 1 - Current)

    Person(user, "Пользователь", "Обучается слепой печати")

    Container_Boundary(client, "Client-Side Application") {
        Container(spa, "Single Page Application", "HTML + Vanilla JavaScript", "Интерактивный тренажер с виртуальной клавиатурой")
        ContainerDb(localStorage, "LocalStorage", "Browser Storage", "Сохраняет прогресс, настройки, историю тестов")
        Container(dataFiles, "JSON Data Files", "Static JSON", "Тексты для Уроков, цитаты")
    }

    System_Ext(browser, "Web Browser", "Chrome/Firefox/Safari/Edge")

    Rel(user, spa, "Проходит Уроки", "HTTPS")
    Rel(spa, localStorage, "Читает/записывает прогресс", "Web Storage API")
    Rel(spa, dataFiles, "Загружает тексты", "Fetch API")
    Rel(browser, spa, "Исполняет JavaScript", "Browser Engine")

    UpdateLayoutConfig($c4ShapeInRow="2", $c4BoundaryInRow="1")
```

### Phase 2: Full-Stack Architecture (Планируемая)

```mermaid
C4Container
    title Container Diagram - Typing Trainer (Phase 2 - Planned)

    Person(user, "Пользователь")

    Container_Boundary(frontend, "Frontend") {
        Container(webApp, "Web Application", "React/Vue + TypeScript", "SPA с виртуальной клавиатурой")
    }

    Container_Boundary(backend, "Backend") {
        Container(apiApp, "API Application", "FastAPI (Python)", "REST API для бизнес-логики")
        Container(aiService, "AI Analyzer", "Python + OpenAI", "Анализ Weak Keys пользователя")
        Container(authService, "Auth Service", "JWT + OAuth2", "Аутентификация и авторизация")
    }

    Container_Boundary(data, "Data Layer") {
        ContainerDb(mainDb, "Main Database", "PostgreSQL", "Пользователи, прогресс, уроки")
        ContainerDb(cache, "Cache", "Redis", "Сессии, временные данные")
        Container(fileStorage, "File Storage", "S3/MinIO", "Медиа файлы, экспорты")
    }

    System_Ext(payment, "Payment Gateway", "Stripe/YooKassa")
    System_Ext(email, "Email Service", "SendGrid")

    Rel(user, webApp, "Использует приложение", "HTTPS")
    Rel(webApp, apiApp, "Отправляет запросы", "REST/JSON")
    Rel(apiApp, mainDb, "Читает/записывает данные", "SQL")
    Rel(apiApp, cache, "Кеширует данные", "Redis Protocol")
    Rel(apiApp, authService, "Проверяет токены", "JWT")
    Rel(aiService, apiApp, "Предоставляет анализ", "Internal API")
    Rel(apiApp, payment, "Обрабатывает платежи", "REST API")
    Rel(apiApp, email, "Отправляет уведомления", "SMTP/API")
    Rel(apiApp, fileStorage, "Сохраняет файлы", "S3 API")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="3")
```

### Описание Containers (Phase 1)

| Container | Технология | Назначение | Данные |
|-----------|------------|------------|--------|
| **Single Page Application** | HTML + Vanilla JS | Основное приложение с UI | 6 модулей: main.js, keyboard.js, stats.js, utils.js, settings.js |
| **LocalStorage** | Browser Web Storage | Персистентность на клиенте | Прогресс Уроков, лучшие результаты, настройки |
| **JSON Data Files** | Static JSON | Контент для Training | `quotes.json`, `data/texts/ru.json` |

### Описание Containers (Phase 2 - Planned)

| Container | Технология | Назначение |
|-----------|------------|------------|
| **Web Application** | React/Vue + TS | Frontend SPA |
| **API Application** | FastAPI | REST API backend |
| **AI Analyzer** | Python + OpenAI | Weak Keys analysis |
| **Auth Service** | JWT + OAuth2 | Аутентификация |
| **Main Database** | PostgreSQL | Основное хранилище |
| **Cache** | Redis | Кеширование сессий |
| **File Storage** | S3/MinIO | Медиа и экспорты |

---

## Level 3: Component

### Описание

Component diagram показывает **модули внутри каждого Container**.

### Phase 1: SPA Components (Текущая архитектура)

```mermaid
C4Component
    title Component Diagram - Single Page Application (Phase 1)

    Container_Boundary(spa, "Single Page Application") {
        Component(typingTrainer, "TypingTrainer", "JavaScript Class", "Основная логика приложения")
        Component(keyboard, "VirtualKeyboard", "JavaScript Module", "Управление виртуальной клавиатурой")
        Component(stats, "StatsManager", "JavaScript Module", "Расчет и отображение статистики")
        Component(storage, "StorageUtils", "JavaScript Module", "Работа с LocalStorage")
        Component(settings, "Settings", "JavaScript Object", "Централизованная конфигурация")
        Component(utils, "UtilsLibrary", "JavaScript Modules", "Вспомогательные функции")
    }

    ContainerDb(localStorage, "LocalStorage", "Browser Storage")
    Container(dataFiles, "JSON Data", "Static Files")

    Rel(typingTrainer, keyboard, "Управляет подсветкой клавиш", "Function calls")
    Rel(typingTrainer, stats, "Передает статистику", "Function calls")
    Rel(typingTrainer, storage, "Сохраняет прогресс", "StorageUtils API")
    Rel(typingTrainer, settings, "Читает настройки", "Settings.get()")
    Rel(typingTrainer, utils, "Использует утилиты", "Function calls")
    Rel(stats, storage, "Сохраняет лучшие результаты", "StorageUtils API")
    Rel(storage, localStorage, "Читает/записывает", "Web Storage API")
    Rel(typingTrainer, dataFiles, "Загружает тексты", "Fetch API")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

### Детали компонентов (Phase 1)

#### 1. TypingTrainer (main.js)

**Назначение:** Центральный контроллер приложения

**Ключевые функции:**
- `startNewTest()` - начало нового Урока
- `handleInput(event)` - обработка ввода пользователя
- `calculateWPM()` - вычисление скорости печати
- `calculateAccuracy()` - вычисление точности
- `finishTest()` - завершение Урока
- `saveTestResult()` - сохранение результата

**State Management:**
```javascript
{
  currentText: string,      // Текущий Typing Text
  typedText: string,        // Уже напечатанный текст
  currentPosition: number,  // Позиция курсора
  isTestActive: boolean,    // Активен ли тест
  startTime: timestamp,     // Время начала
  errors: number,           // Количество ошибок
  currentLevel: string      // Difficulty Level
}
```

#### 2. VirtualKeyboard (keyboard.js)

**Назначение:** Управление виртуальной клавиатурой

**Ключевые функции:**
- `highlightKey(char)` - подсветка следующей клавиши (Key Highlight)
- `pressKey(key, code)` - визуализация нажатия
- `releaseKey(key)` - сброс подсветки
- `animateCorrectKey(key)` - анимация правильного ввода
- `animateIncorrectKey(key)` - Error Flash при ошибке

**Цвета пальцев:**
- Pink (#ff7675) - Pinky (мизинец)
- Orange (#fdcb6e) - Ring (безымянный)
- Green (#00b894) - Middle (средний)
- Cyan (#74b9ff) - Index Left (указательный левый)
- Blue (#0984e3) - Index Right (указательный правый)
- Purple (#a29bfe) - Thumb (большой)

#### 3. StatsManager (stats.js)

**Назначение:** Расчет и отображение Real-time Stats

**Метрики:**
- **WPM** = (totalCharacters / 5) / (timeInMinutes)
- **Accuracy** = ((totalChars - errors) / totalChars) * 100%
- **Error Rate** = (errors / totalChars) * 100%
- **Star Rating** = 1-5 звезд (на основе WPM + Accuracy)

**Ключевые функции:**
- `updateStats()` - обновление статистики каждые 100ms
- `calculateRating(wpm, accuracy)` - расчет Star Rating
- `loadBestStats()` - загрузка лучших результатов
- `saveBestStats()` - сохранение рекордов

#### 4. StorageUtils (utils.js)

**Назначение:** Абстракция над LocalStorage

**LocalStorage Keys:**
- `typing_trainer_best_stats` - лучшие результаты (WPM, Accuracy)
- `typing_trainer_user_settings` - настройки пользователя
- `typing_trainer_test_history` - история тестов (последние 100)
- `typing_trainer_current_level` - текущий Difficulty Level

**Ключевые функции:**
- `StorageUtils.set(key, data)` - сохранение с JSON.stringify
- `StorageUtils.get(key, defaultValue)` - чтение с JSON.parse
- `StorageUtils.remove(key)` - удаление
- `StorageUtils.clear()` - полная очистка

#### 5. Settings (config/settings.js)

**Назначение:** Центральная конфигурация через объект `APP_CONFIG`

**Структура:**
```javascript
APP_CONFIG = {
  difficultyLevels: {
    beginner: { targetWPM: 15, maxErrors: 10 },
    easy: { targetWPM: 25, maxErrors: 8 },
    medium: { targetWPM: 40, maxErrors: 6 },
    ...
  },
  rating: {
    stars: {
      5: { minWPM: 100, minAccuracy: 95 },
      4: { minWPM: 80, minAccuracy: 90 },
      ...
    }
  },
  keyboard: {
    fingerColors: { ... },
    animation: { ... }
  }
}
```

**API:**
- `Settings.get(path, defaultValue)` - получение значения по пути
- `Settings.getLevelColor(level)` - цвет уровня
- `Settings.getRatingCriteria()` - критерии Star Rating

#### 6. UtilsLibrary (utils.js)

**Модули:**
- `DOMUtils` - работа с DOM (`$()`, `$$()`, createElement)
- `TimeUtils` - форматирование времени (MM:SS)
- `TextUtils` - текстовые утилиты
- `DebugUtils` - логирование
- `NotificationUtils` - уведомления

---

### Phase 2: API Components (Планируемая архитектура)

```mermaid
C4Component
    title Component Diagram - API Application (Phase 2 - Planned)

    Container_Boundary(api, "API Application (FastAPI)") {
        Component(authController, "AuthController", "FastAPI Router", "Аутентификация: /auth/*")
        Component(userController, "UserController", "FastAPI Router", "Управление пользователями: /users/*")
        Component(lessonController, "LessonController", "FastAPI Router", "Уроки: /lessons/*")
        Component(progressController, "ProgressController", "FastAPI Router", "Прогресс: /progress/*")
        Component(subscriptionController, "SubscriptionController", "FastAPI Router", "Подписки: /subscription/*")
        Component(aiController, "AIController", "FastAPI Router", "AI анализ: /ai/*")

        Component(businessLogic, "Business Logic Layer", "Python Services", "Бизнес-логика")
        Component(dataAccess, "Data Access Layer", "SQLAlchemy ORM", "Доступ к БД")
        Component(validators, "Validators", "Pydantic Models", "Валидация данных")
    }

    ContainerDb(database, "PostgreSQL", "Database")
    ContainerDb(cache, "Redis", "Cache")
    System_Ext(aiService, "OpenAI API", "External")

    Rel(userController, businessLogic, "Вызывает сервисы", "Python")
    Rel(lessonController, businessLogic, "Вызывает сервисы", "Python")
    Rel(progressController, businessLogic, "Вызывает сервисы", "Python")
    Rel(aiController, aiService, "Запрашивает анализ", "REST API")
    Rel(businessLogic, dataAccess, "Читает/записывает", "ORM")
    Rel(dataAccess, database, "SQL запросы", "PostgreSQL Protocol")
    Rel(businessLogic, cache, "Кеширует", "Redis Protocol")
    Rel(authController, validators, "Валидирует данные", "Pydantic")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

### API Endpoints (Phase 2 - Planned)

| Endpoint | Method | Описание | Request | Response |
|----------|--------|----------|---------|----------|
| `/auth/register` | POST | Регистрация | `{email, password}` | `{user_id, token}` |
| `/auth/login` | POST | Вход | `{email, password}` | `{token, refresh_token}` |
| `/users/me` | GET | Профиль | - | `{user_data}` |
| `/users/{id}/progress` | GET | Прогресс | - | `{lessons_completed, wpm, accuracy}` |
| `/lessons` | GET | Список Уроков | `?block=1&difficulty=pinky` | `{lessons[]}` |
| `/lessons/{id}` | GET | Детали Урока | - | `{lesson_data}` |
| `/progress` | POST | Сохранить результат | `{lesson_id, wpm, accuracy, errors}` | `{success, rating}` |
| `/progress/stats` | GET | Общая статистика | - | `{total_wpm, avg_accuracy, weak_keys}` |
| `/ai/weak-keys-analysis` | POST | AI анализ Weak Keys | `{user_id, history}` | `{weak_keys[], recommendations[]}` |
| `/subscription/status` | GET | Статус подписки | - | `{tier, expires_at}` |
| `/subscription/upgrade` | POST | Апгрейд | `{tier}` | `{payment_url}` |

---

## Level 4: Code

### Описание

Code level показывает **детали реализации ключевых компонентов**: классы, интерфейсы, методы.

### TypingTrainer Class (main.js)

```mermaid
classDiagram
    class TypingTrainer {
        -state: Object
        -elements: Object
        -texts: Object
        -quotes: Array

        +constructor()
        +init()
        +startNewTest()
        +handleInput(event)
        +handleKeyDown(event)
        +handleKeyUp(event)
        +calculateWPM() number
        +calculateAccuracy() number
        +finishTest()
        +resetTest()
        +saveTestResult()
        +getStats() Object
    }

    class State {
        +currentText: string
        +typedText: string
        +currentPosition: number
        +isTestActive: boolean
        +startTime: timestamp
        +errors: number
        +totalChars: number
        +currentLevel: string
    }

    class Settings {
        +get(path, default) any
        +getAll() Object
        +getLevelColor(level) string
        +getRatingCriteria() Object
    }

    class StorageUtils {
        +set(key, data) boolean
        +get(key, default) any
        +remove(key) boolean
        +clear() boolean
    }

    TypingTrainer --> State : contains
    TypingTrainer --> Settings : uses
    TypingTrainer --> StorageUtils : uses
```

### VirtualKeyboard Module (keyboard.js)

```mermaid
classDiagram
    class VirtualKeyboard {
        <<module>>
        -currentHighlightedKey: Element
        -currentPressedKeys: Set
        +initKeyboard()
        +highlightKey(char)
        +pressKey(key, code)
        +releaseKey(key)
        +clearKeyHighlights()
        +animateCorrectKey(key)
        +animateIncorrectKey(key)
        +findKeyByChar(char) Element
    }

    class KeyMapping {
        <<constant>>
        +charToKey: Object
        +specialKeys: Object
    }

    VirtualKeyboard --> KeyMapping : uses
```

### StatsManager Module (stats.js)

```mermaid
classDiagram
    class StatsManager {
        <<module>>
        -statsUpdateInterval: IntervalID
        -bestStats: Object
        -statsElements: Object
        +initStats()
        +startStatsTracking()
        +stopStatsTracking()
        +updateStats()
        +updateStatsDisplay(stats)
        +calculateRating(stats) number
        +updateStarRating(rating)
        +loadBestStats()
        +saveBestStats()
        +resetStats()
    }

    class BestStats {
        +time: number
        +speed: number
        +minErrors: number
    }

    class RatingCriteria {
        +minWPM: number
        +minAccuracy: number
    }

    StatsManager --> BestStats : manages
    StatsManager --> RatingCriteria : uses
```

### Settings Configuration (config/settings.js)

```mermaid
classDiagram
    class APP_CONFIG {
        +name: string
        +version: string
        +api: ApiConfig
        +testing: TestingConfig
        +keyboard: KeyboardConfig
        +difficultyLevels: DifficultyConfig
        +rating: RatingConfig
        +storage: StorageConfig
        +ui: UIConfig
    }

    class DifficultyLevel {
        +name: string
        +description: string
        +targetWPM: number
        +maxErrors: number
        +color: string
    }

    class RatingConfig {
        +stars: Object
        +accuracyBonus: Object
    }

    class Settings {
        <<static>>
        +get(path, default) any
        +getAll() Object
        +getLevelColor(level) string
        +getRatingCriteria() Object
    }

    APP_CONFIG --> DifficultyLevel : contains 6
    APP_CONFIG --> RatingConfig : contains
    Settings --> APP_CONFIG : accesses
```

### Data Flow: User Types Character

```mermaid
sequenceDiagram
    participant User
    participant HiddenInput
    participant TypingTrainer
    participant VirtualKeyboard
    participant StatsManager
    participant StorageUtils

    User->>HiddenInput: Нажимает клавишу
    HiddenInput->>TypingTrainer: input event
    TypingTrainer->>TypingTrainer: handleInput(event)
    TypingTrainer->>TypingTrainer: Проверка символа

    alt Правильный символ
        TypingTrainer->>VirtualKeyboard: animateCorrectKey(char)
        VirtualKeyboard-->>User: Зеленая анимация
    else Неправильный символ
        TypingTrainer->>TypingTrainer: errors++
        TypingTrainer->>VirtualKeyboard: animateIncorrectKey(char)
        VirtualKeyboard-->>User: Красная вспышка (Error Flash)
    end

    TypingTrainer->>TypingTrainer: calculateWPM()
    TypingTrainer->>TypingTrainer: calculateAccuracy()
    TypingTrainer->>StatsManager: updateStats({wpm, accuracy, errors})
    StatsManager-->>User: Обновление Real-time Stats

    TypingTrainer->>VirtualKeyboard: highlightKey(nextChar)
    VirtualKeyboard-->>User: Подсветка следующей клавиши (Key Highlight)

    alt Конец текста
        TypingTrainer->>TypingTrainer: finishTest()
        TypingTrainer->>StatsManager: showFinalStats()
        TypingTrainer->>StorageUtils: saveTestResult()
        StorageUtils->>LocalStorage: Сохранение в LocalStorage
        StatsManager-->>User: Star Rating (1-5 звезд)
    end
```

---

## Архитектурные решения

### 1. Модульная архитектура (Module Pattern)

**Решение:** Каждый JavaScript файл - самостоятельный модуль с четкой ответственностью.

**Преимущества:**
- ✅ Разделение ответственности (Separation of Concerns)
- ✅ Легкое тестирование
- ✅ Переиспользование кода
- ✅ Понятная структура

**Модули:**
- `main.js` - TypingTrainer (ядро)
- `keyboard.js` - VirtualKeyboard
- `stats.js` - StatsManager
- `utils.js` - утилиты
- `settings.js` - конфигурация

### 2. Config-Driven Design

**Решение:** Вся конфигурация в `config/settings.js` через объект `APP_CONFIG`.

**Преимущества:**
- ✅ Централизованные настройки
- ✅ Легко менять параметры (targetWPM, colors, etc.)
- ✅ Не нужно искать магические числа в коде
- ✅ Простое A/B тестирование

**Использование:**
```javascript
const targetWPM = Settings.get('difficultyLevels.medium.targetWPM', 40);
const pink = Settings.get('keyboard.fingerColors.pinky', '#ff7675');
```

### 3. LocalStorage для персистентности (Phase 1)

**Решение:** Все данные хранятся в браузере через LocalStorage.

**Преимущества:**
- ✅ Нет Backend - простое развертывание
- ✅ Быстрая разработка MVP
- ✅ Работает оффлайн
- ✅ Бесплатно

**Недостатки (устранены в Phase 2):**
- ❌ Нет синхронизации между устройствами
- ❌ Данные теряются при очистке браузера
- ❌ Нет мультипользовательских возможностей

### 4. Event-Driven Architecture

**Решение:** Взаимодействие через события (keydown, input, etc.)

**Преимущества:**
- ✅ Слабая связанность (Loose Coupling)
- ✅ Легко добавлять новые обработчики
- ✅ Модули не зависят друг от друга напрямую

**События:**
- `input` - ввод символа
- `keydown`/`keyup` - нажатие/отпускание клавиши
- `blur`/`focus` - фокус окна

### 5. Real-time Stats Update

**Решение:** Обновление статистики каждые 100ms через `setInterval`.

**Преимущества:**
- ✅ Мгновенная обратная связь
- ✅ Мотивация пользователя
- ✅ Плавные анимации

**Реализация:**
```javascript
setInterval(() => {
  const stats = window.getStats();
  updateStatsDisplay(stats);
}, 100); // каждые 100ms
```

### 6. Color-Coded Virtual Keyboard

**Решение:** Каждая клавиша окрашена цветом соответствующего пальца.

**Преимущества:**
- ✅ Визуальное обучение
- ✅ Понятно какой палец использовать
- ✅ Соответствует физической клавиатуре

**Цвета:**
- Розовый (Pink) - мизинец
- Оранжевый (Orange) - безымянный
- Зеленый (Green) - средний
- Голубой (Cyan) - указательный левый
- Синий (Blue) - указательный правый
- Фиолетовый (Purple) - большой

### 7. Progressive Difficulty System

**Решение:** 6 уровней сложности (Difficulty Levels) от Pinky до Advanced.

**Преимущества:**
- ✅ Постепенное обучение
- ✅ Мотивация через progression
- ✅ Адаптация под уровень пользователя

**Уровни:**
1. Pinky (Мизинец) - targetWPM: 15
2. Ring (Безымянный) - targetWPM: 25
3. Middle (Средний) - targetWPM: 40
4. Index Left - targetWPM: 60
5. Index Right - targetWPM: 80
6. Advanced - targetWPM: 100

### 8. Star Rating System

**Решение:** Оценка от 1 до 5 звезд на основе WPM + Accuracy.

**Преимущества:**
- ✅ Геймификация
- ✅ Ясные цели для улучшения
- ✅ Мотивация повторить урок

**Критерии:**
- ⭐⭐⭐⭐⭐ 5 звезд: WPM ≥ 100, Accuracy ≥ 95%
- ⭐⭐⭐⭐ 4 звезды: WPM ≥ 80, Accuracy ≥ 90%
- ⭐⭐⭐ 3 звезды: WPM ≥ 60, Accuracy ≥ 85%
- ⭐⭐ 2 звезды: WPM ≥ 40, Accuracy ≥ 80%
- ⭐ 1 звезда: WPM ≥ 20, Accuracy ≥ 70%

---

## Migration Path (Phase 1 → Phase 2)

### Стратегия миграции

**Цель:** Постепенный переход от Client-Side к Full-Stack без потери данных пользователей.

### Этапы миграции

#### Этап 1: Backend Development (Параллельно с Phase 1)

**Задачи:**
- Разработка Backend Architecture (Борис)
- Создание PostgreSQL schema
- Разработка REST API (FastAPI)
- Настройка Authentication (JWT)

**Статус:** 🔵 In Progress (Борис работает над Backend Architecture document)

#### Этап 2: Data Migration Strategy

**Проблема:** Пользователи Phase 1 имеют данные в LocalStorage. Нужно перенести их в PostgreSQL.

**Решение:**

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant MigrationAPI
    participant Backend
    participant PostgreSQL

    User->>Frontend: Открывает приложение (Phase 2)
    Frontend->>Frontend: Проверяет LocalStorage

    alt Есть данные в LocalStorage
        Frontend->>User: "Хотите сохранить свой прогресс?"
        User->>Frontend: "Да" (регистрация)
        Frontend->>MigrationAPI: POST /migrate/local-data
        Note over MigrationAPI: {localStorage_dump}
        MigrationAPI->>Backend: Парсит данные
        Backend->>PostgreSQL: Сохраняет в UserProgress table
        PostgreSQL-->>Backend: user_id
        Backend->>MigrationAPI: {migration_success, user_id}
        MigrationAPI->>Frontend: {token, migrated_lessons}
        Frontend->>LocalStorage: Помечает как migrated
        Frontend-->>User: "Прогресс сохранен!"
    else Нет данных
        Frontend->>User: "Начните обучение с нуля"
    end
```

**LocalStorage → PostgreSQL mapping:**

| LocalStorage Key | PostgreSQL Table | Mapping |
|------------------|------------------|---------|
| `typing_trainer_best_stats` | `UserProgress.best_wpm`, `best_accuracy` | Direct |
| `typing_trainer_test_history` | `TestHistory` table | Array → Rows |
| `typing_trainer_user_settings` | `UserSettings` table | JSON → Columns |
| `typing_trainer_current_level` | `Users.current_difficulty_level` | Direct |

#### Этап 3: Hybrid Mode (Transition Period)

**Идея:** Приложение работает в двух режимах:
- **Authenticated Mode** - с Backend (Phase 2)
- **Guest Mode** - только LocalStorage (Phase 1)

**Преимущества:**
- ✅ Плавный переход
- ✅ Пользователи могут попробовать без регистрации
- ✅ Gradual rollout

**Реализация:**
```javascript
class DataAdapter {
  constructor() {
    this.mode = this.detectMode(); // 'authenticated' | 'guest'
  }

  async saveProgress(data) {
    if (this.mode === 'authenticated') {
      return await API.post('/progress', data);
    } else {
      return StorageUtils.set('progress', data);
    }
  }

  async loadProgress() {
    if (this.mode === 'authenticated') {
      return await API.get('/progress');
    } else {
      return StorageUtils.get('progress');
    }
  }
}
```

#### Этап 4: Full Migration to Phase 2

**Когда:** Через 3-6 месяцев после запуска Phase 2

**Действия:**
- Отключение Guest Mode
- Все пользователи должны зарегистрироваться
- LocalStorage используется только для кеширования

---

## Связанные документы

### Процессы:
- [Specification Workflow](../processes/Specification_Workflow.md) - процесс создания спецификаций
- [Documentation Audit Guide](../processes/Documentation_Audit_Guide.md) - аудит документации

### Стандарты:
- [Terminology System](../domain/typing-terminology.md) - **ОБЯЗАТЕЛЬНО** использовать термины отсюда
- [Accessibility Compliance](../specs/006_Accessibility_Compliance_Specification.md) - WCAG 2.1 Level AA

### Архитектура:
- [Backend Architecture](./Backend_Architecture.md) - детальная архитектура Backend (Борис создает)

### Спецификации:
- [Spec 001: AI Weak Keys Analyzer](../specs/001_AI_Weak_Keys_Analyzer.md) - AI анализ Weak Keys
- [Spec 002-005](../specs/) - другие функциональные спецификации

### Планирование:
- [ROADMAP](../planning/ROADMAP.md) - план развития проекта (Тимофей создаст)

### User Documentation:
- [Quick Start Guide](../user/Quick_Start_Guide.md) - быстрый старт для новых пользователей (Тимофей создаст)
- [FAQ](../user/FAQ.md) - часто задаваемые вопросы (Тимофей создаст)
- [User Guide](../user/User_Guide.md) - полное руководство пользователя (Тимофей создаст)

---

## Changelog

| Дата | Версия | Изменения | Автор |
|------|--------|-----------|-------|
| 2025-11-16 | 1.0 | Initial creation - все 4 уровня C4 diagrams | Тимофей |

---

## Метаданные

**Статус:** ✅ Готово к review
**Reviewer:** Клод (Architect)
**Next Steps:**
1. Review от Клода
2. Согласование с Борисом (Backend Architecture alignment)
3. Merge в master branch

**Maintained by:** Тимофей (Technical Writer)
**Last Updated:** 16 ноября 2025
**Version:** 1.0
