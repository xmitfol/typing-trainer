"""Event model — analytics + audit.

DDL: TSD §2.2. Партиционирование по месяцам — добавляется в Sprint 8
через alembic. На Sprint 0/1 — обычная таблица.

PII: IP в plain не храним (152-ФЗ) — sha256 hash.
"""

from datetime import datetime
from uuid import UUID

from sqlalchemy import BigInteger, ForeignKey, Index, String, text
from sqlalchemy.dialects.postgresql import JSONB, TIMESTAMP, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Event(Base):
    """Аналитическое событие.

    user_id может быть NULL — события от анонимных гостей до signup'а.
    session_id — браузерная сессия (UUID v4 от фронта), позволяет связать
    pre-signup → post-signup трейл.
    """

    __tablename__ = "events"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
    )
    session_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), nullable=False)
    type: Mapped[str] = mapped_column(String(40), nullable=False)
    payload: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        server_default=text("'{}'::jsonb"),
    )
    user_agent: Mapped[str | None] = mapped_column(String(255))
    # SHA256(IP) — 64 hex chars. NULL для server-side events.
    ip_hash: Mapped[str | None] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=text("now()"),
    )

    __table_args__ = (
        Index(
            "ix_events_type_time",
            "type",
            "created_at",
            postgresql_ops={"created_at": "DESC"},
        ),
        Index(
            "ix_events_user_time",
            "user_id",
            "created_at",
            postgresql_where=text("user_id IS NOT NULL"),
            postgresql_ops={"created_at": "DESC"},
        ),
        # Анонимные события — для daily cleanup'а (ADR-001 TTL=3д)
        Index(
            "ix_events_anonymous_old",
            "created_at",
            postgresql_where=text("user_id IS NULL"),
        ),
    )
