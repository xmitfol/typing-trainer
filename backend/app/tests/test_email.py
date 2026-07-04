"""Tests для email-слоя (S1.7): renderer + EmailService.

Не требуют DB/Docker. Нужны jinja2 + aiosmtplib (в deps, доступны в CI).
SMTP-транспорт замокан — реальный mailpit не дёргаем.
"""

from email.message import EmailMessage
from unittest.mock import AsyncMock, patch

import pytest

from app.config import Settings
from app.core.emails import render_email
from app.services.email_service import EmailService


@pytest.fixture
def settings() -> Settings:
    return Settings(  # type: ignore[call-arg]
        app_env="dev",
        db_password="x",
        jwt_secret_key="x" * 64,
        frontend_base_url="https://app.example.com",
        smtp_from="TT <noreply@example.com>",
    )


def _html_part(msg: EmailMessage) -> str:
    for part in msg.walk():
        if part.get_content_type() == "text/html":
            return part.get_content()
    return ""


# ─── renderer ─────────────────────────────────────────────────────────


def test_render_welcome_ru() -> None:
    subject, html = render_email("welcome", "ru", name="Иван", frontend_base_url="X")
    assert subject == "Добро пожаловать в Клавиатренажёр!"
    assert "Иван" in html


def test_render_welcome_en() -> None:
    subject, html = render_email("welcome", "en", name="John", frontend_base_url="X")
    assert subject == "Welcome to Typing Trainer!"
    assert "John" in html


def test_render_unknown_lang_falls_back_to_ru() -> None:
    subject, _ = render_email("welcome", "de", name="X", frontend_base_url="X")
    assert subject == "Добро пожаловать в Клавиатренажёр!"


def test_render_verify_contains_url() -> None:
    _, html = render_email(
        "verify_email", "ru", name="X", verify_url="https://app/verify?token=abc", ttl_hours=24
    )
    assert "https://app/verify?token=abc" in html


# ─── EmailService (SMTP замокан) ──────────────────────────────────────


@pytest.mark.asyncio
async def test_send_welcome_calls_smtp(settings: Settings) -> None:
    with patch("app.services.email_service.aiosmtplib.send", new=AsyncMock()) as mock_send:
        await EmailService(settings).send_welcome(to="user@example.com", name="Иван", language="ru")
    mock_send.assert_awaited_once()
    msg: EmailMessage = mock_send.call_args.args[0]
    assert msg["To"] == "user@example.com"
    assert msg["From"] == "TT <noreply@example.com>"
    assert msg["Subject"] == "Добро пожаловать в Клавиатренажёр!"
    assert "Иван" in _html_part(msg)
    # хост/порт берутся из settings (dev → mailpit)
    assert mock_send.call_args.kwargs["hostname"] == settings.smtp_host
    assert mock_send.call_args.kwargs["port"] == settings.smtp_port


@pytest.mark.asyncio
async def test_send_verification_url_has_token(settings: Settings) -> None:
    with patch("app.services.email_service.aiosmtplib.send", new=AsyncMock()) as mock_send:
        await EmailService(settings).send_verification(
            to="u@e.com", name="X", language="en", token="TKN123"
        )
    msg: EmailMessage = mock_send.call_args.args[0]
    html = _html_part(msg)
    assert "https://app.example.com/auth.html?action=verify&token=TKN123" in html


@pytest.mark.asyncio
async def test_send_password_reset_url_has_token(settings: Settings) -> None:
    with patch("app.services.email_service.aiosmtplib.send", new=AsyncMock()) as mock_send:
        await EmailService(settings).send_password_reset(
            to="u@e.com", name="X", language="ru", token="RST456"
        )
    msg: EmailMessage = mock_send.call_args.args[0]
    assert "https://app.example.com/auth.html?action=reset&token=RST456" in _html_part(msg)
