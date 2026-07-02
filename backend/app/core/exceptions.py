"""Доменные исключения. Сервисы кидают их, API-слой мапит на HTTP-коды.

Принцип: бизнес-логика не знает про HTTP — это разделение api/ ↔ services/.
Каждому исключению соответствует машиночитаемый `code` (см. openapi.yaml Error).
"""


class DomainError(Exception):
    """База для доменных ошибок. `code` — машиночитаемый, `message` — для юзера."""

    code: str = "DOMAIN_ERROR"

    def __init__(self, message: str | None = None) -> None:
        self.message = message or self.__class__.__doc__ or self.code
        super().__init__(self.message)


class EmailTakenError(DomainError):
    """Email уже зарегистрирован."""

    code = "EMAIL_TAKEN"


class InvalidCredentialsError(DomainError):
    """Неверный email или пароль."""

    code = "INVALID_CREDENTIALS"


class TokenInvalidError(DomainError):
    """Токен невалиден или истёк."""

    code = "TOKEN_INVALID"


class OAuthNoEmailError(DomainError):
    """OAuth-провайдер не отдал email — без него аккаунт не создать (ADR-007 §3)."""

    code = "OAUTH_NO_EMAIL"


class AgeDowngradeForbiddenError(DomainError):
    """Нельзя «омолодить» аккаунт adult→kid (TSD §4a.3)."""

    code = "AGE_DOWNGRADE_FORBIDDEN"


# ─── Billing (ADR-008) ────────────────────────────────────────────────


class PlanNotFoundError(DomainError):
    """Тариф или период не найден в каталоге."""

    code = "PLAN_NOT_FOUND"


class SubscriptionNotFoundError(DomainError):
    """У пользователя нет подписки."""

    code = "SUBSCRIPTION_NOT_FOUND"


class SubscriptionRequiredError(DomainError):
    """Требуется активная подписка (paywall)."""

    code = "SUBSCRIPTION_REQUIRED"


class WebhookInvalidError(DomainError):
    """Webhook-подпись не прошла проверку или тело невалидно."""

    code = "WEBHOOK_INVALID"


# ─── Admin panel ──────────────────────────────────────────────────────


class UserNotFoundError(DomainError):
    """Пользователь не найден (admin-панель)."""

    code = "USER_NOT_FOUND"
