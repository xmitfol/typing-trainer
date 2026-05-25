**🗄****️**** Database Schema Design**
**Typing Trainer SaaS - ****Детальная**** ****схема**** ****базы**** ****данных**
**Версия:** 1.0
**Дата:** 09 октября 2025
**СУБД:** PostgreSQL 15+
**Связанные документы:** 

**📋**** Содержание**







**🏗****️ Общая архитектура**
**ER-диаграмма (упрощенная)**
┌──────────┐       ┌──────────────┐       ┌─────────┐
│  Users   │──────<│  Subscriptions│       │ Courses │
└────┬─────┘       └──────────────┘       └────┬────┘
     │                                          │
     │                                          │
     │  ┌──────────┐                           │
     └─<│ Progress │>──────────────────────────┘
        └────┬─────┘                           │
             │                                  │
             │                            ┌────▼────┐
             │                            │ Lessons │
             │                            └────┬────┘
             │                                 │
        ┌────▼────────┐                       │
        │  Sessions   │<──────────────────────┘
        └────┬────────┘
             │
        ┌────▼────────┐
        │ Keystrokes  │  (TimescaleDB)
        └─────────────┘

        ┌─────────────┐
        │Achievements │
        └──────┬──────┘
               │
        ┌──────▼────────────┐
        │UserAchievements  │
        └───────────────────┘
**Принципы проектирования**
**1. Нормализация**
3NF (Third Normal Form) для основных таблиц
Денормализация для аналитических запросов
**2. ****Temporal**** Data**
Timestamps на каждой таблице (created_at, updated_at)
Soft deletes (deleted_at)
Audit trail для критичных операций
**3. Performance**
Индексы на внешние ключи
Composite индексы для частых запросов
Партиционирование для больших таблиц (keystrokes)
**4. ****Scalability**
UUID для распределенных систем (опционально)
Партиционирование по датам
Read replicas support

**📊**** Схема таблиц**
**1. ****Users**** (Пользователи)**
CREATE TABLE users (
    id SERIAL PRIMARY KEY,

    -- Authentication
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,

    -- Profile
    username VARCHAR(100) UNIQUE,
    full_name VARCHAR(255),
    avatar_url TEXT,

    -- Settings
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    theme VARCHAR(20) DEFAULT 'light',

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_premium BOOLEAN DEFAULT FALSE,
    is_admin BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,

    -- OAuth
    oauth_provider VARCHAR(50),  -- 'google', 'github', etc.
    oauth_id VARCHAR(255),

    -- GDPR
    consent_analytics BOOLEAN DEFAULT TRUE,
    consent_marketing BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP,
    last_login_at TIMESTAMP,

    -- Constraints
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_language CHECK (language IN ('en', 'ru', 'es', 'de', 'fr'))
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_oauth ON users(oauth_provider, oauth_id);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = TRUE;

**2. Courses (****Курсы****)**
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,

    -- Identity
    slug VARCHAR(100) UNIQUE NOT NULL,  -- 'adults-en-v1'
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Metadata
    language VARCHAR(10) NOT NULL,
    age_group VARCHAR(20) NOT NULL,  -- 'adults', 'teens', 'kids'
    version VARCHAR(20) DEFAULT '1.0.0',

    -- Settings
    total_lessons INTEGER NOT NULL,
    total_blocks INTEGER NOT NULL,
    estimated_duration INTEGER,  -- minutes
    target_wpm INTEGER,
    target_accuracy DECIMAL(5,2),

    -- Status
    is_published BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,

    -- Media
    thumbnail_url TEXT,
    cover_image_url TEXT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    published_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_courses_slug ON courses(slug);
CREATE INDEX idx_courses_language ON courses(language);
CREATE INDEX idx_courses_published ON courses(is_published) WHERE is_published = TRUE;

**3. Lessons (****Уроки****)**
CREATE TABLE lessons (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

    -- Identity
    lesson_number INTEGER NOT NULL,  -- 1-99
    block_number INTEGER NOT NULL,   -- 1-7

    -- Content
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructions TEXT,

    -- Exercise content
    text_content TEXT NOT NULL,
    text_length INTEGER NOT NULL,

    -- Objectives
    target_wpm INTEGER NOT NULL,
    target_accuracy DECIMAL(5,2) NOT NULL,
    target_duration INTEGER,  -- seconds

    -- Keys
    target_keys JSONB,  -- ["a", "s", "d", "f"]

    -- Settings
    difficulty INTEGER DEFAULT 1,  -- 1-5
    exercise_type VARCHAR(50),  -- 'drill', 'words', 'sentences', 'paragraphs'

    -- Unlocking
    unlock_requirements JSONB,  -- {"previous_lesson_stars": 2}

    -- Hints
    hints JSONB,  -- ["Hint 1", "Hint 2"]

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Constraints
    UNIQUE(course_id, lesson_number),
    CONSTRAINT valid_difficulty CHECK (difficulty BETWEEN 1 AND 5)
);

-- Indexes
CREATE INDEX idx_lessons_course ON lessons(course_id);
CREATE INDEX idx_lessons_block ON lessons(course_id, block_number);
CREATE INDEX idx_lessons_number ON lessons(course_id, lesson_number);

**4. Progress (****Прогресс**** ****пользователя****)**
CREATE TABLE progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,

    -- Completion
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,

    -- Best results
    best_wpm INTEGER,
    best_accuracy DECIMAL(5,2),
    best_rating INTEGER,  -- 1-5 stars
    best_session_id INTEGER,  -- reference to sessions

    -- Attempts
    attempt_count INTEGER DEFAULT 0,

    -- Status
    is_unlocked BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Constraints
    UNIQUE(user_id, lesson_id),
    CONSTRAINT valid_rating CHECK (best_rating BETWEEN 1 AND 5)
);

-- Indexes
CREATE INDEX idx_progress_user ON progress(user_id);
CREATE INDEX idx_progress_lesson ON progress(lesson_id);
CREATE INDEX idx_progress_user_course ON progress(user_id, course_id);
CREATE INDEX idx_progress_completed ON progress(user_id, is_completed) WHERE is_completed = TRUE;

**5. Sessions (****Сессии**** ****печати****)**
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,

    -- Results
    wpm INTEGER NOT NULL,
    accuracy DECIMAL(5,2) NOT NULL,
    duration INTEGER NOT NULL,  -- milliseconds
    errors INTEGER NOT NULL,

    -- Rating
    rating INTEGER NOT NULL,  -- 1-5 stars

    -- Detailed stats
    total_keystrokes INTEGER NOT NULL,
    correct_keystrokes INTEGER NOT NULL,

    -- Timing
    avg_keystroke_time INTEGER,  -- milliseconds
    max_pause_duration INTEGER,  -- longest pause
    pause_count INTEGER,

    -- Context
    device_type VARCHAR(50),  -- 'desktop', 'laptop', 'tablet'
    keyboard_layout VARCHAR(50),  -- 'qwerty', 'йцукен'

    -- Flags
    is_practice BOOLEAN DEFAULT FALSE,  -- vs actual attempt
    is_completed BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,

    -- Constraints
    CONSTRAINT valid_rating CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT valid_accuracy CHECK (accuracy BETWEEN 0 AND 100)
);

-- Indexes
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_lesson ON sessions(lesson_id);
CREATE INDEX idx_sessions_user_date ON sessions(user_id, created_at DESC);
CREATE INDEX idx_sessions_rating ON sessions(user_id, rating);

**6. Keystrokes (****Нажатия**** ****клавиш****) - TimescaleDB**
-- Convert to hypertable for time-series data
CREATE TABLE keystrokes (
    id BIGSERIAL,
    session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL,  -- Denormalized for faster queries

    -- Keystroke data
    expected CHAR(1) NOT NULL,
    actual CHAR(1) NOT NULL,
    correct BOOLEAN NOT NULL,

    -- Timing
    latency INTEGER NOT NULL,  -- ms from previous key
    timestamp BIGINT NOT NULL,  -- Unix timestamp

    -- Context
    finger VARCHAR(20),  -- 'index_left', 'pinky_right', etc.
    key_code VARCHAR(20),  -- 'KeyA', 'Space', etc.

    -- Position in text
    text_index INTEGER NOT NULL,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),

    PRIMARY KEY (id, created_at)
);

-- Convert to TimescaleDB hypertable (for high-volume time-series data)
SELECT create_hypertable('keystrokes', 'created_at', chunk_time_interval => INTERVAL '1 week');

-- Indexes
CREATE INDEX idx_keystrokes_session ON keystrokes(session_id, created_at DESC);
CREATE INDEX idx_keystrokes_user ON keystrokes(user_id, created_at DESC);
CREATE INDEX idx_keystrokes_key ON keystrokes(expected, created_at DESC);

-- Retention policy (keep only 6 months of raw data)
SELECT add_retention_policy('keystrokes', INTERVAL '6 months');

**7. Subscriptions (****Подписки****)**
CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Stripe data
    stripe_subscription_id VARCHAR(255) UNIQUE,
    stripe_customer_id VARCHAR(255),
    stripe_price_id VARCHAR(255),

    -- Plan
    plan_name VARCHAR(50) NOT NULL,  -- 'free', 'premium', 'professional'
    billing_interval VARCHAR(20),  -- 'monthly', 'yearly'

    -- Pricing
    amount INTEGER NOT NULL,  -- cents
    currency VARCHAR(3) DEFAULT 'USD',

    -- Status
    status VARCHAR(50) NOT NULL,  -- 'active', 'canceled', 'past_due', 'trialing'

    -- Dates
    trial_start TIMESTAMP,
    trial_end TIMESTAMP,
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    canceled_at TIMESTAMP,
    ended_at TIMESTAMP,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_plan CHECK (plan_name IN ('free', 'premium', 'professional', 'enterprise')),
    CONSTRAINT valid_status CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete'))
);

-- Indexes
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status) WHERE status = 'active';

**8. Achievements (****Достижения****)**
CREATE TABLE achievements (
    id SERIAL PRIMARY KEY,

    -- Identity
    slug VARCHAR(100) UNIQUE NOT NULL,  -- 'speed_demon'
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Display
    icon_url TEXT,
    color VARCHAR(7),  -- Hex color

    -- Criteria (JSON)
    criteria JSONB NOT NULL,  -- {"wpm": {"min": 100}, "accuracy": {"min": 95}}

    -- Rewards
    points INTEGER DEFAULT 0,
    badge_tier VARCHAR(20),  -- 'bronze', 'silver', 'gold', 'platinum'

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_hidden BOOLEAN DEFAULT FALSE,  -- Secret achievements

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_achievements_slug ON achievements(slug);
CREATE INDEX idx_achievements_active ON achievements(is_active) WHERE is_active = TRUE;

**9. User Achievements (****Достижения**** ****пользователей****)**
CREATE TABLE user_achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id INTEGER NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,

    -- Context
    session_id INTEGER REFERENCES sessions(id),  -- Which session unlocked it

    -- Timestamps
    earned_at TIMESTAMP DEFAULT NOW(),

    -- Constraints
    UNIQUE(user_id, achievement_id)
);

-- Indexes
CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement ON user_achievements(achievement_id);

**10. AI Recommendations (AI ****рекомендации****)**
CREATE TABLE ai_recommendations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Type
    recommendation_type VARCHAR(50) NOT NULL,  -- 'weak_keys', 'plateau', 'practice_plan'

    -- Content
    title VARCHAR(255) NOT NULL,
    description TEXT,
    action_items JSONB,  -- [{"type": "lesson", "id": 15}, ...]

    -- Priority
    priority INTEGER DEFAULT 1,  -- 1-5

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_dismissed BOOLEAN DEFAULT FALSE,
    is_completed BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    dismissed_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_ai_recommendations_user ON ai_recommendations(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_ai_recommendations_type ON ai_recommendations(recommendation_type);

**11. Analytics Summary (****Агрегированная**** ****аналитика****)**
-- Daily user statistics (pre-calculated)
CREATE TABLE analytics_daily (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Date
    date DATE NOT NULL,

    -- Activity
    sessions_count INTEGER DEFAULT 0,
    total_duration INTEGER DEFAULT 0,  -- seconds
    lessons_completed INTEGER DEFAULT 0,

    -- Performance
    avg_wpm INTEGER,
    max_wpm INTEGER,
    avg_accuracy DECIMAL(5,2),
    total_keystrokes INTEGER,
    total_errors INTEGER,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Constraints
    UNIQUE(user_id, date)
);

-- Indexes
CREATE INDEX idx_analytics_user_date ON analytics_daily(user_id, date DESC);

**🔗**** Связи и индексы**
**Основные связи**
-- Users -> Progress (One-to-Many)
-- Users -> Sessions (One-to-Many)
-- Users -> Subscriptions (One-to-Many)
-- Users -> UserAchievements (One-to-Many)

-- Courses -> Lessons (One-to-Many)
-- Courses -> Progress (One-to-Many)

-- Lessons -> Progress (One-to-Many)
-- Lessons -> Sessions (One-to-Many)

-- Sessions -> Keystrokes (One-to-Many)

-- Achievements -> UserAchievements (One-to-Many)
**Composite ****индексы**** ****для**** ****частых**** ****запросов**
-- User's course progress
CREATE INDEX idx_progress_user_course_completed 
ON progress(user_id, course_id, is_completed);

-- Lesson completion leaderboard
CREATE INDEX idx_progress_lesson_rating 
ON progress(lesson_id, best_rating DESC, best_wpm DESC);

-- User's recent sessions
CREATE INDEX idx_sessions_user_recent 
ON sessions(user_id, created_at DESC) 
WHERE is_completed = TRUE;

-- Weak keys analysis
CREATE INDEX idx_keystrokes_user_errors 
ON keystrokes(user_id, expected, correct) 
WHERE correct = FALSE;

**📂**** ****Партиционирование**
**Keystrokes Table Partitioning**
-- Partition by month for better performance
CREATE TABLE keystrokes_2025_10 PARTITION OF keystrokes
    FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

CREATE TABLE keystrokes_2025_11 PARTITION OF keystrokes
    FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

-- Auto-create partitions
CREATE OR REPLACE FUNCTION create_monthly_partition()
RETURNS void AS $$
DECLARE
    partition_date DATE;
    partition_name TEXT;
    start_date TEXT;
    end_date TEXT;
BEGIN
    partition_date := DATE_TRUNC('month', NOW() + INTERVAL '1 month');
    partition_name := 'keystrokes_' || TO_CHAR(partition_date, 'YYYY_MM');
    start_date := partition_date::TEXT;
    end_date := (partition_date + INTERVAL '1 month')::TEXT;

    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF keystrokes FOR VALUES FROM (%L) TO (%L)',
        partition_name, start_date, end_date
    );
END;
$$ LANGUAGE plpgsql;

-- Schedule to run monthly
SELECT cron.schedule('create-partition', '0 0 1 * *', 'SELECT create_monthly_partition()');

**🔄**** ****Миграции**
**Alembic Migration Structure**
# alembic/versions/001_initial_schema.py
"""Initial schema

Revision ID: 001
Create Date: 2025-10-09

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    # Users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('username', sa.String(100)),
        sa.Column('full_name', sa.String(255)),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('is_premium', sa.Boolean(), default=False),
        sa.Column('created_at', sa.TIMESTAMP(), default=sa.func.now()),
        sa.Column('updated_at', sa.TIMESTAMP(), default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )

    op.create_index('idx_users_email', 'users', ['email'])

    # Continue with other tables...

def downgrade():
    op.drop_table('users')

**📝**** Примеры запросов**
**1. Получить прогресс пользователя по курсу**
SELECT 
    c.name as course_name,
    COUNT(DISTINCT p.lesson_id) as completed_lessons,
    c.total_lessons,
    ROUND(COUNT(DISTINCT p.lesson_id)::NUMERIC / c.total_lessons * 100, 2) as completion_percentage,
    AVG(p.best_wpm) as avg_wpm,
    AVG(p.best_accuracy) as avg_accuracy,
    MAX(p.best_wpm) as max_wpm
FROM progress p
JOIN lessons l ON p.lesson_id = l.id
JOIN courses c ON l.course_id = c.id
WHERE p.user_id = 123 
  AND p.is_completed = TRUE
  AND c.id = 1
GROUP BY c.id, c.name, c.total_lessons;
**2. Найти слабые клавиши пользователя**
WITH key_stats AS (
    SELECT 
        k.expected as key,
        COUNT(*) as total_presses,
        SUM(CASE WHEN k.correct = FALSE THEN 1 ELSE 0 END) as errors,
        AVG(k.latency) as avg_latency,
        ROUND(SUM(CASE WHEN k.correct = FALSE THEN 1 ELSE 0 END)::NUMERIC / COUNT(*) * 100, 2) as error_rate
    FROM keystrokes k
    WHERE k.user_id = 123
      AND k.created_at >= NOW() - INTERVAL '7 days'
    GROUP BY k.expected
)
SELECT *
FROM key_stats
WHERE error_rate > 10 OR avg_latency > 300
ORDER BY error_rate DESC, avg_latency DESC
LIMIT 5;
**3. Leaderboard ****по**** ****уроку**
SELECT 
    u.username,
    u.avatar_url,
    p.best_wpm,
    p.best_accuracy,
    p.best_rating,
    p.completed_at,
    RANK() OVER (ORDER BY p.best_wpm DESC, p.best_accuracy DESC) as rank
FROM progress p
JOIN users u ON p.user_id = u.id
WHERE p.lesson_id = 45
  AND p.is_completed = TRUE
  AND u.is_active = TRUE
ORDER BY rank
LIMIT 100;
**4. Дневная статистика пользователя**
SELECT 
    date,
    sessions_count,
    total_duration / 60 as total_minutes,
    lessons_completed,
    avg_wpm,
    max_wpm,
    avg_accuracy
FROM analytics_daily
WHERE user_id = 123
  AND date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date DESC;
**5. AI: ****Анализ**** ****паттернов**** ****ошибок**
-- Find bigrams (two-key combinations) with high error rates
WITH bigrams AS (
    SELECT 
        k1.expected || k2.expected as bigram,
        COUNT(*) as total,
        SUM(CASE WHEN k2.correct = FALSE THEN 1 ELSE 0 END) as errors,
        ROUND(SUM(CASE WHEN k2.correct = FALSE THEN 1 ELSE 0 END)::NUMERIC / COUNT(*) * 100, 2) as error_rate
    FROM keystrokes k1
    JOIN keystrokes k2 ON k1.session_id = k2.session_id 
                      AND k2.text_index = k1.text_index + 1
    WHERE k1.user_id = 123
      AND k1.created_at >= NOW() - INTERVAL '7 days'
    GROUP BY k1.expected, k2.expected
    HAVING COUNT(*) >= 10  -- Sufficient data
)
SELECT *
FROM bigrams
WHERE error_rate > 15
ORDER BY error_rate DESC, total DESC
LIMIT 10;

**🔧**** ****Утилиты**** ****и**** ****функции**
**Automatic Updated_at Trigger**
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ... repeat for other tables
**Soft Delete Function**
CREATE OR REPLACE FUNCTION soft_delete_user(user_id_param INTEGER)
RETURNS void AS $$
BEGIN
    UPDATE users 
    SET 
        deleted_at = NOW(),
        is_active = FALSE,
        email = 'deleted_' || id || '@deleted.com'  -- Anonymize
    WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql;

**📊**** Производительность**
**Expected**** ****Table**** ****Sizes**
**Total:** ~203 GB/год (большая часть - keystrokes)
**Optimization**** ****Strategies**
**Keystrokes****:** TimescaleDB + compression + retention policy
**Sessions:** Partition by month if > 100M rows
**Analytics:** Pre-calculate daily/weekly summaries
**Read**** ****Replicas****:** для аналитических запросов

**Статус:** ✅ Готово к реализации
**Следующий документ:** AI/ML Architecture
**Дата:** 09 октября 2025


| Таблица | Строк (1 год) | Размер |
| --- | --- | --- |
| users | 100,000 | ~50 MB |
| courses | 50 | <1 MB |
| lessons | 5,000 | ~10 MB |
| progress | 5,000,000 | ~500 MB |
| sessions | 10,000,000 | ~2 GB |
| keystrokes | 5,000,000,000 | ~200 GB |
| subscriptions | 20,000 | ~5 MB |
| achievements | 100 | <1 MB |
