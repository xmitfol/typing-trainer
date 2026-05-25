# TSD-010: MarkdownCleaner Implementation

**Дата создания:** 26.10.2025
**Статус:** 🟡 Ready for Implementation
**Автор:** AI Assistant
**Связан с:** User Story TBD
**Приоритет:** Medium
**Estimated time:** 6 часов

## 📋 Обзор

Реализация модуля `MarkdownCleaner` для очистки и форматирования Markdown текста в формат, совместимый с Telegram Bot API, с автоматическим исправлением ошибок форматирования и защитой от небезопасного контента.

## 🎯 Цель

Создать надежный модуль для обработки Markdown сообщений от AI, который:
- Очищает и исправляет некорректный Markdown
- Конвертирует в Telegram-совместимый формат
- Обеспечивает безопасность от XSS и malicious content
- Обрабатывает ошибки форматирования gracefully
- Интегрируется в существующий Telegram контроллер

## 🏗️ Технические требования

### Functional Requirements

#### FR-001: Core Markdown Processing
- **Требование:** Обработка основных элементов Markdown: `**bold**`, `*italic*`, `__italic__`, `` `code` ``, `[link](url)`
- **Acceptance Criteria:**
  - ✅ Корректная обработка всех основных элементов Telegram Markdown
  - ✅ Сохранение форматирования при конвертации
  - ✅ Обработка вложенных конструкций (`**bold *italic***`)
- **Priority:** High

#### FR-002: Broken Markdown Handling
- **Требование:** Автоматическое исправление сломанного форматирования
- **Acceptance Criteria:**
  - ✅ Незакрытый `**bold` → `bold` (удаление форматирования)
  - ✅ Сломанные ссылки `[text]()` → `text`
  - ✅ Некорректные HTML теги → безопасное удаление
- **Priority:** High

#### FR-003: Security & Sanitization
- **Требование:** Защита от XSS и malicious content
- **Acceptance Criteria:**
  - ✅ Удаление `<script>alert(1)</script>`
  - ✅ Фильтрация `javascript:` URLs в ссылках
  - ✅ Whitelist подход к HTML элементам
- **Priority:** Critical

#### FR-004: Performance Requirements
- **Требование:** Обработка сообщений без задержек для пользователя
- **Acceptance Criteria:**
  - ✅ < 1ms на типичное сообщение (100-500 символов)
  - ✅ < 10ms на длинное сообщение (2000+ символов)
  - ✅ Поддержка до 100 сообщений/сек
- **Priority:** Medium

### Non-Functional Requirements

#### NFR-001: Compatibility
- **Ruby:** 3.4.2 (текущая версия проекта)
- **Rails:** 8.1.0
- **Dependencies:** kramdown (уже установлен), sanitize (уже установлен)

#### NFR-002: Error Handling
- Graceful degradation при критических ошибках
- Fallback к plain text при полной неработоспособности
- Логирование ошибок через `ErrorLogger` модуль

#### NFR-003: Testability
- Minitest тесты для всех edge cases
- Coverage > 95%
- Интеграционные тесты с Telegram контроллером

## 🏛️ Архитектура и компоненты

### 1. Основной модуль: `MarkdownCleaner`

```ruby
# app/services/markdown_cleaner.rb
class MarkdownCleaner
  # Основной public API
  def self.clean_for_telegram(text, options = {})

  # Приватные компоненты
  private

  def self.safe_parse_markdown(text)
  def self.sanitize_html(html)
  def self.convert_to_telegram_format(clean_html)
  def self.fix_broken_formatting(text)
  def self.fallback_to_plain_text(text)
end
```

### 2. Подмодули для разделения ответственности

#### `MarkdownCleaner::Parser`
- Интеграция с Kramdown
- Безопасная конфигурация парсера
- Обработка ошибок парсинга

#### `MarkdownCleaner::Sanitizer`
- Конфигурация Sanitize gem
- XSS protection
- URL validation

#### `MarkdownCleaner::Formatter`
- Конвертация HTML → Telegram Markdown
- Оптимизация для Telegram API
- Обработка специальных случаев

### 3. Конфигурация

```ruby
# app/services/markdown_cleaner/configuration.rb
module MarkdownCleaner
  class Configuration
    # Telegram разрешенные элементы
    TELEGRAM_ALLOWED_ELEMENTS = %w[strong em code a].freeze

    # Безопасные протоколы для ссылок
    ALLOWED_PROTOCOLS = %w[http https].freeze

    # Максимальная длина сообщения
    MAX_MESSAGE_LENGTH = 4096
  end
end
```

## 🚀 План реализации

### Phase 1: Foundation (2 часа)

#### Task 1.1: Base Module Setup (30 мин)
- [ ] Создать `app/services/markdown_cleaner.rb`
- [ ] Настроить базовую структуру класса
- [ ] Добавить basic `clean_for_telegram` метод
- [ ] Конфигурация Kramdown с безопасными опциями

#### Task 1.2: Basic Markdown Processing (60 мин)
- [ ] Реализация `safe_parse_markdown` с Kramdown
- [ ] Базовая обработка `**bold**`, `*italic*`, `` `code` ``
- [ ] Простая конвертация в Telegram формат
- [ ] Unit тесты для базовой функциональности

#### Task 1.3: Basic Sanitization (30 мин)
- [ ] Интеграция Sanitize gem
- [ ] Базовая конфигурация безопасности
- [ ] Тесты защиты от XSS

### Phase 2: Advanced Features (3 часа)

#### Task 2.1: Broken Markdown Handling (90 мин)
- [ ] Реализация `fix_broken_formatting`
- [ ] Обработка незакрытого форматирования
- [ ] Исправление сломанных ссылок
- [ ] Comprehensive тесты edge cases

#### Task 2.2: Advanced Security (60 мин)
- [ ] Расширенная санитизация HTML
- [ ] URL validation и protocol checking
- [ ] Защита от advanced XSS векторов
- [ ] Тесты безопасности

#### Task 2.3: Telegram Format Optimization (30 мин)
- [ ] Оптимизация для Telegram API ограничений
- [ ] Обработка специальных символов
- [ ] Усечение длинных сообщений
- [ ] Performance оптимизация

### Phase 3: Integration & Testing (1 час)

#### Task 3.1: Integration (30 мин)
- [ ] Модификация `Telegram::WebhookController`
- [ ] Обновление `WelcomeService`
- [ ] Интеграция с AI response pipeline

#### Task 3.2: Testing & Documentation (30 мин)
- [ ] Интеграционные тесты
- [ ] Performance тесты
- [ ] Документация API и usage examples
- [ ] README с best practices

## 🔧 Технические детали

### Dependencies
- `kramdown` (v2.5.1) - уже установлен в проекте
- `sanitize` (v7.0.0) - уже установлен в проекте
- `rails` (v8.1.0) - текущая версия

### Configuration Options

```ruby
# Безопасная конфигурация Kramdown
KRAMDOWN_SAFE_OPTIONS = {
  remove_block_html_tags: true,
  remove_span_html_tags: true,
  parse_block_html: false,
  parse_span_html: false,
  entity_output: :symbolic
}.freeze

# Конфигурация Sanitize для Telegram
SANITIZE_CONFIG = {
  elements: %w[strong em code a],
  attributes: { 'a' => ['href'] },
  protocols: { 'a' => { 'href' => %w[http https] } }
}.freeze
```

### Error Handling Strategy
1. **Parse Errors:** Fallback к plain text
2. **Sanitization Errors:** Удаление проблемных элементов
3. **Performance Issues:** Timeout на 50ms
4. **Critical Errors:** Логирование через `ErrorLogger`

## ⚠️ Риски и зависимости

### Риски
1. **Performance:** Kramdown медленнее C extensions
   - **Mitigation:** Кэширование для повторяющихся паттернов
2. **Broken Input:** Непредсказуемый malformed markdown
   - **Mitigation:** Comprehensive error handling и fallback
3. **Telegram API Changes:** Изменение форматирования
   - **Mitigation:** Изолированный formatter module

### Зависимости
- ✅ Gems уже установлены в проекте
- ✅ Совместимо с текущей версией Rails/Ruby
- ⚠️ Требуется тестирование с telegram-bot gem

## 🧪 Тестирование

### Unit Tests
- Все основные элементы Markdown
- Broken formatting edge cases
- Security vulnerabilities
- Performance benchmarks

### Integration Tests
- Telegram webhook controller
- AI response processing
- WelcomeService integration

### Test Coverage
- **Target:** > 95%
- **Critical Paths:** 100%
- **Edge Cases:** Comprehensive coverage

## 📊 Метрики успеха

### Technical Metrics
- **Performance:** < 1ms per message
- **Reliability:** 99.9% uptime (no parsing errors)
- **Security:** 0 XSS vulnerabilities
- **Coverage:** > 95%

### Business Metrics
- **User Experience:** Smooth formatting без визуальных ошибок
- **Safety:** Zero malicious content delivery
- **Compatibility:** 100% Telegram API compliance

## 🔗 Связанные документы

- **[Markdown Parser Comparison](../gems/markdown-parser-comparison.md)** - анализ выбранных технологий
- **[Product Constitution](../../product/constitution.md)** - требования к продукту
- **[FLOW](../../FLOW.md)** - процесс разработки
- **[Telegram Bot Integration](../gems/telegram-bot/)** - документация по Telegram API

## ✅ Definition of Done

- [ ] Модуль `MarkdownCleaner` реализован и протестирован
- [ ] Интегрирован в `Telegram::WebhookController`
- [ ] Обновлена `WelcomeService`
- [ ] Unit тесты (coverage > 95%)
- [ ] Интеграционные тесты пройдены
- [ ] Performance тесты (< 1ms per message)
- [ ] Documentation complete
- [ ] Code review пройден
- [ ] Готов к production deployment

---

**⚠️ Важно:** Следовать Product Constitution principles - Dialogue-Only Interaction и AI-First Approach при имплементации.