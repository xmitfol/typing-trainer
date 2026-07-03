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
    """Тело /admin/reauth — повторный ввод пароля (+ TOTP для superadmin с 2FA)."""

    model_config = ConfigDict(extra="forbid")

    password: str = Field(min_length=1, max_length=256)
    # Ф4b: TOTP-код (6 цифр) ИЛИ recovery-код. Требуется для superadmin с
    # включённой 2FA; для остальных — игнорируется.
    totp_code: str | None = Field(default=None, max_length=32)


class ReauthResponse(BaseModel):
    """scope-токен для заголовка X-Admin-Reauth (TTL-окно)."""

    reauth_token: str
    ttl_seconds: int


# ─── Admin 2FA (Ф4b — TOTP для superadmin) ──────────────────────────────


class TwoFAEnrollResponse(BaseModel):
    """POST /admin/2fa/enroll — данные для QR (secret ещё не подтверждён)."""

    otpauth_uri: str = Field(description="otpauth:// URI для QR-кода")
    secret: str = Field(description="base32 TOTP-секрет (ручной ввод, если нет QR)")


class TwoFAVerifyRequest(BaseModel):
    """POST /admin/2fa/verify — подтверждение enrollment TOTP-кодом."""

    model_config = ConfigDict(extra="forbid")

    code: str = Field(min_length=6, max_length=8, description="TOTP-код с приложения")


class TwoFAVerifyResponse(BaseModel):
    """Ответ verify — recovery-коды показываются PLAINTEXT ОДИН раз."""

    ok: bool = True
    enabled: bool = True
    recovery_codes: list[str] = Field(
        description="Сохраните — больше не покажем. Каждый одноразовый."
    )


class TwoFAStatusResponse(BaseModel):
    """GET /admin/2fa/status — включена ли 2FA у текущего админа."""

    enabled: bool


class TwoFADisableResponse(BaseModel):
    """POST /admin/2fa/disable."""

    ok: bool = True
    enabled: bool = False


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
    user_id: UUID
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


# ─── Impersonation / role (Ф4a — admin-panel TSD §5.1, §4) ──────────────


class ImpersonateResult(BaseModel):
    """Ответ POST /admin/users/{id}/impersonate.

    Токен также ставится в cookie (access_token = imp-токен, admin_return —
    оригинальная admin-сессия). Тело — для фронта: под кем сессия + TTL, чтобы
    отрисовать баннер «Вы вошли как {email}».
    """

    ok: bool = True
    impersonated_user_id: UUID
    impersonated_email: str
    actor_user_id: UUID
    ttl_seconds: int


class RoleSetRequest(BaseModel):
    """Тело POST /admin/users/{id}/role — назначить роль сотруднику."""

    model_config = ConfigDict(extra="forbid")

    role: AdminRole


class RoleSetResult(BaseModel):
    """Ответ POST /admin/users/{id}/role."""

    ok: bool = True
    user_id: UUID
    old_role: str
    new_role: str
    action: str = "role.set"


# ─── Subscriptions (admin-panel TSD §4, Ф2) ─────────────────────────────


class AdminSubscriptionsPage(BaseModel):
    """GET /admin/subscriptions — offset-пагинация."""

    items: list[AdminSubscriptionOut]
    total: int
    page: int
    page_size: int


class AdminChargeOut(BaseModel):
    """Строка charge-лога подписки (списание/возврат)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str
    amount_kopecks: int
    attempted_at: datetime
    is_recurring: bool
    retry_number: int
    error_code: str | None = None
    error_message: str | None = None
    charge_metadata: dict = Field(default_factory=dict)


class AdminSubscriptionDetail(BaseModel):
    """GET /admin/subscriptions/{id} — подписка + charge-лог."""

    subscription: AdminSubscriptionOut
    charges: list[AdminChargeOut]


class AdminChargeDebugOut(AdminChargeOut):
    """Строка сквозного charge-лога (/billing/charges) — debug-поля сверх
    AdminChargeOut: к какой подписке относится и ключи сверки с провайдером
    (идемпотентность, webhook-раскопки)."""

    subscription_id: UUID
    idempotency_key: str
    yookassa_payment_id: str | None = None


class AdminChargesPage(BaseModel):
    """GET /admin/billing/charges — сквозной debug-список списаний."""

    items: list[AdminChargeDebugOut]
    total: int
    page: int
    page_size: int


class GrantSubscriptionRequest(BaseModel):
    """Тело grant: ручная выдача подписки (support). user_id — в теле."""

    model_config = ConfigDict(extra="forbid")

    user_id: UUID
    plan: Literal["pro", "family"] = Field(description="Только покупаемые планы")
    period: Literal["w1", "m1", "m3", "m6", "y1"]
    reason: str = Field(min_length=1, max_length=500)


class RefundRequest(BaseModel):
    """Тело refund (superadmin + re-auth-once)."""

    model_config = ConfigDict(extra="forbid")

    amount_kopecks: int | None = Field(
        default=None,
        gt=0,
        description="Сумма возврата; None → полная сумма подписки",
    )
    reason: str = Field(min_length=1, max_length=500)


class AdminSubActionResult(BaseModel):
    """Ответ cancel/grant/refund по подписке."""

    ok: bool = True
    subscription_id: UUID
    action: str


# ─── Analytics (admin-panel TSD §6, Ф3-3/Ф3-4) ──────────────────────────
#
# Формы контрактов фиксированы для фронта (Алекс). Все — computed dict'ы из
# analytics_service; response_model валидирует форму. cached — из кэша ли ответ.


class HistBucket(BaseModel):
    """Бакет гистограммы [lo, hi). hi=None → последний открытый бакет [lo, ∞)."""

    lo: int
    hi: int | None = None
    count: int


class SkillOut(BaseModel):
    """GET /admin/analytics/skill — распределение WPM/accuracy из progress."""

    tier: str | None = None
    period: int
    n: int
    avg_wpm: float
    avg_accuracy: float
    wpm_buckets: list[HistBucket]
    acc_buckets: list[HistBucket]
    cached: bool = False


class RevenuePoint(BaseModel):
    """Точка MRR-серии (день)."""

    date: str
    mrr_kopecks: int


class RevenueOut(BaseModel):
    """GET /admin/analytics/revenue — деньги из subscriptions/charges."""

    period: int
    mrr_kopecks: int
    active_subscriptions: int
    new_subscriptions: int
    cancelled_subscriptions: int
    decline_rate: float = Field(description="failed/(success+failed) charges за период")
    series: list[RevenuePoint]
    cached: bool = False


class FunnelRates(BaseModel):
    """Конверсии между шагами воронки (0..1)."""

    activation: float
    subscription: float
    churn: float


class FunnelOut(BaseModel):
    """GET /admin/analytics/funnel — из наличных таблиц (не ждёт events)."""

    period: int
    signups: int
    activated: int
    subscribed: int
    churned: int
    rates: FunnelRates
    cached: bool = False


class RetentionOut(BaseModel):
    """GET /admin/analytics/retention — D1/D7/D30 доли из attempts."""

    period: int
    cohort_size: int
    d1: float
    d7: float
    d30: float
    cached: bool = False


class LessonDropoff(BaseModel):
    """Drop-off одного урока."""

    lesson_num: int
    reached: int
    completed: int
    dropoff_rate: float = Field(description="1 - completed/reached")


class LessonsOut(BaseModel):
    """GET /admin/analytics/lessons — drop-off по урокам из progress/attempts."""

    tier: str | None = None
    items: list[LessonDropoff]
    cached: bool = False
