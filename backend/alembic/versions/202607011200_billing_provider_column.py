"""Add provider column to subscriptions (ADR-008 — provider-agnostic billing).

Минимальная миграция поверх initial_schema: колонка `provider`
(String(20), NOT NULL, server_default 'stub'). Не трогает существующие
поля — yookassa_payment_id остаётся (обратная совместимость, семантика
обобщается до provider_payment_id).

Revision ID: 202607011200
Revises: 202606071800
Create Date: 2026-07-01 12:00:00
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "202607011200"
down_revision: Union[str, None] = "202606071800"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "subscriptions",
        sa.Column(
            "provider",
            sa.String(20),
            nullable=False,
            server_default=sa.text("'stub'"),
        ),
    )
    op.add_column(
        "subscriptions",
        sa.Column("period", sa.String(8), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("subscriptions", "period")
    op.drop_column("subscriptions", "provider")
