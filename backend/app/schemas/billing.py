"""Pydantic v2 schemas для billing (ADR-008).

Контракт эндпоинтов billing: plans (публично), checkout, subscription.
Планы/периоды — из core/billing.PLAN_CATALOG (sync с assets/js/pricing.js).
"""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

PlanId = Literal["free", "pro", "family"]
PeriodId = Literal["w1", "m1", "m3", "m6", "y1"]


class PeriodOut(BaseModel):
    """Период оплаты с посчитанной ценой (для конкретного плана)."""

    id: str
    label: str
    months: float
    savings: int
    amount_kopecks: int = Field(description="Цена плана за этот период, в копейках")


class PlanOut(BaseModel):
    """Тариф из каталога + цены по всем периодам."""

    id: str
    label: str
    tagline: str
    base_price_rub: int
    purchasable: bool
    features: list[str]
    periods: list[PeriodOut]


class PlansResponse(BaseModel):
    """GET /billing/plans — весь каталог + валюта."""

    currency: str
    plans: list[PlanOut]


class CheckoutRequest(BaseModel):
    """POST /billing/checkout body."""

    plan: PlanId
    period: PeriodId
    return_url: str | None = Field(
        default=None,
        description="Куда провайдер вернёт юзера после оплаты. "
        "None → frontend_base_url из настроек.",
    )


class CheckoutResponse(BaseModel):
    """POST /billing/checkout response — redirect на confirmation_url."""

    subscription_id: UUID
    confirmation_url: str
    amount_kopecks: int
    provider: str


class SubscriptionOut(BaseModel):
    """GET /billing/subscription — текущий статус подписки."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    plan: str
    period: str | None = None
    status: str
    provider: str
    amount_kopecks: int
    currency: str
    started_at: datetime | None
    expires_at: datetime | None
    is_auto_renew: bool
    cancelled_at: datetime | None


class SubscriptionStatusOut(BaseModel):
    """Мягкий статус для paywall-UI (есть ли активный доступ)."""

    has_active: bool
    subscription: SubscriptionOut | None = None
