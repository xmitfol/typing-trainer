"""Admin panel Ф2: subscription_charges.status += 'refunded'.

Аддитивно: расширяет CHECK на status значением 'refunded' (возврат через
admin-панель, PaymentProvider.refund). Старые значения success/failed/
pending_3ds/pending_yk остаются валидными.

ВАЖНО про имя constraint: в initial_schema CheckConstraint был создан с
name="charge_status_valid", но metadata naming_convention
(`ck_%(table)s_%(constraint_name)s`, base.py) применилась ПОВЕРХ, дав
двойной префикс + PG-усечение до 63 символов с хвостом-хешем — фактическое
имя нестабильно (`ck_subscription_charges_ck_subscription_charges_charge__XXXX`).
Поэтому здесь НЕ хардкодим имя: находим CHECK, который ограничивает `status`,
по pg_get_constraintdef и пересоздаём его raw-SQL со стабильным явным именем
`ck_sc_status_valid` (raw SQL не применяет convention → имя как написано).

Revision ID: 202607021600
Revises: 202607021400
Create Date: 2026-07-02 16:00:00
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "202607021600"
down_revision: Union[str, None] = "202607021400"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_TABLE = "subscription_charges"
_NEW_NAME = "ck_sc_status_valid"

_OLD = (
    "status IN ('success', 'failed', 'pending_3ds', 'pending_yk')"
)
_NEW = (
    "status IN ('success', 'failed', 'pending_3ds', 'pending_yk', 'refunded')"
)


def _drop_status_check() -> None:
    """Найти и удалить CHECK, ограничивающий колонку status (любое имя)."""
    conn = op.get_bind()
    rows = conn.execute(
        sa.text(
            "SELECT conname, pg_get_constraintdef(oid) AS def "
            "FROM pg_constraint "
            "WHERE conrelid = 'subscription_charges'::regclass AND contype = 'c'"
        )
    ).fetchall()
    for name, definition in rows:
        d = (definition or "").lower()
        # CHECK на status с перечнем статусов (не amount/retry).
        if "status" in d and "pending_yk" in d:
            op.execute(f'ALTER TABLE {_TABLE} DROP CONSTRAINT "{name}"')
            return
    # Уже мог быть пересоздан под новым именем — не падаем.


def _add(check: str) -> None:
    op.execute(
        f"ALTER TABLE {_TABLE} ADD CONSTRAINT {_NEW_NAME} CHECK ({check})"
    )


def upgrade() -> None:
    _drop_status_check()
    _add(_NEW)


def downgrade() -> None:
    op.execute(f'ALTER TABLE {_TABLE} DROP CONSTRAINT "{_NEW_NAME}"')
    _add(_OLD)
