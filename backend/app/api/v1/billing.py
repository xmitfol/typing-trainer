"""Billing endpoints (ADR-008). Контракт — backend/openapi.yaml.

Тонкий слой: валидация (Pydantic) + вызов billing_service. Бизнес-логика и
транзакции — в services/billing_service.py. Провайдер выбирается конфигом
(get_payment_provider), эндпоинты его не знают.
"""

import structlog
from fastapi import APIRouter, HTTPException, Request, status

from app.config import get_settings
from app.core.billing import (
    PERIODS,
    PLAN_CATALOG,
    get_payment_provider,
    price_kopecks,
)
from app.core.exceptions import (
    PlanNotFoundError,
    SubscriptionNotFoundError,
)
from app.deps import CurrentUser, DbSession
from app.schemas.billing import (
    CheckoutRequest,
    CheckoutResponse,
    PeriodOut,
    PlanOut,
    PlansResponse,
    SubscriptionOut,
    SubscriptionStatusOut,
)
from app.services import billing_service

logger = structlog.get_logger(__name__)

router = APIRouter()


@router.get(
    "/plans",
    response_model=PlansResponse,
    summary="Каталог тарифов (публично)",
)
async def get_plans() -> PlansResponse:
    """Все планы каталога + цены по периодам. Sync с assets/js/pricing.js."""
    settings = get_settings()
    plans_out: list[PlanOut] = []
    for plan in PLAN_CATALOG.values():
        periods_out = [
            PeriodOut(
                id=period.id,
                label=period.label,
                months=period.months,
                savings=period.savings,
                amount_kopecks=price_kopecks(plan, period),
            )
            for period in PERIODS.values()
        ]
        plans_out.append(
            PlanOut(
                id=plan.id,
                label=plan.label,
                tagline=plan.tagline,
                base_price_rub=plan.base_price_rub,
                purchasable=plan.purchasable,
                features=list(plan.features),
                periods=periods_out,
            )
        )
    return PlansResponse(currency=settings.billing_currency, plans=plans_out)


@router.post(
    "/checkout",
    response_model=CheckoutResponse,
    summary="Создать оплату — вернуть confirmation_url (auth)",
)
async def create_checkout(
    payload: CheckoutRequest,
    user: CurrentUser,
    session: DbSession,
) -> CheckoutResponse:
    """Создаёт pending-подписку + checkout у провайдера. Юзера редиректим на URL."""
    try:
        sub, confirmation_url = await billing_service.create_checkout(
            session,
            user.id,
            payload.plan,
            payload.period,
            return_url=payload.return_url,
        )
    except PlanNotFoundError as e:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            detail={"code": e.code, "message": e.message},
        ) from e

    return CheckoutResponse(
        subscription_id=sub.id,
        confirmation_url=confirmation_url,
        amount_kopecks=sub.amount_kopecks,
        provider=sub.provider,
    )


@router.post(
    "/webhook/{provider}",
    status_code=status.HTTP_200_OK,
    summary="Callback провайдера (публично, сырое тело + headers)",
)
async def provider_webhook(
    provider: str,
    request: Request,
    session: DbSession,
) -> dict[str, str]:
    """Сырое тело + headers → provider.parse_webhook → apply_webhook (FSM).

    Всегда 200 (провайдеры ретраят на не-2xx). Невалидную подпись/чужой
    payload молча игнорируем (parse_webhook вернёт None).
    """
    raw_body = await request.body()
    headers = {k.lower(): v for k, v in request.headers.items()}

    settings = get_settings()
    payment_provider = get_payment_provider(settings)
    if payment_provider.name != provider:
        # Провайдер в URL не совпадает с активным конфигом — игнорируем.
        logger.warning("billing.webhook_provider_mismatch", url_provider=provider)
        return {"status": "ignored"}

    event = payment_provider.parse_webhook(headers=headers, raw_body=raw_body)
    if event is None:
        logger.warning("billing.webhook_rejected", provider=provider)
        return {"status": "ignored"}

    await billing_service.apply_webhook(session, provider, event)
    return {"status": "ok"}


@router.get(
    "/subscription",
    response_model=SubscriptionStatusOut,
    summary="Текущая подписка + флаг активности (auth)",
)
async def get_subscription(
    user: CurrentUser,
    session: DbSession,
) -> SubscriptionStatusOut:
    """Статус подписки для UI-гейтов. subscription=None если её нет."""
    sub = await billing_service.get_subscription(session, user.id)
    has_active = await billing_service.has_active_subscription(session, user.id)
    return SubscriptionStatusOut(
        has_active=has_active,
        subscription=SubscriptionOut.model_validate(sub) if sub is not None else None,
    )


@router.post(
    "/subscription/cancel",
    response_model=SubscriptionOut,
    summary="Отменить подписку (до end-of-period, auth)",
)
async def cancel_subscription(
    user: CurrentUser,
    session: DbSession,
) -> SubscriptionOut:
    """status='cancelled'. Доступ сохраняется до expires_at."""
    try:
        sub = await billing_service.cancel_subscription(session, user.id)
    except SubscriptionNotFoundError as e:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            detail={"code": e.code, "message": e.message},
        ) from e
    return SubscriptionOut.model_validate(sub)
