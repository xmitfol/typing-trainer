"""Dependency injection для FastAPI endpoints.

Sprint 1: `db_session` / `redis_client` подключены к реальным engine/Redis
(core/db.py, core/redis.py). `current_user_*` — заполняются по мере auth
(Sprint 1-3).
"""

from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import Depends
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.core.db import get_session
from app.core.redis import get_redis
from app.services.email_service import EmailService, get_email_service


def settings_dep() -> Settings:
    """Singleton settings через DI (для test override)."""
    return get_settings()


SettingsDep = Annotated[Settings, Depends(settings_dep)]


# ─── DB / Redis (Sprint 1) ──────────────────────────────────────────────


async def db_session() -> AsyncIterator[AsyncSession]:
    """Per-request SQLAlchemy async session (см. core/db.py)."""
    async for session in get_session():
        yield session


async def redis_client() -> Redis:
    """Async Redis-клиент (singleton, см. core/redis.py)."""
    return get_redis()


async def email_sender() -> EmailService:
    """EmailService (S1.7+). В тестах переопределяется через dependency_overrides."""
    return get_email_service()


DbSession = Annotated[AsyncSession, Depends(db_session)]
RedisClient = Annotated[Redis, Depends(redis_client)]
EmailServiceDep = Annotated[EmailService, Depends(email_sender)]


# ─── Placeholders на Sprint 1+ ──────────────────────────────────────────


async def current_user_optional() -> None:
    """TODO Sprint 1: текущий юзер из cookie/JWT, None если гость."""
    return None


async def current_user_required() -> None:
    """TODO Sprint 1: то же что выше, но 401 если не авторизован."""
    return None


async def current_subscription() -> None:
    """TODO Sprint 6: активная подписка current_user."""
    return None
