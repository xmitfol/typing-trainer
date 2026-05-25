# Backend Architecture - Typing Trainer

> **Version:** 1.0
> **Created:** 2025-11-16
> **Author:** Борис (Backend Developer)
> **Status:** 🟡 Draft (Design Phase)

---

## 📋 Executive Summary

Backend архитектура для Typing Trainer SaaS приложения построена на современном Python-стеке с FastAPI в качестве REST API framework, PostgreSQL для персистентного хранения данных, и Redis для кеширования и session management.

**Ключевые особенности:**
- **Масштабируемость**: Horizontal scaling через multiple API instances + load balancer
- **Производительность**: Async/await operations, database connection pooling, Redis caching
- **Безопасность**: JWT authentication, password hashing (bcrypt), input validation, rate limiting
- **Миграция данных**: Бесшовный переход от LocalStorage (Phase 1) к PostgreSQL (Phase 2)
- **Freemium модель**: RBAC для разграничения free vs premium features (15 бесплатных уроков + 84 premium)
- **AI интеграция**: API endpoints для AI Weak Keys Analyzer и персонализированных рекомендаций

---

## 🎯 Goals & Principles

### Business Goals

1. **Scalability to 10,000+ Users**: Архитектура должна поддерживать рост пользовательской базы без degradation производительности
2. **Freemium Monetization**: Backend поддерживает subscription tiers (free, basic, premium) с enforcement через API
3. **Data-Driven Insights**: Сбор и анализ user progress data для AI-powered recommendations
4. **Fast Time-to-Market**: Phase 2 backend должен быть готов за 3-4 недели разработки

### Technical Principles

1. **API-First Design**: RESTful API с четким versioning (/api/v1/...) для future compatibility
2. **Security by Default**: Все endpoints защищены authentication, sensitive data encrypted
3. **Database Normalization**: 3NF database schema для минимизации redundancy и обеспечения data integrity
4. **Performance-Oriented**: Target response time < 200ms для 95% requests
5. **Testability**: Comprehensive unit, integration, и API tests (coverage ≥ 80%)
6. **Documentation**: OpenAPI/Swagger spec для всех endpoints
7. **Monitoring & Observability**: Logging, metrics, и error tracking с самого начала

### Architecture Principles

- **Separation of Concerns**: Layers - API → Business Logic → Data Access
- **Dependency Injection**: Loose coupling между компонентами
- **SOLID Principles**: Clean code architecture
- **12-Factor App**: Stateless API, configuration через environment variables, horizontal scalability

---

## 🛠️ Technology Stack

### Core Technologies

#### **1. FastAPI (Python 3.11+)**
**Почему FastAPI:**
- ⚡ **Производительность**: Один из fastest Python frameworks (comparable to Node.js и Go)
- 🔧 **Async Support**: Native async/await для high-concurrency scenarios
- 📝 **Auto Documentation**: OpenAPI/Swagger UI из коробки
- ✅ **Type Validation**: Pydantic models для automatic request/response validation
- 🛠️ **Developer Experience**: Excellent error messages, hot reload, intuitive API

**Альтернативы рассмотрены**: Django REST Framework (too heavy), Flask (lacks async), Node.js/Express (team expertise в Python)

**Dependencies:**
```python
fastapi[all]==0.104.1  # Core framework + extras (Uvicorn, Pydantic, etc.)
uvicorn[standard]==0.24.0  # ASGI server
python-multipart==0.0.6  # Form data support
```

---

#### **2. PostgreSQL 15+**
**Почему PostgreSQL:**
- 🏆 **Industry Standard**: Proven reliability для production workloads
- 🔍 **Rich Data Types**: JSON/JSONB для flexible schema parts (user settings, weak keys data)
- 📊 **Performance**: Excellent query performance с indexing и query planner
- 🔒 **ACID Compliance**: Data integrity гарантирована
- 🌍 **Open Source**: No licensing costs, large community

**Альтернативы рассмотрены**: MySQL (less feature-rich), MongoDB (no need for NoSQL), SQLite (not scalable)

**Extensions используемые:**
- `uuid-ossp`: UUID generation для primary keys
- `pg_trgm`: Trigram indexing для text search (lesson content search)

---

#### **3. Redis 7+**
**Почему Redis:**
- ⚡ **Speed**: In-memory storage для ultra-fast caching
- 🔄 **Session Storage**: JWT refresh tokens, rate limiting counters
- 📦 **Caching**: Lesson content, user progress stats, leaderboards
- 🔔 **Pub/Sub**: Real-time notifications (future feature)

**Use Cases:**
- Cache lesson content (immutable data, 1-hour TTL)
- Rate limiting (sliding window algorithm)
- Session tokens (refresh tokens with 30-day TTL)
- Frequently accessed user stats (WPM, accuracy, total lessons)

**Альтернативы рассмотрены**: Memcached (less features), no caching (poor performance)

---

#### **4. SQLAlchemy 2.0 (ORM)**
**Почему SQLAlchemy:**
- 🔧 **Flexibility**: Supports both ORM и Core (raw SQL when needed)
- 🔒 **Security**: Automatic SQL injection prevention
- 🚀 **Async Support**: SQLAlchemy 2.0 full async support
- 📝 **Migrations**: Seamless integration с Alembic

**Models Definition Style:**
```python
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, Integer, TIMESTAMP

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP, default=func.now())
    subscription_tier: Mapped[str] = mapped_column(String(50), default="free")
```

---

#### **5. Alembic (Database Migrations)**
**Почему Alembic:**
- 🔄 **Version Control для DB**: Track database schema changes
- ⬆️⬇️ **Up/Down Migrations**: Rollback capability
- 🔧 **Auto-generation**: Generate migrations from SQLAlchemy models

**Migration Workflow:**
```bash
# Create new migration
alembic revision --autogenerate -m "Add weak_keys table"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

---

#### **6. Pydantic (Data Validation)**
**Почему Pydantic:**
- ✅ **Type Safety**: Runtime validation с Python type hints
- 📝 **Auto Documentation**: FastAPI uses Pydantic models для OpenAPI spec
- 🔧 **Serialization**: JSON serialization из коробки
- 🛡️ **Input Validation**: Prevents malformed data от попадания в database

**Example Schema:**
```python
from pydantic import BaseModel, EmailStr, constr, Field

class UserCreate(BaseModel):
    email: EmailStr
    password: constr(min_length=8, max_length=128)  # type: ignore

class UserResponse(BaseModel):
    id: int
    email: str
    subscription_tier: str
    created_at: datetime

    class Config:
        from_attributes = True  # SQLAlchemy model compatibility
```

---

#### **7. Additional Libraries**

**Authentication & Security:**
```python
python-jose[cryptography]==3.3.0  # JWT encoding/decoding
passlib[bcrypt]==1.7.4  # Password hashing
python-multipart==0.0.6  # OAuth2 password flow
```

**Database:**
```python
asyncpg==0.29.0  # Async PostgreSQL driver
redis[hiredis]==5.0.1  # Async Redis client
```

**Testing:**
```python
pytest==7.4.3  # Test framework
pytest-asyncio==0.21.1  # Async test support
httpx==0.25.2  # Async HTTP client для API tests
```

**Development:**
```python
black==23.11.0  # Code formatter
ruff==0.1.6  # Linter (faster than flake8)
mypy==1.7.1  # Type checker
```

---

### Infrastructure (Phase 3)

**Deployment:**
- **Docker**: Containerization для consistent environments
- **Docker Compose**: Local development multi-container setup
- **Kubernetes**: Production orchestration (optional, для scale >10k users)

**Monitoring & Logging:**
- **Sentry**: Error tracking и monitoring
- **Prometheus + Grafana**: Metrics visualization
- **ELK Stack** (Elasticsearch, Logstash, Kibana): Centralized logging

**CI/CD:**
- **GitHub Actions**: Automated testing и deployment
- **Pre-commit hooks**: Code quality checks перед commit

---

## 📊 Database Schema

### Design Principles

1. **Normalization**: 3NF для минимизации redundancy
2. **Indexing Strategy**: Index на foreign keys, frequently queried fields (email, user_id, created_at)
3. **Data Types**: Appropriate types для каждого field (UUID для IDs, JSONB для flexible data)
4. **Constraints**: Foreign keys, unique constraints, check constraints для data integrity
5. **Timestamps**: created_at, updated_at на каждой таблице для audit trail
6. **Soft Deletes**: is_deleted flag вместо hard deletes (для data recovery и analytics)

---

### Tables Overview

```
┌─────────────────┐       ┌──────────────────┐       ┌─────────────────┐
│     Users       │──────<│  UserProgress    │       │    Lessons      │
│                 │       │                  │───────│                 │
│  - id (PK)      │       │  - id (PK)       │       │  - id (PK)      │
│  - email        │       │  - user_id (FK)  │       │  - block_id     │
│  - password_hash│       │  - lesson_id (FK)│       │  - level        │
│  - sub_tier     │       │  - wpm           │       │  - content      │
│  - created_at   │       │  - accuracy      │       │  - target_wpm   │
└─────────────────┘       │  - completed_at  │       └─────────────────┘
         │                └──────────────────┘                │
         │                                                    │
         │                ┌──────────────────┐               │
         └───────────────<│   WeakKeys       │               │
                          │                  │               │
                          │  - id (PK)       │               │
                          │  - user_id (FK)  │               │
                          │  - key           │               │
                          │  - error_count   │               │
                          │  - error_rate    │               │
                          └──────────────────┘               │
                                                              │
┌─────────────────┐       ┌──────────────────┐              │
│ Subscriptions   │       │    Payments      │              │
│                 │       │                  │              │
│  - id (PK)      │       │  - id (PK)       │              │
│  - user_id (FK) │<──────│  - user_id (FK)  │              │
│  - plan         │       │  - amount        │              │
│  - status       │       │  - status        │              │
│  - expires_at   │       │  - created_at    │              │
└─────────────────┘       └──────────────────┘              │
                                                              │
                          ┌──────────────────┐               │
                          │  LessonContent   │               │
                          │  (опционально)   │<──────────────┘
                          │                  │
                          │  - id (PK)       │
                          │  - lesson_id(FK) │
                          │  - lang          │
                          │  - text          │
                          └──────────────────┘
```

---

### Table Definitions

#### **1. users**

Хранит информацию о пользователях системы.

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    subscription_tier VARCHAR(50) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'premium')),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login_at TIMESTAMP,

    -- Indexes
    INDEX idx_users_email (email),
    INDEX idx_users_subscription (subscription_tier),
    INDEX idx_users_created_at (created_at)
);

-- Comments
COMMENT ON TABLE users IS 'Пользователи системы (User - термин из Terminology System)';
COMMENT ON COLUMN users.subscription_tier IS 'Уровень подписки: free (15 уроков), basic, premium (все уроки)';
COMMENT ON COLUMN users.is_verified IS 'Email verification status (Phase 2+)';
```

**Поля:**
- `id`: Primary key (auto-increment integer)
- `email`: Unique email для authentication
- `password_hash`: Bcrypt hash пароля (never store plain passwords!)
- `full_name`: Опциональное имя пользователя
- `subscription_tier`: Тип подписки (`free`, `basic`, `premium`)
- `is_active`: Account active status (для soft bans)
- `is_verified`: Email verification status
- `created_at`, `updated_at`: Audit timestamps
- `last_login_at`: Последний login для analytics

---

#### **2. user_progress**

Хранит результаты прохождения уроков пользователями.

```sql
CREATE TABLE user_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id VARCHAR(100) NOT NULL,  -- Example: "block_1_lesson_3"
    wpm INTEGER NOT NULL,  -- Words Per Minute (термин из Terminology System)
    accuracy DECIMAL(5,2) NOT NULL CHECK (accuracy >= 0 AND accuracy <= 100),  -- Accuracy в процентах
    errors INTEGER DEFAULT 0,
    duration_seconds INTEGER NOT NULL,
    total_chars INTEGER NOT NULL,
    completed_at TIMESTAMP DEFAULT NOW(),

    -- Metadata
    text_preview TEXT,  -- Первые 100 символов текста (для reference)
    device_type VARCHAR(50),  -- desktop, mobile, tablet

    -- Indexes
    INDEX idx_user_progress_user_id (user_id),
    INDEX idx_user_progress_lesson_id (lesson_id),
    INDEX idx_user_progress_completed_at (completed_at),
    INDEX idx_user_progress_user_lesson (user_id, lesson_id),

    -- Constraints
    UNIQUE (user_id, lesson_id, completed_at)  -- Пользователь может проходить урок многократно
);

COMMENT ON TABLE user_progress IS 'История прохождения уроков (UserProgress - Training results)';
COMMENT ON COLUMN user_progress.wpm IS 'Words Per Minute - скорость печати (термин из Terminology System)';
COMMENT ON COLUMN user_progress.accuracy IS 'Точность печати в процентах (Accuracy - термин из Terminology System)';
```

**Поля:**
- `id`: Primary key
- `user_id`: Foreign key → users.id
- `lesson_id`: Lesson identifier (example: `"block_1_lesson_3"`)
- `wpm`: Words Per Minute (calculated)
- `accuracy`: Accuracy percentage (0-100)
- `errors`: Total errors made
- `duration_seconds`: Время прохождения урока
- `total_chars`: Total characters typed
- `completed_at`: Timestamp завершения
- `text_preview`: Превью текста (для display в history)
- `device_type`: Device type для analytics

**Indexes:**
- `user_id` - для получения всей истории пользователя
- `lesson_id` - для analytics по урокам
- `completed_at` - для sorting по времени
- `(user_id, lesson_id)` - composite index для queries "все попытки пользователя на уроке X"

---

#### **3. lessons**

Хранит метаданные уроков (контент может быть в отдельной таблице или файлах).

```sql
CREATE TABLE lessons (
    id VARCHAR(100) PRIMARY KEY,  -- Example: "block_1_lesson_3"
    block_id INTEGER NOT NULL,  -- 1-6 (Block number)
    lesson_number INTEGER NOT NULL,  -- Номер урока в блоке
    title VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty_level VARCHAR(50) NOT NULL CHECK (difficulty_level IN ('pinky', 'ring', 'middle', 'index_left', 'index_right', 'advanced')),
    target_wpm INTEGER NOT NULL,  -- Target WPM для этого урока
    max_errors INTEGER DEFAULT 5,
    is_premium BOOLEAN DEFAULT FALSE,  -- Free vs Premium урок
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Indexes
    INDEX idx_lessons_block_id (block_id),
    INDEX idx_lessons_difficulty (difficulty_level),
    INDEX idx_lessons_is_premium (is_premium),

    -- Constraints
    UNIQUE (block_id, lesson_number)
);

COMMENT ON TABLE lessons IS 'Метаданные уроков (Lesson - термин из Terminology System)';
COMMENT ON COLUMN lessons.difficulty_level IS 'Уровень сложности: pinky, ring, middle, index_left, index_right, advanced (Difficulty Level - термин из Terminology System)';
COMMENT ON COLUMN lessons.is_premium IS 'FALSE = бесплатный урок (первые 15), TRUE = premium (остальные 84)';
```

**Поля:**
- `id`: Lesson ID (string, example: `"block_1_lesson_3"`)
- `block_id`: Block number (1-6)
- `lesson_number`: Номер урока в блоке
- `title`: Название урока
- `description`: Описание урока
- `difficulty_level`: Уровень сложности (Terminology: Pinky, Ring, Middle, etc.)
- `target_wpm`: Целевой WPM для урока
- `max_errors`: Maximum допустимых ошибок
- `is_premium`: Premium flag (для freemium model)
- `is_active`: Active status

**Freemium Logic:**
- Первые 15 уроков: `is_premium = FALSE`
- Остальные 84 урока: `is_premium = TRUE`
- API endpoint `/lessons/{id}` должен проверять `user.subscription_tier` и возвращать 403 Forbidden для premium lessons если user = free

---

#### **4. lesson_content** (опционально)

Хранит контент уроков (typing text). Может быть отдельной таблицей или JSON файлами.

```sql
CREATE TABLE lesson_content (
    id SERIAL PRIMARY KEY,
    lesson_id VARCHAR(100) NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    language VARCHAR(10) DEFAULT 'ru',  -- 'ru', 'en'
    content TEXT NOT NULL,  -- Текст для набора (Typing Text - термин из Terminology System)
    target_keys TEXT[],  -- Массив целевых клавиш для урока
    created_at TIMESTAMP DEFAULT NOW(),

    -- Indexes
    INDEX idx_lesson_content_lesson_id (lesson_id),
    INDEX idx_lesson_content_language (language),

    -- Constraints
    UNIQUE (lesson_id, language)
);

COMMENT ON TABLE lesson_content IS 'Контент уроков - тексты для набора (Typing Text - термин из Terminology System)';
COMMENT ON COLUMN lesson_content.target_keys IS 'Целевые клавиши для урока (для подсветки и анализа)';
```

**Альтернативный подход:**
- Хранить `content` в JSON файлах (`data/texts/ru.json`) и загружать в Redis cache
- Pros: Easier content management, version control
- Cons: No database-level querying

**Рекомендация**: Hybrid approach - основной контент в JSON файлах, metadata в database

---

#### **5. weak_keys**

Хранит данные о слабых клавишах пользователей (для AI Weak Keys Analyzer).

```sql
CREATE TABLE weak_keys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key VARCHAR(10) NOT NULL,  -- Клавиша (example: "ф", "ы", "в")
    error_count INTEGER DEFAULT 0,
    total_presses INTEGER DEFAULT 0,
    error_rate DECIMAL(5,2) DEFAULT 0.0,  -- Error Rate в процентах (термин из Terminology System)
    last_updated_at TIMESTAMP DEFAULT NOW(),

    -- Indexes
    INDEX idx_weak_keys_user_id (user_id),
    INDEX idx_weak_keys_error_rate (error_rate DESC),
    INDEX idx_weak_keys_user_key (user_id, key),

    -- Constraints
    UNIQUE (user_id, key),
    CHECK (error_rate >= 0 AND error_rate <= 100)
);

COMMENT ON TABLE weak_keys IS 'Слабые клавиши пользователей (Weak Keys - термин из Terminology System)';
COMMENT ON COLUMN weak_keys.error_rate IS 'Частота ошибок на клавише в процентах (Error Rate = errors / total_presses * 100)';
```

**Поля:**
- `id`: Primary key
- `user_id`: Foreign key → users.id
- `key`: Клавиша (single character)
- `error_count`: Количество ошибок на этой клавише
- `total_presses`: Всего нажатий на клавишу
- `error_rate`: Error Rate в процентах
- `last_updated_at`: Последнее обновление

**Weak Keys Detection Logic:**
```python
# В AI Weak Keys Analyzer
weak_keys = db.query(WeakKeys).filter(
    WeakKeys.user_id == user_id,
    WeakKeys.error_count > 3,
    WeakKeys.error_rate > 10.0
).order_by(WeakKeys.error_rate.desc()).limit(10)
```

---

#### **6. subscriptions**

Хранит информацию о подписках пользователей.

```sql
CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan VARCHAR(50) NOT NULL CHECK (plan IN ('free', 'basic', 'premium')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'expired', 'past_due')),
    started_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,  -- NULL для free plan, date для paid plans
    canceled_at TIMESTAMP,
    stripe_subscription_id VARCHAR(255) UNIQUE,  -- Stripe subscription ID (Phase 2+)

    -- Indexes
    INDEX idx_subscriptions_user_id (user_id),
    INDEX idx_subscriptions_status (status),
    INDEX idx_subscriptions_expires_at (expires_at),

    -- Constraints
    UNIQUE (user_id)  -- One active subscription per user
);

COMMENT ON TABLE subscriptions IS 'Подписки пользователей (Subscription management)';
COMMENT ON COLUMN subscriptions.status IS 'active = действующая, canceled = отменена, expired = истекла, past_due = просрочка оплаты';
```

**Поля:**
- `id`: Primary key
- `user_id`: Foreign key → users.id (unique - one subscription per user)
- `plan`: Subscription plan (`free`, `basic`, `premium`)
- `status`: Subscription status
- `started_at`: Дата начала подписки
- `expires_at`: Дата окончания (NULL для free)
- `canceled_at`: Дата отмены
- `stripe_subscription_id`: Stripe ID для payment tracking

**Subscription Logic:**
- `free` plan: `expires_at = NULL`, status = `active` (always)
- `basic`/`premium`: `expires_at` set, status changes based on payment

---

#### **7. payments**

Хранит историю платежей (для analytics и billing).

```sql
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id INTEGER REFERENCES subscriptions(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_method VARCHAR(50),  -- 'stripe', 'paypal', etc.
    stripe_payment_intent_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,

    -- Indexes
    INDEX idx_payments_user_id (user_id),
    INDEX idx_payments_subscription_id (subscription_id),
    INDEX idx_payments_status (status),
    INDEX idx_payments_created_at (created_at DESC),

    -- Constraints
    CHECK (amount >= 0)
);

COMMENT ON TABLE payments IS 'История платежей (Payment tracking)';
COMMENT ON COLUMN payments.status IS 'pending = ожидает, completed = успешно, failed = неудачно, refunded = возврат';
```

**Поля:**
- `id`: Primary key
- `user_id`: Foreign key → users.id
- `subscription_id`: Foreign key → subscriptions.id
- `amount`: Payment amount
- `currency`: Currency code
- `status`: Payment status
- `payment_method`: Payment provider
- `stripe_payment_intent_id`: Stripe payment ID
- `created_at`, `completed_at`: Timestamps

---

### Database Migration Strategy (LocalStorage → PostgreSQL)

**Phase 1 (MVP)** использует LocalStorage:
```javascript
// Текущая структура LocalStorage (из main.js)
{
  "typing_trainer_test_history": [
    {
      "timestamp": 1700000000000,
      "level": "medium",
      "text": "быстрая коричневая лиса...",
      "wpm": 45,
      "accuracy": 92,
      "errors": 5,
      "duration": 60000,
      "totalChars": 150
    }
  ],
  "typing_trainer_current_level": "medium",
  "typing_trainer_best_stats": {
    "bestWPM": 67,
    "bestAccuracy": 98
  },
  "typing_trainer_user_settings": {
    "theme": "dark",
    "soundEnabled": false
  }
}
```

**Phase 2** - Миграция в PostgreSQL:

#### Migration Script (Python)

```python
import json
from datetime import datetime
from typing import List, Dict
from sqlalchemy.orm import Session

def migrate_user_from_localstorage(
    db: Session,
    user_id: int,
    localstorage_data: Dict
) -> None:
    """
    Миграция данных пользователя из LocalStorage в PostgreSQL

    Args:
        db: Database session
        user_id: ID пользователя в новой системе
        localstorage_data: JSON данные из LocalStorage
    """

    # 1. Migrate test history → user_progress
    test_history = localstorage_data.get("typing_trainer_test_history", [])

    for test in test_history:
        progress_entry = UserProgress(
            user_id=user_id,
            lesson_id=f"migrated_lesson_{test.get('level', 'unknown')}",
            wpm=test.get("wpm", 0),
            accuracy=test.get("accuracy", 0.0),
            errors=test.get("errors", 0),
            duration_seconds=test.get("duration", 0) // 1000,  # ms → seconds
            total_chars=test.get("totalChars", 0),
            completed_at=datetime.fromtimestamp(test.get("timestamp", 0) / 1000),
            text_preview=test.get("text", "")[:100]
        )
        db.add(progress_entry)

    # 2. Migrate best stats (опционально - можно вычислить из progress)
    # best_stats = localstorage_data.get("typing_trainer_best_stats", {})
    # (Store в Redis cache или user metadata JSON field)

    # 3. Migrate user settings → users table JSON field или отдельная таблица
    user_settings = localstorage_data.get("typing_trainer_user_settings", {})
    # ... (save to users.settings JSONB field или user_settings table)

    db.commit()
    print(f"✅ Migrated {len(test_history)} test results for user {user_id}")
```

#### Migration API Endpoint

```python
@router.post("/api/v1/users/migrate-from-localstorage")
async def migrate_localstorage_data(
    localstorage_data: Dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict:
    """
    API endpoint для миграции данных из LocalStorage при первом login

    Frontend отправляет все данные из LocalStorage после successful registration/login
    """
    try:
        await migrate_user_from_localstorage(db, current_user.id, localstorage_data)

        # Очищаем LocalStorage на frontend после успешной миграции
        return {
            "status": "success",
            "message": "Data migrated successfully",
            "migrated_items": len(localstorage_data.get("typing_trainer_test_history", []))
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Migration failed: {str(e)}")
```

#### Frontend Migration Flow

```javascript
// После successful login/registration
async function migrateLocalStorageData() {
  // 1. Собираем все данные из LocalStorage
  const localData = {
    typing_trainer_test_history: JSON.parse(localStorage.getItem('typing_trainer_test_history') || '[]'),
    typing_trainer_best_stats: JSON.parse(localStorage.getItem('typing_trainer_best_stats') || '{}'),
    typing_trainer_user_settings: JSON.parse(localStorage.getItem('typing_trainer_user_settings') || '{}'),
    typing_trainer_current_level: localStorage.getItem('typing_trainer_current_level')
  };

  // 2. Отправляем на backend
  const response = await fetch('/api/v1/users/migrate-from-localstorage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify(localData)
  });

  if (response.ok) {
    // 3. Очищаем LocalStorage после успешной миграции
    Object.keys(localStorage)
      .filter(key => key.startsWith('typing_trainer_'))
      .forEach(key => localStorage.removeItem(key));

    console.log('✅ Data migrated to server successfully');
  }
}
```

---

## 🔌 API Endpoints

### API Versioning

All endpoints prefixed with `/api/v1/` для future compatibility.

**Versioning Strategy:**
- `/api/v1/` - Current version
- `/api/v2/` - Future breaking changes (если нужно)
- Deprecation notices за 3 месяца до removal старой версии

---

### Authentication Endpoints

#### `POST /api/v1/auth/register`
**Description:** Регистрация нового пользователя

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "full_name": "Иван Петров" // optional
}
```

**Response (201 Created):**
```json
{
  "user_id": 42,
  "email": "user@example.com",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

**Validation:**
- Email: valid email format, unique
- Password: min 8 characters, max 128 characters
- Full name: optional, max 255 characters

**Errors:**
- `400 Bad Request`: Invalid input (validation errors)
- `409 Conflict`: Email already registered

---

#### `POST /api/v1/auth/login`
**Description:** Вход в систему

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "user_id": 42,
  "email": "user@example.com",
  "subscription_tier": "free",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

**Errors:**
- `401 Unauthorized`: Invalid credentials
- `403 Forbidden`: Account inactive/banned

---

#### `POST /api/v1/auth/refresh`
**Description:** Обновление access token через refresh token

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

**Errors:**
- `401 Unauthorized`: Invalid/expired refresh token

---

#### `POST /api/v1/auth/logout`
**Description:** Выход из системы (invalidates refresh token)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

---

### User Endpoints

#### `GET /api/v1/users/me`
**Description:** Получить информацию о текущем пользователе

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "id": 42,
  "email": "user@example.com",
  "full_name": "Иван Петров",
  "subscription_tier": "free",
  "is_active": true,
  "created_at": "2025-11-16T10:00:00Z",
  "last_login_at": "2025-11-16T15:30:00Z"
}
```

---

#### `GET /api/v1/users/{user_id}/progress`
**Description:** Получить прогресс пользователя (история тестов)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `limit` (int, default=20): Количество результатов
- `offset` (int, default=0): Pagination offset
- `lesson_id` (string, optional): Filter по уроку
- `from_date` (datetime, optional): From date
- `to_date` (datetime, optional): To date

**Response (200 OK):**
```json
{
  "total": 150,
  "results": [
    {
      "id": 1001,
      "lesson_id": "block_1_lesson_3",
      "wpm": 45,
      "accuracy": 92.5,
      "errors": 5,
      "duration_seconds": 120,
      "total_chars": 250,
      "completed_at": "2025-11-16T14:00:00Z",
      "text_preview": "быстрая коричневая лиса..."
    }
  ]
}
```

**Permissions:**
- Users can only access their own progress
- Admins can access any user's progress

---

### Lesson Endpoints

#### `GET /api/v1/lessons`
**Description:** Получить список уроков

**Query Parameters:**
- `block_id` (int, optional): Filter по блоку (1-6)
- `difficulty_level` (string, optional): Filter по сложности
- `is_premium` (bool, optional): Filter free/premium
- `include_content` (bool, default=false): Include lesson content

**Response (200 OK):**
```json
{
  "total": 99,
  "lessons": [
    {
      "id": "block_1_lesson_1",
      "block_id": 1,
      "lesson_number": 1,
      "title": "Тренировка мизинца: клавиши А и Я",
      "description": "Базовая тренировка левого мизинца",
      "difficulty_level": "pinky",
      "target_wpm": 15,
      "max_errors": 5,
      "is_premium": false,
      "is_active": true
    }
  ]
}
```

**Access Control:**
- Free users: только `is_premium = false` уроки (первые 15)
- Premium users: все уроки

---

#### `GET /api/v1/lessons/{lesson_id}`
**Description:** Получить детали урока с контентом

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "id": "block_1_lesson_3",
  "block_id": 1,
  "lesson_number": 3,
  "title": "Тренировка мизинца: клавиши А и Я",
  "difficulty_level": "pinky",
  "target_wpm": 15,
  "max_errors": 5,
  "is_premium": false,
  "content": {
    "language": "ru",
    "text": "фыва фыва фыва яфяф яфяф яфяф",
    "target_keys": ["ф", "ы", "в", "а", "я"]
  }
}
```

**Errors:**
- `404 Not Found`: Lesson не существует
- `403 Forbidden`: Premium урок для free user

**Access Control Logic:**
```python
@router.get("/api/v1/lessons/{lesson_id}")
async def get_lesson(
    lesson_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    lesson = await db.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(404, "Lesson not found")

    # Freemium access control
    if lesson.is_premium and current_user.subscription_tier == "free":
        raise HTTPException(403, "Premium lesson requires subscription")

    return lesson
```

---

### Progress Endpoints

#### `POST /api/v1/progress`
**Description:** Сохранить результат прохождения урока

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "lesson_id": "block_1_lesson_3",
  "wpm": 45,
  "accuracy": 92.5,
  "errors": 5,
  "duration_seconds": 120,
  "total_chars": 250,
  "text_preview": "быстрая коричневая лиса...",
  "device_type": "desktop"
}
```

**Response (201 Created):**
```json
{
  "id": 1001,
  "user_id": 42,
  "lesson_id": "block_1_lesson_3",
  "wpm": 45,
  "accuracy": 92.5,
  "errors": 5,
  "completed_at": "2025-11-16T14:00:00Z",
  "personal_best": true  // True если это новый лучший результат для этого урока
}
```

**Validation:**
- `wpm`: integer, > 0
- `accuracy`: float, 0-100
- `errors`: integer, >= 0
- `duration_seconds`: integer, > 0

---

#### `GET /api/v1/progress/stats`
**Description:** Получить агрегированную статистику пользователя

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `period` (string, default="all"): "all", "week", "month", "year"

**Response (200 OK):**
```json
{
  "user_id": 42,
  "period": "all",
  "total_lessons_completed": 25,
  "total_lessons_available": 99,
  "average_wpm": 52,
  "best_wpm": 67,
  "average_accuracy": 91.5,
  "best_accuracy": 98.0,
  "total_errors": 450,
  "total_time_seconds": 18000,  // 5 hours
  "lessons_by_difficulty": {
    "pinky": 5,
    "ring": 5,
    "middle": 5,
    "index_left": 5,
    "index_right": 3,
    "advanced": 2
  },
  "progress_trend": [
    {"date": "2025-11-10", "avg_wpm": 40},
    {"date": "2025-11-11", "avg_wpm": 42},
    {"date": "2025-11-12", "avg_wpm": 45}
  ]
}
```

---

### AI Analysis Endpoints

#### `POST /api/v1/ai/weak-keys-analysis`
**Description:** Анализ слабых клавиш пользователя через AI

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "user_id": 42,  // optional, defaults to current_user
  "min_error_count": 3,
  "min_error_rate": 10.0
}
```

**Response (200 OK):**
```json
{
  "user_id": 42,
  "weak_keys": [
    {
      "key": "ф",
      "error_count": 12,
      "total_presses": 80,
      "error_rate": 15.0,
      "recommendation": "Тренировать левый мизинец, клавиша Ф. Рекомендуемый урок: block_1_lesson_3"
    },
    {
      "key": "ы",
      "error_count": 8,
      "total_presses": 60,
      "error_rate": 13.3,
      "recommendation": "Тренировать левый безымянный, клавиша Ы. Рекомендуемый урок: block_1_lesson_5"
    }
  ],
  "recommended_lessons": ["block_1_lesson_3", "block_1_lesson_5"],
  "ai_insights": "Фокус на левую руку, особенно мизинец и безымянный палец. Рекомендуется повторить Block 1 уроки."
}
```

**Backend Logic:**
```python
@router.post("/api/v1/ai/weak-keys-analysis")
async def analyze_weak_keys(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # 1. Fetch weak keys from database
    weak_keys_query = await db.execute(
        select(WeakKeys)
        .where(WeakKeys.user_id == current_user.id)
        .where(WeakKeys.error_count > 3)
        .where(WeakKeys.error_rate > 10.0)
        .order_by(WeakKeys.error_rate.desc())
        .limit(10)
    )
    weak_keys = weak_keys_query.scalars().all()

    # 2. AI Analysis (простая версия - rule-based)
    recommendations = []
    for wk in weak_keys:
        # Find lessons that target this key
        lessons = find_lessons_for_key(wk.key)
        recommendations.append({
            "key": wk.key,
            "error_count": wk.error_count,
            "error_rate": wk.error_rate,
            "recommendation": f"Тренировать {get_finger_name(wk.key)}, клавиша {wk.key.upper()}. Рекомендуемый урок: {lessons[0]}"
        })

    # 3. Generate AI insights
    ai_insights = generate_ai_insights(weak_keys, current_user)

    return {
        "user_id": current_user.id,
        "weak_keys": recommendations,
        "recommended_lessons": extract_lesson_ids(recommendations),
        "ai_insights": ai_insights
    }
```

---

### Subscription Endpoints

#### `GET /api/v1/subscription/status`
**Description:** Получить статус подписки пользователя

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "user_id": 42,
  "plan": "free",
  "status": "active",
  "started_at": "2025-11-16T10:00:00Z",
  "expires_at": null,  // null для free plan
  "features": {
    "max_lessons": 15,
    "ai_analysis": false,
    "advanced_stats": false,
    "priority_support": false
  }
}
```

---

#### `POST /api/v1/subscription/upgrade`
**Description:** Апгрейд подписки (создает Stripe checkout session)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "plan": "premium",  // "basic" или "premium"
  "billing_period": "monthly"  // "monthly" или "yearly"
}
```

**Response (200 OK):**
```json
{
  "checkout_session_id": "cs_test_...",
  "checkout_url": "https://checkout.stripe.com/pay/cs_test_...",
  "plan": "premium",
  "price": 9.99,
  "currency": "USD",
  "billing_period": "monthly"
}
```

**Flow:**
1. Frontend calls this endpoint
2. Backend creates Stripe Checkout Session
3. Frontend redirects user to Stripe
4. After payment, Stripe webhook updates subscription status

---

### Payment Endpoints

#### `POST /api/v1/payments/webhook`
**Description:** Webhook для Stripe payment events

**Headers:**
```
Stripe-Signature: <signature>
```

**Request Body:** Stripe Event JSON

**Response (200 OK):**
```json
{
  "received": true
}
```

**Events Handled:**
- `checkout.session.completed`: Создать subscription
- `invoice.payment_succeeded`: Extend subscription
- `invoice.payment_failed`: Mark subscription as past_due
- `customer.subscription.deleted`: Cancel subscription

---

## 🔐 Authentication & Authorization

### JWT Token Strategy

**Access Token:**
- **Lifetime**: 15 minutes (short-lived для security)
- **Storage**: Frontend memory (не LocalStorage!)
- **Payload**:
  ```json
  {
    "sub": "42",  // user_id
    "email": "user@example.com",
    "subscription_tier": "free",
    "iat": 1700000000,
    "exp": 1700000900  // 15 min later
  }
  ```

**Refresh Token:**
- **Lifetime**: 30 days
- **Storage**: HttpOnly cookie (secure, не доступен JS)
- **Payload**:
  ```json
  {
    "sub": "42",
    "type": "refresh",
    "iat": 1700000000,
    "exp": 1702592000  // 30 days later
  }
  ```
- **Rotation**: New refresh token при каждом refresh (для security)

---

### Password Hashing

**Algorithm:** bcrypt (OWASP recommended)

**Implementation:**
```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)
```

**Bcrypt Parameters:**
- **Rounds**: 12 (balanced security vs performance)
- **Salt**: Automatically generated per password

**Why bcrypt:**
- Adaptive hash function (cost factor можно увеличить в будущем)
- Resistant to rainbow table attacks (built-in salt)
- Industry standard

---

### Role-Based Access Control (RBAC)

**Roles (через subscription_tier):**

| Role | Max Lessons | AI Analysis | Advanced Stats | API Rate Limit |
|------|------------|-------------|----------------|----------------|
| **free** | 15 | ❌ | ❌ | 100 req/hour |
| **basic** | 50 | ✅ | ❌ | 500 req/hour |
| **premium** | 99 (all) | ✅ | ✅ | 1000 req/hour |

**Implementation:**
```python
from functools import wraps
from fastapi import Depends, HTTPException

def require_subscription(min_tier: str):
    """Decorator для проверки subscription tier"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, current_user: User = Depends(get_current_user), **kwargs):
            tier_hierarchy = ["free", "basic", "premium"]

            if tier_hierarchy.index(current_user.subscription_tier) < tier_hierarchy.index(min_tier):
                raise HTTPException(
                    status_code=403,
                    detail=f"This feature requires {min_tier} subscription"
                )

            return await func(*args, current_user=current_user, **kwargs)
        return wrapper
    return decorator

# Usage
@router.get("/api/v1/ai/weak-keys-analysis")
@require_subscription("basic")
async def analyze_weak_keys(current_user: User = Depends(get_current_user)):
    # Only basic/premium users can access
    pass
```

---

### Security Best Practices

1. **Password Requirements:**
   - Min 8 characters, max 128
   - Regex: `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$` (at least 1 lowercase, 1 uppercase, 1 digit)

2. **Rate Limiting:**
   - Per user: 100-1000 req/hour (based on tier)
   - Per IP: 1000 req/hour (prevent DDoS)
   - Login attempts: 5 per hour per IP (prevent brute force)

3. **Token Security:**
   - Access token в Authorization header (never в URL!)
   - Refresh token в HttpOnly cookie
   - Rotate refresh tokens при использовании

4. **HTTPS Only:**
   - All API requests через HTTPS
   - `Secure` flag на cookies

5. **CORS Configuration:**
   ```python
   from fastapi.middleware.cors import CORSMiddleware

   app.add_middleware(
       CORSMiddleware,
       allow_origins=["https://typing-trainer.com"],  # Only production domain
       allow_credentials=True,
       allow_methods=["GET", "POST", "PUT", "DELETE"],
       allow_headers=["Authorization", "Content-Type"]
   )
   ```

---

## 💾 Data Migration Strategy

### Phase 1 → Phase 2 Transition

**Challenge:** Existing users имеют данные в LocalStorage, нужно бесшовно перенести в PostgreSQL при первом login.

**Solution:** Client-side migration script + server-side migration endpoint

---

### Migration Workflow

```
┌─────────────┐
│ User opens  │
│ app Phase 2 │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ Has LocalStorage?   │
│ (typing_trainer_*)  │
└──────┬──────────────┘
       │ Yes
       ▼
┌────────────────────────┐
│ Prompt: "We found     │
│ your progress. Login  │
│ to save it online"    │
└──────┬─────────────────┘
       │
       ▼
┌────────────────┐
│ User registers │
│ or logs in     │
└──────┬─────────┘
       │
       ▼
┌──────────────────────────┐
│ POST /api/v1/users/      │
│ migrate-from-localstorage│
│ (sends LocalStorage JSON)│
└──────┬───────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Backend saves to DB:    │
│ - test_history → user_  │
│   progress              │
│ - weak_keys → weak_keys │
│ - settings → users JSON │
└──────┬──────────────────┘
       │
       ▼
┌────────────────────────┐
│ Clear LocalStorage     │
│ typing_trainer_* keys  │
└──────┬─────────────────┘
       │
       ▼
┌────────────────────┐
│ ✅ Migration done │
└────────────────────┘
```

---

### Migration Code (detailed)

**Frontend (main.js):**
```javascript
class DataMigrationService {
    async checkAndMigrate() {
        // 1. Check if migration needed
        if (!this.hasLocalStorageData() || !this.isUserLoggedIn()) {
            return;
        }

        // 2. Collect LocalStorage data
        const localData = this.collectLocalStorageData();

        // 3. Send to backend
        try {
            const response = await fetch('/api/v1/users/migrate-from-localstorage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAccessToken()}`
                },
                body: JSON.stringify(localData)
            });

            if (response.ok) {
                // 4. Clear LocalStorage after successful migration
                this.clearLocalStorage();
                console.log('✅ Data migrated successfully');

                // 5. Show notification to user
                NotificationUtils.success('Ваш прогресс сохранен в облаке!');
            }
        } catch (error) {
            console.error('Migration failed:', error);
            // Keep LocalStorage data if migration failed
        }
    }

    hasLocalStorageData() {
        return localStorage.getItem('typing_trainer_test_history') !== null;
    }

    collectLocalStorageData() {
        return {
            test_history: JSON.parse(localStorage.getItem('typing_trainer_test_history') || '[]'),
            current_level: localStorage.getItem('typing_trainer_current_level'),
            best_stats: JSON.parse(localStorage.getItem('typing_trainer_best_stats') || '{}'),
            user_settings: JSON.parse(localStorage.getItem('typing_trainer_user_settings') || '{}')
        };
    }

    clearLocalStorage() {
        Object.keys(localStorage)
            .filter(key => key.startsWith('typing_trainer_'))
            .forEach(key => localStorage.removeItem(key));
    }
}

// Usage
document.addEventListener('DOMContentLoaded', async () => {
    const migrationService = new DataMigrationService();
    await migrationService.checkAndMigrate();
});
```

**Backend (migration.py):**
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from typing import Dict, List

router = APIRouter(prefix="/api/v1/users", tags=["users"])

@router.post("/migrate-from-localstorage")
async def migrate_from_localstorage(
    migration_data: Dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict:
    """
    Migrate user data from LocalStorage to PostgreSQL

    Принимает JSON с данными из LocalStorage и сохраняет в DB
    """
    try:
        migrated_count = 0

        # 1. Migrate test history → user_progress
        test_history = migration_data.get("test_history", [])
        for test in test_history:
            # Skip invalid entries
            if not all(k in test for k in ["timestamp", "wpm", "accuracy"]):
                continue

            progress_entry = UserProgress(
                user_id=current_user.id,
                lesson_id=test.get("level", "unknown"),  # Legacy: level field → lesson_id
                wpm=test["wpm"],
                accuracy=test["accuracy"],
                errors=test.get("errors", 0),
                duration_seconds=test.get("duration", 0) // 1000,  # ms → seconds
                total_chars=test.get("totalChars", 0),
                completed_at=datetime.fromtimestamp(test["timestamp"] / 1000),
                text_preview=test.get("text", "")[:100],
                device_type="unknown"  # Not tracked in Phase 1
            )

            db.add(progress_entry)
            migrated_count += 1

        # 2. Update current level preference (если есть)
        current_level = migration_data.get("current_level")
        if current_level:
            # Save to user settings или отдельная таблица
            pass

        # 3. Best stats - можно пересчитать из progress или сохранить отдельно
        # (Не критично, т.к. можно вычислить из user_progress)

        # 4. User settings - save to users.settings (JSONB field)
        user_settings = migration_data.get("user_settings", {})
        if user_settings:
            current_user.settings = user_settings

        # Commit all changes
        await db.commit()

        return {
            "status": "success",
            "message": f"Successfully migrated {migrated_count} test results",
            "migrated_count": migrated_count
        }

    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Migration failed: {str(e)}"
        )
```

---

### Data Consistency & Validation

**Migration Validation Checks:**
1. ✅ All required fields present (wpm, accuracy, timestamp)
2. ✅ Data types correct (wpm = int, accuracy = float, etc.)
3. ✅ Value ranges valid (accuracy 0-100, wpm > 0, etc.)
4. ✅ Timestamps reasonable (not future dates)
5. ✅ No duplicate entries (same user + lesson + timestamp)

**Error Handling:**
- Invalid entries skipped (logged for debugging)
- Partial migration success (save what's valid)
- Rollback on critical errors
- Keep LocalStorage data if migration fails (user can retry)

---

## ⚡ Performance Optimization

### 1. Database Indexing

**Primary Indexes:**
```sql
-- Users table
CREATE INDEX idx_users_email ON users(email);  -- Login queries
CREATE INDEX idx_users_subscription ON users(subscription_tier);  -- Analytics

-- UserProgress table
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);  -- User history
CREATE INDEX idx_user_progress_lesson_id ON user_progress(lesson_id);  -- Lesson analytics
CREATE INDEX idx_user_progress_completed_at ON user_progress(completed_at DESC);  -- Recent activity
CREATE INDEX idx_user_progress_user_lesson ON user_progress(user_id, lesson_id);  -- Composite: user's lesson attempts

-- WeakKeys table
CREATE INDEX idx_weak_keys_user_id ON weak_keys(user_id);
CREATE INDEX idx_weak_keys_error_rate ON weak_keys(error_rate DESC);  -- Top weak keys
CREATE INDEX idx_weak_keys_user_key ON weak_keys(user_id, key);  -- Unique constraint enforcement

-- Lessons table
CREATE INDEX idx_lessons_block_id ON lessons(block_id);
CREATE INDEX idx_lessons_difficulty ON lessons(difficulty_level);
CREATE INDEX idx_lessons_is_premium ON lessons(is_premium);  -- Freemium filtering
```

**Index Rationale:**
- Indexes на foreign keys для JOINs
- Indexes на frequently filtered columns (subscription_tier, is_premium)
- Composite indexes для common query patterns (user_id + lesson_id)
- Descending index на completed_at для sorting recent results

---

### 2. Database Connection Pooling

**SQLAlchemy Async Engine Configuration:**
```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# Connection pool settings
engine = create_async_engine(
    DATABASE_URL,
    echo=False,  # Disable SQL logging в production
    pool_size=20,  # Max connections в pool
    max_overflow=10,  # Additional connections when pool full
    pool_timeout=30,  # Timeout waiting для connection
    pool_recycle=3600,  # Recycle connections after 1 hour (prevent stale connections)
    pool_pre_ping=True,  # Check connection health before use
)

async_session_maker = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False  # Keep objects usable after commit
)

# Dependency для FastAPI
async def get_db():
    async with async_session_maker() as session:
        yield session
```

**Why Connection Pooling:**
- **Performance**: Reusing connections избегает overhead создания новых
- **Scalability**: Fixed pool size prevents exhausting database connections
- **Reliability**: `pool_pre_ping` detects stale connections

---

### 3. Redis Caching Strategy

**Cache Layers:**

#### **Layer 1: Lesson Content Cache**
```python
# Lesson content редко меняется → long TTL
LESSON_CACHE_TTL = 3600  # 1 hour

async def get_lesson_content(lesson_id: str, redis: Redis, db: AsyncSession):
    # 1. Try cache first
    cache_key = f"lesson:content:{lesson_id}"
    cached = await redis.get(cache_key)

    if cached:
        return json.loads(cached)

    # 2. Cache miss → fetch from DB
    lesson = await db.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(404, "Lesson not found")

    # 3. Save to cache
    await redis.setex(
        cache_key,
        LESSON_CACHE_TTL,
        json.dumps(lesson_to_dict(lesson))
    )

    return lesson
```

**Cache Invalidation:**
- Manual invalidation при update урока (admin действия)
- TTL expiration для eventual consistency

---

#### **Layer 2: User Stats Cache**
```python
# User stats часто читаются, редко пишутся → cache
USER_STATS_CACHE_TTL = 300  # 5 minutes

async def get_user_stats(user_id: int, redis: Redis, db: AsyncSession):
    cache_key = f"user:stats:{user_id}"
    cached = await redis.get(cache_key)

    if cached:
        return json.loads(cached)

    # Calculate stats from DB (expensive query)
    stats = await calculate_user_stats(user_id, db)

    # Cache result
    await redis.setex(cache_key, USER_STATS_CACHE_TTL, json.dumps(stats))

    return stats

# Invalidate cache при new progress entry
async def save_progress(progress: UserProgress, redis: Redis, db: AsyncSession):
    db.add(progress)
    await db.commit()

    # Invalidate user stats cache
    await redis.delete(f"user:stats:{progress.user_id}")
```

---

#### **Layer 3: Rate Limiting Cache**
```python
# Sliding window rate limiting с Redis
async def check_rate_limit(
    user_id: int,
    endpoint: str,
    limit: int,  # Max requests
    window: int,  # Time window в секундах
    redis: Redis
) -> bool:
    """
    Redis-based sliding window rate limiting

    Returns True if request allowed, False if rate limit exceeded
    """
    key = f"rate_limit:{user_id}:{endpoint}"
    now = time.time()

    # Remove old entries outside window
    await redis.zremrangebyscore(key, 0, now - window)

    # Count requests в window
    count = await redis.zcard(key)

    if count >= limit:
        return False  # Rate limit exceeded

    # Add current request
    await redis.zadd(key, {str(now): now})
    await redis.expire(key, window)  # Auto-cleanup

    return True

# Usage в endpoint
@router.get("/api/v1/lessons")
async def get_lessons(
    current_user: User = Depends(get_current_user),
    redis: Redis = Depends(get_redis)
):
    # Check rate limit
    limit = get_rate_limit_for_tier(current_user.subscription_tier)

    if not await check_rate_limit(current_user.id, "lessons", limit, 3600, redis):
        raise HTTPException(429, "Rate limit exceeded")

    # Process request...
```

---

### 4. Query Optimization

**N+1 Query Prevention:**
```python
# ❌ BAD: N+1 queries
users = await db.execute(select(User))
for user in users:
    progress = await db.execute(
        select(UserProgress).where(UserProgress.user_id == user.id)
    )  # Separate query for each user!

# ✅ GOOD: Single query с JOIN
from sqlalchemy.orm import selectinload

users = await db.execute(
    select(User).options(selectinload(User.progress))
)
```

**Pagination для больших результатов:**
```python
@router.get("/api/v1/users/{user_id}/progress")
async def get_user_progress(
    user_id: int,
    limit: int = 20,  # Default page size
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    # Paginated query
    query = (
        select(UserProgress)
        .where(UserProgress.user_id == user_id)
        .order_by(UserProgress.completed_at.desc())
        .limit(limit)
        .offset(offset)
    )

    results = await db.execute(query)
    return results.scalars().all()
```

**Partial Field Selection:**
```python
# Only select needed columns (reduce data transfer)
query = select(
    UserProgress.id,
    UserProgress.wpm,
    UserProgress.accuracy,
    UserProgress.completed_at
).where(UserProgress.user_id == user_id)
```

---

### 5. Async Operations

**Background Tasks для non-critical operations:**
```python
from fastapi import BackgroundTasks

async def send_welcome_email(email: str):
    # Slow email sending не блокирует response
    await email_service.send(email, "Welcome to Typing Trainer!")

@router.post("/api/v1/auth/register")
async def register(
    user_data: UserCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    # 1. Create user (fast, critical)
    user = await create_user(user_data, db)

    # 2. Send email в background (slow, non-critical)
    background_tasks.add_task(send_welcome_email, user.email)

    # 3. Return response immediately
    return {"user_id": user.id, "message": "User created"}
```

---

### Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| API Response Time (p95) | < 200ms | Prometheus metrics |
| API Response Time (p99) | < 500ms | Prometheus metrics |
| Database Query Time | < 50ms | SQLAlchemy logging |
| Cache Hit Ratio | > 80% | Redis INFO stats |
| Throughput | 1000 req/sec | Load testing (Locust) |

---

## 🔒 Security Considerations

### 1. Input Validation

**Pydantic Models для всех inputs:**
```python
from pydantic import BaseModel, EmailStr, constr, validator

class UserCreate(BaseModel):
    email: EmailStr  # Automatic email validation
    password: constr(min_length=8, max_length=128)  # type: ignore
    full_name: constr(max_length=255) | None = None  # type: ignore

    @validator('password')
    def password_strength(cls, v):
        # Enforce password complexity
        if not re.match(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$', v):
            raise ValueError(
                'Password must contain at least 1 lowercase, 1 uppercase, and 1 digit'
            )
        return v
```

**SQL Injection Prevention:**
- ✅ SQLAlchemy ORM automatically escapes inputs
- ✅ Parameterized queries для raw SQL
- ❌ Never concat user input в SQL strings

**XSS Prevention:**
- API returns JSON (не HTML) → less XSS risk
- Frontend sanitizes HTML перед display
- Content-Security-Policy headers

---

### 2. CORS Configuration

**Strict CORS для production:**
```python
from fastapi.middleware.cors import CORSMiddleware

# Production CORS settings
ALLOWED_ORIGINS = [
    "https://typing-trainer.com",
    "https://www.typing-trainer.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # Only production domains
    allow_credentials=True,  # Allow cookies
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
    max_age=3600  # Cache preflight requests
)
```

---

### 3. Rate Limiting

**Multi-Layer Rate Limiting:**

**Layer 1: Per-IP Rate Limiting (DDoS protection)**
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.get("/api/v1/lessons")
@limiter.limit("1000/hour")  # 1000 requests per hour per IP
async def get_lessons():
    pass
```

**Layer 2: Per-User Rate Limiting (subscription-based)**
```python
# Different limits based on subscription tier
RATE_LIMITS = {
    "free": 100,     # 100 req/hour
    "basic": 500,    # 500 req/hour
    "premium": 1000  # 1000 req/hour
}

async def check_user_rate_limit(
    current_user: User,
    redis: Redis
):
    limit = RATE_LIMITS[current_user.subscription_tier]

    if not await check_rate_limit(current_user.id, "api", limit, 3600, redis):
        raise HTTPException(429, "Rate limit exceeded for your subscription tier")
```

**Layer 3: Endpoint-Specific Limits (prevent abuse)**
```python
# Login endpoint - prevent brute force
@app.post("/api/v1/auth/login")
@limiter.limit("5/hour")  # Only 5 login attempts per hour per IP
async def login():
    pass
```

---

### 4. Security Headers

```python
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.sessions import SessionMiddleware

# Only allow requests from trusted hosts
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["typing-trainer.com", "*.typing-trainer.com"]
)

# Security headers
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)

    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'"

    return response
```

---

### 5. Data Encryption

**Encryption at Rest:**
- PostgreSQL: Enable `pgcrypto` extension для sensitive fields
- Backups: Encrypt database backups

**Encryption in Transit:**
- HTTPS only (TLS 1.3)
- Database connections через SSL/TLS

**Sensitive Data Handling:**
```python
# Never log sensitive data
logger.info(f"User {user.id} logged in")  # ✅ OK
logger.info(f"User {user.email} password: {password}")  # ❌ NEVER!

# Mask sensitive data в responses
class UserResponse(BaseModel):
    id: int
    email: str
    # password_hash не включаем в response!
```

---

### 6. Vulnerability Scanning

**Dependency Scanning:**
```bash
# Check для known vulnerabilities
pip-audit

# Keep dependencies updated
pip list --outdated
```

**Static Analysis:**
```bash
# Security linting
bandit -r app/

# Type checking (prevents some bugs)
mypy app/
```

---

## 📈 Scalability Strategy

### 1. Horizontal Scaling

**Stateless API Design:**
- ✅ No session state на API server (все в JWT tokens)
- ✅ Shared Redis для session storage
- ✅ Shared PostgreSQL database
- ✅ API instances за load balancer

**Architecture:**
```
                    ┌──────────────┐
                    │ Load Balancer│
                    │  (Nginx)     │
                    └───────┬──────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
     ┌────▼────┐       ┌────▼────┐      ┌────▼────┐
     │ FastAPI │       │ FastAPI │      │ FastAPI │
     │Instance1│       │Instance2│      │Instance3│
     └────┬────┘       └────┬────┘      └────┬────┘
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
     ┌────▼──────┐    ┌─────▼─────┐    ┌─────▼─────┐
     │PostgreSQL │    │   Redis   │    │  Storage  │
     │(Primary)  │    │  (Cache)  │    │   (S3)    │
     └───────────┘    └───────────┘    └───────────┘
```

**Scaling Metrics:**
- **1-1000 users**: Single API instance + single DB
- **1000-10000 users**: 3-5 API instances + DB read replicas
- **10000+ users**: Auto-scaling API instances + DB sharding (если нужно)

---

### 2. Database Scaling

**Read Replicas для read-heavy workloads:**
```python
from sqlalchemy import create_engine

# Primary database (writes)
primary_engine = create_async_engine(PRIMARY_DB_URL)

# Read replica (reads)
replica_engine = create_async_engine(REPLICA_DB_URL)

async def get_db_write():
    """Use primary DB для writes"""
    async with primary_engine.begin() as conn:
        yield conn

async def get_db_read():
    """Use replica DB для reads"""
    async with replica_engine.begin() as conn:
        yield conn

# Usage
@router.get("/api/v1/lessons")
async def get_lessons(db: AsyncSession = Depends(get_db_read)):
    # Read from replica
    pass

@router.post("/api/v1/progress")
async def save_progress(db: AsyncSession = Depends(get_db_write)):
    # Write to primary
    pass
```

**Connection Pooling per Instance:**
- Each API instance: 20 connections в pool
- 5 API instances: 100 total connections
- PostgreSQL max_connections: 200 (safe buffer)

---

### 3. Caching Strategy

**Multi-Level Cache:**
1. **L1 Cache**: In-memory cache на API instance (для ultra-hot data)
2. **L2 Cache**: Redis (shared между instances)
3. **L3 Cache**: Database (source of truth)

**Cache-Aside Pattern:**
```python
async def get_with_cache(key: str, fetch_func, redis: Redis, ttl: int):
    # L2: Try Redis cache
    cached = await redis.get(key)
    if cached:
        return json.loads(cached)

    # L3: Fetch from database
    data = await fetch_func()

    # Update L2 cache
    await redis.setex(key, ttl, json.dumps(data))

    return data
```

---

### 4. Async Everywhere

**FastAPI Async Handlers:**
```python
@router.get("/api/v1/users/me")
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # All IO operations async
    progress = await get_user_progress(current_user.id, db)
    stats = await get_user_stats(current_user.id, db)

    return {
        "user": current_user,
        "progress": progress,
        "stats": stats
    }
```

**Why Async:**
- Single thread handles 1000s concurrent connections
- No blocking на IO operations (DB, Redis, external APIs)
- Better resource utilization

---

### 5. Monitoring & Auto-Scaling

**Metrics to Monitor:**
- CPU usage: Auto-scale если > 70%
- Memory usage: Alert если > 80%
- Request latency: Alert если p95 > 500ms
- Error rate: Alert если > 1%
- Database connection pool: Alert если exhausted

**Auto-Scaling Rules (Kubernetes HPA):**
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: fastapi-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: fastapi-deployment
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70  # Scale up if CPU > 70%
```

---

## 🧪 Testing Strategy

### 1. Unit Tests

**Test Database Models:**
```python
import pytest
from app.models import User, UserProgress

@pytest.mark.asyncio
async def test_create_user(db_session):
    user = User(
        email="test@example.com",
        password_hash="hashed_password",
        subscription_tier="free"
    )
    db_session.add(user)
    await db_session.commit()

    assert user.id is not None
    assert user.email == "test@example.com"
    assert user.subscription_tier == "free"

@pytest.mark.asyncio
async def test_user_progress_relationship(db_session):
    user = User(email="test@example.com", password_hash="hash")
    progress = UserProgress(
        user_id=user.id,
        lesson_id="block_1_lesson_1",
        wpm=45,
        accuracy=92.5
    )

    db_session.add_all([user, progress])
    await db_session.commit()

    assert progress.user_id == user.id
```

---

### 2. Integration Tests

**Test API Endpoints:**
```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_register_user(client: AsyncClient):
    response = await client.post("/api/v1/auth/register", json={
        "email": "newuser@example.com",
        "password": "SecurePass123!"
    })

    assert response.status_code == 201
    data = response.json()
    assert "user_id" in data
    assert "access_token" in data
    assert data["email"] == "newuser@example.com"

@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient):
    response = await client.post("/api/v1/auth/login", json={
        "email": "user@example.com",
        "password": "WrongPassword"
    })

    assert response.status_code == 401
    assert "Invalid credentials" in response.json()["detail"]

@pytest.mark.asyncio
async def test_get_premium_lesson_as_free_user(client: AsyncClient, free_user_token):
    response = await client.get(
        "/api/v1/lessons/block_6_lesson_50",
        headers={"Authorization": f"Bearer {free_user_token}"}
    )

    assert response.status_code == 403
    assert "requires subscription" in response.json()["detail"]
```

---

### 3. API Tests (OpenAPI Spec Validation)

**Generate Tests from OpenAPI Spec:**
```python
# Using schemathesis для property-based testing
import schemathesis

schema = schemathesis.from_uri("http://localhost:8000/openapi.json")

@schema.parametrize()
def test_api(case):
    # Automatically tests all endpoints с valid/invalid inputs
    case.call_and_validate()
```

---

### 4. Load Testing

**Locust Load Test:**
```python
from locust import HttpUser, task, between

class TypingTrainerUser(HttpUser):
    wait_time = between(1, 3)  # Wait 1-3 sec между requests

    def on_start(self):
        # Login once
        response = self.client.post("/api/v1/auth/login", json={
            "email": "loadtest@example.com",
            "password": "TestPass123!"
        })
        self.token = response.json()["access_token"]

    @task(3)
    def get_lessons(self):
        self.client.get(
            "/api/v1/lessons",
            headers={"Authorization": f"Bearer {self.token}"}
        )

    @task(1)
    def save_progress(self):
        self.client.post(
            "/api/v1/progress",
            json={
                "lesson_id": "block_1_lesson_1",
                "wpm": 45,
                "accuracy": 92.5,
                "errors": 3,
                "duration_seconds": 120,
                "total_chars": 250
            },
            headers={"Authorization": f"Bearer {self.token}"}
        )

# Run: locust -f loadtest.py --host=http://localhost:8000
```

**Load Test Targets:**
- 1000 concurrent users
- p95 response time < 200ms
- 0% error rate

---

### 5. Test Coverage

**Coverage Target:** ≥ 80%

```bash
# Run tests с coverage
pytest --cov=app --cov-report=html

# View coverage report
open htmlcov/index.html
```

---

## 🚀 Deployment Architecture

### Docker Setup

**Dockerfile:**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY app/ ./app/
COPY alembic/ ./alembic/
COPY alembic.ini .

# Run migrations и start server
CMD alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**docker-compose.yml (Local Development):**
```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://postgres:password@db:5432/typing_trainer
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=dev_secret_change_in_production
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: typing_trainer
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

---

### Production Deployment (Phase 3)

**Platform Options:**
1. **Render/Railway** (easiest, для MVP)
   - Pros: Zero DevOps, auto-deploy from Git
   - Cons: Limited scaling, higher cost at scale

2. **DigitalOcean App Platform** (balanced)
   - Pros: Good balance cost/features, managed DB
   - Cons: Less flexible than Kubernetes

3. **AWS ECS + RDS** (enterprise)
   - Pros: Full control, best scaling, AWS ecosystem
   - Cons: Complex setup, requires DevOps expertise

**Recommended for Phase 2:** Render или Railway (fast time-to-market)

---

## 📚 Related Documents

- **[Terminology System](../domain/typing-terminology.md)** - Unified terminology
- **[Specification Workflow](../processes/Specification_Workflow.md)** - Spec process
- **[Spec 006 - Accessibility](../specs/006_Accessibility_Compliance_Specification.md)** - Accessibility requirements для API
- **[Frontend Architecture](./Frontend_Architecture.md)** - Frontend design (to be created)
- **[C4 Architecture Diagrams](./C4_Architecture_Diagrams.md)** - Visual architecture (Тимофей creating)

---

## 🔄 Changelog

### [2025-11-16] - Version 1.0 (Draft)
- ✅ Создан Backend Architecture документ
- ✅ Technology Stack определен (FastAPI, PostgreSQL, Redis, SQLAlchemy, Alembic, Pydantic)
- ✅ Database Schema спроектирован (7 таблиц: users, user_progress, lessons, lesson_content, weak_keys, subscriptions, payments)
- ✅ API Endpoints спроектированы (auth, users, lessons, progress, AI, subscriptions, payments)
- ✅ Authentication & Authorization (JWT, bcrypt, RBAC)
- ✅ Data Migration Strategy (LocalStorage → PostgreSQL с client-side и server-side migration)
- ✅ Performance Optimization (indexing, connection pooling, Redis caching, async operations)
- ✅ Security Considerations (input validation, SQL injection prevention, XSS, CORS, rate limiting, encryption)
- ✅ Scalability Strategy (horizontal scaling, database scaling, multi-level caching, monitoring)
- ✅ Testing Strategy (unit, integration, API, load tests)
- ✅ Deployment Architecture (Docker, docker-compose, production options)

**Next Steps:**
- [ ] Review от Клода (Architect)
- [ ] Approval от Ивана (Product Owner)
- [ ] Создать Implementation Plan
- [ ] Начать Phase 2 implementation

---

**Maintained by:** Борис (Backend Developer)
**Last Updated:** 16 ноября 2025
**Status:** 🟡 Draft
**Version:** 1.0
