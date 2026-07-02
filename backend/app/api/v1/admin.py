"""Admin-panel endpoints Ф1 (admin-panel TSD §4).

Все под require_admin_role(...); мутирующие пишут аудит. Тонкий слой:
валидация + RBAC-гейт + вызов admin_service. Бизнес-логика — в сервисе.

Ф1 покрывает: reauth (analyst), overview (analyst), users list/detail
(support), block/restore/reset-password/verify-email (support). Подписки/
возвраты — Ф2, имперсонация/роли — Ф4.
"""

from uuid import UUID

import structlog
from fastapi import APIRouter, HTTPException, Query, Request, status

from app.core.exceptions import (
    PlanNotFoundError,
    SubscriptionNotFoundError,
    UserNotFoundError,
)
from app.core.security import get_dummy_hash, verify_password
from app.deps import (
    CurrentUser,
    DbSession,
    EmailServiceDep,
    RedisClient,
    RequireAnalyst,
    RequireReauthOnce,
    RequireSupport,
    RequireSuperadmin,
)
from app.schemas.admin import (
    AdminActionResult,
    AdminAttemptOut,
    AdminChargeOut,
    AdminFamilyMember,
    AdminOAuthOut,
    AdminSubActionResult,
    AdminSubscriptionDetail,
    AdminSubscriptionOut,
    AdminSubscriptionsPage,
    AdminTierSummary,
    AdminUserDetail,
    AdminUserListItem,
    AdminUserProfile,
    AdminUsersPage,
    GrantSubscriptionRequest,
    OverviewMetrics,
    ReauthRequest,
    ReauthResponse,
    RefundRequest,
)
from app.services import admin_service

logger = structlog.get_logger(__name__)

router = APIRouter()

# Rate-limit /admin/reauth от онлайн-брутфорса пароля админа (F1-SEC HIGH).
# Счётчик неудач на user.id; при превышении — 429 lockout; успех сбрасывает.
REAUTH_FAIL_LIMIT = 5
REAUTH_FAIL_WINDOW = 300  # секунд


def _ip_hash(request: Request) -> str | None:
    ip = request.client.host if request.client else None
    return admin_service.hash_ip(ip)


# ─── Re-auth (analyst; выдаёт scope-токен для чувствительных операций) ───


@router.post(
    "/reauth",
    response_model=ReauthResponse,
    summary="Повторный ввод пароля → scope-токен (X-Admin-Reauth)",
)
async def reauth(
    payload: ReauthRequest,
    user: CurrentUser,
    redis: RedisClient,
) -> ReauthResponse:
    """Проверяет пароль (Argon2, как signin) → выдаёт scope-токен в Redis.

    Требует лишь авторизации (CurrentUser) — сам гейт роли на чувствительных
    эндпоинтах (Ф2/Ф4). OAuth-only юзер без пароля → 403 (нечего проверять).
    """
    fail_key = f"ratelimit:reauth:{user.id}"
    fails = await redis.get(fail_key)
    if fails and int(fails) >= REAUTH_FAIL_LIMIT:
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            detail={"code": "RATE_LIMITED", "message": "Слишком много попыток, попробуйте позже"},
        )
    target_hash = user.password_hash or get_dummy_hash()
    ok = verify_password(payload.password, target_hash)
    if not (user.password_hash and ok):
        cnt = await redis.incr(fail_key)
        if cnt == 1:
            await redis.expire(fail_key, REAUTH_FAIL_WINDOW)
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            detail={"code": "REAUTH_FAILED", "message": "Неверный пароль"},
        )
    await redis.delete(fail_key)  # успех сбрасывает счётчик неудач
    token, ttl = await admin_service.issue_reauth_token(redis, user.id)
    logger.info("admin.reauth_issued", user_id=str(user.id))
    return ReauthResponse(reauth_token=token, ttl_seconds=ttl)


# ─── Overview (analyst) ─────────────────────────────────────────────────


@router.get(
    "/overview",
    response_model=OverviewMetrics,
    summary="Метрики дашборда за период (analyst)",
)
async def overview(
    _actor: RequireAnalyst,
    session: DbSession,
    period: int = Query(default=30, description="Период в днях"),
) -> OverviewMetrics:
    """DAU-ish активные / регистрации / подписки / MRR / конверсия."""
    if period not in (7, 30, 90):
        period = 30
    metrics = await admin_service.overview(session, period_days=period)
    return OverviewMetrics(**metrics)


# ─── Users list/detail (support) ────────────────────────────────────────


@router.get(
    "/users",
    response_model=AdminUsersPage,
    summary="Список/поиск/фильтр юзеров (support)",
)
async def list_users(
    _actor: RequireSupport,
    session: DbSession,
    search: str | None = Query(default=None, description="substring email/name"),
    audience: str | None = Query(default=None),
    email_verified: bool | None = Query(default=None),
    has_subscription: bool | None = Query(default=None),
    deleted: bool | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> AdminUsersPage:
    rows, total = await admin_service.list_users(
        session,
        search=search,
        audience=audience,
        email_verified=email_verified,
        has_subscription=has_subscription,
        deleted=deleted,
        page=page,
        page_size=page_size,
    )
    return AdminUsersPage(
        items=[AdminUserListItem.model_validate(u) for u in rows],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/users/{user_id}",
    response_model=AdminUserDetail,
    summary="Карточка юзера: профиль+подписки+прогресс+family+oauth (support)",
)
async def get_user_detail(
    user_id: UUID,
    _actor: RequireSupport,
    session: DbSession,
) -> AdminUserDetail:
    try:
        d = await admin_service.get_user_detail(session, user_id)
    except UserNotFoundError as e:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, detail={"code": e.code, "message": e.message}
        ) from e
    return AdminUserDetail(
        profile=AdminUserProfile.model_validate(d["profile"]),
        subscriptions=[AdminSubscriptionOut.model_validate(s) for s in d["subscriptions"]],
        progress_by_tier=[AdminTierSummary(**t) for t in d["progress_by_tier"]],
        recent_attempts=[
            AdminAttemptOut(
                tier=a.tier,
                lesson_num=a.lesson_num,
                wpm=a.wpm,
                accuracy=a.accuracy,
                errors=a.errors,
                created_at=a.created_at,
            )
            for a in d["recent_attempts"]
        ],
        family=[AdminFamilyMember(**m) for m in d["family"]],
        oauth_accounts=[
            AdminOAuthOut(
                provider=o.provider, external_id=o.external_id, linked_at=o.linked_at
            )
            for o in d["oauth_accounts"]
        ],
    )


# ─── User mutations (support; block/restore/verify — без re-auth) ───────


def _not_found(e: UserNotFoundError) -> HTTPException:
    return HTTPException(
        status.HTTP_404_NOT_FOUND, detail={"code": e.code, "message": e.message}
    )


@router.post(
    "/users/{user_id}/block",
    response_model=AdminActionResult,
    summary="Заблокировать (soft-delete) юзера (support)",
)
async def block_user(
    user_id: UUID,
    actor: RequireSupport,
    session: DbSession,
    request: Request,
) -> AdminActionResult:
    try:
        await admin_service.block(session, actor, user_id, ip_hash=_ip_hash(request))
    except UserNotFoundError as e:
        raise _not_found(e) from e
    return AdminActionResult(user_id=user_id, action="user.block")


@router.post(
    "/users/{user_id}/restore",
    response_model=AdminActionResult,
    summary="Снять блокировку юзера (support)",
)
async def restore_user(
    user_id: UUID,
    actor: RequireSupport,
    session: DbSession,
    request: Request,
) -> AdminActionResult:
    try:
        await admin_service.restore(session, actor, user_id, ip_hash=_ip_hash(request))
    except UserNotFoundError as e:
        raise _not_found(e) from e
    return AdminActionResult(user_id=user_id, action="user.restore")


@router.post(
    "/users/{user_id}/verify-email",
    response_model=AdminActionResult,
    summary="Ручная верификация email (support)",
)
async def verify_user_email(
    user_id: UUID,
    actor: RequireSupport,
    session: DbSession,
    request: Request,
) -> AdminActionResult:
    try:
        await admin_service.verify_email(session, actor, user_id, ip_hash=_ip_hash(request))
    except UserNotFoundError as e:
        raise _not_found(e) from e
    return AdminActionResult(user_id=user_id, action="user.verify_email")


@router.post(
    "/users/{user_id}/reset-password",
    response_model=AdminActionResult,
    summary="Отправить письмо сброса пароля (support)",
)
async def reset_user_password(
    user_id: UUID,
    actor: RequireSupport,
    session: DbSession,
    redis: RedisClient,
    emailer: EmailServiceDep,
    request: Request,
) -> AdminActionResult:
    try:
        await admin_service.reset_password(
            session,
            actor,
            user_id,
            redis=redis,
            emailer=emailer,
            ip_hash=_ip_hash(request),
        )
    except UserNotFoundError as e:
        raise _not_found(e) from e
    return AdminActionResult(user_id=user_id, action="user.reset_password")


# ─── Subscriptions (Ф2) ──────────────────────────────────────────────────
#
# list/detail/cancel/grant — support; refund — superadmin + one-time re-auth.
# grant: РЕШЕНИЕ — user_id в теле (POST /admin/subscriptions/grant), а не
# {id}/grant. TSD §4 показывает /subscriptions/{id}/grant, но grant создаёт
# НОВУЮ подписку по user_id (нет sub_id заранее) — путь с {id} семантически
# неверен. Выбран консистентный `/admin/subscriptions/grant` с user_id в body.


def _sub_not_found(e: SubscriptionNotFoundError) -> HTTPException:
    return HTTPException(
        status.HTTP_404_NOT_FOUND,
        detail={"code": e.code, "message": "Подписка не найдена"},
    )


@router.get(
    "/subscriptions",
    response_model=AdminSubscriptionsPage,
    summary="Список подписок (фильтр status/plan/provider/period, support)",
)
async def list_subscriptions(
    _actor: RequireSupport,
    session: DbSession,
    status_: str | None = Query(default=None, alias="status"),
    plan: str | None = Query(default=None),
    provider: str | None = Query(default=None),
    period: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> AdminSubscriptionsPage:
    rows, total = await admin_service.list_subscriptions(
        session,
        status=status_,
        plan=plan,
        provider=provider,
        period=period,
        page=page,
        page_size=page_size,
    )
    return AdminSubscriptionsPage(
        items=[AdminSubscriptionOut.model_validate(s) for s in rows],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post(
    "/subscriptions/grant",
    response_model=AdminSubActionResult,
    summary="Ручная выдача подписки юзеру (support; user_id в теле)",
)
async def grant_subscription(
    payload: GrantSubscriptionRequest,
    actor: RequireSupport,
    session: DbSession,
    request: Request,
) -> AdminSubActionResult:
    try:
        sub = await admin_service.grant(
            session,
            actor,
            payload.user_id,
            plan=payload.plan,
            period=payload.period,
            reason=payload.reason,
            ip_hash=_ip_hash(request),
        )
    except UserNotFoundError as e:
        raise _not_found(e) from e
    except PlanNotFoundError as e:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail={"code": e.code, "message": str(e) or "Неизвестный тариф/период"},
        ) from e
    return AdminSubActionResult(subscription_id=sub.id, action="sub.grant")


@router.get(
    "/subscriptions/{sub_id}",
    response_model=AdminSubscriptionDetail,
    summary="Карточка подписки + charge-лог (support)",
)
async def get_subscription_detail(
    sub_id: UUID,
    _actor: RequireSupport,
    session: DbSession,
) -> AdminSubscriptionDetail:
    try:
        d = await admin_service.get_subscription_detail(session, sub_id)
    except SubscriptionNotFoundError as e:
        raise _sub_not_found(e) from e
    return AdminSubscriptionDetail(
        subscription=AdminSubscriptionOut.model_validate(d["subscription"]),
        charges=[AdminChargeOut.model_validate(ch) for ch in d["charges"]],
    )


@router.post(
    "/subscriptions/{sub_id}/cancel",
    response_model=AdminSubActionResult,
    summary="Отменить подписку (support)",
)
async def cancel_subscription(
    sub_id: UUID,
    actor: RequireSupport,
    session: DbSession,
    request: Request,
) -> AdminSubActionResult:
    try:
        sub = await admin_service.cancel(
            session, actor, sub_id, ip_hash=_ip_hash(request)
        )
    except SubscriptionNotFoundError as e:
        raise _sub_not_found(e) from e
    return AdminSubActionResult(subscription_id=sub.id, action="sub.cancel")


@router.post(
    "/subscriptions/{sub_id}/refund",
    response_model=AdminSubActionResult,
    summary="Возврат средств (superadmin + one-time re-auth)",
)
async def refund_subscription(
    sub_id: UUID,
    payload: RefundRequest,
    _actor: RequireSuperadmin,
    actor: RequireReauthOnce,
    session: DbSession,
    request: Request,
) -> AdminSubActionResult:
    """Возврат: RequireSuperadmin (роль) + RequireReauthOnce (одноразовый токен).

    amount_kopecks=None → полная сумма подписки (берём sub.amount_kopecks).
    Идемпотентно по refund:{payment_id} (повтор → тот же charge, no-op).
    """
    # Определяем сумму до вызова сервиса (нужна подписка для полного возврата).
    try:
        sub = await admin_service._get_subscription(session, sub_id)
    except SubscriptionNotFoundError as e:
        raise _sub_not_found(e) from e
    amount = payload.amount_kopecks or sub.amount_kopecks
    try:
        charge = await admin_service.refund(
            session,
            actor,
            sub_id,
            amount_kopecks=amount,
            reason=payload.reason,
            ip_hash=_ip_hash(request),
        )
    except SubscriptionNotFoundError as e:
        # Нет provider_payment_id — возвращать нечего.
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "REFUND_UNAVAILABLE",
                "message": "У подписки нет исходного платежа для возврата",
            },
        ) from e
    return AdminSubActionResult(
        subscription_id=charge.subscription_id, action="sub.refund"
    )
