# Technical Specification Document: TSD-003 - Визуальная оценка повреждений по фото

**Статус:** Draft
**Сложность:** Medium
**Приоритет:** Medium
**Создан:** 25.10.2025
**Обновлен:** 25.10.2025
**User Story:** [../user-stories/US-003-telegram-photo-damage-assessment.md](../user-stories/US-003-telegram-photo-damage-assessment.md)

## 🎯 User Story

**As a** владелец автомобиля с повреждениями кузова
**I want to** отправить фото в Telegram и получить экспертную оценку повреждений и предварительную стоимость ремонта
**so that** я могу быстро понять ориентировочную стоимость и принять решение о записи на осмотр

### Критерии приемки
- [ ] **Functional:** Клиент может отправить фото и получить AI-анализ повреждений
- [ ] **User Experience:** 80% пользователей получают полезную оценку, конверсия в запись > 40%
- [ ] **Performance:** Анализ фото < 10 секунд, точность определения повреждений > 75%

## 🎯 Технические требования

### Functional Requirements
- [ ] **FR-001:** Клиент может отправить фото в Telegram и получить AI-анализ
- [ ] **FR-002:** AI определяет тип повреждений (вмятины, царапины, трещины, деформации)
- [ ] **FR-003:** Система предоставляет предварительную оценку стоимости ремонта
- [ ] **FR-004:** AI рекомендует методы ремонта (PDR, покраска, замена элементов)
- [ ] **FR-005:** Интеграция с визуальными AI моделями (GPT-4 Vision, Claude Vision, или аналоги)
- [ ] **FR-006:** Обработка фотографий плохого качества с запросом лучших фото

### Non-Functional Requirements
- [ ] **Security:** Временное хранение фото с автоматическим удалением через 24 часа
- [ ] **Performance:** Время анализа фото < 10 секунд для 95% запросов
- [ ] **Accuracy:** Точность определения типа повреждений > 75%
- [ ] **Scalability:** Обработка до 100 фото в час в MVP
- [ ] **Privacy:** Фото не используются для обучения AI без согласия

## 🏗️ Architecture & Design

### System Components
```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   Telegram Bot  │───▶│  Photo Store │───▶│   Vision AI     │
│                 │    │   (Temp)     │    │   Analysis      │
└─────────────────┘    └──────────────┘    └─────────────────┘
                                                      │
                                                      ▼
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│    Response     │◀───│ Cost Engine  │◀───│ Damage Report   │
│   Generator     │    │              │    │   Generator     │
└─────────────────┘    └──────────────┘    └─────────────────┘
```

### Data Models
```ruby
class PhotoAnalysis < ApplicationRecord
  belongs_to :chat
  has_one_attached :photo

  # Результаты анализа
  jsonb :damage_types, array: true
  jsonb :severity_estimates
  jsonb :repair_recommendations
  jsonb :cost_estimates

  # Метаданные
  string :analysis_model
  string :confidence_level
  datetime :analyzed_at
end
```

### API Integration
```ruby
# Vision AI Service (адаптер для разных провайдеров)
class VisionAnalysisService
  def analyze_photo(photo_data)
    # Integration with:
    # - OpenAI GPT-4 Vision
    # - Anthropic Claude Vision
    # - Google Cloud Vision API
    # - Custom car damage detection models
  end
end
```

## 💾 Database Schema

### New Tables
```sql
CREATE TABLE photo_analyses (
  id BIGINT PRIMARY KEY,
  chat_id BIGINT REFERENCES chats(id),
  photo_attachment_id BIGINT,

  -- Results
  damage_types JSONB,
  severity_estimates JSONB,
  repair_recommendations JSONB,
  cost_estimates JSONB,

  -- Metadata
  analysis_model VARCHAR(100),
  confidence_level DECIMAL(3,2),
  analyzed_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## 🔧 Implementation Details

### Photo Processing Pipeline
```ruby
class PhotoAnalysisPipeline
  def process(photo, chat)
    # 1. Validate photo quality
    return "Фото плохого качества" unless quality_check(photo)

    # 2. Extract visual features
    features = VisionAI.analyze(photo)

    # 3. Detect damage types
    damages = DamageDetector.detect(features)

    # 4. Estimate costs
    costs = CostEstimator.estimate(damages)

    # 5. Generate response
    ResponseGenerator.generate(damages, costs)
  end
end
```

### System Prompts for Vision AI
```text
Ты - эксперт по кузовному ремонту с 20-летним опытом. Проанализируй фото автомобиля и определи:

1. Типы повреждений (вмятины, царапины, трещины, деформации)
2. Степень тяжести (легкая, средняя, тяжелая)
3. Необходимые ремонтные работы
4. Предварительную стоимость в диапазоне

Укажи точность своей оценки и рекомендуй следующие шаги клиенту.
```

## 📱 User Experience Flow

```
Пользователь: "Помогите оценить повреждения"
Система: "Пришлите фото автомобиля с разных ракурсов"

[Пользователь отправляет фото]
Система: "Анализирую фото..." (10 секунд)

Система: "На фото вижу:
- Вмятина на переднем крыле справа (средняя)
- Царапина на двери водителя (легкая)

Рекомендуемый ремонт:
- Выправление крыла: 8,000-12,000₽
- Покраска крыла: 5,000-7,000₽
- Полировка царапины: 1,500-3,000₽

Итого: 14,500-22,000₽

Хотите записаться на бесплатный осмотр для точной оценки?"
```

## 🧪 Testing Strategy

### Unit Tests
- [ ] Photo quality validation
- [ ] Damage detection accuracy
- [ ] Cost calculation logic
- [ ] Response generation

### Integration Tests
- [ ] Vision AI API integration
- [ ] File upload/download
- [ ] Database operations
- [ ] Error handling

### Performance Tests
- [ ] Photo analysis speed (< 10 seconds)
- [ ] Concurrent photo processing
- [ ] Memory usage optimization

## 🚀 Deployment & Monitoring

### Monitoring Metrics
- Photo analysis success rate
- Average processing time
- User satisfaction with assessments
- Conversion rate to booking

### Error Handling
- Graceful degradation when AI is unavailable
- Fallback to manual assessment
- Clear error messages to users

## 📋 Open Questions

1. **AI Model Choice:** GPT-4 Vision vs Claude Vision vs specialized models?
2. **Cost Management:** API calls costs for vision analysis
3. **Privacy:** Photo retention policy and consent
4. **Accuracy:** Benchmark for acceptable damage detection accuracy

## 🔗 Dependencies

- **US-002b:** Базовая запись на осмотр
- **AI Infrastructure:** Vision AI API integration
- **File Storage:** Temporary photo storage solution
- **Cost Database:** Repair cost reference data

---

**Implementation Priority:** Medium (Phase 2 - Post-MVP)
**Estimated Effort:** 2-3 недели
**Team Required:** Backend Developer + AI Specialist