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
