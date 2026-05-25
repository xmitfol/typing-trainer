# Changelog

Все значимые изменения в проекте Typing Trainer документируются в этом файле.

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.0.0/),
версионирование следует [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased] - MVP Phase 1

### Added
- 🎨 Виртуальная клавиатура с цветовой кодировкой пальцев
- 📝 **39 уроков базового курса** (Tier 1-3) - **ЗАВЕРШЕНО 2025-12-02**
  - Tier 1 (уроки 1-10): Базовый алфавит (19 букв, WPM 10→22)
  - Tier 2 (уроки 11-30): Полный алфавит + цифры + пунктуация (WPM 24→40)
  - Tier 3 (уроки 31-39): Профессиональный уровень + программирование (WPM 42→50)
  - 13 ритм-уроков для закрепления навыков
  - Все 33 русские буквы, цифры 0-9, все спецсимволы
  - 4 персонажа с уникальными советами (Анна, Максим, Кнопыч, Клавочка)
  - Методология из книги "Соло на пишущей машинке" (1992)
- 📊 Система статистики (WPM, точность, количество ошибок)
- ⭐ Рейтинговая система (1-5 звезд)
- 💾 LocalStorage для сохранения лучших результатов
- 🤖 AI Weak Keys Analyzer (в разработке)
- 📚 Документация проекта (архитектура, планирование, требования)
- 👥 Команда из 11 AI-агентов
- 📋 MVP Product Requirements Document (PRD)
- 🎯 Мастер-план системы курсов (99 уроков для взрослых)
- 📖 Детальный план реализации (24 спринта)

### Changed
- 🎨 Улучшена структура кода (модульная архитектура)
- 📐 Обновлена конфигурация приложения (APP_CONFIG)
- 📝 Переработана система уровней сложности

### In Progress
- 🤖 **Ася (AI/ML):** AI Weak Keys Analyzer (12h)
- 🎨 **Алекс (Frontend):** Интеграция 39 уроков в приложение (16h)
- 🧪 **Квинн (QA):** Testing всех 39 уроков (20h)
- 🚀 **Дима (DevOps):** Netlify deployment setup (8h)
- 🛡️ **Сергей (Security):** Pre-launch security audit (8h)
- 📣 **Марина (Marketing):** Domain research (4h)
- 📚 **Тимофей (Technical Writer):** Documentation overhaul (28h)

### Completed
- ✅ **Катя (Content):** 39 уроков базового курса - ЗАВЕРШЕНО 2025-12-02

---

## [0.1.0] - 2025-11-14 - Team & Planning

### Added
- 👥 Создана команда из 11 специализированных AI-агентов:
  - 🎨 Алекс (Frontend Developer)
  - ⚙️ Борис (Backend Developer)
  - 🤖 Ася (AI/ML Specialist)
  - 📝 Катя (Content Creator)
  - 🎯 Полина (Product Manager)
  - 📣 Марина (Marketing Specialist)
  - 🔍 Юля (UX Researcher)
  - 🧪 Квинн (QA Engineer)
  - 🚀 Дима (DevOps Engineer)
  - 🛡️ Сергей (Security Engineer)
  - 📚 Тимофей (Technical Writer)

- 📋 **MVP Product Requirements Document** создан:
  - Target audience: Офисные работники + Программисты
  - MVP Scope: 30 уроков (Блоки 1-2)
  - Freemium модель: 15 free / 84 premium
  - AI Level 1 (Weak Keys Analyzer only)
  - Desktop only в MVP
  - Launch: ASAP (конец ноября 2025)

- 💰 **Pricing Strategy** утвержден:
  - Early Bird (100 users): 299₽/мес, 2990₽/год (lifetime lock)
  - Regular: 399₽/мес, 3990₽/год
  - NO Lifetime tier (только recurring подписки)

- 📚 **Documentation Structure** создана:
  - `docs/planning/` - планы и roadmap
  - `docs/architecture/` - архитектурные решения
  - `docs/requirements/` - требования и спецификации
  - `docs/Learning/` - методология спецификаций
  - `.claude/agents/` - профили всех 11 агентов
  - `.claude/SESSION_CONTEXT.md` - контекст сессии

- 🎯 **Мастер-план курсов** (99 уроков):
  - 7 блоков для взрослых
  - MVP: Блоки 1-2 (30 уроков)
  - Post-launch: +1 блок каждые 2-3 недели
  - Детский курс: 50 уроков (Phase 3)

- 📈 **Success Metrics** (Month 1):
  - 100 DAU
  - 50% completion rate первого урока
  - >4.0 user satisfaction
  - <5 critical bugs
  - D7 retention >30%

### Changed
- 🎯 Product vision: **Quality over Quantity**
- 🚀 Launch strategy: Build & Learn (ASAP launch + iterative improvement)
- 🌍 Geography: Russia first, expansion позже

### Decisions Made
- ✅ NO Lifetime subscription tier
- ✅ Desktop ONLY в MVP (no mobile/tablet)
- ✅ Simplified AI в MVP (only Weak Keys Analyzer)
- ✅ Freemium from Day 1
- ✅ Recurring subscriptions only
- ✅ Russian market first
- ✅ 99 lessons total (30 in MVP)
- ✅ Recommended domain: typingtrainer.com
- ✅ Hosting: Netlify (рекомендация)
- ✅ Analytics: Google Analytics + Yandex.Metrica

---

## [0.0.1] - 2025-11-03 - Initial Commit

### Added
- 🎨 Базовая HTML структура приложения
- 💻 Vanilla JavaScript реализация
- 🎹 Виртуальная клавиатура (HTML/CSS)
- 📊 Система статистики
- 💾 LocalStorage для персистентности
- 📝 Первые 5 уроков
- 🎨 CSS стили (main.css, keyboard.css, components.css)
- ⚙️ Конфигурация приложения (config/settings.js)
- 📚 Начальная документация

### Technical Details
- **Frontend:** Vanilla JavaScript (ES6+)
- **No build system:** Простые HTML/CSS/JS файлы
- **Storage:** Browser LocalStorage
- **Layout:** Russian QWERTY keyboard
- **Responsive:** Desktop-focused design

---

## Типы изменений

В этом changelog используются следующие типы изменений:

- **Added** - новые функции и возможности
- **Changed** - изменения в существующей функциональности
- **Deprecated** - функции, которые скоро будут удалены
- **Removed** - удаленные функции
- **Fixed** - исправления багов
- **Security** - исправления уязвимостей
- **In Progress** - текущая работа (для Unreleased секции)
- **Decisions Made** - ключевые продуктовые решения

---

## Roadmap (ближайшие релизы)

### [0.2.0] - MVP Launch (Конец ноября 2025)
- ✅ 30 уроков (Блоки 1-2)
- ✅ AI Weak Keys Analyzer
- ✅ Freemium модель (15 free / 84 premium)
- ✅ Payment integration (Stripe + ЮКасса)
- ✅ Production deployment (Netlify)
- ✅ Analytics (GA + Yandex.Metrica)
- ✅ Security audit passed

### [0.3.0] - Content Expansion (Декабрь 2025 - Январь 2026)
- ➕ Блок 3 (уроки 31-45)
- ➕ Блок 4 (уроки 46-60)
- ➕ Additional motivational quotes (200+)
- ➕ User feedback integration

### [0.4.0] - Backend Integration (Phase 2)
- 🔐 User authentication (JWT)
- ☁️ Cloud sync (progress across devices)
- 📊 Advanced analytics
- 🤖 AI Level 2 (ML models)
- 📱 Mobile responsive (Phase 2+)

### [1.0.0] - Full Release
- 📚 99 уроков для взрослых
- 🤖 AI Level 3 (LLM персонализация)
- 👶 Детский курс (50 уроков)
- 🌍 Multi-language support (English)
- 📱 Mobile apps (iOS/Android)

---

**Maintained by:** Тимофей (Technical Writer)
**Last Updated:** 15 ноября 2025
**Format:** Keep a Changelog 1.0.0
