"""Pydantic v2 schemas для админ-панели (admin-panel TSD §4).

Ф1: reauth, overview, users (list/detail/actions). Стиль — как schemas/me.py
и schemas/billing.py (from_attributes для проекций ORM, extra=forbid на входе).
"""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

AdminRole = Literal["user", "analyst", "support", "superadmin"]


# ─── Re-auth (POST /admin/reauth) ───────────────────────────────────────


class ReauthRequest(BaseModel):
    """Тело /admin/reauth — повторный ввод пароля."""

    model_config = ConfigDict(extra="forbid")

    password: str = Field(min_length=1, max_length=256)


class ReauthResponse(BaseModel):
    """scope-токен для заголовка X-Admin-Reauth (TTL-окно)."""

    reauth_token: str
    ttl_seconds: int


# ─── Overview (GET /admin/overview) ─────────────────────────────────────


class OverviewMetrics(BaseModel):
    """Метрики дашборда за период (admin PRD §4.1)."""

    period_days: int
    active_users: int = Field(description="Уникальных юзеров с attempt за период")
    new_registrations: int = Field(description="Новых аккаунтов за период")
    active_subscriptions: int = Field(description="Подписок в статусе доступа сейчас")
    mrr_kopecks: int = Field(description="MRR: Σ active amount, нормировано на месяц")
    signup_to_paid_conversion: float = Field(
        description="Доля юзеров, созданных за период, купивших подписку (0..1)"
    )


# ─── Users list (GET /admin/users) ──────────────────────────────────────


class AdminUserListItem(BaseModel):
    """Строка списка юзеров."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    name: str
    audience: str
    role: str
    email_verified: bool
    is_anonymous: bool
    created_at: datetime
    deleted_at: datetime | None = None


class AdminUsersPage(BaseModel):
    """GET /admin/users — offset-пагинация."""

    items: list[AdminUserListItem]
    total: int
    page: int
    page_size: int


# ─── User detail (GET /admin/users/{id}) ────────────────────────────────


class AdminSubscriptionOut(BaseModel):
    """Подписка в карточке юзера."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    plan: str
    period: str | None = None
    status: str
    provider: str
    amount_kopecks: int
    currency: str
    started_at: datetime | None = None
    expires_at: datetime | None = None
    is_auto_renew: bool
    cancelled_at: datetime | None = None
    created_at: datetime | None = None


class AdminProgressEntry(BaseModel):
    """Одна запись прогресса (агрегат по уроку)."""

    tier: str
    lesson_num: int
    stars: int
    best_wpm: int
    best_accuracy: int
    completed_at: datetime


class AdminTierSummary(BaseModel):
    """Свод по тиру: сколько уроков пройдено и звёзд."""

    tier: str
    lessons_completed: int
    total_stars: int


class AdminAttemptOut(BaseModel):
    """Последняя попытка юзера."""

    tier: str
    lesson_num: int
    wpm: int
    accuracy: int
    errors: int
    created_at: datetime


class AdminOAuthOut(BaseModel):
    """Привязанный OAuth-провайдер."""

    provider: str
    external_id: str
    linked_at: datetime


class AdminFamilyMember(BaseModel):
    """Родитель/ребёнок family-связи (ADR-003)."""

    id: UUID
    email: str
    name: str
    relation: Literal["parent", "child"]


class AdminUserProfile(BaseModel):
    """Профильная часть карточки."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    email_verified: bool
    name: str
    audience: str
    character: str
    gender: str | None = None
    language: str
    role: str
    is_anonymous: bool
    created_at: datetime
    deleted_at: datetime | None = None


class AdminUserDetail(BaseModel):
    """GET /admin/users/{id} — полный агрегат карточки."""

    profile: AdminUserProfile
    subscriptions: list[AdminSubscriptionOut]
    progress_by_tier: list[AdminTierSummary]
    recent_attempts: list[AdminAttemptOut]
    family: list[AdminFamilyMember]
    oauth_accounts: list[AdminOAuthOut]


# ─── Actions results ────────────────────────────────────────────────────


class AdminActionResult(BaseModel):
    """Единый ответ для block/restore/verify-email/reset-password."""

    ok: bool = True
    user_id: UUID
    action: str
