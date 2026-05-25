# Typing Trainer - AI-Powered Клавиатурный Тренажер

> Умный клавиатурный тренажер с AI-персонализацией для обучения слепой печати

[![Status](https://img.shields.io/badge/status-MVP-orange)](https://github.com/typing-trainer)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Desktop-green)](https://github.com/typing-trainer)

---

## 🎯 О проекте

**Typing Trainer** - это современный SaaS-сервис для обучения слепой печати на русской клавиатуре. Наше главное конкурентное преимущество - **AI-powered персонализация** обучения на основе анализа слабых клавиш и прогресса пользователя.

### Для кого:
- 👔 **Офисные работники** - повышение продуктивности работы
- 💻 **Программисты** - ускорение написания кода
- 🎓 **Студенты** - эффективное освоение навыка слепой печати

### Ключевые особенности:
- 🤖 **AI-анализ слабых клавиш** - умная система рекомендаций
- 🎨 **Виртуальная клавиатура** с цветовой кодировкой пальцев
- 📊 **Детальная статистика** - WPM, точность, прогресс
- 🎯 **99 уроков** для взрослых (30 в MVP)
- 🌟 **Система рейтингов** - мотивация через звезды
- 💎 **Freemium модель** - 15 бесплатных уроков, 84 premium

---

## 🚀 Быстрый старт

### Локальная разработка:

```bash
# 1. Клонировать репозиторий
git clone https://github.com/your-username/typing-trainer.git
cd typing-trainer

# 2. Запустить локальный сервер (любой из вариантов):

# Python
python -m http.server 8000

# PHP
php -S localhost:8000

# Node.js
npx http-server -p 8000

# 3. Открыть в браузере
# http://localhost:8000
```

### Требования:
- Современный браузер (Chrome, Firefox, Safari, Edge)
- Разрешение экрана: минимум 1024x768
- **Desktop only** (мобильные устройства не поддерживаются в MVP)

---

## 📦 Структура проекта

```
typing-trainer/
├── index.html              # Главная страница приложения
├── assets/
│   ├── css/               # Стили
│   │   ├── main.css       # Основные стили
│   │   ├── keyboard.css   # Стили виртуальной клавиатуры
│   │   └── components.css # UI компоненты
│   └── js/                # JavaScript модули
│       ├── main.js        # Основная логика приложения
│       ├── keyboard.js    # Управление клавиатурой
│       ├── stats.js       # Статистика и расчеты
│       └── utils.js       # Утилиты и LocalStorage
├── config/
│   └── settings.js        # Конфигурация приложения
├── data/
│   ├── texts/            # Тексты для уроков
│   │   └── ru.json       # Русские тексты
│   └── quotes.json       # Мотивационные цитаты
└── docs/                 # Документация
    ├── INDEX.md          # Индекс документации
    ├── architecture/     # Архитектурные решения
    ├── planning/         # Планы и roadmap
    └── requirements/     # Требования и спецификации
```

---

## 📚 Документация

### Для пользователей:
- [Быстрый старт](docs/user/getting-started/quick-start.md) *(скоро)*
- [Руководство пользователя](docs/user/guides/complete-guide.md) *(скоро)*
- [FAQ](docs/user/faq.md) *(скоро)*

### Для разработчиков:
- [Архитектура системы](docs/architecture/Архитектура%20системы.md)
- [Frontend Architecture](docs/architecture/Frontend%20Architecture.md)
- [AI/ML Architecture](docs/architecture/AIML%20Architecture.md)
- [Техническое задание](docs/requirements/Техническое%20задание%20SaaS%20Клавиатурный%20Тренажер.md)

### Планирование:
- [MVP PRD](docs/planning/MVP_PRD.md) - Product Requirements Document
- [Детальный план реализации](docs/planning/Детальный%20план%20реализации.md) - 24 спринта
- [Мастер-план курсов](docs/planning/Мастер-план%20системы%20курсов.md) - 99 уроков

### Команда:
- [Знакомство с командой](docs/TEAM_INTRODUCTION.md) - 11 AI-агентов
- [Agent Team](docs/AGENT_TEAM.md) - Структура команды

**Полный индекс:** [docs/INDEX.md](docs/INDEX.md)

---

## 🛠️ Технологии

### Phase 1 (MVP - текущая фаза):
- **Frontend:** Vanilla JavaScript (ES6+), HTML5, CSS3
- **Storage:** LocalStorage (браузер)
- **Build:** Нет build-системы (простые файлы)
- **Deployment:** Netlify / Vercel (рекомендация)

### Phase 2 (Backend Integration - планируется):
- **Frontend:** React + TypeScript
- **Backend:** Python FastAPI
- **Database:** PostgreSQL + Redis
- **Auth:** JWT tokens
- **Payments:** Stripe + ЮКасса

### Phase 3 (Expansion - будущее):
- **AI/ML:** TensorFlow.js, scikit-learn
- **LLM:** OpenAI API / Yandex GPT
- **Analytics:** Google Analytics, Yandex.Metrica
- **Monitoring:** Sentry, LogRocket

---

## 👥 Команда

Над проектом работает команда из **11 специализированных AI-агентов**:

### Core Team:
- 🎨 **Алекс** - Frontend Developer
- ⚙️ **Борис** - Backend Developer (Phase 2)
- 🤖 **Ася** - AI/ML Specialist
- 📝 **Катя** - Content Creator

### Business Team:
- 🎯 **Полина** - Product Manager
- 📣 **Марина** - Marketing Specialist
- 🔍 **Юля** - UX Researcher

### Support Team:
- 🧪 **Квинн** - QA Engineer
- 🚀 **Дима** - DevOps Engineer
- 🛡️ **Сергей** - Security Engineer
- 📚 **Тимофей** - Technical Writer

**Подробнее:** [docs/TEAM_INTRODUCTION.md](docs/TEAM_INTRODUCTION.md)

---

## 📈 Статус проекта

### Текущая фаза: **MVP (Phase 1)**

**Готово:**
- ✅ Виртуальная клавиатура с цветовой кодировкой
- ✅ Уроки 1-5 (базовые)
- ✅ Система статистики (WPM, точность)
- ✅ Рейтинговая система (звезды)
- ✅ LocalStorage для сохранения прогресса

**В работе:**
- 🔄 AI Weak Keys Analyzer (Ася - 12h)
- 🔄 Уроки 6-30 (Катя - 32h)
- 🔄 UI polish (Алекс - 12h)
- 🔄 Security audit (Сергей - 8h)
- 🔄 Deployment setup (Дима - 8h)

**Планируется:**
- 📋 Freemium модель (15 free / 84 premium)
- 📋 Payment integration (Stripe + ЮКасса)
- 📋 Backend API (Phase 2)
- 📋 Cloud sync (Phase 2)
- 📋 Детский курс (50 уроков, Phase 3)

**Target Launch:** Конец ноября 2025

---

## 💰 Монетизация

### Freemium Model:
- 🎁 **FREE:** 15 уроков (Блок 1)
- 💎 **PREMIUM:** 84 урока (Блоки 2-7)

### Pricing (Early Bird - первые 100 users):
- **299₽/месяц** (lifetime lock)
- **2990₽/год** (lifetime lock)

### Regular Pricing:
- **399₽/месяц**
- **3990₽/год**

**Важно:** Только recurring подписки, NO lifetime tier

---

## 🎯 Success Metrics (Month 1)

- **DAU:** 100 активных пользователей
- **Completion Rate:** 50% завершают первый урок
- **User Satisfaction:** >4.0/5.0
- **Critical Bugs:** <5
- **D7 Retention:** >30%

---

## 🤝 Contributing

Проект находится в активной разработке. Contributing guidelines будут добавлены в Phase 2.

---

## 📄 Лицензия

MIT License - детали в файле [LICENSE](LICENSE)

---

## 📞 Контакты

- **Product Owner:** Иван
- **Architecture:** Claude (AI Architect)
- **Website:** *(coming soon)*
- **Email:** *(coming soon)*

---

## 🙏 Благодарности

Спасибо всем участникам проекта за вклад в создание современного клавиатурного тренажера!

---

**Сделано с ❤️ командой Typing Trainer**

*Last Updated: 15 ноября 2025*
