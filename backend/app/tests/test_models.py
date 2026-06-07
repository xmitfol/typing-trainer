"""Smoke tests для моделей — что DDL валиден и все Base.metadata содержит
ожидаемые таблицы. Без БД (используем in-memory schema check).
"""

import pytest

from app.models import Base


@pytest.fixture
def metadata():
    return Base.metadata


def test_all_tables_registered(metadata) -> None:
    """8 core таблиц зарегистрированы в Base.metadata."""
    expected = {
        "users",
        "user_settings",
        "oauth_accounts",
        "progress",
        "attempts",
        "subscriptions",
        "subscription_charges",
        "events",
    }
    assert expected.issubset(set(metadata.tables.keys()))


def test_users_has_constraints(metadata) -> None:
    users = metadata.tables["users"]
    check_names = {c.name for c in users.constraints if c.name and c.name.startswith("ck_")}
    assert "ck_users_audience_valid" in check_names
    assert "ck_users_character_valid" in check_names
    assert "ck_users_language_valid" in check_names


def test_progress_pk_composite(metadata) -> None:
    """Progress PK = (user_id, tier, lesson_num)."""
    progress = metadata.tables["progress"]
    pk_columns = [c.name for c in progress.primary_key.columns]
    assert pk_columns == ["user_id", "tier", "lesson_num"]


def test_subscription_has_hybrid_renewal_fields(metadata) -> None:
    """ADR-005 fields присутствуют в subscriptions."""
    subs = metadata.tables["subscriptions"]
    col_names = {c.name for c in subs.columns}
    adr_fields = {
        "is_auto_renew",
        "payment_method_id",
        "last_charge_attempt_at",
        "last_charge_error",
        "last_reminder_sent_at",
        "grace_until",
        "cancelled_at",
    }
    assert adr_fields.issubset(col_names)


def test_subscription_charges_has_idempotency_key(metadata) -> None:
    """ADR-005 Q4: subscription_charges имеет idempotency_key."""
    charges = metadata.tables["subscription_charges"]
    col_names = {c.name for c in charges.columns}
    assert "idempotency_key" in col_names
    assert "retry_number" in col_names
    assert "is_recurring" in col_names


def test_events_user_id_nullable(metadata) -> None:
    """ADR-001: гостевые события (user_id IS NULL) поддерживаются."""
    events = metadata.tables["events"]
    user_id_col = events.c.user_id
    assert user_id_col.nullable is True


def test_users_email_citext(metadata) -> None:
    """Email — CITEXT (case-insensitive)."""
    users = metadata.tables["users"]
    email_col = users.c.email
    type_str = str(email_col.type).lower()
    assert "citext" in type_str
