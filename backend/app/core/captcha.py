"""Yandex SmartCaptcha verification.

По security spec — fail-closed в prod (если Yandex API недоступен → отказ).
В dev — bypass через test-токен `test-bypass-captcha`.

Используется на endpoints с риском бот-атак:
- POST /auth/signup (always)
- POST /auth/signin (после 3 failed attempts/IP/час)
- POST /auth/forgot (always)
- POST /me/family/add (always)
"""

import httpx
import structlog

from app.config import get_settings

logger = structlog.get_logger(__name__)

YANDEX_CAPTCHA_VERIFY_URL = "https://smartcaptcha.yandexcloud.net/validate"

# Dev-only bypass token (для verify-скриптов чтобы не дёргать реальный Y-API)
DEV_BYPASS_TOKEN = "test-bypass-captcha"


async def verify_captcha(token: str, ip: str | None = None) -> bool:
    """Возвращает True если человек, False если бот / fail.

    Behavior:
      - dev + token == DEV_BYPASS_TOKEN → True (для verify-скриптов)
      - prod + token пустой → False
      - prod + Yandex API недоступен → False (fail-closed)
      - prod + Yandex отвечает success/ok → True
    """
    settings = get_settings()

    # Dev bypass для verify-скриптов
    if settings.app_env == "dev" and token == DEV_BYPASS_TOKEN:
        return True

    if not token:
        logger.info("captcha.empty_token", ip=ip)
        return False

    if not settings.yandex_captcha_server_key:
        logger.warning("captcha.server_key_missing — fail-closed")
        return False

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                YANDEX_CAPTCHA_VERIFY_URL,
                params={
                    "secret": settings.yandex_captcha_server_key,
                    "token": token,
                    "ip": ip or "",
                },
            )
    except httpx.RequestError as e:
        logger.warning("captcha.api_unreachable", error=str(e), ip=ip)
        # fail-closed (security spec)
        return False

    if response.status_code != 200:
        logger.warning(
            "captcha.api_non_200",
            status=response.status_code,
            ip=ip,
        )
        return False

    try:
        data = response.json()
    except ValueError:
        logger.warning("captcha.api_invalid_json", ip=ip)
        return False

    is_ok = data.get("status") == "ok"
    if not is_ok:
        logger.info(
            "captcha.rejected",
            yandex_message=data.get("message", ""),
            ip=ip,
        )

    return is_ok
