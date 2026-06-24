"""Auth endpoints (Sprint 1). Контракт — backend/openapi.yaml (S1.10).

Тонкий слой: валидация (Pydantic) + капча + cookies + вызов auth_service.
Бизнес-логика — в services/auth_service.py.
"""

from uuid import UUID

import structlog
from fastapi import APIRouter, Cookie, HTTPException, Request, Response, status
from jose import JWTError

from app.config import get_settings
from app.core.captcha import issue_challenge, verify_captcha
from app.core.email_tokens import (
    RESET_PREFIX,
    RESET_TTL_SECONDS,
    VERIFY_PREFIX,
    VERIFY_TTL_SECONDS,
    consume_token,
    issue_token,
)
from app.core.exceptions import EmailTakenError, InvalidCredentialsError
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.deps import DbSession, EmailServiceDep, RedisClient
from app.schemas.auth import (
    ChallengeResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    SigninRequest,
    SignupRequest,
    UserPublic,
    VerifyEmailRequest,
)
from app.services import auth_service

logger = structlog.get_logger(__name__)

router = APIRouter()

ACCESS_COOKIE = "access_token"
REFRESH_COOKIE = "refresh_token"

# Redis-ключ отозванных refresh-jti (ротация = one-time-use refresh).
REVOKED_PREFIX = "refresh:revoked:"

# Conditional-captcha порог: после стольких неудачных signin с одного IP за час
# требуем PoW (security spec §2 / ADR-006).
SIGNIN_CAPTCHA_THRESHOLD = 3
SIGNIN_FAIL_TTL = 3600


def _captcha_failed() -> HTTPException:
    return HTTPException(
        status.HTTP_403_FORBIDDEN,
        detail={"code": "CAPTCHA_FAILED", "message": "Проверка не пройдена"},
    )


async def _require_captcha(
    *, challenge: str, signature: str, nonce: str, honeypot: str, ip: str | None, redis
) -> None:
    """honeypot + PoW gate (ADR-006). 403 CAPTCHA_FAILED при провале."""
    if honeypot:
        logger.info("captcha.honeypot_tripped", ip=ip)
        raise _captcha_failed()
    if not await verify_captcha(challenge, signature, nonce, ip=ip, redis=redis):
        raise _captcha_failed()


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


def _clear_auth_cookies(response: Response) -> None:
    settings = get_settings()
    for name in (ACCESS_COOKIE, REFRESH_COOKIE):
        response.delete_cookie(name, domain=settings.cookie_domain, path="/")


def _token_invalid() -> HTTPException:
    return HTTPException(
        status.HTTP_401_UNAUTHORIZED,
        detail={"code": "TOKEN_INVALID", "message": "Сессия истекла, войдите снова"},
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
    emailer: EmailServiceDep,
) -> UserPublic:
    """Создаёт пользователя + user_settings, ставит auth-cookies.

    Защита от ботов (ADR-006): honeypot пустой + валидное PoW + не replay.
    """
    ip = request.client.host if request.client else None
    await _require_captcha(
        challenge=payload.captcha_challenge,
        signature=payload.captcha_signature,
        nonce=payload.captcha_nonce,
        honeypot=payload.honeypot,
        ip=ip,
        redis=redis,
    )

    try:
        user = await auth_service.signup(session, payload)
    except EmailTakenError as e:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail={"code": e.code, "message": e.message},
        ) from e

    # S1.7/S1.8: welcome + verification email — best-effort, сбой SMTP/Redis
    # не валит регистрацию (юзер создан; повторную отправку добавим в Sprint 2).
    try:
        await emailer.send_welcome(to=user.email, name=user.name, language=user.language)
        token = await issue_token(redis, VERIFY_PREFIX, user.id, VERIFY_TTL_SECONDS)
        await emailer.send_verification(
            to=user.email, name=user.name, language=user.language, token=token
        )
    except Exception as e:  # noqa: BLE001 — почта/Redis не должны ломать signup
        logger.warning("signup.post_email_failed", user_id=str(user.id), error=str(e))

    _set_auth_cookies(response, user.id)
    return UserPublic.model_validate(user)


@router.post(
    "/signin",
    response_model=UserPublic,
    summary="Вход по email/password",
)
async def signin(
    payload: SigninRequest,
    request: Request,
    response: Response,
    session: DbSession,
    redis: RedisClient,
) -> UserPublic:
    """Логин → httpOnly cookies. Anti-timing: одинаковый 401 для любой ошибки.

    Conditional-captcha: после SIGNIN_CAPTCHA_THRESHOLD неудач с одного IP за
    час требуется PoW (403 CAPTCHA_REQUIRED → клиент берёт challenge и повторяет).
    """
    ip = request.client.host if request.client else None
    fail_key = f"signin:fail:{ip}"
    fail_count = int(await redis.get(fail_key) or 0)

    # Порог неудач превышен — требуем капчу
    if fail_count >= SIGNIN_CAPTCHA_THRESHOLD:
        if not (payload.captcha_challenge and payload.captcha_signature and payload.captcha_nonce):
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                detail={"code": "CAPTCHA_REQUIRED", "message": "Пройдите проверку"},
            )
        ok = await verify_captcha(
            payload.captcha_challenge,
            payload.captcha_signature,
            payload.captcha_nonce,
            ip=ip,
            redis=redis,
        )
        if not ok:
            raise _captcha_failed()

    try:
        user = await auth_service.signin(session, payload.email, payload.password)
    except InvalidCredentialsError as e:
        # Считаем неудачу по IP (для conditional-captcha), TTL час
        new_count = await redis.incr(fail_key)
        if new_count == 1:
            await redis.expire(fail_key, SIGNIN_FAIL_TTL)
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            detail={"code": e.code, "message": e.message},
        ) from e

    await redis.delete(fail_key)  # успех — сбрасываем счётчик
    _set_auth_cookies(response, user.id)
    return UserPublic.model_validate(user)


@router.post(
    "/refresh",
    response_model=UserPublic,
    summary="Обновить access-токен по refresh-cookie",
)
async def refresh(
    response: Response,
    session: DbSession,
    redis: RedisClient,
    refresh_token: str | None = Cookie(default=None),
) -> UserPublic:
    """Ротация: старый refresh-jti отзывается, выдаётся новая пара токенов.

    Повторное использование уже ротированного токена → 401 (jti в blocklist'е).
    """
    if not refresh_token:
        raise _token_invalid()
    try:
        claims = decode_token(refresh_token, "refresh")
    except JWTError:
        raise _token_invalid() from None

    jti = claims["jti"]
    if await redis.get(REVOKED_PREFIX + jti):
        raise _token_invalid()  # уже использован/отозван

    user = await auth_service.get_active_user(session, UUID(claims["sub"]))
    if user is None:
        raise _token_invalid()

    # Отзываем старый jti (TTL = срок жизни refresh), выдаём новую пару
    settings = get_settings()
    await redis.set(
        REVOKED_PREFIX + jti, "1", ex=settings.jwt_refresh_ttl_days * 24 * 3600
    )
    _set_auth_cookies(response, user.id)
    return UserPublic.model_validate(user)


@router.post(
    "/signout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Выход — очистка cookies + отзыв refresh-токена",
)
async def signout(
    response: Response,
    redis: RedisClient,
    refresh_token: str | None = Cookie(default=None),
) -> None:
    """Чистит auth-cookies и отзывает текущий refresh-jti."""
    if refresh_token:
        try:
            claims = decode_token(refresh_token, "refresh")
            settings = get_settings()
            await redis.set(
                REVOKED_PREFIX + claims["jti"],
                "1",
                ex=settings.jwt_refresh_ttl_days * 24 * 3600,
            )
        except JWTError:
            pass  # битый токен — просто чистим cookies
    _clear_auth_cookies(response)


@router.post(
    "/verify-email",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Подтвердить email по токену из письма",
)
async def verify_email(
    payload: VerifyEmailRequest,
    session: DbSession,
    redis: RedisClient,
) -> None:
    """Одноразовый токен (Redis GETDEL) → email_verified=true."""
    user_id = await consume_token(redis, VERIFY_PREFIX, payload.token)
    if user_id is None:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail={"code": "TOKEN_INVALID", "message": "Ссылка недействительна или истекла"},
        )
    await auth_service.mark_email_verified(session, user_id)


@router.post(
    "/forgot",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Запрос на сброс пароля",
)
async def forgot_password(
    payload: ForgotPasswordRequest,
    request: Request,
    session: DbSession,
    redis: RedisClient,
    emailer: EmailServiceDep,
) -> None:
    """Всегда 202 (не раскрываем существование email). Требует капчу (ADR-006).

    Если email известен — выдаём reset-токен и шлём письмо (best-effort).
    """
    ip = request.client.host if request.client else None
    await _require_captcha(
        challenge=payload.captcha_challenge,
        signature=payload.captcha_signature,
        nonce=payload.captcha_nonce,
        honeypot=payload.honeypot,
        ip=ip,
        redis=redis,
    )

    user = await auth_service.find_active_by_email(session, payload.email)
    if user is not None:
        try:
            token = await issue_token(redis, RESET_PREFIX, user.id, RESET_TTL_SECONDS)
            await emailer.send_password_reset(
                to=user.email, name=user.name, language=user.language, token=token
            )
        except Exception as e:  # noqa: BLE001 — сбой почты/Redis не раскрываем клиенту
            logger.warning("forgot.email_failed", error=str(e))
    # 202 в любом случае (status_code в декораторе)


@router.post(
    "/reset",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Установить новый пароль по токену сброса",
)
async def reset_password(
    payload: ResetPasswordRequest,
    session: DbSession,
    redis: RedisClient,
) -> None:
    """Одноразовый reset-токен (GETDEL) → новый Argon2-хеш.

    TODO Sprint 2: глобальная инвалидация активных сессий (нужен per-user
    token-version; сейчас старые refresh-токены доживут до своего TTL).
    """
    user_id = await consume_token(redis, RESET_PREFIX, payload.token)
    if user_id is None:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail={"code": "TOKEN_INVALID", "message": "Ссылка недействительна или истекла"},
        )
    await auth_service.set_password(session, user_id, payload.password)
