"""Tests для core/billing.py — YooKassa webhook-нормализация (offline).

Разрешение Ники (handoff 2026-07-04 §0.1а): достаём вперёд ТОЛЬКО оффлайн
нормализацию notification-payload'ов — без HTTP-методов и без верификации
источника (та остаётся припаркованной до подтверждённого shop).

Payload'ы — по формату YooKassa API v3 (notification: type/event/object).
"""

import json

import pytest

from app.core.billing import WebhookEvent, YooKassaProvider, _yk_amount_to_kopecks


def _notification(event: str, obj: dict) -> bytes:
    """Собрать сырое тело YK-notification, как его шлёт провайдер."""
    return json.dumps({"type": "notification", "event": event, "object": obj}).encode()


def _payment_object(**overrides: object) -> dict:
    """Типичный payment-object из notification payment.succeeded."""
    obj = {
        "id": "2c85115d-0015-5000-8000-1f64111bc63e",
        "status": "succeeded",
        "paid": True,
        "amount": {"value": "490.00", "currency": "RUB"},
        "income_amount": {"value": "472.85", "currency": "RUB"},
        "description": "Подписка «Полный», 1 месяц",
        "payment_method": {
            "type": "bank_card",
            "id": "2c85115d-0015-5000-8000-1f64111bc63e",
            "saved": True,
            "title": "Bank card *4444",
        },
        "created_at": "2026-07-04T10:00:00.000Z",
        "test": True,
        "metadata": {"user_id": "u-1", "plan": "pro", "period": "m1"},
    }
    obj.update(overrides)
    return obj


# ─── normalize_webhook: happy paths ──────────────────────────────────


def test_payment_succeeded_normalized() -> None:
    body = _notification("payment.succeeded", _payment_object())
    event = YooKassaProvider.normalize_webhook(body)

    assert isinstance(event, WebhookEvent)
    assert event.kind == "payment.succeeded"
    assert event.provider_payment_id == "2c85115d-0015-5000-8000-1f64111bc63e"
    assert event.status == "succeeded"
    assert event.amount_kopecks == 49000
    assert event.payment_method_id == "2c85115d-0015-5000-8000-1f64111bc63e"
    # raw сохраняет исходный payload целиком (audit/debug)
    assert event.raw["event"] == "payment.succeeded"
    assert event.raw["object"]["metadata"]["plan"] == "pro"


def test_payment_canceled_normalized() -> None:
    obj = _payment_object(
        status="canceled",
        paid=False,
        cancellation_details={"party": "yoo_money", "reason": "card_expired"},
    )
    event = YooKassaProvider.normalize_webhook(_notification("payment.canceled", obj))

    assert event is not None
    assert event.kind == "payment.canceled"
    assert event.status == "canceled"
    # canceled → payment_method не сохраняем (recurring не с чем строить)
    assert event.payment_method_id is None


def test_refund_succeeded_maps_to_original_payment() -> None:
    refund_obj = {
        "id": "3d9f2b8a-0016-5000-9000-145f6df21d6f",  # id самого возврата
        "payment_id": "2c85115d-0015-5000-8000-1f64111bc63e",  # исходный платёж
        "status": "succeeded",
        "amount": {"value": "245.00", "currency": "RUB"},
        "created_at": "2026-07-04T11:00:00.000Z",
    }
    event = YooKassaProvider.normalize_webhook(_notification("refund.succeeded", refund_obj))

    assert event is not None
    assert event.kind == "refund"
    # apply_webhook ищет подписку по yookassa_payment_id → тут id ПЛАТЕЖА
    assert event.provider_payment_id == "2c85115d-0015-5000-8000-1f64111bc63e"
    assert event.amount_kopecks == 24500


def test_unsaved_payment_method_not_captured() -> None:
    """saved: false → метод нельзя переиспользовать off-session (ADR-005)."""
    obj = _payment_object(
        payment_method={"type": "bank_card", "id": "pm-1", "saved": False},
    )
    event = YooKassaProvider.normalize_webhook(_notification("payment.succeeded", obj))

    assert event is not None
    assert event.payment_method_id is None


def test_missing_amount_gives_none_kopecks() -> None:
    """Сумма опциональна: apply_webhook подставит сумму подписки."""
    obj = _payment_object()
    del obj["amount"]
    event = YooKassaProvider.normalize_webhook(_notification("payment.succeeded", obj))

    assert event is not None
    assert event.amount_kopecks is None


# ─── normalize_webhook: мусор и незнакомые события → None ────────────


@pytest.mark.parametrize(
    "raw_body",
    [
        b"",  # пустое тело
        b"not json at all",
        b"[]",  # JSON, но не объект
        b'"string"',
        json.dumps({"type": "notification"}).encode(),  # нет event/object
        json.dumps({"event": ["payment.succeeded"], "object": {}}).encode(),  # event не строка
        json.dumps({"event": "payment.succeeded", "object": "oops"}).encode(),  # object не dict
    ],
    ids=["empty", "not-json", "list", "string", "no-event", "event-not-str", "object-not-dict"],
)
def test_garbage_rejected(raw_body: bytes) -> None:
    assert YooKassaProvider.normalize_webhook(raw_body) is None


@pytest.mark.parametrize(
    "event_name",
    ["payment.waiting_for_capture", "deal.closed", "payout.succeeded", "unknown.event"],
)
def test_unmapped_events_ignored(event_name: str) -> None:
    """waiting_for_capture и прочие — не наш flow (capture:true) → None."""
    body = _notification(event_name, _payment_object())
    assert YooKassaProvider.normalize_webhook(body) is None


def test_missing_payment_id_rejected() -> None:
    obj = _payment_object()
    del obj["id"]
    assert YooKassaProvider.normalize_webhook(_notification("payment.succeeded", obj)) is None


def test_refund_without_payment_id_rejected() -> None:
    refund_obj = {"id": "refund-1", "status": "succeeded"}  # нет payment_id
    assert YooKassaProvider.normalize_webhook(_notification("refund.succeeded", refund_obj)) is None


def test_missing_status_rejected() -> None:
    obj = _payment_object()
    del obj["status"]
    assert YooKassaProvider.normalize_webhook(_notification("payment.succeeded", obj)) is None


# ─── _yk_amount_to_kopecks: Decimal без float-дрейфа ─────────────────


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        ("490.00", 49000),
        ("489.99", 48999),  # float дал бы 48998.999…
        ("0.01", 1),
        ("1249.50", 124950),
        (490, 49000),  # int тоже принимаем
        ("0.00", 0),
    ],
)
def test_amount_to_kopecks(value: object, expected: int) -> None:
    assert _yk_amount_to_kopecks({"value": value, "currency": "RUB"}) == expected


@pytest.mark.parametrize(
    "amount",
    [
        None,
        "490.00",  # не dict
        {},  # нет value
        {"value": None},
        {"value": "abc"},
        {"value": "-1.00"},  # отрицательная
        {"value": "0.005"},  # дробные копейки
        {"value": "Infinity"},
        {"value": "NaN"},
        {"value": True},  # bool — не сумма
    ],
    ids=[
        "none",
        "not-dict",
        "no-value",
        "value-none",
        "not-number",
        "negative",
        "sub-kopeck",
        "infinity",
        "nan",
        "bool",
    ],
)
def test_amount_to_kopecks_rejects(amount: object) -> None:
    assert _yk_amount_to_kopecks(amount) is None


# ─── parse_webhook: верификация источника припаркована ───────────────


def test_parse_webhook_fails_fast_until_source_verification() -> None:
    """Боевой parse_webhook ОБЯЗАН падать, пока верификация источника — TODO.

    YK не подписывает notification HMAC'ом; принимать тело без проверки
    источника нельзя. Тест зафиксирует момент, когда верификацию реализуют:
    он упадёт — и его нужно будет заменить на тесты самой верификации.
    """
    provider = YooKassaProvider(
        shop_id="test-shop",
        secret_key="test-secret",
        webhook_secret=None,
        test_mode=True,
    )
    body = _notification("payment.succeeded", _payment_object())
    with pytest.raises(NotImplementedError):
        provider.parse_webhook(headers={}, raw_body=body)
