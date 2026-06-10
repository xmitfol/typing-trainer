"""Initial schema — users + user_settings + oauth_accounts + progress + attempts
+ subscriptions + subscription_charges + events.

Включает ВСЁ из TSD §2.2 + ADR-005 schema additions. В Sprint 1+ модели
будут дополняться через autogenerate.

Revision ID: 202606071800
Revises: None
Create Date: 2026-06-07 18:00:00
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import CITEXT, JSONB, TIMESTAMP, UUID


revision: str = "202606071800"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Extensions нужны для UUID generation + CITEXT
    op.execute('CREATE EXTENSION IF NOT EXISTS "citext"')
    op.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')  # для gen_random_uuid()

    # ─── users ───────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column(
            "id",
            UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("email", CITEXT(), nullable=False),
        sa.Column("email_verified", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("password_hash", sa.String(255)),
        sa.Column("name", sa.String(80), nullable=False),
        sa.Column("audience", sa.String(10), nullable=False),
        sa.Column("gender", sa.String(1)),
        sa.Column("character", sa.String(20), nullable=False),
        sa.Column("language", sa.String(2), nullable=False, server_default="ru"),
        sa.Column("is_anonymous", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("parent_user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("deleted_at", TIMESTAMP(timezone=True)),
        sa.Column("created_at", TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("audience IN ('adult', 'teen', 'kid')", name="ck_users_audience_valid"),
        sa.CheckConstraint("gender IS NULL OR gender IN ('m', 'f')", name="ck_users_gender_valid"),
        sa.CheckConstraint(
            "character IN ('anna', 'maxim', 'knopych', 'klavochka')",
            name="ck_users_character_valid",
        ),
        sa.CheckConstraint("language IN ('ru', 'en')", name="ck_users_language_valid"),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )
    op.create_index(
        "ix_users_email_active",
        "users",
        ["email"],
        unique=True,
        postgresql_where=sa.text("deleted_at IS NULL"),
    )
    op.create_index(
        "ix_users_parent",
        "users",
        ["parent_user_id"],
        postgresql_where=sa.text("parent_user_id IS NOT NULL"),
    )

    # ─── user_settings ───────────────────────────────────────────────
    op.create_table(
        "user_settings",
        sa.Column(
            "user_id",
            UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("keyboard_type", sa.String(20), nullable=False, server_default="classic"),
        sa.Column("keyboard_layout", sa.String(20), nullable=False, server_default="standard"),
        sa.Column("finger_hint", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("key_sound", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("metronome", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("task_zoom", sa.SmallInteger(), nullable=False, server_default="100"),
        sa.Column("hide_indicator", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("preview_off", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("time_limit_minutes_per_day", sa.SmallInteger()),
        sa.Column("updated_at", TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint(
            "keyboard_type IN ('classic', 'laptop', 'ergonomic')",
            name="ck_user_settings_keyboard_type_valid",
        ),
        sa.CheckConstraint(
            "keyboard_layout IN ('standard', 'phonetic', 'typewriter', 'mac')",
            name="ck_user_settings_keyboard_layout_valid",
        ),
        sa.CheckConstraint("task_zoom BETWEEN 70 AND 150", name="ck_user_settings_task_zoom_range"),
        sa.CheckConstraint(
            "time_limit_minutes_per_day IS NULL OR time_limit_minutes_per_day BETWEEN 5 AND 240",
            name="ck_user_settings_time_limit_range",
        ),
    )

    # ─── oauth_accounts ──────────────────────────────────────────────
    op.create_table(
        "oauth_accounts",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column(
            "user_id",
            UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("provider", sa.String(10), nullable=False),
        sa.Column("external_id", sa.String(255), nullable=False),
        sa.Column("raw_payload", JSONB(), nullable=False),
        sa.Column("linked_at", TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("provider", "external_id", name="uq_oauth_provider_external"),
        sa.CheckConstraint("provider IN ('yandex', 'vk', 'google')", name="ck_oauth_accounts_provider_valid"),
    )
    op.create_index("ix_oauth_user", "oauth_accounts", ["user_id"])

    # ─── progress ────────────────────────────────────────────────────
    op.create_table(
        "progress",
        sa.Column(
            "user_id",
            UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("tier", sa.String(20), nullable=False),
        sa.Column("lesson_num", sa.SmallInteger(), nullable=False),
        sa.Column("stars", sa.SmallInteger(), nullable=False),
        sa.Column("best_wpm", sa.Integer(), nullable=False),
        sa.Column("best_accuracy", sa.SmallInteger(), nullable=False),
        sa.Column("best_time", sa.Interval(), nullable=False),
        sa.Column("completed_at", TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("user_id", "tier", "lesson_num", name="pk_progress"),
        sa.CheckConstraint("lesson_num > 0", name="ck_progress_lesson_num_positive"),
        sa.CheckConstraint("stars BETWEEN 0 AND 5", name="ck_progress_stars_range"),
        sa.CheckConstraint("best_wpm BETWEEN 0 AND 1500", name="ck_progress_best_wpm_capped"),
        sa.CheckConstraint("best_accuracy BETWEEN 0 AND 100", name="ck_progress_best_accuracy_range"),
    )
    op.create_index("ix_progress_user", "progress", ["user_id"])

    # ─── attempts (append-only history) ──────────────────────────────
    op.create_table(
        "attempts",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column(
            "user_id",
            UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("tier", sa.String(20), nullable=False),
        sa.Column("lesson_num", sa.SmallInteger(), nullable=False),
        sa.Column("wpm", sa.Integer(), nullable=False),
        sa.Column("accuracy", sa.SmallInteger(), nullable=False),
        sa.Column("duration_ms", sa.Integer(), nullable=False),
        sa.Column("errors", sa.SmallInteger(), nullable=False, server_default="0"),
        sa.Column("rhythm", sa.SmallInteger()),
        sa.Column("created_at", TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("wpm BETWEEN 0 AND 1500", name="ck_attempts_wpm_capped"),
        sa.CheckConstraint("accuracy BETWEEN 0 AND 100", name="ck_attempts_accuracy_range"),
        sa.CheckConstraint("duration_ms >= 0", name="ck_attempts_duration_nonneg"),
        sa.CheckConstraint("errors >= 0", name="ck_attempts_errors_nonneg"),
    )
    op.create_index(
        "ix_attempts_user_date",
        "attempts",
        ["user_id", sa.text("created_at DESC")],
    )
    op.create_index("ix_attempts_user_tier", "attempts", ["user_id", "tier", "lesson_num"])

    # ─── subscriptions (с ADR-005 fields) ────────────────────────────
    op.create_table(
        "subscriptions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column(
            "user_id",
            UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("plan", sa.String(20), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("started_at", TIMESTAMP(timezone=True)),
        sa.Column("expires_at", TIMESTAMP(timezone=True)),
        sa.Column("yookassa_payment_id", sa.String(64)),
        sa.Column("amount_kopecks", sa.Integer(), nullable=False),
        sa.Column("currency", sa.String(3), nullable=False, server_default="RUB"),
        # ADR-005 Hybrid renewal fields
        sa.Column("is_auto_renew", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("payment_method_id", sa.String(64)),
        sa.Column("last_charge_attempt_at", TIMESTAMP(timezone=True)),
        sa.Column("last_charge_error", sa.String(255)),
        sa.Column("last_reminder_sent_at", TIMESTAMP(timezone=True)),
        sa.Column("grace_until", TIMESTAMP(timezone=True)),
        sa.Column("cancelled_at", TIMESTAMP(timezone=True)),
        sa.Column("created_at", TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("yookassa_payment_id", name="uq_subscriptions_yookassa_payment_id"),
        sa.CheckConstraint(
            "status IN ('pending', 'active', 'grace', 'expired', 'cancelled', 'failed')",
            name="ck_subscriptions_status_valid",
        ),
        sa.CheckConstraint("amount_kopecks > 0", name="ck_subscriptions_amount_positive"),
    )
    op.create_index(
        "ix_subs_user_active",
        "subscriptions",
        ["user_id", "status"],
        postgresql_where=sa.text("status = 'active'"),
    )
    op.create_index(
        "ix_subs_due_renewal",
        "subscriptions",
        ["expires_at", "status"],
        postgresql_where=sa.text("status IN ('active', 'grace') AND is_auto_renew = TRUE"),
    )
    op.create_index(
        "ix_subs_due_reminder",
        "subscriptions",
        ["expires_at", "status"],
        postgresql_where=sa.text("status = 'active'"),
    )

    # ─── subscription_charges (audit log из ADR-005) ─────────────────
    op.create_table(
        "subscription_charges",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column(
            "subscription_id",
            UUID(as_uuid=True),
            sa.ForeignKey("subscriptions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("yookassa_payment_id", sa.String(64)),
        sa.Column("idempotency_key", sa.String(128), nullable=False),
        sa.Column("attempted_at", TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("amount_kopecks", sa.Integer(), nullable=False),
        sa.Column("error_code", sa.String(64)),
        sa.Column("error_message", sa.String(512)),
        sa.Column("is_recurring", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("retry_number", sa.SmallInteger(), nullable=False, server_default="0"),
        sa.Column("charge_metadata", JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.UniqueConstraint("yookassa_payment_id", name="uq_subscription_charges_yookassa_payment_id"),
        sa.CheckConstraint(
            "status IN ('success', 'failed', 'pending_3ds', 'pending_yk')",
            name="ck_subscription_charges_charge_status_valid",
        ),
        sa.CheckConstraint("amount_kopecks > 0", name="ck_subscription_charges_charge_amount_positive"),
        sa.CheckConstraint(
            "retry_number BETWEEN 0 AND 3",
            name="ck_subscription_charges_retry_number_range",
        ),
    )
    op.create_index(
        "ix_sub_charges_sub_time",
        "subscription_charges",
        ["subscription_id", sa.text("attempted_at DESC")],
    )
    op.create_index("ix_sub_charges_idempotency", "subscription_charges", ["idempotency_key"])
    op.create_index(
        "ix_sub_charges_pending",
        "subscription_charges",
        ["status", sa.text("attempted_at DESC")],
        postgresql_where=sa.text("status IN ('failed', 'pending_3ds')"),
    )

    # ─── events ──────────────────────────────────────────────────────
    op.create_table(
        "events",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column(
            "user_id",
            UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
        ),
        sa.Column("session_id", UUID(as_uuid=True), nullable=False),
        sa.Column("type", sa.String(40), nullable=False),
        sa.Column("payload", JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("user_agent", sa.String(255)),
        sa.Column("ip_hash", sa.String(64)),
        sa.Column("created_at", TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index(
        "ix_events_type_time",
        "events",
        ["type", sa.text("created_at DESC")],
    )
    op.create_index(
        "ix_events_user_time",
        "events",
        ["user_id", sa.text("created_at DESC")],
        postgresql_where=sa.text("user_id IS NOT NULL"),
    )
    op.create_index(
        "ix_events_anonymous_old",
        "events",
        ["created_at"],
        postgresql_where=sa.text("user_id IS NULL"),
    )


def downgrade() -> None:
    op.drop_table("events")
    op.drop_table("subscription_charges")
    op.drop_table("subscriptions")
    op.drop_table("attempts")
    op.drop_table("progress")
    op.drop_table("oauth_accounts")
    op.drop_table("user_settings")
    op.drop_table("users")
