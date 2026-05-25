# 🛡️ Паттерны обработки ошибок в Valera

**Версия:** 1.0 | **Последнее обновление:** 27.10.2025
> **Руководство разработчика:** [Development Guide](../development/README.md)

---

## 📋 Обзор

В проекте Valera используется централизованная система обработки ошибок через `ErrorLogger` модуль. Это обеспечивает единый подход к логированию, мониторингу и отладке ошибок.

---

## 🚨 Critical Rule: ВСЕГДА используйте ErrorLogger

**🚨 КРИТИЧЕСКИ ВАЖНО:** ВСЕГДА используй `log_error(e, context)` вместо `Bugsnag.notify(e)`!

### **Правильное использование:**
```ruby
include ErrorLogger

rescue => e
  log_error(e, { user_id: user.id, action: "process_booking" })
end
```

### **НЕПРАВИЛЬНОЕ использование:**
```ruby
# ❌ НЕ ДЕЛАТЬ ТАК
rescue => e
  Bugsnag.notify(e)  # Запрещено!
  Rails.logger.error(e.message)  # Недостаточно контекста
end
```

---

## 🔧 Базовый паттерн обработки ошибок

### **Стандартный rescue блок**
```ruby
class BookingService
  include ErrorLogger

  def create_booking(params)
    Booking.create!(params)
  rescue => e
    log_error(e, {
      service: 'BookingService',
      action: 'create_booking',
      params: params.except(:sensitive_data)
    })
    nil
  end
end
```

### **С контекстом пользователя**
```ruby
class ChatService
  include ErrorLogger

  def process_message(message, user)
    response = ai_client.chat(message)
    response
  rescue => e
    log_error(e, {
      user_id: user&.id,
      chat_id: message.chat_id,
      message_id: message.id,
      action: 'process_message'
    })
    "Произошла ошибка. Попробуйте позже."
  end
end
```

---

## 📊 Контекст для логирования

### **Обязательные поля контекста**
- **action** - Какое действие выполнялось
- **service/class** - Где произошла ошибка
- **user_id** - ID пользователя (если есть)

### **Рекомендуемые поля контекста**
```ruby
log_error(e, {
  # Основная информация
  action: 'process_telegram_webhook',
  service: 'TelegramController',

  # Пользовательский контекст
  user_id: current_user&.id,
  telegram_id: telegram_user&.id,

  # Контекст запроса
  request_id: request.request_id,
  ip_address: request.remote_ip,

  # Бизнес контекст
  booking_id: booking&.id,
  chat_id: chat&.id,

  # Технический контекст
  provider: ai_provider,
  model: ai_model
})
```

---

## 🎯 Специфичные паттерны

### **1. Ошибки AI/LLM интеграции**
```ruby
class LlmService
  include ErrorLogger

  def generate_response(prompt, user)
    response = client.chat(
      messages: [{ role: 'user', content: prompt }],
      model: current_model
    )
    response
  rescue OpenAI::Error => e
    log_error(e, {
      action: 'generate_response',
      user_id: user&.id,
      provider: 'openai',
      model: current_model,
      prompt_length: prompt.length
    })
    fallback_response(user)
  rescue Net::TimeoutError => e
    log_error(e, {
      action: 'generate_response',
      user_id: user&.id,
      error_type: 'timeout'
    })
    "Сервис временно недоступен. Попробуйте позже."
  end
end
```

### **2. Ошибки Telegram API**
```ruby
class TelegramService
  include ErrorLogger

  def send_message(chat_id, text)
    bot.api.send_message(
      chat_id: chat_id,
      text: text,
      parse_mode: 'Markdown'
    )
  rescue Telegram::Bot::Exceptions::ResponseError => e
    log_error(e, {
      action: 'send_message',
      chat_id: chat_id,
      error_code: e.error_code,
      text_length: text.length
    })
    false
  rescue => e
    log_error(e, {
      action: 'send_message',
      chat_id: chat_id
    })
    false
  end
end
```

### **3. Ошибки базы данных**
```ruby
class BookingRepository
  include ErrorLogger

  def create_with_transaction(booking_params)
    Booking.transaction do
      booking = Booking.create!(booking_params)
      # Дополнительные операции
      booking
    end
  rescue ActiveRecord::RecordInvalid => e
    log_error(e, {
      action: 'create_booking',
      validation_errors: e.record.errors.full_messages,
      params: booking_params
    })
    nil
  rescue PG::ConnectionBad => e
    log_error(e, {
      action: 'create_booking',
      error_type: 'database_connection'
    })
    raise # Пробрасываем наверх для обработки на уровне приложения
  end
end
```

### **4. Ошибки внешних API**
```ruby
class ExternalApiService
  include ErrorLogger

  def fetch_car_info(license_plate)
    response = HTTParty.get(
      "#{api_url}/cars/#{license_plate}",
      headers: { 'Authorization' => "Bearer #{api_token}" }
    )
    parse_response(response)
  rescue HTTParty::Error => e
    log_error(e, {
      action: 'fetch_car_info',
      license_plate: license_plate,
      error_type: 'http_error'
    })
    nil
  rescue Net::TimeoutError => e
    log_error(e, {
      action: 'fetch_car_info',
      license_plate: license_plate,
      error_type: 'timeout'
    })
    nil
  rescue JSON::ParserError => e
    log_error(e, {
      action: 'fetch_car_info',
      license_plate: license_plate,
      error_type: 'json_parse',
      response_body: response.body[0..500] # Первые 500 символов
    })
    nil
  end
end
```

---

## 🧪 Тестирование обработки ошибок

### **Тестирование ErrorLogger**
```ruby
RSpec.describe BookingService do
  let(:service) { described_class.new }

  it 'logs errors with proper context' do
    allow(service).to receive(:log_error)

    expect(service).to receive(:log_error).with(
      instance_of(StandardError),
      hash_including(
        action: 'create_booking',
        service: 'BookingService'
      )
    )

    service.create_booking(invalid_params)
  end
end
```

### **Мокирование ErrorLogger в тестах**
```ruby
# ❌ НЕ ДЕЛАТЬ ТАК - логирование НЕ мокируется
allow(service).to receive(:log_error)

# ✅ ПРАВИЛЬНО - проверяем что лог вызывается
expect(service).to receive(:log_error).with(...)
```

---

## 🔍 Отладка и мониторинг

### **Поиск ошибок в логах**
```bash
# Поиск всех ошибок
grep "ERROR" log/production.log

# Поиск ошибок конкретного сервиса
grep "BookingService" log/production.log | grep "ERROR"

# Поиск ошибок конкретного пользователя
grep "user_id: 123" log/production.log | grep "ERROR"
```

### **Мониторинг через Rails Console**
```ruby
# Последние ошибки
ErrorLogger.recent_errors(limit: 10)

# Ошибки конкретного пользователя
ErrorLogger.errors_by_user(user_id: 123)

# Статистика ошибок
ErrorLogger.error_statistics(since: 1.day.ago)
```

---

## ⚡ Performance оптимизация

### **Избегайте избыточного логирования**
```ruby
# ❌ ПЛОХО - избыточный контекст
log_error(e, {
  action: 'process_message',
  full_request: request.to_h, # Слишком много данных
  all_params: params.to_unsafe_h # Безопасность issue
})

# ✅ ХОРОШО - релевантный контекст
log_error(e, {
  action: 'process_message',
  request_id: request.request_id,
  user_id: current_user&.id,
  message_length: params[:message]&.length
})
```

### **Асинхронное логирование для production**
```ruby
# В production среде
if Rails.env.production?
  ErrorLoggerJob.perform_later(e, context)
else
  log_error(e, context)
end
```

---

## 📋 Check-list для обработки ошибок

### **Перед коммитом кода:**
- [ ] Все rescue блоки используют `log_error(e, context)`
- [ ] Контекст содержит `action` и `service/class`
- [ ] Нет прямых вызовов `Bugsnag.notify(e)`
- [ ] Нет `Rails.logger.error(e.message)` без контекста
- [ ] Пользовательский ID добавлен в контекст когда доступен
- [ ] Чувствительные данные исключены из контекста

### **При ревью кода:**
- [ ] Проверить использование `include ErrorLogger`
- [ ] Убедиться что контекст информативный
- [ ] Проверить что нет пробрасывания критических ошибок
- [ ] Проверить тесты на обработку ошибок

---

## 🔗 Связанные документы

- **[Руководство разработчика](../development/README.md)** - Общие правила разработки
- **[Технологический стек](../TECHNOLOGY_STACK.md)** - Информация о технологиях
- **[Product Constitution](../product/constitution.md)** - Требования к продукту

---

**Помните:** Правильная обработка ошибок - это не просто логирование, а инструмент для быстрой диагностики и решения проблем в production.

**Поддерживается:** Development Team | **Актуальность:** 27.10.2025