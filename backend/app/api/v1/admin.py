"""Admin-panel endpoints Ф1 (admin-panel TSD §4).

Все под require_admin_role(...); мутирующие пишут аудит. Тонкий слой:
валидация + RBAC-гейт + вызов admin_service. Бизнес-логика — в сервисе.

Ф1 покрывает: reauth (analyst), overview (analyst), users list/detail
(support), block/restore/reset-password/verify-email (support). Подписки/
возвраты — Ф2, имперсонация/роли — Ф4.
"""

from datetime import timedelta
from uuid import UUID

import structlog
from fastapi import APIRouter, Cookie, HTTPException, Query, Request, Response, status

from app.api.v1.auth import CookieKwargs
from app.config import get_settings
from app.core.exceptions import (
    ImpersonateForbiddenError,
    PlanNotFoundError,
    RefundAmountExceedsError,
    RoleSelfForbiddenError,
    SubscriptionNotFoundError,
    UserNotFoundError,
)
from app.core.security import create_access_token, get_dummy_hash, verify_password
from app.deps import (
    CurrentUser,
    DbSession,
    EmailServiceDep,
    RedisClient,
    RequireAnalyst,
    RequireReauthOnce,
    RequireSuperadmin,
    RequireSupport,
)
from app.models.user import User
from app.schemas.admin import (
    AdminActionResult,
    AdminAttemptOut,
    AdminChargeDebugOut,
    AdminChargeOut,
    AdminChargesPage,
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
    FunnelOut,
    GrantSubscriptionRequest,
    ImpersonateResult,
    LessonsOut,
    OverviewMetrics,
    ReauthRequest,
    ReauthResponse,
    RefundRequest,
    RetentionOut,
    RevenueOut,
    RoleSetRequest,
    RoleSetResult,
    SkillOut,
    TwoFADisableResponse,
    TwoFAEnrollResponse,
    TwoFAStatusResponse,
    TwoFAVerifyRequest,
    TwoFAVerifyResponse,
)
from app.services import admin_2fa_service, admin_service, analytics_service

logger = structlog.get_logger(__name__)

router = APIRouter()

# Rate-limit /admin/reauth от онлайн-брутфорса пароля админа (F1-SEC HIGH).
# Счётчик неудач на user.id; при превышении — 429 lockout; успех сбрасывает.
REAUTH_FAIL_LIMIT = 5
REAUTH_FAIL_WINDOW = 300  # секунд

# ─── Имперсонация — cookie-механика (Ф4a, TSD §5.1) ──────────────────────
#
# РЕШЕНИЕ (наименее инвазивный путь): НЕ трогаем current_user. Вместо этого
# при старте имперсонации:
#   1. Сохраняем оригинальный admin access_token в отдельную httpOnly cookie
#      `admin_return` (короткий TTL = TTL access-токена админа, 15 мин).
#   2. Перезаписываем access_token = imp-токен (короткий TTL, claim imp=actor,
#      refresh НЕ трогаем/не выдаём — сессия истечёт сама).
# current_user_required читает access_token как обычно → отдаёт target-юзера,
# claim imp виден в токене (для логов/баннера). «Выход» (/impersonate/stop):
# восстанавливаем access_token из admin_return, чистим admin_return.
#
# Почему не отдельная imp-cookie с приоритетом в current_user: это изменило бы
# current_user (риск для ВСЕХ эндпоинтов). Перезапись access_token изолирована
# и не требует правок в deps.py.
ACCESS_COOKIE = "access_token"
ADMIN_RETURN_COOKIE = "admin_return"
IMPERSONATE_TTL_MINUTES = 15


def _ip_hash(request: Request) -> str | None:
    ip = request.client.host if request.client else None
    return admin_service.hash_ip(ip)


# ─── Per-actor rate-limit на мутирующие /admin/* (F2-SEC) ────────────────
#
# Находка Сергея: мутации (refund/grant/cancel/block/restore/reset/verify)
# без лимита → скомпрометированный админ крутит в цикле. Общий guard:
# incr+expire(60) на actor.id, при превышении config-лимита — 429.
# READ-эндпоинты (list/detail/overview/analytics) НЕ лимитируются.

_ADMIN_MUTATION_RL_PREFIX = "ratelimit:admin_mut:"


async def guard_admin_mutation_rate(actor: User, redis: RedisClient) -> None:
    """Per-actor лимит мутаций/мин (rate_limit_admin_mutations_per_minute).

    Паттерн me.py progress: incr, на первом — expire(60), при превышении 429
    RATE_LIMITED. Вызывается из каждого мутирующего эндпоинта первым делом.
    """
    limit = get_settings().rate_limit_admin_mutations_per_minute
    key = f"{_ADMIN_MUTATION_RL_PREFIX}{actor.id}"
    count = await redis.incr(key)
    if count == 1:
        await redis.expire(key, 60)
    if count > limit:
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            detail={"code": "RATE_LIMITED", "message": "Слишком много действий, подождите минуту"},
        )


# ─── Re-auth (analyst; выдаёт scope-токен для чувствительных операций) ───


@router.post(
    "/reauth",
    response_model=ReauthResponse,
    summary="Повторный ввод пароля → scope-токен (X-Admin-Reauth)",
)
async def reauth(
    payload: ReauthRequest,
    user: CurrentUser,
    session: DbSession,
    redis: RedisClient,
) -> ReauthResponse:
    """Проверяет пароль (Argon2, как signin) → выдаёт scope-токен в Redis.

    Требует лишь авторизации (CurrentUser) — сам гейт роли на чувствительных
    эндпоинтах (Ф2/Ф4). OAuth-only юзер без пароля → 403 (нечего проверять).

    Ф4b (2FA enforcement): для superadmin с включённой 2FA — вдобавок к паролю
    требуется валидный TOTP-код (payload.totp_code) ИЛИ recovery-код (one-time).
    Неудачи TOTP тоже инкрементят fail-счётчик (анти-брутфорс кода). Когда
    require_superadmin_2fa=True (prod) — superadmin БЕЗ 2FA получает 403
    TOTP_ENROLLMENT_REQUIRED (форс enrollment до денежных операций).
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
        await _bump_reauth_fail(redis, fail_key)
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            detail={"code": "REAUTH_FAILED", "message": "Неверный пароль"},
        )

    # Ф4b: enforcement 2FA для superadmin (после успешной проверки пароля).
    totp_result = await admin_2fa_service.check_reauth_totp(
        session, user, totp_code=payload.totp_code
    )
    if totp_result == "enrollment":
        # require_superadmin_2fa=True и 2FA не включена — не считаем это неудачей
        # брутфорса (пароль верный), просто требуем enrollment.
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            detail={
                "code": "TOTP_ENROLLMENT_REQUIRED",
                "message": "Требуется настройка 2FA для этой операции",
            },
        )
    if totp_result == "required":
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            detail={
                "code": "TOTP_REQUIRED",
                "message": "Требуется код двухфакторной аутентификации",
            },
        )
    if totp_result == "invalid":
        # Неверный TOTP/recovery — тоже анти-брутфорс (инкремент счётчика).
        await _bump_reauth_fail(redis, fail_key)
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            detail={"code": "TOTP_INVALID", "message": "Неверный код двухфакторной аутентификации"},
        )

    await redis.delete(fail_key)  # успех сбрасывает счётчик неудач
    token, ttl = await admin_service.issue_reauth_token(redis, user.id)
    logger.info("admin.reauth_issued", user_id=str(user.id))
    return ReauthResponse(reauth_token=token, ttl_seconds=ttl)


async def _bump_reauth_fail(redis: RedisClient, fail_key: str) -> None:
    """Инкремент счётчика неудач reauth (пароль ИЛИ TOTP) с TTL-окном."""
    cnt = await redis.incr(fail_key)
    if cnt == 1:
        await redis.expire(fail_key, REAUTH_FAIL_WINDOW)


# ─── Admin 2FA (Ф4b — TOTP для superadmin) ──────────────────────────────
#
# enroll → verify включает 2FA (+ recovery-коды); disable выключает (требует
# re-auth). status — любой админ про себя. Enforcement самой 2FA живёт в
# /admin/reauth (см. выше) — здесь только управление enrollment'ом.


@router.post(
    "/2fa/enroll",
    response_model=TwoFAEnrollResponse,
    summary="Начать enrollment 2FA — secret+QR (superadmin)",
)
async def twofa_enroll(
    actor: RequireSuperadmin,
    session: DbSession,
) -> TwoFAEnrollResponse:
    """Генерит TOTP-секрет (enabled=False), отдаёт otpauth_uri+secret для QR.

    Повторный enroll до подтверждения (или поверх включённой 2FA) — перегенерит
    секрет и сбрасывает enabled в False (подтвердить заново через /2fa/verify).
    """
    uri, secret = await admin_2fa_service.enroll(session, actor, issuer=get_settings().app_name)
    return TwoFAEnrollResponse(otpauth_uri=uri, secret=secret)


@router.post(
    "/2fa/verify",
    response_model=TwoFAVerifyResponse,
    summary="Подтвердить 2FA TOTP-кодом → enabled + recovery-коды (superadmin)",
)
async def twofa_verify(
    payload: TwoFAVerifyRequest,
    actor: RequireSuperadmin,
    session: DbSession,
    request: Request,
) -> TwoFAVerifyResponse:
    """Проверяет TOTP-код против secret; при успехе enabled=True + 8 recovery-
    кодов (PLAINTEXT в ответе ОДИН раз, в БД — только хеши). Неверный код → 403.
    """
    recovery = await admin_2fa_service.verify_and_enable(
        session, actor, code=payload.code, ip_hash=_ip_hash(request)
    )
    if recovery is None:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            detail={"code": "TOTP_INVALID", "message": "Неверный код, 2FA не включена"},
        )
    return TwoFAVerifyResponse(recovery_codes=recovery)


@router.post(
    "/2fa/disable",
    response_model=TwoFADisableResponse,
    summary="Отключить 2FA (superadmin + re-auth)",
)
async def twofa_disable(
    _superadmin: RequireSuperadmin,
    actor: RequireReauthOnce,
    session: DbSession,
    request: Request,
) -> TwoFADisableResponse:
    """Выключает 2FA: enabled=False, чистит secret/recovery. Требует one-time
    re-auth (X-Admin-Reauth) — отключение защиты само по себе чувствительно.
    """
    await admin_2fa_service.disable(session, actor, ip_hash=_ip_hash(request))
    return TwoFADisableResponse()


@router.get(
    "/2fa/status",
    response_model=TwoFAStatusResponse,
    summary="Включена ли 2FA у меня (любой админ)",
)
async def twofa_status(
    actor: RequireAnalyst,
    session: DbSession,
) -> TwoFAStatusResponse:
    """Статус 2FA текущего админа про себя (analyst+ — минимальная admin-роль)."""
    enabled = await admin_2fa_service.is_enabled(session, actor.id)
    return TwoFAStatusResponse(enabled=enabled)


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
            AdminOAuthOut(provider=o.provider, external_id=o.external_id, linked_at=o.linked_at)
            for o in d["oauth_accounts"]
        ],
    )


# ─── User mutations (support; block/restore/verify — без re-auth) ───────


def _not_found(e: UserNotFoundError) -> HTTPException:
    return HTTPException(status.HTTP_404_NOT_FOUND, detail={"code": e.code, "message": e.message})


@router.post(
    "/users/{user_id}/block",
    response_model=AdminActionResult,
    summary="Заблокировать (soft-delete) юзера (support)",
)
async def block_user(
    user_id: UUID,
    actor: RequireSupport,
    session: DbSession,
    redis: RedisClient,
    request: Request,
) -> AdminActionResult:
    await guard_admin_mutation_rate(actor, redis)
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
    redis: RedisClient,
    request: Request,
) -> AdminActionResult:
    await guard_admin_mutation_rate(actor, redis)
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
    redis: RedisClient,
    request: Request,
) -> AdminActionResult:
    await guard_admin_mutation_rate(actor, redis)
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
    await guard_admin_mutation_rate(actor, redis)
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


# ─── Impersonation + role (Ф4a; support/superadmin + re-auth) ────────────


def _impersonate_cookie_kwargs() -> CookieKwargs:
    """Общие kwargs httpOnly-cookie (как _set_auth_cookies в auth.py)."""
    settings = get_settings()
    return {
        "httponly": True,
        "secure": settings.cookie_secure,
        "samesite": "lax",
        "domain": settings.cookie_domain,
        "path": "/",
    }


@router.post(
    "/users/{user_id}/impersonate",
    response_model=ImpersonateResult,
    summary="Войти под юзером — короткий imp-токен (support + re-auth)",
)
async def impersonate_user(
    user_id: UUID,
    _support: RequireSupport,
    actor: RequireReauthOnce,
    session: DbSession,
    redis: RedisClient,
    request: Request,
    response: Response,
    access_token: str | None = Cookie(default=None),
) -> ImpersonateResult:
    """Имперсонация обычного юзера (TSD §5.1).

    Цель обязана быть НЕ заблокированной и role=='user' (иначе 403
    IMPERSONATE_FORBIDDEN). Выдаём короткий (15 мин) access-токен target'а с
    claim imp=<actor_id>; refresh НЕ выдаём. Оригинальную admin-сессию кладём
    в cookie admin_return (для возврата через /impersonate/stop).
    """
    await guard_admin_mutation_rate(actor, redis)
    try:
        target = await admin_service.impersonate(session, actor, user_id, ip_hash=_ip_hash(request))
    except UserNotFoundError as e:
        raise _not_found(e) from e
    except ImpersonateForbiddenError as e:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            detail={"code": e.code, "message": "Имперсонация этого юзера запрещена"},
        ) from e

    imp_token, _ = create_access_token(
        target.id,
        ttl=timedelta(minutes=IMPERSONATE_TTL_MINUTES),
        imp_actor_id=actor.id,
    )
    kwargs = _impersonate_cookie_kwargs()
    # Сохраняем текущий admin access-токен для возврата (TTL = его же ~15 мин).
    if access_token:
        response.set_cookie(
            ADMIN_RETURN_COOKIE,
            access_token,
            max_age=get_settings().jwt_access_ttl_minutes * 60,
            **kwargs,
        )
    # Подменяем активную сессию на imp-токен (refresh НЕ трогаем — истечёт сам).
    response.set_cookie(
        ACCESS_COOKIE,
        imp_token,
        max_age=IMPERSONATE_TTL_MINUTES * 60,
        **kwargs,
    )
    return ImpersonateResult(
        impersonated_user_id=target.id,
        impersonated_email=target.email,
        actor_user_id=actor.id,
        ttl_seconds=IMPERSONATE_TTL_MINUTES * 60,
    )


@router.post(
    "/impersonate/stop",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Выйти из имперсонации — вернуть admin-сессию",
)
async def impersonate_stop(
    response: Response,
    admin_return: str | None = Cookie(default=None),
) -> None:
    """Восстанавливает admin_return → access_token, чистит admin_return.

    Без CurrentUser: под imp-токеном current_user отдал бы target-юзера, а не
    админа. Возврат чисто cookie-операция (admin_return httpOnly, подделать
    нельзя). Если admin_return нет — просто чистим imp access_token (сессия
    истечёт), деградация безопасна.
    """
    kwargs = _impersonate_cookie_kwargs()
    settings = get_settings()
    if admin_return:
        response.set_cookie(
            ACCESS_COOKIE,
            admin_return,
            max_age=settings.jwt_access_ttl_minutes * 60,
            **kwargs,
        )
    else:
        response.delete_cookie(ACCESS_COOKIE, domain=settings.cookie_domain, path="/")
    response.delete_cookie(ADMIN_RETURN_COOKIE, domain=settings.cookie_domain, path="/")


@router.post(
    "/users/{user_id}/role",
    response_model=RoleSetResult,
    summary="Назначить роль сотруднику (superadmin + re-auth)",
)
async def set_user_role(
    user_id: UUID,
    payload: RoleSetRequest,
    _superadmin: RequireSuperadmin,
    actor: RequireReauthOnce,
    session: DbSession,
    redis: RedisClient,
    request: Request,
) -> RoleSetResult:
    """Смена роли (superadmin only). Нельзя менять роль самому себе
    (403 ROLE_SELF_FORBIDDEN). Выдача superadmin другому разрешена, аудируется.
    """
    await guard_admin_mutation_rate(actor, redis)
    try:
        target, old_role = await admin_service.set_role(
            session, actor, user_id, new_role=payload.role, ip_hash=_ip_hash(request)
        )
    except RoleSelfForbiddenError as e:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            detail={"code": e.code, "message": "Нельзя менять роль самому себе"},
        ) from e
    except UserNotFoundError as e:
        raise _not_found(e) from e
    except ImpersonateForbiddenError as e:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            detail={"code": e.code, "message": "Сначала снимите блокировку юзера"},
        ) from e
    return RoleSetResult(user_id=target.id, old_role=old_role, new_role=payload.role)


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
    redis: RedisClient,
    request: Request,
) -> AdminSubActionResult:
    await guard_admin_mutation_rate(actor, redis)
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


_CHARGE_STATUSES = ("success", "failed", "pending_3ds", "pending_yk", "refunded")


@router.get(
    "/billing/charges",
    response_model=AdminChargesPage,
    summary="Сквозной debug-список списаний с фильтрами (support)",
)
async def list_charges(
    _actor: RequireSupport,
    session: DbSession,
    status_filter: str | None = Query(
        default=None, alias="status", description=f"один из {_CHARGE_STATUSES}"
    ),
    subscription_id: UUID | None = Query(default=None),
    yookassa_payment_id: str | None = Query(default=None),
    idempotency_key: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> AdminChargesPage:
    """Debug вебхуков/идемпотентности при живом провайдере: найти charge по
    yookassa_payment_id / idempotency_key, посмотреть свежие failed — без
    знания subscription_id (карточка подписки требует его заранее)."""
    if status_filter is not None and status_filter not in _CHARGE_STATUSES:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "INVALID_STATUS",
                "message": f"status должен быть одним из {_CHARGE_STATUSES}",
            },
        )
    rows, total = await admin_service.list_charges(
        session,
        status=status_filter,
        subscription_id=subscription_id,
        yookassa_payment_id=yookassa_payment_id,
        idempotency_key=idempotency_key,
        page=page,
        page_size=page_size,
    )
    return AdminChargesPage(
        items=[AdminChargeDebugOut.model_validate(ch) for ch in rows],
        total=total,
        page=page,
        page_size=page_size,
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
    redis: RedisClient,
    request: Request,
) -> AdminSubActionResult:
    await guard_admin_mutation_rate(actor, redis)
    try:
        sub = await admin_service.cancel(session, actor, sub_id, ip_hash=_ip_hash(request))
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
    redis: RedisClient,
    request: Request,
) -> AdminSubActionResult:
    """Возврат: RequireSuperadmin (роль) + RequireReauthOnce (одноразовый токен).

    amount_kopecks=None → полная сумма подписки (берём sub.amount_kopecks).
    Идемпотентно по refund:{payment_id} (повтор → тот же charge, no-op).
    """
    await guard_admin_mutation_rate(actor, redis)
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
    except RefundAmountExceedsError as e:
        # F2-SEC: сумма возврата больше оплаченной.
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail={"code": e.code, "message": "Сумма возврата больше оплаченной"},
        ) from e
    return AdminSubActionResult(subscription_id=charge.subscription_id, action="sub.refund")


# ─── Analytics (Ф3-3/Ф3-4; все RequireAnalyst, кэш Redis Ф3-5) ──────────
#
# Считаем из наличных таблиц (users/attempts/progress/subscriptions/charges) —
# не ждём накопления events. Тяжёлые агрегаты кэшируются (analytics_service
# ._cached, TTL config.analytics_cache_ttl_seconds); поле `cached` в ответе.


@router.get(
    "/analytics/skill",
    response_model=SkillOut,
    summary="Распределение WPM/accuracy (гистограммы) из progress (analyst)",
)
async def analytics_skill(
    _actor: RequireAnalyst,
    session: DbSession,
    redis: RedisClient,
    tier: str | None = Query(default=None),
    period: int = Query(default=30),
) -> SkillOut:
    period = analytics_service.normalize_period(period)
    data, hit = await analytics_service._cached(
        redis,
        metric="skill",
        tier=tier,
        period=period,
        compute=lambda: analytics_service.skill(session, tier=tier, period=period),
    )
    return SkillOut(**data, cached=hit)


@router.get(
    "/analytics/revenue",
    response_model=RevenueOut,
    summary="MRR / подписки / decline rate из subscriptions/charges (analyst)",
)
async def analytics_revenue(
    _actor: RequireAnalyst,
    session: DbSession,
    redis: RedisClient,
    period: int = Query(default=30),
) -> RevenueOut:
    period = analytics_service.normalize_period(period)
    data, hit = await analytics_service._cached(
        redis,
        metric="revenue",
        tier=None,
        period=period,
        compute=lambda: analytics_service.revenue(session, period=period),
    )
    return RevenueOut(**data, cached=hit)


@router.get(
    "/analytics/funnel",
    response_model=FunnelOut,
    summary="Воронка signup→activated→subscribed→churned из таблиц (analyst)",
)
async def analytics_funnel(
    _actor: RequireAnalyst,
    session: DbSession,
    redis: RedisClient,
    period: int = Query(default=30),
) -> FunnelOut:
    period = analytics_service.normalize_period(period)
    data, hit = await analytics_service._cached(
        redis,
        metric="funnel",
        tier=None,
        period=period,
        compute=lambda: analytics_service.funnel(session, period=period),
    )
    return FunnelOut(**data, cached=hit)


@router.get(
    "/analytics/retention",
    response_model=RetentionOut,
    summary="Retention D1/D7/D30 из attempts (analyst)",
)
async def analytics_retention(
    _actor: RequireAnalyst,
    session: DbSession,
    redis: RedisClient,
    period: int = Query(default=30),
) -> RetentionOut:
    period = analytics_service.normalize_period(period)
    data, hit = await analytics_service._cached(
        redis,
        metric="retention",
        tier=None,
        period=period,
        compute=lambda: analytics_service.retention(session, period=period),
    )
    return RetentionOut(**data, cached=hit)


@router.get(
    "/analytics/lessons",
    response_model=LessonsOut,
    summary="Drop-off по урокам из progress/attempts (analyst)",
)
async def analytics_lessons(
    _actor: RequireAnalyst,
    session: DbSession,
    redis: RedisClient,
    tier: str | None = Query(default=None),
) -> LessonsOut:
    data, hit = await analytics_service._cached(
        redis,
        metric="lessons",
        tier=tier,
        period=0,  # lessons не зависит от периода; фикс 0 в ключе кэша
        compute=lambda: analytics_service.lessons(session, tier=tier),
    )
    return LessonsOut(**data, cached=hit)
