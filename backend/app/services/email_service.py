"""Email-сервис (S1.7+). Async SMTP через aiosmtplib + Jinja2-шаблоны.

Транспорт абстрагирован: dev → mailpit (localhost:1025, без TLS/creds),
prod → Y360 (smtp.yandex.ru:465, TLS) — отличается только конфигом.
HTML-письма с plain-text fallback. i18n RU+EN (ADR-005 §8).

TODO Sprint 2: вынести отправку в ARQ-очередь (сейчас inline; в signup
вызывается best-effort с подавлением ошибок, чтобы не валить регистрацию).
"""

from email.message import EmailMessage

import aiosmtplib
import structlog

from app.config import Settings, get_settings
from app.core.emails import render_email

logger = structlog.get_logger(__name__)

# TTL ссылок (часы) — для текста письма; фактический TTL токена задаёт S1.8.
VERIFY_TTL_HOURS = 24
RESET_TTL_HOURS = 1


class EmailService:
    """Отправка транзакционных писем."""

    def __init__(self, settings: Settings) -> None:
        self._s = settings

    async def _send(self, to: str, subject: str, html: str) -> None:
        msg = EmailMessage()
        msg["From"] = self._s.smtp_from
        msg["To"] = to
        msg["Subject"] = subject
        msg.set_content("Это письмо в формате HTML — включите его отображение.")
        msg.add_alternative(html, subtype="html")
        await aiosmtplib.send(
            msg,
            hostname=self._s.smtp_host,
            port=self._s.smtp_port,
            use_tls=self._s.smtp_use_tls,
            username=self._s.smtp_username or None,
            password=self._s.smtp_password or None,
        )
        logger.info("email.sent", to=to, subject=subject)

    async def send_welcome(self, *, to: str, name: str, language: str) -> None:
        subject, html = render_email(
            "welcome", language, name=name, frontend_base_url=self._s.frontend_base_url
        )
        await self._send(to, subject, html)

    async def send_verification(
        self, *, to: str, name: str, language: str, token: str
    ) -> None:
        url = f"{self._s.frontend_base_url}/auth.html?action=verify&token={token}"
        subject, html = render_email(
            "verify_email",
            language,
            name=name,
            verify_url=url,
            ttl_hours=VERIFY_TTL_HOURS,
        )
        await self._send(to, subject, html)

    async def send_password_reset(
        self, *, to: str, name: str, language: str, token: str
    ) -> None:
        url = f"{self._s.frontend_base_url}/auth.html?action=reset&token={token}"
        subject, html = render_email(
            "password_reset",
            language,
            name=name,
            reset_url=url,
            ttl_hours=RESET_TTL_HOURS,
        )
        await self._send(to, subject, html)


def get_email_service() -> EmailService:
    """Фабрика (для DI; в тестах переопределяется через dependency_overrides)."""
    return EmailService(get_settings())
