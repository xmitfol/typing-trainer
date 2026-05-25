**⚙****️**** Backend Architecture**
**Typing Trainer SaaS - ****Детальный**** ****дизайн**
**Версия:** 1.0
**Дата:** 09 октября 2025
**Связанные документы:** , 

**📋**** Содержание**







**🎯**** Архитектурный подход**
**Backend**** Evolution**
v1.0 (MVP)          v2.0              v3.0
──────────────────────────────────────────────
No backend    →    Monolith API   →   Microservices
LocalStorage       FastAPI            + Message Queue
                   PostgreSQL         + Event-Driven
                   Redis              + CQRS
**Технологический**** ****стек**
**Core:**
**FastAPI** (Python 3.11+) - Async web framework
**PostgreSQL**** 15+** - Primary database
**Redis**** 7+** - Cache & sessions
**SQLAlchemy**** 2.0** - ORM
**Alembic** - Migrations
**Pydantic** - Validation
**Additional****:**
**Celery** - Background tasks
**RabbitMQ** - Message broker
**OpenAI**** API** - AI features
**Stripe** - Payments

**📁**** ****Структура**** ****проекта**
typing-trainer-backend/
├── app/
│   ├── main.py                      # FastAPI app entry
│   ├── config.py                    # Configuration
│   ├── dependencies.py              # Dependency injection
│   │
│   ├── api/                         # API endpoints
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py             # /api/v1/auth/*
│   │   │   ├── users.py            # /api/v1/users/*
│   │   │   ├── courses.py          # /api/v1/courses/*
│   │   │   ├── lessons.py          # /api/v1/lessons/*
│   │   │   ├── stats.py            # /api/v1/stats/*
│   │   │   └── ai.py               # /api/v1/ai/*
│   │   └── deps.py                 # API dependencies
│   │
│   ├── core/                        # Core functionality
│   │   ├── security.py             # JWT, passwords
│   │   ├── config.py               # Settings
│   │   └── exceptions.py           # Custom exceptions
│   │
│   ├── models/                      # SQLAlchemy models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── course.py
│   │   ├── lesson.py
│   │   ├── progress.py
│   │   ├── keystroke.py
│   │   └── subscription.py
│   │
│   ├── schemas/                     # Pydantic schemas
│   │   ├── __init__.py
│   │   ├── user.py                 # Request/Response models
│   │   ├── course.py
│   │   ├── lesson.py
│   │   ├── stats.py
│   │   └── token.py
│   │
│   ├── services/                    # Business logic
│   │   ├── auth_service.py
│   │   ├── user_service.py
│   │   ├── lesson_service.py
│   │   ├── stats_service.py
│   │   ├── ai_service.py
│   │   └── payment_service.py
│   │
│   ├── repositories/                # Data access layer
│   │   ├── base.py
│   │   ├── user_repository.py
│   │   ├── lesson_repository.py
│   │   └── stats_repository.py
│   │
│   ├── tasks/                       # Celery tasks
│   │   ├── __init__.py
│   │   ├── analytics.py
│   │   ├── notifications.py
│   │   └── ai_processing.py
│   │
│   └── utils/                       # Utilities
│       ├── email.py
│       ├── cache.py
│       └── helpers.py
│
├── alembic/                         # Database migrations
│   ├── versions/
│   └── env.py
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── scripts/
│   ├── seed_data.py
│   └── init_db.py
│
├── docker/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── docker-compose.prod.yml
│
├── requirements/
│   ├── base.txt
│   ├── dev.txt
│   └── prod.txt
│
└── pyproject.toml

**🌐**** API Design**
**RESTful API Structure**
Base URL: https://api.typingtrainer.com/v1

Authentication: Bearer JWT Token
Header: Authorization: Bearer <token>
**Endpoints Overview**
**1. Authentication**
POST   /auth/register          # Register new user
POST   /auth/login             # Login
POST   /auth/logout            # Logout
POST   /auth/refresh           # Refresh token
POST   /auth/forgot-password   # Password reset request
POST   /auth/reset-password    # Reset password
GET    /auth/me                # Current user info
**2. Users**
GET    /users/me               # Get current user
PUT    /users/me               # Update profile
DELETE /users/me               # Delete account
GET    /users/me/stats         # User statistics
GET    /users/me/progress      # Learning progress
POST   /users/me/avatar        # Upload avatar
**3. Courses**
GET    /courses                # List all courses
GET    /courses/{id}           # Get course details
GET    /courses/{id}/lessons   # List lessons in course
GET    /courses/search         # Search courses
**4. Lessons**
GET    /lessons/{id}           # Get lesson details
GET    /lessons/{id}/content   # Get lesson text
POST   /lessons/{id}/start     # Start lesson
POST   /lessons/{id}/complete  # Complete lesson
POST   /lessons/{id}/progress  # Save progress
**5. Statistics**
POST   /stats/keystroke        # Record keystroke
POST   /stats/session          # Complete session
GET    /stats/summary          # Get summary stats
GET    /stats/history          # Get session history
GET    /stats/weak-keys        # Get weak keys analysis
GET    /stats/progress-chart   # Get progress chart data
**6. AI Features**
POST   /ai/analyze             # Analyze typing patterns
GET    /ai/recommendations     # Get personalized recommendations
POST   /ai/generate-exercise   # Generate custom exercise
POST   /ai/chat                # Chat with AI coach
**7. Payments**
GET    /payments/plans         # List subscription plans
POST   /payments/subscribe     # Create subscription
POST   /payments/cancel        # Cancel subscription
GET    /payments/invoices      # List invoices
POST   /payments/webhook       # Stripe webhook

**API Example: Complete Lesson**
**Request:**
POST /api/v1/lessons/123/complete
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "duration": 180000,
  "wpm": 67,
  "accuracy": 96.5,
  "errors": 8,
  "keystrokes": [
    {
      "expected": "t",
      "actual": "t",
      "correct": true,
      "latency": 245,
      "timestamp": 1728474300000
    },
    // ... more keystrokes
  ]
}
**Response:**
{
  "success": true,
  "data": {
    "sessionId": "sess_abc123",
    "rating": 4,
    "achievements": [
      {
        "id": "speed_demon",
        "name": "Speed Demon",
        "description": "Reached 60+ WPM"
      }
    ],
    "nextLesson": {
      "id": 124,
      "title": "Advanced Speed Training",
      "unlocked": true
    },
    "stats": {
      "wpm": 67,
      "accuracy": 96.5,
      "improvement": "+3 WPM from last session"
    }
  }
}

**🏗****️ Сервисная архитектура**
**Layered**** Architecture**
┌────────────────────────────────────┐
│         API Layer                  │
│  (FastAPI routes)                  │
└───────────┬────────────────────────┘
            │
┌───────────▼────────────────────────┐
│       Service Layer                │
│  (Business Logic)                  │
│  - AuthService                     │
│  - LessonService                   │
│  - StatsService                    │
└───────────┬────────────────────────┘
            │
┌───────────▼────────────────────────┐
│     Repository Layer               │
│  (Data Access)                     │
│  - UserRepository                  │
│  - LessonRepository                │
└───────────┬────────────────────────┘
            │
┌───────────▼────────────────────────┐
│       Database Layer               │
│  (PostgreSQL)                      │
└────────────────────────────────────┘

**Example: Lesson Service**
# app/services/lesson_service.py
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models import Lesson, User, Progress
from app.repositories import LessonRepository, ProgressRepository
from app.schemas import LessonComplete, SessionStats
from app.core.exceptions import LessonNotFoundError, UnauthorizedError

class LessonService:
    def __init__(self, db: Session):
        self.db = db
        self.lesson_repo = LessonRepository(db)
        self.progress_repo = ProgressRepository(db)

    async def get_lesson(self, lesson_id: int, user_id: int) -> Lesson:
        """Get lesson by ID with authorization check"""
        lesson = await self.lesson_repo.get_by_id(lesson_id)

        if not lesson:
            raise LessonNotFoundError(f"Lesson {lesson_id} not found")

        # Check if user has access
        if not await self._check_access(user_id, lesson):
            raise UnauthorizedError("Lesson not unlocked")

        return lesson

    async def complete_lesson(
        self,
        lesson_id: int,
        user_id: int,
        data: LessonComplete
    ) -> SessionStats:
        """Complete a lesson and calculate stats"""

        # Get lesson
        lesson = await self.get_lesson(lesson_id, user_id)

        # Calculate rating (1-5 stars)
        rating = self._calculate_rating(
            wpm=data.wpm,
            accuracy=data.accuracy,
            target_wpm=lesson.target_wpm
        )

        # Save progress
        progress = await self.progress_repo.create(
            user_id=user_id,
            lesson_id=lesson_id,
            wpm=data.wpm,
            accuracy=data.accuracy,
            duration=data.duration,
            errors=data.errors,
            rating=rating
        )

        # Save keystrokes for AI analysis
        if data.keystrokes:
            await self._save_keystrokes(progress.id, data.keystrokes)

        # Check for achievements
        achievements = await self._check_achievements(user_id, data)

        # Unlock next lesson if rating >= 2
        next_lesson = None
        if rating >= 2:
            next_lesson = await self._unlock_next_lesson(user_id, lesson)

        # Trigger AI analysis (async task)
        from app.tasks.ai_processing import analyze_typing_pattern
        analyze_typing_pattern.delay(user_id, progress.id)

        return SessionStats(
            session_id=progress.id,
            rating=rating,
            achievements=achievements,
            next_lesson=next_lesson,
            stats={
                "wpm": data.wpm,
                "accuracy": data.accuracy,
                "improvement": await self._calculate_improvement(user_id)
            }
        )

    def _calculate_rating(self, wpm: int, accuracy: float, target_wpm: int) -> int:
        """Calculate 1-5 star rating"""
        wpm_ratio = wpm / target_wpm

        if accuracy < 85:
            return 1
        elif wpm_ratio >= 1.1 and accuracy >= 97:
            return 5
        elif wpm_ratio >= 1.0 and accuracy >= 95:
            return 4
        elif wpm_ratio >= 0.9 and accuracy >= 92:
            return 3
        elif wpm_ratio >= 0.7 and accuracy >= 88:
            return 2
        else:
            return 1

    async def _check_access(self, user_id: int, lesson: Lesson) -> bool:
        """Check if user has access to lesson"""
        # First lesson is always available
        if lesson.order == 1:
            return True

        # Check if previous lesson completed
        previous_lesson = await self.lesson_repo.get_previous(lesson)
        if not previous_lesson:
            return True

        progress = await self.progress_repo.get_best(user_id, previous_lesson.id)
        return progress and progress.rating >= 2

    async def _save_keystrokes(self, session_id: int, keystrokes: List[dict]):
        """Save individual keystrokes for analysis"""
        # Bulk insert for performance
        from app.models import Keystroke

        keystroke_objects = [
            Keystroke(
                session_id=session_id,
                expected=k['expected'],
                actual=k['actual'],
                correct=k['correct'],
                latency=k['latency'],
                timestamp=k['timestamp']
            )
            for k in keystrokes
        ]

        self.db.bulk_save_objects(keystroke_objects)
        await self.db.commit()

**Example: AI Service**
# app/services/ai_service.py
from typing import List, Dict
from openai import AsyncOpenAI
from app.models import User, Keystroke
from app.repositories import KeystrokeRepository
from app.schemas import AIRecommendation, CustomExercise

class AIService:
    def __init__(self, db: Session):
        self.db = db
        self.keystroke_repo = KeystrokeRepository(db)
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    async def analyze_pattern(self, user_id: int) -> List[AIRecommendation]:
        """Analyze typing patterns and generate recommendations"""

        # Get recent keystrokes
        keystrokes = await self.keystroke_repo.get_recent(user_id, limit=1000)

        # Analyze weak keys
        weak_keys = self._analyze_weak_keys(keystrokes)

        # Analyze speed patterns
        speed_analysis = self._analyze_speed(keystrokes)

        # Generate AI recommendations
        prompt = self._build_analysis_prompt(weak_keys, speed_analysis)

        response = await self.client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert typing coach analyzing user performance."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=500
        )

        # Parse recommendations
        recommendations_text = response.choices[0].message.content

        return self._parse_recommendations(recommendations_text)

    async def generate_exercise(
        self,
        user_id: int,
        focus_keys: List[str],
        difficulty: str = "medium"
    ) -> CustomExercise:
        """Generate personalized exercise text"""

        prompt = f"""
        Generate a typing practice text with these requirements:
        - Focus on keys: {', '.join(focus_keys)}
        - Difficulty: {difficulty}
        - Length: 100 words
        - Natural sentences (not just drills)
        - Include common bigrams with these keys
        """

        response = await self.client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": "You are a typing exercise generator."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.8
        )

        text = response.choices[0].message.content

        return CustomExercise(
            text=text,
            focus_keys=focus_keys,
            difficulty=difficulty,
            estimated_duration=self._estimate_duration(text, difficulty)
        )

    def _analyze_weak_keys(self, keystrokes: List[Keystroke]) -> Dict:
        """Identify problematic keys"""
        key_stats = {}

        for k in keystrokes:
            if k.expected not in key_stats:
                key_stats[k.expected] = {"total": 0, "errors": 0, "avg_latency": 0}

            key_stats[k.expected]["total"] += 1
            if not k.correct:
                key_stats[k.expected]["errors"] += 1
            key_stats[k.expected]["avg_latency"] += k.latency

        # Calculate error rates
        for key, stats in key_stats.items():
            stats["error_rate"] = (stats["errors"] / stats["total"]) * 100
            stats["avg_latency"] /= stats["total"]

        # Find weak keys (>15% error rate or >400ms latency)
        weak_keys = {
            key: stats
            for key, stats in key_stats.items()
            if stats["error_rate"] > 15 or stats["avg_latency"] > 400
        }

        return weak_keys

**🔒**** ****Безопасность**
**Authentication: JWT**
# app/core/security.py
from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)

    to_encode.update({"exp": expire, "type": "access"})

    return jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

def create_refresh_token(data: dict):
    """Create JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=30)
    to_encode.update({"exp": expire, "type": "refresh"})

    return jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash password"""
    return pwd_context.hash(password)
**Authorization Middleware**
# app/api/deps.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.core.security import ALGORITHM, SECRET_KEY
from app.models import User
from app.services import UserService

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")

        if user_id is None or token_type != "access":
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    user_service = UserService(db)
    user = await user_service.get_by_id(int(user_id))

    if user is None or not user.is_active:
        raise credentials_exception

    return user

def require_premium(user: User = Depends(get_current_user)) -> User:
    """Require premium subscription"""
    if not user.is_premium:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Premium subscription required"
        )
    return user

**📈**** ****Масштабирование**
**Caching Strategy**
# app/utils/cache.py
import json
from typing import Optional, Any
from redis import Redis
from app.core.config import settings

redis_client = Redis.from_url(settings.REDIS_URL)

def cache_get(key: str) -> Optional[Any]:
    """Get value from cache"""
    value = redis_client.get(key)
    return json.loads(value) if value else None

def cache_set(key: str, value: Any, ttl: int = 3600):
    """Set value in cache with TTL"""
    redis_client.setex(
        key,
        ttl,
        json.dumps(value, default=str)
    )

def cache_delete(key: str):
    """Delete key from cache"""
    redis_client.delete(key)

# Decorator for caching
def cached(ttl: int = 3600, key_prefix: str = ""):
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Generate cache key
            cache_key = f"{key_prefix}:{func.__name__}:{args}:{kwargs}"

            # Try cache first
            cached_value = cache_get(cache_key)
            if cached_value is not None:
                return cached_value

            # Execute function
            result = await func(*args, **kwargs)

            # Store in cache
            cache_set(cache_key, result, ttl)

            return result
        return wrapper
    return decorator

# Usage
@cached(ttl=300, key_prefix="lesson")
async def get_lesson(lesson_id: int):
    # This will be cached for 5 minutes
    return await lesson_repo.get_by_id(lesson_id)
**Background Tasks**
# app/tasks/analytics.py
from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "typing_trainer",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

@celery_app.task
def calculate_daily_stats(user_id: int):
    """Calculate daily statistics for user"""
    # Heavy computation
    sessions = Session.query(Progress).filter_by(user_id=user_id).all()

    stats = {
        "total_wpm": sum(s.wpm for s in sessions) / len(sessions),
        "total_time": sum(s.duration for s in sessions),
        "lessons_completed": len(sessions)
    }

    # Store aggregated stats
    DailyStats.create(user_id=user_id, **stats)

@celery_app.task
def send_progress_email(user_id: int):
    """Send weekly progress report"""
    user = User.get(user_id)
    stats = get_weekly_stats(user_id)

    send_email(
        to=user.email,
        subject="Your Weekly Progress",
        template="weekly_progress",
        context={"user": user, "stats": stats}
    )

**📊**** ****Мониторинг**
**Logging**
# app/core/logging.py
import logging
import sys
from loguru import logger

# Remove default handler
logger.remove()

# Add custom handler
logger.add(
    sys.stdout,
    format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
    level="INFO"
)

# Add file handler
logger.add(
    "logs/app.log",
    rotation="500 MB",
    retention="10 days",
    level="DEBUG"
)

# Usage
logger.info("User {user_id} completed lesson {lesson_id}", user_id=123, lesson_id=45)
logger.error("Failed to process payment", exc_info=True)
**Metrics**
# app/core/metrics.py
from prometheus_client import Counter, Histogram, Gauge

# Request counters
request_count = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

# Response time histogram
request_duration = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration',
    ['method', 'endpoint']
)

# Active users gauge
active_users = Gauge('active_users_total', 'Number of active users')

# Usage in middleware
@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start_time = time.time()

    response = await call_next(request)

    duration = time.time() - start_time

    request_count.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()

    request_duration.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(duration)

    return response

**Статус:** ✅ Готово к реализации
**Следующий документ:** Database Schema Design
**Дата:** 09 октября 2025
