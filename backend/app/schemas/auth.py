"""Pydantic v2 schemas для auth (Sprint 1, S1.4).

Контракт зафиксирован в backend/openapi.yaml (S1.10). Enum'ы совпадают с
CHECK-constraints модели User (audience/character/language/gender).
"""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

Audience = Literal["adult", "teen", "kid"]
Character = Literal["anna", "maxim", "knopych", "klavochka"]
Language = Literal["ru", "en"]
Gender = Literal["m", "f"]


class CaptchaSolution(BaseModel):
    """Поля решённой капчи (ADR-006). Плоско в форме для удобства frontend.

    `honeypot` — скрытое поле; реальный клиент оставляет пустым. Имя поля в
    форме конфигурируемо (CAPTCHA_HONEYPOT_FIELD), здесь принимаем под
    нейтральным alias'ом `nickname2`.
    """

    captcha_challenge: str = Field(description="challenge из GET /auth/challenge")
    captcha_signature: str = Field(description="signature из GET /auth/challenge")
    captcha_nonce: str = Field(description="найденное клиентом решение PoW")
    honeypot: str = Field(default="", alias="nickname2")

    model_config = ConfigDict(populate_by_name=True)


class SignupRequest(CaptchaSolution):
    """POST /auth/signup body."""

    email: EmailStr = Field(max_length=254)
    password: str = Field(min_length=8, max_length=128)
    name: str = Field(min_length=1, max_length=80)
    audience: Audience
    character: Character
    gender: Gender | None = None
    language: Language = "ru"


class SigninRequest(BaseModel):
    """POST /auth/signin body.

    Поля captcha_* — опциональны: требуются только если сервер вернул
    403 CAPTCHA_REQUIRED (после серии неудачных попыток с этого IP).
    """

    email: EmailStr
    password: str
    captcha_challenge: str | None = None
    captcha_signature: str | None = None
    captcha_nonce: str | None = None


class VerifyEmailRequest(BaseModel):
    """POST /auth/verify-email body."""

    token: str


class ForgotPasswordRequest(CaptchaSolution):
    """POST /auth/forgot body — email + капча (ADR-006, защита от перебора)."""

    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """POST /auth/reset body."""

    token: str
    password: str = Field(min_length=8, max_length=128)


class ChallengeResponse(BaseModel):
    """GET /auth/challenge response (ADR-006)."""

    challenge: str
    signature: str
    difficulty: int
    algorithm: str


class UserPublic(BaseModel):
    """Публичная проекция User — без password_hash и служебных полей."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: EmailStr
    email_verified: bool
    name: str
    audience: Audience
    character: Character
    gender: Gender | None
    language: Language
    is_anonymous: bool
    created_at: datetime
