"""Tests для captcha.py — Yandex SmartCaptcha verification."""

from unittest.mock import AsyncMock, patch

import pytest

from app.core.captcha import DEV_BYPASS_TOKEN, verify_captcha


@pytest.mark.asyncio
async def test_dev_bypass_token_works() -> None:
    """В dev режиме `test-bypass-captcha` token проходит без API call."""
    result = await verify_captcha(DEV_BYPASS_TOKEN, ip="127.0.0.1")
    assert result is True


@pytest.mark.asyncio
async def test_empty_token_rejected() -> None:
    assert await verify_captcha("", ip="127.0.0.1") is False


@pytest.mark.asyncio
async def test_real_token_without_server_key_rejected() -> None:
    """Без server_key (не настроен) — fail-closed."""
    with patch("app.core.captcha.get_settings") as mock_settings:
        mock_settings.return_value.app_env = "dev"
        mock_settings.return_value.yandex_captcha_server_key = ""
        result = await verify_captcha("real-looking-token", ip="1.2.3.4")
        assert result is False


@pytest.mark.asyncio
async def test_yandex_api_success() -> None:
    """Mock'ируем httpx — возвращаем {status: ok} → True."""
    mock_response = AsyncMock()
    mock_response.status_code = 200
    mock_response.json = lambda: {"status": "ok"}

    with patch("app.core.captcha.get_settings") as mock_settings, \
            patch("httpx.AsyncClient") as mock_client_cls:
        mock_settings.return_value.app_env = "prod"
        mock_settings.return_value.yandex_captcha_server_key = "test-secret"

        mock_client = AsyncMock()
        mock_client.post = AsyncMock(return_value=mock_response)
        mock_client_cls.return_value.__aenter__.return_value = mock_client

        result = await verify_captcha("y_token_abc", ip="1.2.3.4")
        assert result is True


@pytest.mark.asyncio
async def test_yandex_api_failed_response() -> None:
    """{status: failed} → False."""
    mock_response = AsyncMock()
    mock_response.status_code = 200
    mock_response.json = lambda: {"status": "failed", "message": "captcha-not-passed"}

    with patch("app.core.captcha.get_settings") as mock_settings, \
            patch("httpx.AsyncClient") as mock_client_cls:
        mock_settings.return_value.app_env = "prod"
        mock_settings.return_value.yandex_captcha_server_key = "test-secret"
        mock_client = AsyncMock()
        mock_client.post = AsyncMock(return_value=mock_response)
        mock_client_cls.return_value.__aenter__.return_value = mock_client

        result = await verify_captcha("y_token_bot", ip="1.2.3.4")
        assert result is False


@pytest.mark.asyncio
async def test_yandex_api_500_rejected() -> None:
    """API non-200 → fail-closed (False)."""
    mock_response = AsyncMock()
    mock_response.status_code = 500

    with patch("app.core.captcha.get_settings") as mock_settings, \
            patch("httpx.AsyncClient") as mock_client_cls:
        mock_settings.return_value.app_env = "prod"
        mock_settings.return_value.yandex_captcha_server_key = "test-secret"
        mock_client = AsyncMock()
        mock_client.post = AsyncMock(return_value=mock_response)
        mock_client_cls.return_value.__aenter__.return_value = mock_client

        result = await verify_captcha("any", ip="1.2.3.4")
        assert result is False


@pytest.mark.asyncio
async def test_yandex_api_unreachable_fail_closed() -> None:
    """Network error → fail-closed."""
    import httpx
    with patch("app.core.captcha.get_settings") as mock_settings, \
            patch("httpx.AsyncClient") as mock_client_cls:
        mock_settings.return_value.app_env = "prod"
        mock_settings.return_value.yandex_captcha_server_key = "test-secret"
        mock_client = AsyncMock()
        mock_client.post = AsyncMock(side_effect=httpx.ConnectError("DNS resolution failed"))
        mock_client_cls.return_value.__aenter__.return_value = mock_client

        result = await verify_captcha("any", ip="1.2.3.4")
        assert result is False


@pytest.mark.asyncio
async def test_yandex_api_malformed_json() -> None:
    """Невалидный JSON → fail-closed."""
    mock_response = AsyncMock()
    mock_response.status_code = 200
    mock_response.json = lambda: (_ for _ in ()).throw(ValueError("invalid json"))

    with patch("app.core.captcha.get_settings") as mock_settings, \
            patch("httpx.AsyncClient") as mock_client_cls:
        mock_settings.return_value.app_env = "prod"
        mock_settings.return_value.yandex_captcha_server_key = "test-secret"
        mock_client = AsyncMock()
        mock_client.post = AsyncMock(return_value=mock_response)
        mock_client_cls.return_value.__aenter__.return_value = mock_client

        result = await verify_captcha("any", ip="1.2.3.4")
        assert result is False
