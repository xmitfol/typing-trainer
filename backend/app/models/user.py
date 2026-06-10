"""User + UserSettings + OAuthAccount models.

DDL: TSD §2.2 + ADR-002 (profile mutation) + ADR-003 (family parent_user_id).
"""

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    ForeignKey,
    Index,
    SmallInteger,
    String,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import CITEXT, JSONB, TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPkMixin

if TYPE_CHECKING:
    from app.models.progress import Attempt, Progress
    from app.models.subscription import Subscription


class User(Base, UUIDPkMixin, TimestampMixin):
    """Главная сущность юзера.

    Email-CITEXT (case-insensitive), password_hash optional для OAuth-only,
    parent_user_id для family sub-accounts (ADR-003), deleted_at для soft delete
    с 30-дневным grace period (GDPR).
    """

    __tablename__ = "users"

    email: Mapped[str] = mapped_column(CITEXT, nullable=False, unique=True)
    email_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    password_hash: Mapped[str | None] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    audience: Mapped[str] = mapped_column(String(10), nullable=False)
    gender: Mapped[str | None] = mapped_column(String(1))
    character: Mapped[str] = mapped_column(String(20), nullable=False)
    language: Mapped[str] = mapped_column(String(2), nullable=False, default="ru")
    is_anonymous: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Family sub-account: parent имеет паблик-подписку, дети — без своей.
    parent_user_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
    )

    # Soft delete (GDPR) — hard delete через cron после 30 дней grace.
    deleted_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))

    # ── Relationships ────────────────────────────────────────────────
    settings: Mapped["UserSettings"] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        uselist=False,
    )
    oauth_accounts: Mapped[list["OAuthAccount"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    progress: Mapped[list["Progress"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    attempts: Mapped[list["Attempt"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    subscriptions: Mapped[list["Subscription"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    family_children: Mapped[list["User"]] = relationship(
        back_populates="parent",
        foreign_keys="User.parent_user_id",
    )
    parent: Mapped["User | None"] = relationship(
        back_populates="family_children",
        foreign_keys=[parent_user_id],
        remote_side="User.id",
    )

    __table_args__ = (
        CheckConstraint(
            "audience IN ('adult', 'teen', 'kid')",
            name="audience_valid",
        ),
        CheckConstraint(
            "gender IS NULL OR gender IN ('m', 'f')",
            name="gender_valid",
        ),
        CheckConstraint(
            "character IN ('anna', 'maxim', 'knopych', 'klavochka')",
            name="character_valid",
        ),
        CheckConstraint(
            "language IN ('ru', 'en')",
            name="language_valid",
        ),
        Index(
            "ix_users_email_active",
            "email",
            unique=True,
            postgresql_where=text("deleted_at IS NULL"),
        ),
        Index(
            "ix_users_parent",
            "parent_user_id",
            postgresql_where=text("parent_user_id IS NOT NULL"),
        ),
    )


class UserSettings(Base):
    """Per-user UI/задачные настройки.

    Отделено от users чтобы:
      1) Settings меняются часто (toolbar toggles) — не invalidate'ить
         cache юзерского профиля.
      2) Чисто (RBAC: parent может писать в свои settings но не в child's).
    """

    __tablename__ = "user_settings"

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )

    keyboard_type: Mapped[str] = mapped_column(String(20), nullable=False, default="classic")
    keyboard_layout: Mapped[str] = mapped_column(String(20), nullable=False, default="standard")

    finger_hint: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    key_sound: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    metronome: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    task_zoom: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=100)

    # Sprint 0 Polish pack additions
    hide_indicator: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    preview_off: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Parental time limit (ADR-003): для sub-account'ов, NULL для всех остальных
    time_limit_minutes_per_day: Mapped[int | None] = mapped_column(SmallInteger)

    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=text("now()"),
        onupdate=text("now()"),
    )

    user: Mapped["User"] = relationship(back_populates="settings")

    __table_args__ = (
        CheckConstraint(
            "keyboard_type IN ('classic', 'laptop', 'ergonomic')",
            name="keyboard_type_valid",
        ),
        CheckConstraint(
            "keyboard_layout IN ('standard', 'phonetic', 'typewriter', 'mac')",
            name="keyboard_layout_valid",
        ),
        CheckConstraint(
            "task_zoom BETWEEN 70 AND 150",
            name="task_zoom_range",
        ),
        CheckConstraint(
            "time_limit_minutes_per_day IS NULL OR time_limit_minutes_per_day BETWEEN 5 AND 240",
            name="time_limit_range",
        ),
    )


class OAuthAccount(Base, UUIDPkMixin):
    """Связь юзера с external OAuth provider'ом.

    Один user может иметь несколько OAuth accounts (например, и Yandex,
    и VK). Уникальность по (provider, external_id) — провайдер однозначно
    идентифицирует юзера.
    """

    __tablename__ = "oauth_accounts"

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    provider: Mapped[str] = mapped_column(String(10), nullable=False)
    external_id: Mapped[str] = mapped_column(String(255), nullable=False)
    raw_payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    linked_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=text("now()"),
    )

    user: Mapped["User"] = relationship(back_populates="oauth_accounts")

    __table_args__ = (
        UniqueConstraint("provider", "external_id", name="uq_oauth_provider_external"),
        CheckConstraint(
            "provider IN ('yandex', 'vk', 'google')",
            name="provider_valid",
        ),
        Index("ix_oauth_user", "user_id"),
    )
