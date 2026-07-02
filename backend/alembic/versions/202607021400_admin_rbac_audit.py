"""Admin panel Ф1: users.role + admin_audit_log (RBAC + аудит).

Аддитивно/безопасно на непустой таблице (как billing-миграция 202607011200):
  - users.role String(12) NOT NULL server_default 'user' + CHECK + индексы
    (частичный ix_users_staff по role<>'user', ix_users_name для поиска);
  - таблица admin_audit_log (id BigInt PK, actor FK SET NULL, action/target,
    payload JSONB, ip_hash, created_at) + два составных индекса.

Ничего существующего не трогает (charge/subscriptions/… — без изменений).

Revision ID: 202607021400
Revises: 202607011200
Create Date: 2026-07-02 14:00:00
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "202607021400"
down_revision: Union[str, None] = "202607011200"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── F1-1: users.role ──────────────────────────────────────────────
    op.add_column(
        "users",
        sa.Column(
            "role",
            sa.String(12),
            nullable=False,
            server_default=sa.text("'user'"),
        ),
    )
    op.create_check_constraint(
        "ck_users_role_valid",
        "users",
        "role IN ('user', 'analyst', 'support', 'superadmin')",
    )
    # Частичный индекс — быстрый список сотрудников.
    op.create_index(
        "ix_users_staff",
        "users",
        ["role"],
        postgresql_where=sa.text("role <> 'user'"),
    )
    # Поиск юзеров по имени (email уже unique CITEXT).
    op.create_index("ix_users_name", "users", ["name"])

    # ── F1-2: admin_audit_log ─────────────────────────────────────────
    op.create_table(
        "admin_audit_log",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("actor_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("action", sa.String(length=48), nullable=False),
        sa.Column("target_type", sa.String(length=24), nullable=False),
        sa.Column("target_id", sa.String(length=64), nullable=False),
        sa.Column(
            "payload",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
        sa.Column("ip_hash", sa.String(length=64), nullable=True),
        sa.Column(
            "created_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["actor_user_id"],
            ["users.id"],
            name="fk_admin_audit_log_actor_user_id_users",
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_admin_audit_log"),
    )
    op.create_index(
        "ix_admin_audit_actor_time",
        "admin_audit_log",
        ["actor_user_id", "created_at"],
        postgresql_ops={"created_at": "DESC"},
    )
    op.create_index(
        "ix_admin_audit_target_time",
        "admin_audit_log",
        ["target_type", "target_id", "created_at"],
        postgresql_ops={"created_at": "DESC"},
    )


def downgrade() -> None:
    op.drop_index("ix_admin_audit_target_time", table_name="admin_audit_log")
    op.drop_index("ix_admin_audit_actor_time", table_name="admin_audit_log")
    op.drop_table("admin_audit_log")

    op.drop_index("ix_users_name", table_name="users")
    op.drop_index("ix_users_staff", table_name="users")
    op.drop_constraint("ck_users_role_valid", "users", type_="check")
    op.drop_column("users", "role")
