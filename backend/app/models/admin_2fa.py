"""Admin2FA model — TOTP-2FA для superadmin (Ф4b).

Отдельная sparse-таблица (строка только у админов, которые начали enrollment),
1:1 с users (user_id PK+FK CASCADE). Хранит:
  - secret: TOTP base32-секрет, ЗАШИФРОВАННЫЙ at-rest (Fernet, см. core/totp.py).
    В БД лежит Fernet-токен (str), не plaintext-base32.
  - enabled: подтверждён ли enrollment (verify прошёл).
  - recovery_codes: JSONB-список ХЕШЕЙ recovery-кодов (sha256 hex), не plaintext.
    Использованный код удаляется из списка (one-time).
  - confirmed_at: момент успешного verify (для аудита).

Почему отдельная таблица, а не колонки в users: 2FA нужна ~единицам (superadmin),
sparse-таблица не раздувает users и держит крипто-секрет изолированно.
"""

from datetime import datetime
from uuid import UUID

from sqlalchemy import Boolean, ForeignKey, String, text
from sqlalchemy.dialects.postgresql import JSONB, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Admin2FA(Base):
    """TOTP-2FA enrollment одного админа (sparse, 1:1 users)."""

    __tablename__ = "admin_2fa"

    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    # Fernet-токен зашифрованного TOTP base32-секрета (не plaintext).
    secret: Mapped[str] = mapped_column(String(512), nullable=False)
    enabled: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=text("false")
    )
    # Список sha256-хешей recovery-кодов (hex). Использованный — удаляется.
    recovery_codes: Mapped[list[str]] = mapped_column(
        JSONB,
        nullable=False,
        default=list,
        server_default=text("'[]'::jsonb"),
    )
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=text("now()"),
    )
    confirmed_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
