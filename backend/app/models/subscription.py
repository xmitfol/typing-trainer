"""Subscription + SubscriptionCharge models.

DDL: TSD §2.2 + §5 (Hybrid renewal flow из ADR-005).
- Subscription: FSM 6 состояний (pending/active/grace/expired/cancelled/failed).
- SubscriptionCharge: audit log всех попыток charge (idempotent).
"""

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    ForeignKey,
    Index,
    Integer,
    SmallInteger,
    String,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDPkMixin

if TYPE_CHECKING:
    from app.models.user import User


class Subscription(Base, UUIDPkMixin):
    """Подписка юзера. По ADR-005 — Hybrid recurring с fallback на email-reminder.

    FSM:
        pending → active → grace (если recurring fail) → expired
                       ↘ cancelled (по user request, остаётся active до end-of-period)
                       ↘ failed (initial checkout не удался)

    `is_auto_renew=True` + `payment_method_id` → автоматический cron берёт.
    При fail → `is_auto_renew=false`, `status='grace'`, `grace_until=now()+3д`.
    """

    __tablename__ = "subscriptions"

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    plan: Mapped[str] = mapped_column(String(20), nullable=False)
    period: Mapped[str | None] = mapped_column(String(8))  # w1/m1/m3/m6/y1 - срок подписки
    status: Mapped[str] = mapped_column(String(20), nullable=False)

    # Платёжный провайдер (ADR-008): 'stub' / 'yookassa' / … . server_default
    # 'stub' — существующие строки (если бы были) считаем stub'ом.
    provider: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        server_default=text("'stub'"),
    )

    started_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    expires_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))

    yookassa_payment_id: Mapped[str | None] = mapped_column(String(64), unique=True)
    amount_kopecks: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="RUB")

    # ── Hybrid renewal fields (ADR-005) ──────────────────────────────
    is_auto_renew: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    payment_method_id: Mapped[str | None] = mapped_column(String(64))
    last_charge_attempt_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    last_charge_error: Mapped[str | None] = mapped_column(String(255))
    last_reminder_sent_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    grace_until: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    cancelled_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=text("now()"),
    )

    user: Mapped["User"] = relationship(back_populates="subscriptions")
    charges: Mapped[list["SubscriptionCharge"]] = relationship(
        back_populates="subscription",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'active', 'grace', 'expired', 'cancelled', 'failed')",
            name="status_valid",
        ),
        CheckConstraint("amount_kopecks > 0", name="amount_positive"),
        # Active subscriptions — для быстрого `has_active_subscription` check
        Index(
            "ix_subs_user_active",
            "user_id",
            "status",
            postgresql_where=text("status = 'active'"),
        ),
        # Due for renewal — для daily ARQ cron (только auto-renew подписки)
        Index(
            "ix_subs_due_renewal",
            "expires_at",
            "status",
            postgresql_where=text("status IN ('active', 'grace') AND is_auto_renew = TRUE"),
        ),
        # Due for reminder — для email cron (7 дней до expiry без отправленного reminder'а)
        Index(
            "ix_subs_due_reminder",
            "expires_at",
            "status",
            postgresql_where=text("status = 'active'"),
        ),
    )


class SubscriptionCharge(Base):
    """Audit log всех попыток списания (recurring + manual).

    Существует для:
      1. Audit (compliance — 152-ФЗ + ЦБ требуют истории платежей)
      2. PO analytics (decline rate, manual recovery rate из ADR-005 Q10)
      3. Idempotency: перед каждым charge проверяем, не было ли успеха
         в этом period'е (защита от двойного списания).
    """

    __tablename__ = "subscription_charges"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    subscription_id: Mapped[UUID] = mapped_column(
        ForeignKey("subscriptions.id", ondelete="CASCADE"),
        nullable=False,
    )
    yookassa_payment_id: Mapped[str | None] = mapped_column(String(64), unique=True)
    idempotency_key: Mapped[str] = mapped_column(String(128), nullable=False)

    attempted_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=text("now()"),
    )
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    amount_kopecks: Mapped[int] = mapped_column(Integer, nullable=False)

    error_code: Mapped[str | None] = mapped_column(String(64))
    error_message: Mapped[str | None] = mapped_column(String(512))

    # True = recurring cron, False = manual click через email-flow
    is_recurring: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    # 0..3 — counter retry'ев из ADR-005 Q2 (3 max попытки)
    retry_number: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=0)

    charge_metadata: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        server_default=text("'{}'::jsonb"),
    )

    subscription: Mapped["Subscription"] = relationship(back_populates="charges")

    __table_args__ = (
        CheckConstraint(
            "status IN ('success', 'failed', 'pending_3ds', 'pending_yk', 'refunded')",
            name="charge_status_valid",
        ),
        CheckConstraint("amount_kopecks > 0", name="charge_amount_positive"),
        CheckConstraint("retry_number BETWEEN 0 AND 3", name="retry_number_range"),
        Index(
            "ix_sub_charges_sub_time",
            "subscription_id",
            "attempted_at",
            postgresql_ops={"attempted_at": "DESC"},
        ),
        Index("ix_sub_charges_idempotency", "idempotency_key"),
        # F2-SEC: partial UNIQUE на refund-контур — против гонки двойного
        # admin-refund. Только status='refunded' (не трогает webhook/recurring
        # SELECT-then-insert путь). См. migration 202607021800.
        Index(
            "uq_sub_charges_refund_idem",
            "idempotency_key",
            unique=True,
            postgresql_where=text("status = 'refunded'"),
        ),
        # Failed/pending — для admin debug + retry анализа
        Index(
            "ix_sub_charges_pending",
            "status",
            "attempted_at",
            postgresql_where=text("status IN ('failed', 'pending_3ds')"),
            postgresql_ops={"attempted_at": "DESC"},
        ),
    )
