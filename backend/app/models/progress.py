"""Progress + Attempt models.

DDL: TSD §2.2.
- Progress: agregated state per (user, tier, lesson_num) — keyed composite PK.
- Attempt: append-only full history (для streaks/analytics/audit).
"""

from datetime import datetime, timedelta
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    ForeignKey,
    Index,
    Integer,
    Interval,
    PrimaryKeyConstraint,
    SmallInteger,
    String,
    text,
)
from sqlalchemy.dialects.postgresql import TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class Progress(Base):
    """Per-lesson best metrics.

    PK = (user_id, tier, lesson_num). Это позволяет:
    - upsert при `POST /me/progress`
    - per-tier прогресс сохраняется при tier-shift (ADR-002)
    - быстрый lookup для linear-progression checks
    """

    __tablename__ = "progress"

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    tier: Mapped[str] = mapped_column(String(20), nullable=False)
    lesson_num: Mapped[int] = mapped_column(SmallInteger, nullable=False)

    stars: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    best_wpm: Mapped[int] = mapped_column(Integer, nullable=False)
    best_accuracy: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    best_time: Mapped[timedelta] = mapped_column(Interval, nullable=False)

    completed_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=text("now()"),
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=text("now()"),
        onupdate=text("now()"),
    )

    user: Mapped["User"] = relationship(back_populates="progress")

    __table_args__ = (
        PrimaryKeyConstraint("user_id", "tier", "lesson_num", name="pk_progress"),
        CheckConstraint("lesson_num > 0", name="lesson_num_positive"),
        CheckConstraint("stars BETWEEN 0 AND 5", name="stars_range"),
        CheckConstraint("best_wpm BETWEEN 0 AND 1500", name="best_wpm_capped"),
        CheckConstraint("best_accuracy BETWEEN 0 AND 100", name="best_accuracy_range"),
        Index("ix_progress_user", "user_id"),
    )


class Attempt(Base):
    """Append-only history попыток (для streaks, achievements, analytics).

    BIGSERIAL PK — массовая вставка эффективнее UUID. Не cascade на user
    soft-delete: GDPR hard-delete отдельный flow через export.
    """

    __tablename__ = "attempts"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    tier: Mapped[str] = mapped_column(String(20), nullable=False)
    lesson_num: Mapped[int] = mapped_column(SmallInteger, nullable=False)

    wpm: Mapped[int] = mapped_column(Integer, nullable=False)
    accuracy: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    duration_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    errors: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=0)
    rhythm: Mapped[int | None] = mapped_column(SmallInteger)

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=text("now()"),
    )

    user: Mapped["User"] = relationship(back_populates="attempts")

    __table_args__ = (
        CheckConstraint("wpm BETWEEN 0 AND 1500", name="wpm_capped"),
        CheckConstraint("accuracy BETWEEN 0 AND 100", name="accuracy_range"),
        CheckConstraint("duration_ms >= 0", name="duration_nonneg"),
        CheckConstraint("errors >= 0", name="errors_nonneg"),
        Index("ix_attempts_user_date", "user_id", "created_at", postgresql_ops={"created_at": "DESC"}),
        Index("ix_attempts_user_tier", "user_id", "tier", "lesson_num"),
    )
