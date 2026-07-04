"""OAuth endpoints (Sprint 2, S2.3/S2.4, ADR-007).

Server-side Authorization Code flow. Два эндпоинта на провайдера:
    GET /auth/oauth/{provider}/start     → 302 на authorize-URL провайдера
    GET /auth/oauth/{provider}/callback  → обмен code, резолв, наши cookies, 302 фронт

CSRF+PKCE через Redis oauth:state:{state} (TTL 10 мин, GETDEL на callback).
Токен провайдера не храним (ADR-007 §5).
"""

from __future__ import annotations

import json
import secrets

import structlog
from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import RedirectResponse

from app.api.v1.auth import _set_auth_cookies
from app.core.exceptions import OAuthNoEmailError
from app.core.oauth import generate_pkce_pair, get_oauth_strategy
from app.deps import DbSession, RedisClient, SettingsDep
from app.services import oauth_service

logger = structlog.get_logger(__name__)

router = APIRouter()

SUPPORTED_PROVIDERS = ("yandex", "vk")

STATE_PREFIX = "oauth:state:"
STATE_TTL_SECONDS = 600  # 10 мин (ADR-007 §2)


def _provider_or_404(provider: str) -> str:
    if provider not in SUPPORTED_PROVIDERS:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Unknown OAuth provider")
    return provider


@router.get(
    "/{provider}/start",
    summary="Начать OAuth-вход — 302 на провайдера",
)
async def oauth_start(
    provider: str,
    redis: RedisClient,
    settings: SettingsDep,
) -> RedirectResponse:
    """Генерит state (+ PKCE для VK), кладёт в Redis, редиректит на провайдера."""
    _provider_or_404(provider)
    strategy = get_oauth_strategy(provider, settings)

    state = secrets.token_urlsafe(32)
    code_verifier: str | None = None
    code_challenge: str | None = None
    if strategy.uses_pkce:
        code_verifier, code_challenge = generate_pkce_pair()

    payload = {"provider": provider}
    if code_verifier:
        payload["code_verifier"] = code_verifier
    await redis.set(f"{STATE_PREFIX}{state}", json.dumps(payload), ex=STATE_TTL_SECONDS)

    url = strategy.authorize_url(state, code_challenge)
    logger.info("oauth.start", provider=provider)
    # 302 (не 307): смена метода на GET допустима, тело не нужно.
    return RedirectResponse(url, status_code=status.HTTP_302_FOUND)


@router.get(
    "/{provider}/callback",
    summary="OAuth callback — обмен code, резолв, наши cookies, 302 фронт",
)
async def oauth_callback(
    provider: str,
    session: DbSession,
    redis: RedisClient,
    settings: SettingsDep,
    code: str = Query(...),
    state: str = Query(...),
) -> RedirectResponse:
    """Валидирует state (GETDEL), обменивает code, резолвит юзера, ставит cookies."""
    _provider_or_404(provider)
    frontend = settings.frontend_base_url.rstrip("/")

    # ── CSRF: одноразовый state из Redis ──────────────────────────────
    raw = await redis.getdel(f"{STATE_PREFIX}{state}")
    if raw is None:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail={"code": "OAUTH_STATE_INVALID", "message": "Ссылка недействительна или истекла"},
        )
    try:
        stored = json.loads(raw)
    except (ValueError, TypeError):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Bad state") from None
    if stored.get("provider") != provider:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail={"code": "OAUTH_STATE_INVALID", "message": "Провайдер не совпадает"},
        )
    code_verifier = stored.get("code_verifier")

    strategy = get_oauth_strategy(provider, settings)

    # ── Обмен code → token → userinfo → резолв ────────────────────────
    try:
        token = await strategy.exchange_code(code, code_verifier)
        info = await strategy.fetch_userinfo(token)
    except Exception as e:
        # Провайдер/сеть — не 500 юзеру, а мягкий редирект на auth с ошибкой.
        logger.warning("oauth.callback.provider_error", provider=provider, error=str(e))
        return RedirectResponse(
            f"{frontend}/auth.html?error=OAUTH_FAILED",
            status_code=status.HTTP_302_FOUND,
        )

    try:
        user, is_new = await oauth_service.resolve_oauth_login(session, provider, info)
    except OAuthNoEmailError:
        return RedirectResponse(
            f"{frontend}/auth.html?error=OAUTH_NO_EMAIL",
            status_code=status.HTTP_302_FOUND,
        )

    # ── Наши httpOnly cookies + редирект на фронт ─────────────────────
    target = f"{frontend}/onboarding.html?oauth=1&new=1" if is_new else f"{frontend}/dashboard.html"
    response = RedirectResponse(target, status_code=status.HTTP_302_FOUND)
    _set_auth_cookies(response, user.id)
    logger.info("oauth.callback.ok", provider=provider, user_id=str(user.id), is_new=is_new)
    return response
