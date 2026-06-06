"""Dependency injection для FastAPI endpoints.

Stub-версия на Sprint 0: реальные `db_session`, `redis_client`, `current_user`
заполняются в Sprint 1-3 по мере появления auth/models. Здесь — каркас, чтобы
endpoint'ы могли импортировать `Depends(...)` без AttributeError.
"""

from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import Depends

from app.config import Settings, get_settings


def settings_dep() -> Settings:
    """Singleton settings через DI (для test override)."""
    return get_settings()


SettingsDep = Annotated[Settings, Depends(settings_dep)]


# ─── Placeholders на Sprint 1+ ──────────────────────────────────────────


async def db_session() -> AsyncIterator[None]:
    """TODO Sprint 1: SQLAlchemy async session.

    Сейчас yield-ит None как stub чтобы импорт работал.
    """
    yield None


async def redis_client() -> None:
    """TODO Sprint 1: Redis async connection."""
    return None


async def current_user_optional() -> None:
    """TODO Sprint 1: текущий юзер из cookie/JWT, None если гость."""
    return None


async def current_user_required() -> None:
    """TODO Sprint 1: то же что выше, но 401 если не авторизован."""
    return None


async def current_subscription() -> None:
    """TODO Sprint 6: активная подписка current_user."""
    return None
