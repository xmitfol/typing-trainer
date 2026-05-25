# 🚀 Quick Start: Разработка для Valera

**Версия:** 1.0 | **Последнее обновление:** 27.10.2025
> **Технологии проекта:** [Технологический стек](../TECHNOLOGY_STACK.md)

---

## 📋 Требования

### **Системные требования**
- Ruby 3.4.2+
- PostgreSQL 13+
- Rails 8.1+
- Git

### **Необходимые аккаунты**
- Telegram Bot API токен
- Доступ к AI провайдерам (OpenAI/Anthropic/etc)

---

## ⚡ Быстрый старт (5 минут)

```bash
# 1. Клонирование и настройка
git clone <repository-url>
cd valera

# 2. Установка зависимостей
bundle install
rails db:create db:migrate

# 3. Создание тестовых данных
rails db:seed

# 4. Запуск сервера
rails server

# 5. Проверка работы
curl http://localhost:3000/api/v1/health
```

---

## 🔧 Детальная настройка

### **1. Клонирование проекта**
```bash
git clone <repository-url>
cd valera
```

### **2. Установка Ruby зависимостей**
```bash
# Установка gem'ов
bundle install

# Проверка версии
ruby -v  # должно быть 3.4.2+
rails -v # должно быть 8.1+
```

### **3. Настройка базы данных**
```bash
# Создание БД
rails db:create

# Миграции
rails db:migrate

# Заполнение начальными данными
rails db:seed
```

### **4. Конфигурация**

**Важно:** Проект НЕ использует `.env*` файлы. Конфигурация управляется через:

- **config/application.yml** - Основная конфигурация
- **config/database.yml** - Настройки БД
- **Environment variables** - Для_sensitive данных

**Пример конфигурации:**
```yaml
# config/application.yml
telegram:
  bot_token: "YOUR_BOT_TOKEN"

ai:
  provider: "openai"
  api_key: "YOUR_API_KEY"

analytics:
  enabled: true
```

### **5. Запуск тестов**
```bash
# Запуск всех тестов
bundle exec rspec

# Запуск конкретных тестов
bundle exec rspec spec/models/

# Покрытие тестами
bundle exec rspec --coverage
```

---

## 🛠️ Среда разработки

### **Рекомендуемые инструменты**
- **VS Code** с расширением Ruby/Rails
- **RubyMine** (опционально)
- **Postico** или **pgAdmin** для работы с PostgreSQL
- **Postman** или **Insomnia** для тестирования API

### **Настройка VS Code**
Рекомендуемые расширения:
- Ruby
- Rails
- Ruby LSP
- PostgreSQL

### **Проверка окружения**
```bash
# Проверка готовности к разработке
rails runner "
puts 'Ruby: ' + RUBY_VERSION
puts 'Rails: ' + Rails.version
puts 'Database: ' + ActiveRecord::Base.connection.adapter_name
puts 'Ready for development! ✅'
"
```

---

## 🧪 Тестирование

### **Запуск тестов**
```bash
# Все тесты
bundle exec rspec

# Быстрая проверка
bundle exec rspec --tag ~slow

# Конкретные файлы
bundle exec rspec spec/models/chat_spec.rb
```

### **Правила тестирования**
- ✅ Использовать Factory Bot для данных
- ❌ НЕ использовать `File.write`, `File.delete`
- ❌ НЕ изменять ENV переменные
- ❌ НЕ мокировать логирование

### **Статический анализ**
```bash
# Стиль кода
bundle exec rubocop

# Безопасность
bundle exec brakeman

# Покрытие кода
bundle exec rspec --simplecov
```

---

## 📊 Аналитика и отладка

### **Локальная аналитика**
```bash
# Включение аналитики для разработки
ANALYTICS_ENABLED=true rails server

# Проверка событий аналитики
rails runner "puts AnalyticsEvent.count.to_s"
```

### **Логирование**
```bash
# Просмотр логов
tail -f log/development.log

# Структурированные ошибки
grep "ERROR" log/development.log
```

---

## 🔄 Типичный workflow разработки

### **1. Создание новой функциональности**
```bash
# 1. Создать feature branch
git checkout -b feature/new-chat-functionality

# 2. Создать модель (если нужно)
rails generate model NewModel name:string

# 3. Написать тесты
touch spec/models/new_model_spec.rb

# 4. Реализовать функциональность
# ... код ...

# 5. Запустить тесты
bundle exec rspec

# 6. Проверить стиль кода
bundle exec rubocop

# 7. Коммит
git add .
git commit -m "Add new chat functionality"
```

### **2. Работа с AI интеграцией**
```bash
# Тестирование AI запросов
rails runner "
include LlmHelper
response = ask_ai('Hello, Valera!')
puts response
"
```

### **3. Тестирование Telegram интеграции**
```bash
# Запуск вебхука локально
ngrok http 3000

# Настройка webhook URL
rails runner "
Telegram.bot.set_webhook(url: 'https://your-ngrok-url.ngrok.io/telegram/webhook')
"
```

---

## 🐛 Частые проблемы

### **Проблема:** Ошибка подключения к БД
```bash
# Решение: Проверить конфигурацию
rails db:migrate:status
```

### **Проблема:** Тесты падают с ошибкой File.write
**Решение:** Использовать temporary файлs через Rails.root.join("tmp")

### **Проблема:** Не работает Telegram webhook
**Решение:** Использовать ngrok для локального тестирования

---

## 📚 Полезные ссылки

- **[Технологический стек](../TECHNOLOGY_STACK.md)** - Подробности о технологиях
- **[Руководство разработчика](README.md)** - Полное руководство
- **[Product Constitution](../product/constitution.md)** - Требования к продукту
- **[Паттерны ErrorLogger](../patterns/error-handling.md)** - Обработка ошибок

---

## 🤝 Получение помощи

1. **Проверить логи:** `log/development.log`
2. **Запустить тесты:** `bundle exec rspec`
3. **Проверить конфигурацию:** `config/application.yml`
4. **Прочитать документацию:** [docs/](../README.md)

---

**Готово к разработке!** 🚀

**Поддерживается:** Development Team | **Актуальность:** 27.10.2025