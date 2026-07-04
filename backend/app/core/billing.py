"""Provider-agnostic billing core (ADR-008).

Бизнес-логика (services/billing_service.py) зависит ТОЛЬКО от интерфейса
`PaymentProvider` и наших доменных типов — не от сырых ответов провайдера.
Конкретные провайдеры (`StubProvider`, `YooKassaProvider`) — плагины,
выбираются конфигом через `get_payment_provider(settings)`.

Здесь же — каталог тарифов (`PLAN_CATALOG` + `PERIODS`), синхронный с
assets/js/pricing.js (планы free/pro/family; периоды w1/m1/m3/m6/y1 с
множителями). Единственный источник правды для цен на бэкенде.

Реальные вызовы YooKassa API — TODO (тело методов `YooKassaProvider`),
включаются при подтверждённом shop. См. ADR-008 §Rollout.
"""

from __future__ import annotations

import hmac
import json
import secrets
from dataclasses import dataclass, field
from decimal import Decimal, InvalidOperation
from hashlib import sha256
from typing import TYPE_CHECKING, Literal, Protocol, runtime_checkable
from uuid import UUID

if TYPE_CHECKING:
    from app.config import Settings


# ─── Каталог тарифов (sync с assets/js/pricing.js) ───────────────────
#
# pricing.js хранит planы (basePrice) + PERIODS (factor). Цена периода =
# round(basePrice * factor / 10) * 10 (округление до 10 ₽). Повторяем ту же
# формулу в `price_kopecks`, чтобы фронт и бэкенд не разъезжались.
#
# ВАЖНО: цены в pricing.js помечены как "не канонические" (PO решает). Здесь
# берём значения из дизайн-handoff (490 Полный / 890 Семейный) — при смене
# правим в ОДНОМ месте (здесь) и синхронно в pricing.js.

PlanId = Literal["free", "pro", "family"]
PeriodId = Literal["w1", "m1", "m3", "m6", "y1"]


@dataclass(frozen=True)
class Period:
    """Период оплаты. `factor` — множитель к базовой месячной цене."""

    id: str
    label: str
    months: float
    factor: float
    savings: int = 0


@dataclass(frozen=True)
class Plan:
    """Тариф. `base_price_rub` — базовая цена за 1 месяц (m1), в рублях."""

    id: str
    label: str
    tagline: str
    base_price_rub: int
    features: tuple[str, ...] = ()
    purchasable: bool = True  # free — не оформляется через checkout


# Периоды — 1:1 с PERIODS в pricing.js
PERIODS: dict[str, Period] = {
    "w1": Period(id="w1", label="1 неделя", months=0.25, factor=0.30, savings=0),
    "m1": Period(id="m1", label="1 месяц", months=1, factor=1.00, savings=0),
    "m3": Period(id="m3", label="3 месяца", months=3, factor=2.55, savings=15),
    "m6": Period(id="m6", label="6 месяцев", months=6, factor=4.50, savings=25),
    "y1": Period(id="y1", label="1 год", months=12, factor=7.80, savings=35),
}

# Планы — 1:1 с PLANS в pricing.js (free/pro/family)
PLAN_CATALOG: dict[str, Plan] = {
    "free": Plan(
        id="free",
        label="Бесплатно",
        tagline="То что есть",
        base_price_rub=0,
        features=("Уроки 1-5", "Один язык", "Базовая статистика"),
        purchasable=False,
    ),
    "pro": Plan(
        id="pro",
        label="Полный",
        tagline="Лучший выбор для одного",
        base_price_rub=490,
        features=(
            "Все 99 уроков",
            "Все 3 типа клавиатуры",
            "Все языки и раскладки",
            "Тренажёр скорости с метрономом",
            "Сертификат",
        ),
    ),
    "family": Plan(
        id="family",
        label="Семейный",
        tagline="До 5 человек",
        base_price_rub=890,
        features=(
            "Всё из Полного",
            "5 профилей (взрослые + дети)",
            "Подростковый курс с Кнопычем",
            "Детский курс с Клавочкой",
            "Родительская статистика",
        ),
    ),
}


def price_kopecks(plan: Plan, period: Period) -> int:
    """Цена (в копейках) плана за период. Формула = pricing.js computePrice.

    JS: round(basePrice * factor / 10) * 10 (округление до 10 ₽) → в копейки.
    """
    if plan.base_price_rub == 0:
        return 0
    rub = round(plan.base_price_rub * period.factor / 10) * 10
    return rub * 100


def get_plan(plan_id: str) -> Plan | None:
    return PLAN_CATALOG.get(plan_id)


def get_period(period_id: str) -> Period | None:
    return PERIODS.get(period_id)


def period_days(period_id: str | None) -> int:
    """Длительность подписки в днях по периоду (для expires_at). Дефолт — 30."""
    p = PERIODS.get(period_id) if period_id else None
    return round((p.months if p else 1.0) * 30)


# ─── Доменные типы (нормализованные, provider-agnostic) ──────────────

WebhookKind = Literal["payment.succeeded", "payment.failed", "payment.canceled", "refund"]


@dataclass(frozen=True)
class CheckoutResult:
    """Результат создания платежа у провайдера — куда редиректить юзера."""

    provider_payment_id: str
    confirmation_url: str
    status: str  # pending / succeeded (stub может подтвердить сразу)


@dataclass(frozen=True)
class WebhookEvent:
    """Нормализованное webhook-событие провайдера.

    `kind` — наш enum, `raw` — исходный payload (для audit/debug).
    """

    kind: WebhookKind
    provider_payment_id: str
    status: str
    amount_kopecks: int | None = None
    payment_method_id: str | None = None
    raw: dict = field(default_factory=dict)


@dataclass(frozen=True)
class ChargeResult:
    """Результат recurring-списания (auto-renew, ADR-005)."""

    provider_payment_id: str
    status: str  # success / failed
    error_code: str | None = None
    error_message: str | None = None


@dataclass(frozen=True)
class RefundResult:
    """Результат возврата (admin-panel TSD §3.3, Ф2)."""

    refund_id: str
    status: str  # succeeded / pending / failed


# ─── Интерфейс провайдера ─────────────────────────────────────────────


@runtime_checkable
class PaymentProvider(Protocol):
    """Контракт платёжного провайдера (ADR-008 §1).

    Все методы работают в терминах НАШИХ доменных типов, не сырых ответов
    провайдера. Проверка webhook-подписи и нормализация — внутри parse_webhook.
    """

    name: str

    def create_checkout(
        self,
        *,
        user_id: UUID,
        plan: str,
        period: str,
        amount_kopecks: int,
        currency: str,
        idempotency_key: str,
        return_url: str,
    ) -> CheckoutResult:
        """Создать платёж у провайдера, вернуть confirmation_url."""
        ...

    def parse_webhook(self, *, headers: dict[str, str], raw_body: bytes) -> WebhookEvent | None:
        """Проверить подпись + нормализовать webhook. None если не наш/невалиден."""
        ...

    def charge_recurring(
        self,
        *,
        payment_method_id: str,
        amount_kopecks: int,
        currency: str,
        idempotency_key: str,
    ) -> ChargeResult:
        """Авто-продление сохранённым payment_method (ADR-005 Hybrid)."""
        ...

    def cancel(self, *, provider_payment_id: str) -> None:
        """Отмена на стороне провайдера (если нужна). Обычно no-op."""
        ...

    def refund(
        self,
        *,
        provider_payment_id: str,
        amount_kopecks: int,
        idempotency_key: str,
    ) -> RefundResult:
        """Возврат средств по платежу (admin-panel TSD §3.3, Ф2).

        `provider_payment_id` — исходный успешный платёж; `amount_kopecks` —
        сумма возврата (полный/частичный); `idempotency_key` — защита от
        двойного возврата на стороне провайдера.
        """
        ...


# ─── StubProvider — полностью рабочий (дев/тест/CI) ──────────────────


class StubProvider:
    """Фейковый провайдер: прогоняет весь путь checkout → подписка → paywall
    без реального провайдера и без денег (ADR-008 §2).

    - create_checkout → confirmation_url на локальную «эмуляцию оплаты»
      (`return_url` фронта с меткой stub) + сразу возвращает succeeded.
    - parse_webhook → доверяет stub-подписи (HMAC на jwt_secret_key), считает
      событие succeeded (эмуляция мгновенной оплаты).
    - charge_recurring → всегда success.
    - cancel → no-op.
    """

    name = "stub"

    def __init__(self, *, signing_secret: str) -> None:
        self._secret = signing_secret.encode()

    # Подпись stub-webhook'а: HMAC-SHA256(provider_payment_id) в hex.
    def _sign(self, provider_payment_id: str) -> str:
        return hmac.new(self._secret, provider_payment_id.encode(), sha256).hexdigest()

    def create_checkout(
        self,
        *,
        user_id: UUID,
        plan: str,
        period: str,
        amount_kopecks: int,
        currency: str,
        idempotency_key: str,
        return_url: str,
    ) -> CheckoutResult:
        # Детерминированный fake payment_id (по idempotency_key + рандом-хвост).
        payment_id = f"stub_{secrets.token_hex(12)}"
        sig = self._sign(payment_id)
        # confirmation_url ведёт на локальную эмуляцию: фронт открывает,
        # видит успех, дёргает webhook сам (или сервер симулирует — см. service).
        sep = "&" if "?" in return_url else "?"
        confirmation_url = f"{return_url}{sep}stub_payment_id={payment_id}&stub_sig={sig}"
        return CheckoutResult(
            provider_payment_id=payment_id,
            confirmation_url=confirmation_url,
            status="pending",
        )

    def parse_webhook(self, *, headers: dict[str, str], raw_body: bytes) -> WebhookEvent | None:
        """Stub-webhook: JSON {provider_payment_id, sig, [kind, amount_kopecks]}.

        Подпись HMAC-SHA256 проверяется constant-time. Kind по умолчанию —
        payment.succeeded (мгновенный успех эмуляции).
        """
        import json

        try:
            body = json.loads(raw_body or b"{}")
        except (ValueError, TypeError):
            return None

        payment_id = body.get("provider_payment_id")
        sig = body.get("sig", "")
        if not payment_id:
            return None
        expected = self._sign(payment_id)
        if not hmac.compare_digest(sig, expected):
            return None  # подпись не сошлась — не наш/подделка

        kind: WebhookKind = body.get("kind", "payment.succeeded")
        return WebhookEvent(
            kind=kind,
            provider_payment_id=payment_id,
            status="succeeded" if kind == "payment.succeeded" else "failed",
            amount_kopecks=body.get("amount_kopecks"),
            payment_method_id=body.get("payment_method_id", f"stub_pm_{payment_id}"),
            raw=body,
        )

    def charge_recurring(
        self,
        *,
        payment_method_id: str,
        amount_kopecks: int,
        currency: str,
        idempotency_key: str,
    ) -> ChargeResult:
        # Эмуляция: авто-продление всегда проходит.
        return ChargeResult(
            provider_payment_id=f"stub_{secrets.token_hex(12)}",
            status="success",
        )

    def cancel(self, *, provider_payment_id: str) -> None:
        # Нечего отменять на стороне провайдера — no-op.
        return None

    def refund(
        self,
        *,
        provider_payment_id: str,
        amount_kopecks: int,
        idempotency_key: str,
    ) -> RefundResult:
        """Эмуляция возврата: детерминированный подписанный refund_id, success.

        refund_id = "stub_refund_" + HMAC-SHA256(jwt_secret, provider_payment_id
        + ":" + idempotency_key)[:24]. Детерминирован по (платёж, ключ) — тот же
        refund → тот же id (клиентская идемпотентность полагается на charge-
        уникальность в billing-слое; здесь провайдер стабилен).
        """
        material = f"{provider_payment_id}:{idempotency_key}".encode()
        digest = hmac.new(self._secret, material, sha256).hexdigest()
        return RefundResult(refund_id=f"stub_refund_{digest[:24]}", status="succeeded")

    def make_webhook_body(
        self, provider_payment_id: str, *, kind: WebhookKind = "payment.succeeded"
    ) -> dict:
        """Helper для тестов/эмуляции: собрать подписанное stub-webhook-тело."""
        return {
            "provider_payment_id": provider_payment_id,
            "sig": self._sign(provider_payment_id),
            "kind": kind,
        }


# ─── YooKassaProvider — СКЕЛЕТ (prod, ADR-005) ───────────────────────

# Событие YK-notification → наш WebhookKind. payment.waiting_for_capture
# не маппим: платим с capture:true, capture-flow не используется.
# refund.succeeded → "refund" (object там — refund, см. normalize_webhook).
_YK_EVENT_TO_KIND: dict[str, WebhookKind] = {
    "payment.succeeded": "payment.succeeded",
    "payment.canceled": "payment.canceled",
    "refund.succeeded": "refund",
}


def _yk_amount_to_kopecks(amount: object) -> int | None:
    """YK-сумма `{"value": "490.00", "currency": "RUB"}` → копейки (49000).

    Через Decimal — без float-дрейфа ("489.99" → 48999 ровно). Отсутствующее
    поле, кривое значение, отрицательная или дробная-в-копейках сумма → None.
    """
    if not isinstance(amount, dict):
        return None
    value = amount.get("value")
    if isinstance(value, bool) or not isinstance(value, str | int):
        return None
    try:
        kopecks = Decimal(str(value)) * 100
    except InvalidOperation:
        return None
    if not kopecks.is_finite() or kopecks < 0 or kopecks != int(kopecks):
        return None
    return int(kopecks)


class YooKassaProvider:
    """Реальный провайдер YooKassa (ADR-005 Hybrid recurring).

    СКЕЛЕТ: сигнатуры готовы, но тело реальных HTTP-вызовов — TODO
    (включается при подтверждённом shop; интеграционный тест на VM, как auth
    в Sprint 1). Исключение — `normalize_webhook`: оффлайн-нормализация
    notification-payload'ов реализована и покрыта юнит-тестами
    (разрешение Ники, handoff 2026-07-04 §0.1а); верификация источника
    webhook'а (`_verify_webhook_source`) остаётся припаркованной.

    Подставляем shop_id/secret_key → заработает без изменений бизнес-логики.
    """

    name = "yookassa"

    def __init__(
        self,
        *,
        shop_id: str,
        secret_key: str,
        webhook_secret: str | None,
        test_mode: bool = True,
    ) -> None:
        self._shop_id = shop_id
        self._secret_key = secret_key
        self._webhook_secret = webhook_secret
        self._test_mode = test_mode
        # TODO: инициализация SDK/httpx-клиента YooKassa (Basic auth shop_id:secret_key)

    def create_checkout(
        self,
        *,
        user_id: UUID,
        plan: str,
        period: str,
        amount_kopecks: int,
        currency: str,
        idempotency_key: str,
        return_url: str,
    ) -> CheckoutResult:
        # TODO: POST https://api.yookassa.ru/v3/payments
        #   headers: Idempotence-Key=idempotency_key, Basic auth shop_id:secret_key
        #   body: { amount:{value, currency}, capture:true,
        #           confirmation:{type:"redirect", return_url},
        #           save_payment_method:true,   # для recurring (ADR-005)
        #           metadata:{user_id, plan, period} }
        #   → CheckoutResult(payment.id, payment.confirmation.confirmation_url, payment.status)
        raise NotImplementedError(
            "YooKassaProvider.create_checkout — реальный вызов YK API "
            "(TODO: подтверждённый shop, ADR-008 §Rollout шаг 3)"
        )

    def parse_webhook(self, *, headers: dict[str, str], raw_body: bytes) -> WebhookEvent | None:
        # Верификация источника ОБЯЗАТЕЛЬНА до нормализации: YooKassa шлёт
        # notification без HMAC-подписи, доверять телу нельзя. Пока она
        # припаркована (NotImplementedError ниже) — боевой парсинг невозможен,
        # fail-fast by design.
        self._verify_webhook_source(headers=headers)
        return self.normalize_webhook(raw_body)

    def _verify_webhook_source(self, *, headers: dict[str, str]) -> None:
        # TODO (подтверждённый shop, ADR-008 §Rollout шаг 3):
        #   1. source IP против официального allowlist YK (за LB — real_ip)
        #      и/или webhook_secret, если настроен в кабинете;
        #   2. (рекомендация YK) контрольный GET /v3/payments/{object.id} —
        #      статус брать из ответа API, не из тела notification.
        raise NotImplementedError(
            "YooKassaProvider._verify_webhook_source — verify YK notification source "
            "(TODO: подтверждённый shop, ADR-008 §Rollout шаг 3)"
        )

    @staticmethod
    def normalize_webhook(raw_body: bytes) -> WebhookEvent | None:
        """Нормализовать тело YK-notification в `WebhookEvent`. Оффлайн, без HTTP.

        Формат (YK API v3): `{"type": "notification", "event": <имя>,
        "object": {payment | refund}}`. Битый JSON, незнакомое событие или
        отсутствие обязательных полей → None (эндпоинт молча игнорирует,
        отвечая 200).

        Особенности маппинга:
        - refund.succeeded: object — это refund; в `provider_payment_id`
          кладём `object.payment_id` (исходный платёж) — `apply_webhook`
          ищет подписку по `yookassa_payment_id`.
        - `payment_method_id` берём только у payment.succeeded и только при
          `saved: true` — несохранённый метод бесполезен для recurring
          (ADR-005 Hybrid).
        - Суммы: `{"value": "490.00", ...}` → копейки через Decimal (без
          float-дрейфа); некорректная/дробная-в-копейках сумма → None в
          `amount_kopecks` (apply_webhook подставит сумму подписки).
        """
        try:
            body = json.loads(raw_body or b"{}")
        except (ValueError, TypeError):
            return None
        if not isinstance(body, dict):
            return None

        event_name = body.get("event")
        if not isinstance(event_name, str):
            return None
        kind = _YK_EVENT_TO_KIND.get(event_name)
        if kind is None:
            return None

        obj = body.get("object")
        if not isinstance(obj, dict):
            return None

        # Для refund событие привязываем к ИСХОДНОМУ платежу, не к id возврата.
        payment_id = obj.get("payment_id") if kind == "refund" else obj.get("id")
        if not isinstance(payment_id, str) or not payment_id:
            return None

        status = obj.get("status")
        if not isinstance(status, str) or not status:
            return None

        payment_method_id: str | None = None
        if kind == "payment.succeeded":
            pm = obj.get("payment_method")
            if isinstance(pm, dict) and pm.get("saved") is True:
                pm_id = pm.get("id")
                if isinstance(pm_id, str) and pm_id:
                    payment_method_id = pm_id

        return WebhookEvent(
            kind=kind,
            provider_payment_id=payment_id,
            status=status,
            amount_kopecks=_yk_amount_to_kopecks(obj.get("amount")),
            payment_method_id=payment_method_id,
            raw=body,
        )

    def charge_recurring(
        self,
        *,
        payment_method_id: str,
        amount_kopecks: int,
        currency: str,
        idempotency_key: str,
    ) -> ChargeResult:
        # TODO: POST /v3/payments с payment_method_id (без confirmation) —
        #   off-session списание сохранённым методом (ADR-005 Hybrid renewal).
        raise NotImplementedError("YooKassaProvider.charge_recurring — off-session charge (TODO)")

    def cancel(self, *, provider_payment_id: str) -> None:
        # YK: подписки как таковой на стороне провайдера нет (мы сами дёргаем
        # recurring). Отмена = перестать списывать → провайдер-side no-op.
        return None

    def refund(
        self,
        *,
        provider_payment_id: str,
        amount_kopecks: int,
        idempotency_key: str,
    ) -> RefundResult:
        # TODO (F2-PROD, ждёт подтверждённый shop): реальный YK Refunds API —
        #   POST https://api.yookassa.ru/v3/refunds
        #   headers: Idempotence-Key=idempotency_key, Basic auth shop_id:secret_key
        #   body: { amount:{value: amount_kopecks/100, currency},
        #           payment_id: provider_payment_id }
        #   → RefundResult(refund.id, refund.status)  # succeeded / pending / canceled
        raise NotImplementedError(
            "YooKassaProvider.refund — реальный вызов YK Refunds API "
            "(TODO: подтверждённый shop, ADR-008 §Rollout / admin-panel F2-PROD)"
        )


# ─── Фабрика ──────────────────────────────────────────────────────────


def get_payment_provider(settings: Settings) -> PaymentProvider:
    """Выбор провайдера по `settings.billing_provider` (ADR-008 §2).

    Raises:
        ValueError: yookassa выбран, но креды не заданы (fail-fast на старте).
    """
    if settings.billing_provider == "stub":
        return StubProvider(signing_secret=settings.jwt_secret_key)

    if settings.billing_provider == "yookassa":
        if not settings.yookassa_shop_id or settings.yookassa_secret_key is None:
            raise ValueError(
                "billing_provider='yookassa', но yookassa_shop_id/secret_key не заданы"
            )
        return YooKassaProvider(
            shop_id=settings.yookassa_shop_id,
            secret_key=settings.yookassa_secret_key.get_secret_value(),
            webhook_secret=(
                settings.yookassa_webhook_secret.get_secret_value()
                if settings.yookassa_webhook_secret is not None
                else None
            ),
            test_mode=settings.yookassa_test_mode,
        )

    raise ValueError(f"Unknown billing_provider: {settings.billing_provider!r}")
