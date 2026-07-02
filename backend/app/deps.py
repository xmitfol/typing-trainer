"""Dependency injection для FastAPI endpoints.

Sprint 1: `db_session` / `redis_client` подключены к реальным engine/Redis
(core/db.py, core/redis.py). `current_user_*` — заполняются по мере auth
(Sprint 1-3).
"""

import hmac
from collections.abc import AsyncIterator
from typing import Annotated, Callable, Coroutine
from uuid import UUID

from fastapi import Cookie, Depends, Header, HTTPException, status
from jose import JWTError
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.core.db import get_session
from app.core.redis import get_redis
from app.core.security import decode_token
from app.models.user import User
from app.services import auth_service, billing_service
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


# ─── Current user (из access_token cookie, ставится auth-эндпоинтами) ───


ACCESS_COOKIE = "access_token"


def _token_invalid() -> HTTPException:
    return HTTPException(
        status.HTTP_401_UNAUTHORIZED,
        detail={"code": "TOKEN_INVALID", "message": "Сессия истекла, войдите снова"},
    )


async def current_user_optional(
    session: DbSession,
    access_token: str | None = Cookie(default=None),
) -> User | None:
    """Текущий юзер из httpOnly access-cookie. None если гость/битый токен."""
    if not access_token:
        return None
    try:
        claims = decode_token(access_token, "access")
    except JWTError:
        return None
    return await auth_service.get_active_user(session, UUID(claims["sub"]))


async def current_user_required(
    session: DbSession,
    access_token: str | None = Cookie(default=None),
) -> User:
    """То же, но 401 TOKEN_INVALID если не авторизован."""
    if not access_token:
        raise _token_invalid()
    try:
        claims = decode_token(access_token, "access")
    except JWTError:
        raise _token_invalid() from None
    user = await auth_service.get_active_user(session, UUID(claims["sub"]))
    if user is None:
        raise _token_invalid()
    return user


CurrentUser = Annotated[User, Depends(current_user_required)]
CurrentUserOptional = Annotated[User | None, Depends(current_user_optional)]


# ─── Paywall (ADR-008 §5 — feature-gating) ──────────────────────────────
#
# Что именно гейтить (весь курс / после урока N / отдельные тиры) — решение
# PO/Полины. Здесь только инструмент: строгий require_active_subscription
# (403 если нет) и мягкий get_subscription_status (bool, без исключения).


async def require_active_subscription(
    user: CurrentUser,
    session: DbSession,
) -> User:
    """Гейт: 403 SUBSCRIPTION_REQUIRED если нет активной подписки.

    Вешать на защищённые эндпоинты: `Depends(require_active_subscription)`.
    """
    if not await billing_service.has_active_subscription(session, user.id):
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            detail={
                "code": "SUBSCRIPTION_REQUIRED",
                "message": "Требуется активная подписка",
            },
        )
    return user


async def get_subscription_status(
    user: CurrentUserOptional,
    session: DbSession,
) -> bool:
    """Мягкий статус подписки (для UI-гейтов). False для гостя/без подписки."""
    if user is None:
        return False
    return await billing_service.has_active_subscription(session, user.id)


RequireSubscription = Annotated[User, Depends(require_active_subscription)]
SubscriptionStatus = Annotated[bool, Depends(get_subscription_status)]


# ─── Admin RBAC (admin-panel TSD §2.2) ──────────────────────────────────
#
# Иерархия ролей: user < analyst < support < superadmin. Каждый admin-
# эндпоинт объявляет минимальную роль через require_admin_role(min_role).
# Копия паттерна require_active_subscription: 403 при недостатке ранга.

ROLE_RANK = {"user": 0, "analyst": 1, "support": 2, "superadmin": 3}


def require_admin_role(
    min_role: str,
) -> Callable[[User], Coroutine[None, None, User]]:
    """Фабрика зависимости: 403 ADMIN_FORBIDDEN если ранг user'а < min_role.

    Использует существующий CurrentUser (access-cookie → get_active_user).
    Заблокированный (deleted_at) юзер сюда не дойдёт — get_active_user
    вернёт None → 401 в current_user_required.
    """

    async def _dep(user: CurrentUser) -> User:
        if ROLE_RANK.get(user.role, 0) < ROLE_RANK.get(min_role, 999):
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "ADMIN_FORBIDDEN",
                    "message": "Недостаточно прав для этого действия",
                },
            )
        return user

    return _dep


# Алиасы для читаемости в сигнатурах эндпоинтов.
RequireAnalyst = Annotated[User, Depends(require_admin_role("analyst"))]
RequireSupport = Annotated[User, Depends(require_admin_role("support"))]
RequireSuperadmin = Annotated[User, Depends(require_admin_role("superadmin"))]


# ─── Re-auth scope-токен (admin-panel TSD §2.3) ─────────────────────────
#
# Чувствительные операции (возврат/роль/имперсонация — Ф2/Ф4) требуют
# повторного ввода пароля. /admin/reauth кладёт scope-токен в Redis
# admin:reauth:{user_id} (TTL 300с); зависимость require_reauth сверяет
# заголовок X-Admin-Reauth с ним.
#
# РЕШЕНИЕ (спека даёт выбор one-time vs TTL-окно): выбран TTL-окно, НЕ
# one-time. За одну re-auth сотрудник может выполнить несколько чувстви-
# тельных действий в течение 5 мин (напр. серию возвратов) без повторного
# ввода пароля на каждое. Токен инвалидируется по истечении TTL. Это UX-
# компромисс; при желании ужесточить до one-time — заменить get на getdel.

REAUTH_PREFIX = "admin:reauth:"
REAUTH_TTL_SECONDS = 300


async def require_reauth(
    user: CurrentUser,
    redis: RedisClient,
    x_admin_reauth: str | None = Header(default=None),
) -> User:
    """Гейт чувствительных операций: 403 REAUTH_REQUIRED без валидного токена.

    Сверяет заголовок X-Admin-Reauth со scope-токеном в Redis по user_id.
    TTL-окно (не one-time) — см. заметку выше.
    """
    if not x_admin_reauth:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            detail={"code": "REAUTH_REQUIRED", "message": "Требуется повторный ввод пароля"},
        )
    stored = await redis.get(f"{REAUTH_PREFIX}{user.id}")
    # constant-time сравнение scope-токена (F1-SEC гигиена денежного контура).
    if not stored or not hmac.compare_digest(str(stored), x_admin_reauth):
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            detail={"code": "REAUTH_REQUIRED", "message": "Требуется повторный ввод пароля"},
        )
    return user


RequireReauth = Annotated[User, Depends(require_reauth)]
