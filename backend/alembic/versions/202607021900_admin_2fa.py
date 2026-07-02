"""Ф4b: таблица admin_2fa (TOTP-2FA для superadmin).

Аддитивно поверх 202607021800. Отдельная sparse-таблица (строка только у
админов, начавших enrollment), 1:1 с users (user_id PK+FK CASCADE):
  - secret: Fernet-токен зашифрованного TOTP base32-секрета (не plaintext);
  - enabled: подтверждён ли enrollment (verify прошёл);
  - recovery_codes JSONB: список sha256-ХЕШЕЙ recovery-кодов (one-time);
  - created_at / confirmed_at.

Ничего существующего не трогает. downgrade — drop table.

Revision ID: 202607021900
Revises: 202607021800
Create Date: 2026-07-02 19:00:00
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "202607021900"
down_revision: Union[str, None] = "202607021800"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "admin_2fa",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("secret", sa.String(length=512), nullable=False),
        sa.Column(
            "enabled",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        sa.Column(
            "recovery_codes",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "confirmed_at",
            postgresql.TIMESTAMP(timezone=True),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name="fk_admin_2fa_user_id_users",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("user_id", name="pk_admin_2fa"),
    )


def downgrade() -> None:
    op.drop_table("admin_2fa")
