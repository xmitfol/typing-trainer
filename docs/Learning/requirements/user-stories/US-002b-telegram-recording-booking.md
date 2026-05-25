# User Story: US-002b - Telegram Recording + Booking

**Статус:** Completed ✅
**Приоритет:** High
**Story Points:** 5
**Создан:** 25.10.2025
**Обновлен:** 27.10.2025 (добавлены метрики аналитики FIP-001)

## 📝 User Story
**As a** владелец автомобиля, который получил ориентировочную стоимость ремонта и хочет записаться на детальный осмотр **I want to** быстро и удобно записаться на бесплатный осмотр через естественный диалог в Telegram **so that** я могу получить точную оценку стоимости и согласовать ремонт в удобное для меня время

## 👥 User Acceptance Criteria

### 🤖 Functional Criteria (Технические требования)
- [ ] **Given** клиент хочет записаться на осмотр **When** он выражает намерение в диалоге **Then** бот собирает необходимые данные и создает заявку
- [ ] **Given** создана заявка на осмотр **When** она сохранена в системе **Then** менеджеры получают уведомление в своем чате
- [ ] **Given** клиент предоставил неполные данные **When** их недостаточно для записи **Then** бот запрашивает только недостающую информацию

### 👥 User Acceptance Criteria (Пользовательские критерии)
- [ ] **Как клиент** Я чувствую что диалог идет естественно и бот понимает мои намерения
- [ ] **Как клиент** Я получаю подтверждение записи с указанием времени, даты и адреса
- [ ] **Как клиент** Я легко могу записаться, используя обычную речь, без кнопок и форм

### 📊 Performance Criteria (Требования к производительности)
- [ ] **Response time:** < 3 секунд для ответов бота в процессе записи
- [ ] **Availability:** 99.9% uptime для функции создания заявок
- [ ] **Delivery time:** < 5 секунд для доставки заявок менеджерам

### 📈 Analytics Criteria (Требования к аналитике)
- [ ] **Given** заявка создана **When** она отправляется менеджерам **Then** событие `booking_request_created` сохраняется с детальной информацией
- [ ] **Given** диалог продолжается **When** клиент предоставит данные **Then** время диалога и этапы воронки отслеживаются
- [ ] **Given** процесс записи завершен **When** клиент получил подтверждение **Then** полная метрика конверсии сохраняется в аналитике

**📝 Примечание:** Событие `booking_initiated` признано избыточным. Достаточно отслеживать `booking_created` для анализа конверсии.

## 🎯 Business Value
- **Проблема:** Клиенты получив консультацию не всегда переходят к записи из-за сложности процесса или необходимости звонить
- **Решение:** Естественный переход от консультации к записи через диалог в том же интерфейсе
- **Метрики успеха (FIP-001 Analytics Integration):**
  - **Конверсия в запись:** 60% консультаций → создание заявки
  - **Проходимость:** 90% созданных заявок подтверждаются менеджерами
  - **Посещаемость:** 95% клиентов приходят на осмотр после подтверждения
  - **Среднее время диалога:** 5-7 минут до создания заявки (target)
- **ROI:** Увеличение потока клиентов на 30% через упрощение процесса записи

## 🎯 Target Metrics (из FIP-001 Analytics System)

### **Key Performance Indicators:**
- **Conversion rate:** 60% (консультации → заявки)
- **Dialog duration:** 5-7 минут до создания заявки
- **Booking completion:** 90% подтверждение менеджерами
- **Show-up rate:** 95% посещаемость после подтверждения

### **Analytics Events to Track:**
```ruby
# Для US-002b отслеживаем:
AnalyticsService::Events::BOOKING_CREATED        # Создание заявки (основное событие)
# Примечание: booking_initiated, service_added, cart_confirmed избыточны
# Цель US-002b - простая запись на осмотр, не полноценная корзина услуг
```

### **Success Benchmarks (Phase 1 MVP):**
- **Conversion performance:** 60% ± 5% консультаций
- **Time efficiency:** 5-7 минут средний диалог
- **Data accuracy:** 95% полных заявок без дозапроса
- **Processing latency:** < 3 секунд ответы бота

## 🚫 Исключения и Edge Cases
- [ ] **Все временные слоты заняты:** Предложить альтернативные даты или поставить в очередь ожидания
- [ ] **Некорректный номер телефона:** Запросить правильный формат с примером
- [ ] **Менеджеры не получают уведомления:** Retry механизм и fallback на email/звонок
- [ ] **Клиент передумал в процессе:** Легко отменить запись без осуждения

## ✅ Definition of Done
- [ ] Все User Acceptance Criteria выполнены и протестированы
- [ ] Functional Criteria реализованы согласно Technical Design Document
- [ ] Performance Criteria измерены и достигнуты
- [ ] Analytics Criteria реализованы и интегрированы с FIP-001
- [ ] Unit тесты для Booking модели и tool handler написаны и проходят
- [ ] Integration тесты полного диалога проходят
- [ ] Analytics tracking работает и возвращает корректные данные конверсии
- [ ] Performance тесты response time и processing latency проходят
- [ ] Code review выполнен и одобрен
- [ ] Документация для менеджеров по обработке заявок создана
- [ ] Тестирование с реальными пользователями пройдено

## 🔗 Связанные документы
- **Analytics Implementation:** [FIP-001-analytics-system.md](../FIP-001-analytics-system.md)
- **Technical Design:** [TSD-001-analytics-system.md](../tsd/TSD-001-analytics-system.md)
- **Specific TDD:** [../tsd/TSD-002b-telegram-recording-booking.md](../tsd/TSD-002b-telegram-recording-booking.md)
- **Business Metrics:** [../../business-metrics.md](../../business-metrics.md)
- **Dependencies:** US-001 (приветствие), US-002a (консультация)

## 📋 Notes and Decisions

### Ключевые решения:
1. **LLM Tool подход:** Использовать встроенный tool calling механизм ruby_llm вместо сложной формы с кнопками
2. **Естественный диалог:** Собирать данные из контекста разговора, а не через строгую форму
3. **Асинхронные уведомления:** Отправлять заявки менеджерам через фоновые задачи для надежности

### Open Questions:
- **Интеграция с CRM:** Нужно ли будет интегрироваться с существующей CRM системой автосервиса?
- **Количество мастеров:** Текущий расчет на одного мастера, возможно потребуется масштабирование

### Assumptions:
- **Менеджерский чат:** Существует рабочий Telegram чат для получения заявок менеджерами
- **Временные слоты:** Один мастер может обслуживать до 10 клиентов в день в течение 2 дней вперед
- **Telegram webhook:** Базовая инфраструктура для приема сообщений уже работает

---

## 🔧 Production Deployment Configuration

**⚠️ ВАЖНО: `admin_chat_id` настраивается через ENV переменную при деплойменте**

```bash
# Пример установки ENV переменной для production
export ADMIN_CHAT_ID=-123456789  # ID Telegram чата менеджеров

# В deployment скриптах:
admin_chat_id: ${ADMIN_CHAT_ID}
```

**Как найти ID чата:**
1. Добавить `@userinfobot` в ваш менеджерский Telegram чат
2. Отправить любое сообщение в чат
3. Bot покажет `chat_id: -123456789`
4. Использовать этот ID как `ADMIN_CHAT_ID`

**Текущий статус реализации:**
- ✅ **Development:** Уведомления логируются (admin_chat_id не требуется)
- ⚙️ **Production:** Требуется установка `ADMIN_CHAT_ID` ENV переменной
- 🧪 **Testing:** Использует `admin_chat_id: 123_456` (mock значение)

**Change log:**
| Дата | Версия | Изменение | Автор |
|------|--------|-----------|-------|
| 25.10.2025 | 1.0 | Initial version from FIP-002b conversion | Claude Code Assistant |
| 25.10.2025 | 1.1 | Removed FIP-002b reference, updated links per FLOW.md | Claude Code Assistant |
| 27.10.2025 | 1.2 | Added analytics criteria and FIP-001 integration | Claude Code Assistant |
| 27.10.2025 | 1.3 | Added deployment configuration notes for admin_chat_id | Claude Code Assistant |
| 27.10.2025 | 1.4 | Removed booking_initiated event as redundant, kept booking_created only | Claude Code Assistant |
| 27.10.2025 | 1.5 | Simplified analytics: removed service_added, cart_confirmed - focus on booking only | Claude Code Assistant |

---

**Approval:**
- [ ] Product Owner: ____________________ Date: _______
- [ ] Tech Lead: __________________________ Date: _______