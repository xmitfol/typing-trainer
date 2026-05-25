# Development Guide

**Дата создания:** 26.10.2025
**Версия:** 1.0
**Целевая аудитория:** Разработчики проекта Valera
**Тип документа:** HOW (Практическое руководство)

> **Важно:** Это руководство для разработчиков ПРОЕКТА Valera.
> О продукте (AI-боте) см. [docs/product/](docs/product/)

---

## 🚀 Быстрый старт для разработчиков

### Установка окружения

```bash
# Клонирование
git clone <repo-url>
cd valera

# Зависимости
bundle install

# База данных
bin/rails db:create db:migrate

# Запуск
bin/dev
```

### Первые шаги

1. [../CLAUDE.md](../CLAUDE.md) - инструкции и архитектура
2. [Product Constitution](../product/constitution.md) - требования к продукту
3. [FLOW.md](../FLOW.md) - процесс разработки
4. [Глоссарий](../domain/glossary.md) - терминология проекта

---

## 🛠️ Инструменты разработчика

### Документация gems

**Структура:**
- `docs/gems/telegram-bot/` - Telegram интеграция
- `docs/gems/ruby_llm/` - AI/LLM интеграция
- Каждый gem: README, API reference, patterns, examples

### Development команды

```bash
# Разработка
bin/dev                    # Dev сервер
bin/rails console          # Console
bin/rails test             # Тесты
bin/rubocop               # Code style
bin/rubocop -a            # Auto-fix
bin/brakeman              # Security
bin/ci                    # Все проверки

# База данных
bin/rails db:migrate      # Миграции
bin/rails db:rollback     # Откат
bin/rails db:reset        # Пересоздать

# Telegram Bot
bin/rails telegram:bot:poller  # Polling режим (dev)
```

### Интеграция с Claude AI

**Автоматическое обучение:**
- Telegram задачи → изучает telegram-bot docs
- LLM задачи → изучает ruby_llm docs
- Features → изучает requirements/, FLOW.md

**Ручной запуск:**
```bash
ruby .claude/pre-work-hook.rb "your task description"
```

**См. подробнее:**
- [.claude/README.md](.claude/README.md)
- [.claude/telegram-bot-learning.md](.claude/telegram-bot-learning.md)
- [.claude/ruby_llm-learning.md](.claude/ruby_llm-learning.md)

---

## 📋 Процесс разработки

Подробный процесс разработки: **[../FLOW.md](../FLOW.md)**

### Краткий workflow:
1. User Story + Technical Design (согласно шаблонов)
2. Реализация (следовать Product Constitution)
3. Code Review (`bin/ci`)

**См. подробнее:** [../FLOW.md](../FLOW.md)

---

## 🧪 Testing

### Запуск тестов

```bash
# Все
bin/rails test

# Файл
bin/rails test test/models/chat_test.rb

# Конкретный тест
bin/rails test test/models/chat_test.rb:12
```

### Критические правила разработки

🚨 **КРИТИЧЕСКИ ВАЖНО:**
- **Models:** ВСЕГДА используй `rails generate model` для создания моделей и миграций одновременно
- **Error Handling:** Используй `ErrorLogger` вместо `Bugsnag.notify()`
- **Configuration:** Не использовать `.env*` файлы, только `anyway_config`
- **Testing:** В тестах не использовать File.write/File.delete и не изменять ENV
- **Documentation:** Документация создается для AI-агентов в первую очередь
- **AI Architecture:** User Stories разделяются по уровням system prompt, не по бизнес-функциям

**Подробнее об ErrorLogger:** [docs/patterns/error-handling.md](../patterns/error-handling.md)

### Правила тестирования

⚠️ **ВАЖНО:**
- ❌ НЕ использовать `File.write`, `File.delete`
- ❌ НЕ изменять ENV переменные
- ❌ Логирование НЕ мокается и НЕ проверяется

**Подробнее:** [../../CLAUDE.md](../../CLAUDE.md#testing)

---

## 🤖 AI Development с Claude

### Workflow с Claude Code

1. Задать задачу Claude
2. Claude изучает документацию (авто)
3. Claude создает план → `.protocols/`
4. Реализация с паттернами
5. Code review и тесты

**Оптимизация:**
- Автообучение при Telegram/LLM работе
- Готовые паттерны в `docs/gems/`
- Примеры кода для быстрого старта

---

## 📚 Полезные ссылки

- [../CLAUDE.md](../CLAUDE.md) - Инструкции
- [Product Constitution](../product/constitution.md) - Требования к продукту
- [FLOW.md](../FLOW.md) - Процесс
- [ROADMAP.md](../ROADMAP.md) - План
- [Глоссарий](../domain/glossary.md) - Терминология
- [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) - Навигация

---

## 🔧 Troubleshooting

**Зависимости:**
```bash
bundle install
bin/rails db:reset
```

**Тесты:**
```bash
RAILS_ENV=test bin/rails db:reset
bin/rails test
```

**Telegram Bot:**
- Проверить `config/configs/application_config.rb`

---

**Версия:** 1.0
**Дата создания:** 26.10.2025
**Последнее обновление:** 26.10.2025
**Ответственный:** Development Team
