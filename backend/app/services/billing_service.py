"""Billing business logic (ADR-008 §4 — оркестрация).

Тонкие endpoint'ы вызывают эти функции. Транзакции — здесь (commit явный).
HTTP-кодов тут нет: при ошибке кидаем DomainError, api/ мапит на статус.

Провайдер получаем через `get_payment_provider(settings)` — бизнес-логика
не знает, stub это или yookassa (работает в терминах доменных типов).
"""

from datetime import UTC, datetime, timedelta
from uuid import UUID

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.core.billing import (
    Plan,
    Period,
    WebhookEvent,
    get_payment_provider,
    get_period,
    get_plan,
    price_kopecks,
    period_days,
)
from app.core.exceptions import (
    PlanNotFoundError,
    SubscriptionNotFoundError,
)
from app.models.subscription import Subscription, SubscriptionCharge

logger = structlog.get_logger(__name__)


def _now() -> datetime:
    return datetime.now(UTC)


def _resolve_plan_period(plan_id: str, period_id: str) -> tuple[Plan, Period]:
    """Достать план+период из каталога или кинуть PlanNotFoundError."""
    plan = get_plan(plan_id)
    period = get_period(period_id)
    if plan is None or period is None or not plan.purchasable:
        raise PlanNotFoundError(f"Неизвестный тариф/период: {plan_id}/{period_id}")
    return plan, period


async def create_checkout(
    session: AsyncSession,
    user_id: UUID,
    plan_id: str,
    period_id: str,
    *,
    return_url: str | None = None,
) -> tuple[Subscription, str]:
    """Создать pending-подписку + checkout у провайдера.

    Возвращает (subscription, confirmation_url). Юзера редиректим на URL.

    Raises:
        PlanNotFoundError: тариф/период не в каталоге или не покупаемый.
    """
    settings = get_settings()
    plan, period = _resolve_plan_period(plan_id, period_id)
    amount = price_kopecks(plan, period)
    provider = get_payment_provider(settings)

    sub = Subscription(
        user_id=user_id,
        plan=plan.id,
        period=period.id,
        status="pending",
        provider=provider.name,
        amount_kopecks=amount,
        currency=settings.billing_currency,
        is_auto_renew=True,
    )
    session.add(sub)
    await session.flush()  # получить sub.id до вызова провайдера

    idempotency_key = f"checkout:{sub.id}"
    result = provider.create_checkout(
        user_id=user_id,
        plan=plan.id,
        period=period.id,
        amount_kopecks=amount,
        currency=settings.billing_currency,
        idempotency_key=idempotency_key,
        return_url=return_url or settings.frontend_base_url,
    )

    # Обобщённый provider_payment_id пишем в yookassa_payment_id (semantics
    # обобщается по ADR-008 §3 — колонка переиспользуется всеми провайдерами).
    sub.yookassa_payment_id = result.provider_payment_id
    await session.commit()
    await session.refresh(sub)

    logger.info(
        "billing.checkout_created",
        subscription_id=str(sub.id),
        user_id=str(user_id),
        plan=plan.id,
        period=period.id,
        provider=provider.name,
        amount_kopecks=amount,
    )
    return sub, result.confirmation_url


async def apply_webhook(
    session: AsyncSession, provider_name: str, event: WebhookEvent
) -> None:
    """Применить нормализованное webhook-событие (FSM + audit). ИДЕМПОТЕНТНО.

    FSM: pending → active (payment.succeeded) / failed (payment.failed|canceled).
    Пишет SubscriptionCharge. Повторный webhook по тому же provider_payment_id
    не меняет состояние второй раз (идемпотентность по yookassa_payment_id +
    уникальному charge).
    """
    # Найти подписку по provider_payment_id (у нас = yookassa_payment_id).
    stmt = select(Subscription).where(
        Subscription.yookassa_payment_id == event.provider_payment_id
    )
    sub = (await session.execute(stmt)).scalar_one_or_none()
    if sub is None:
        logger.warning(
            "billing.webhook_unknown_payment",
            provider=provider_name,
            provider_payment_id=event.provider_payment_id,
        )
        return

    # Идемпотентность: уже был успешный charge по этому платежу → выходим.
    idempotency_key = f"webhook:{event.provider_payment_id}:{event.kind}"
    existing = (
        await session.execute(
            select(SubscriptionCharge.id).where(
                SubscriptionCharge.idempotency_key == idempotency_key
            )
        )
    ).first()
    if existing is not None:
        logger.info(
            "billing.webhook_duplicate",
            provider=provider_name,
            provider_payment_id=event.provider_payment_id,
            kind=event.kind,
        )
        return

    succeeded = event.kind == "payment.succeeded"
    charge = SubscriptionCharge(
        subscription_id=sub.id,
        # yookassa_payment_id — UNIQUE. Пишем только на success (один терминальный
        # успех на платёж); failed/canceled оставляем NULL (Postgres допускает
        # много NULL), чтобы failed→retry не ловил unique-violation. Идемпотентность
        # гарантируется idempotency_key (webhook:{pid}:{kind}).
        yookassa_payment_id=event.provider_payment_id if succeeded else None,
        idempotency_key=idempotency_key,
        status="success" if succeeded else "failed",
        amount_kopecks=event.amount_kopecks or sub.amount_kopecks,
        is_recurring=False,
        error_code=None if succeeded else event.kind,
    )
    session.add(charge)

    if succeeded:
        # pending → active. Срок считаем из sub.period (w1/m1/m3/m6/y1),
        # который зафиксировали при checkout: period_days(sub.period).
        # started_at ставим один раз (renewal продлевает от текущего expires_at).
        if sub.status in ("pending", "grace", "failed"):
            sub.status = "active"
            sub.started_at = sub.started_at or _now()
            sub.expires_at = (sub.started_at or _now()) + timedelta(days=period_days(sub.period))
            if event.payment_method_id:
                sub.payment_method_id = event.payment_method_id
    else:
        # failed/canceled → initial checkout не удался
        if sub.status == "pending":
            sub.status = "failed"
        sub.last_charge_error = event.kind
        sub.last_charge_attempt_at = _now()

    await session.commit()
    logger.info(
        "billing.webhook_applied",
        provider=provider_name,
        subscription_id=str(sub.id),
        kind=event.kind,
        new_status=sub.status,
    )


async def get_subscription(
    session: AsyncSession, user_id: UUID
) -> Subscription | None:
    """Самая свежая подписка юзера (любой статус) или None."""
    stmt = (
        select(Subscription)
        .where(Subscription.user_id == user_id)
        .order_by(Subscription.created_at.desc())
        .limit(1)
    )
    return (await session.execute(stmt)).scalar_one_or_none()


async def has_active_subscription(session: AsyncSession, user_id: UUID) -> bool:
    """Есть ли у юзера активная подписка (paywall-гейт).

    active — прямой доступ. cancelled — доступ до end-of-period (expires_at).
    grace — временный доступ при fail recurring (ADR-005).
    """
    now = _now()
    stmt = (
        select(Subscription.id)
        .where(
            Subscription.user_id == user_id,
            Subscription.status.in_(("active", "cancelled", "grace")),
            (Subscription.expires_at.is_(None)) | (Subscription.expires_at > now),
        )
        .limit(1)
    )
    return (await session.execute(stmt)).first() is not None


async def cancel_subscription(session: AsyncSession, user_id: UUID) -> Subscription:
    """Отменить подписку (до end-of-period). status='cancelled'.

    Доступ сохраняется до expires_at (не сразу обрезаем). Провайдер-side
    отмена — no-op у большинства (recurring перестаём дёргать).

    Raises:
        SubscriptionNotFoundError: нет подписки для отмены.
    """
    sub = await get_subscription(session, user_id)
    if sub is None or sub.status not in ("active", "grace", "pending"):
        raise SubscriptionNotFoundError()

    settings = get_settings()
    provider = get_payment_provider(settings)
    if sub.yookassa_payment_id:
        provider.cancel(provider_payment_id=sub.yookassa_payment_id)

    sub.status = "cancelled"
    sub.is_auto_renew = False
    sub.cancelled_at = _now()
    await session.commit()
    await session.refresh(sub)

    logger.info(
        "billing.cancelled",
        subscription_id=str(sub.id),
        user_id=str(user_id),
    )
    return sub
