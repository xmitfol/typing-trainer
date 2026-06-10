"""Auth endpoints (Sprint 1). Контракт — backend/openapi.yaml (S1.10).

Тонкий слой: валидация (Pydantic) + капча + cookies + вызов auth_service.
Бизнес-логика — в services/auth_service.py.
"""

import structlog
from fastapi import APIRouter, HTTPException, Request, Response, status

from app.config import get_settings
from app.core.captcha import issue_challenge, verify_captcha
from app.core.exceptions import EmailTakenError
from app.core.security import create_access_token, create_refresh_token
from app.deps import DbSession, RedisClient
from app.schemas.auth import ChallengeResponse, SignupRequest, UserPublic
from app.services import auth_service

logger = structlog.get_logger(__name__)

router = APIRouter()

ACCESS_COOKIE = "access_token"
REFRESH_COOKIE = "refresh_token"


def _set_auth_cookies(response: Response, user_id) -> None:
    """Устанавливает httpOnly access+refresh cookies (SameSite=Lax)."""
    settings = get_settings()
    access_token, _ = create_access_token(user_id)
    refresh_token, _ = create_refresh_token(user_id)
    common = {
        "httponly": True,
        "secure": settings.cookie_secure,
        "samesite": "lax",
        "domain": settings.cookie_domain,
        "path": "/",
    }
    response.set_cookie(
        ACCESS_COOKIE,
        access_token,
        max_age=settings.jwt_access_ttl_minutes * 60,
        **common,
    )
    response.set_cookie(
        REFRESH_COOKIE,
        refresh_token,
        max_age=settings.jwt_refresh_ttl_days * 24 * 3600,
        **common,
    )


@router.get(
    "/challenge",
    response_model=ChallengeResponse,
    summary="Выдать proof-of-work challenge (ADR-006)",
)
async def get_challenge() -> ChallengeResponse:
    """Stateless PoW-challenge для защиты signup/forgot от ботов."""
    return ChallengeResponse(**issue_challenge())


@router.post(
    "/signup",
    response_model=UserPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Регистрация email/password",
)
async def signup(
    payload: SignupRequest,
    request: Request,
    response: Response,
    session: DbSession,
    redis: RedisClient,
) -> UserPublic:
    """Создаёт пользователя + user_settings, ставит auth-cookies.

    Защита от ботов (ADR-006): honeypot пустой + валидное PoW + не replay.
    """
    ip = request.client.host if request.client else None

    # Слой 1: honeypot — непустое скрытое поле = бот
    if payload.honeypot:
        logger.info("signup.honeypot_tripped", ip=ip)
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            detail={"code": "CAPTCHA_FAILED", "message": "Проверка не пройдена"},
        )

    # Слой 2: proof-of-work + replay-guard
    ok = await verify_captcha(
        payload.captcha_challenge,
        payload.captcha_signature,
        payload.captcha_nonce,
        ip=ip,
        redis=redis,
    )
    if not ok:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            detail={"code": "CAPTCHA_FAILED", "message": "Проверка не пройдена"},
        )

    try:
        user = await auth_service.signup(session, payload)
    except EmailTakenError as e:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail={"code": e.code, "message": e.message},
        ) from e

    _set_auth_cookies(response, user.id)
    return UserPublic.model_validate(user)
