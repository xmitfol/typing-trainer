"""Admin-panel business logic (admin-panel TSD §5) — оркестрация + аудит.

Ф1: audit() + users (list/detail/block/restore/reset-password/verify-email)
+ overview-метрики. Переиспользует доменные сервисы (auth_service,
email_service, billing_service), не дублируя бизнес-логику. Транзакции —
здесь (commit явный). HTTP-кодов нет: кидаем DomainError, api/ мапит.

Каждая мутация пишет запись в admin_audit_log через audit().
"""

import hashlib
from datetime import UTC, datetime, timedelta
from uuid import UUID

import structlog
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.email_tokens import RESET_PREFIX, RESET_TTL_SECONDS, issue_token
from app.core.exceptions import UserNotFoundError
from app.models.admin import AdminAuditLog
from app.models.progress import Attempt, Progress
from app.models.subscription import Subscription
from app.models.user import OAuthAccount, User
from app.services import auth_service
from app.services.email_service import EmailService

logger = structlog.get_logger(__name__)

# Статусы подписки, дающие доступ (совпадает с billing_service.has_active_*).
_ACTIVE_STATUSES = ("active", "cancelled", "grace")


def _now() -> datetime:
    return datetime.now(UTC)


def hash_ip(ip: str | None) -> str | None:
    """SHA256(IP) → 64 hex (152-ФЗ, как в events). None → None (CLI/без IP)."""
    if not ip:
        return None
    return hashlib.sha256(ip.encode()).hexdigest()


# ─── Audit ──────────────────────────────────────────────────────────────


async def audit(
    session: AsyncSession,
    *,
    actor: User | None,
    action: str,
    target_type: str,
    target_id: str,
    payload: dict | None = None,
    ip_hash: str | None = None,
    commit: bool = True,
) -> AdminAuditLog:
    """Записать действие сотрудника в admin_audit_log.

    commit=False — если вызывающая мутация коммитит сама (одна транзакция).
    """
    entry = AdminAuditLog(
        actor_user_id=actor.id if actor is not None else None,
        action=action,
        target_type=target_type,
        target_id=str(target_id),
        payload=payload or {},
        ip_hash=ip_hash,
    )
    session.add(entry)
    if commit:
        await session.commit()
    logger.info(
        "admin.audit",
        actor=str(actor.id) if actor else None,
        action=action,
        target_type=target_type,
        target_id=str(target_id),
    )
    return entry


# ─── Users: read ──────────────────────────────────────────────────────


async def _get_user(session: AsyncSession, user_id: UUID) -> User:
    """Юзер по id (включая soft-deleted — админ видит заблокированных)."""
    user = (
        await session.execute(select(User).where(User.id == user_id))
    ).scalar_one_or_none()
    if user is None:
        raise UserNotFoundError()
    return user


async def list_users(
    session: AsyncSession,
    *,
    search: str | None = None,
    audience: str | None = None,
    email_verified: bool | None = None,
    has_subscription: bool | None = None,
    deleted: bool | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[User], int]:
    """Список/поиск/фильтр юзеров с offset-пагинацией.

    search — substring по email ИЛИ name (ILIKE). Фильтры комбинируются AND.
    has_subscription — есть ли подписка в доступном статусе (active/cancelled/
    grace, не истёкшая). deleted — только заблокированные (True) / только
    активные (False) / все (None).

    Возвращает (rows, total).
    """
    page = max(1, page)
    page_size = max(1, min(page_size, 100))

    conditions = []
    if search:
        pattern = f"%{search.strip()}%"
        conditions.append(or_(User.email.ilike(pattern), User.name.ilike(pattern)))
    if audience is not None:
        conditions.append(User.audience == audience)
    if email_verified is not None:
        conditions.append(User.email_verified.is_(email_verified))
    if deleted is True:
        conditions.append(User.deleted_at.isnot(None))
    elif deleted is False:
        conditions.append(User.deleted_at.is_(None))

    if has_subscription is not None:
        now = _now()
        sub_exists = (
            select(Subscription.id)
            .where(
                Subscription.user_id == User.id,
                Subscription.status.in_(_ACTIVE_STATUSES),
                or_(Subscription.expires_at.is_(None), Subscription.expires_at > now),
            )
            .exists()
        )
        conditions.append(sub_exists if has_subscription else ~sub_exists)

    where = and_(*conditions) if conditions else None

    count_stmt = select(func.count()).select_from(User)
    if where is not None:
        count_stmt = count_stmt.where(where)
    total = (await session.execute(count_stmt)).scalar_one()

    stmt = select(User)
    if where is not None:
        stmt = stmt.where(where)
    stmt = (
        stmt.order_by(User.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    rows = list((await session.execute(stmt)).scalars().all())
    return rows, total


async def get_user_detail(session: AsyncSession, user_id: UUID) -> dict:
    """Агрегат карточки: профиль + подписки + прогресс по тирам + последние
    attempts + family + oauth_accounts.

    Возвращает dict с ORM-объектами/скалярами — api-слой мапит в схему.
    """
    user = await _get_user(session, user_id)

    subscriptions = list(
        (
            await session.execute(
                select(Subscription)
                .where(Subscription.user_id == user_id)
                .order_by(Subscription.created_at.desc())
            )
        )
        .scalars()
        .all()
    )

    # Прогресс по тирам: свод (уроков пройдено, звёзд).
    tier_rows = (
        await session.execute(
            select(
                Progress.tier,
                func.count().label("lessons"),
                func.coalesce(func.sum(Progress.stars), 0).label("stars"),
            )
            .where(Progress.user_id == user_id)
            .group_by(Progress.tier)
            .order_by(Progress.tier)
        )
    ).all()
    progress_by_tier = [
        {"tier": r.tier, "lessons_completed": r.lessons, "total_stars": int(r.stars)}
        for r in tier_rows
    ]

    recent_attempts = list(
        (
            await session.execute(
                select(Attempt)
                .where(Attempt.user_id == user_id)
                .order_by(Attempt.created_at.desc())
                .limit(10)
            )
        )
        .scalars()
        .all()
    )

    oauth_accounts = list(
        (
            await session.execute(
                select(OAuthAccount).where(OAuthAccount.user_id == user_id)
            )
        )
        .scalars()
        .all()
    )

    # Family (ADR-003): родитель + дети.
    family: list[dict] = []
    if user.parent_user_id is not None:
        parent = (
            await session.execute(select(User).where(User.id == user.parent_user_id))
        ).scalar_one_or_none()
        if parent is not None:
            family.append(
                {"id": parent.id, "email": parent.email, "name": parent.name, "relation": "parent"}
            )
    children = list(
        (
            await session.execute(
                select(User).where(User.parent_user_id == user_id)
            )
        )
        .scalars()
        .all()
    )
    family.extend(
        {"id": c.id, "email": c.email, "name": c.name, "relation": "child"} for c in children
    )

    return {
        "profile": user,
        "subscriptions": subscriptions,
        "progress_by_tier": progress_by_tier,
        "recent_attempts": recent_attempts,
        "family": family,
        "oauth_accounts": oauth_accounts,
    }


# ─── Users: mutations (каждая → audit) ──────────────────────────────────


async def block(
    session: AsyncSession, actor: User, user_id: UUID, *, ip_hash: str | None = None
) -> User:
    """Soft-delete: ставит deleted_at. Закрывает доступ (get_active_user=None)."""
    user = await _get_user(session, user_id)
    if user.deleted_at is None:
        user.deleted_at = _now()
    await audit(
        session,
        actor=actor,
        action="user.block",
        target_type="user",
        target_id=user.id,
        payload={"email": user.email},
        ip_hash=ip_hash,
        commit=False,
    )
    await session.commit()
    await session.refresh(user)
    return user


async def restore(
    session: AsyncSession, actor: User, user_id: UUID, *, ip_hash: str | None = None
) -> User:
    """Снять soft-delete (deleted_at=NULL) — возвращает доступ."""
    user = await _get_user(session, user_id)
    user.deleted_at = None
    await audit(
        session,
        actor=actor,
        action="user.restore",
        target_type="user",
        target_id=user.id,
        payload={"email": user.email},
        ip_hash=ip_hash,
        commit=False,
    )
    await session.commit()
    await session.refresh(user)
    return user


async def verify_email(
    session: AsyncSession, actor: User, user_id: UUID, *, ip_hash: str | None = None
) -> User:
    """Ручная верификация email. Использует auth_service (идемпотентно)."""
    user = await _get_user(session, user_id)
    if not user.email_verified:
        user.email_verified = True
    await audit(
        session,
        actor=actor,
        action="user.verify_email",
        target_type="user",
        target_id=user.id,
        payload={"email": user.email},
        ip_hash=ip_hash,
        commit=False,
    )
    await session.commit()
    await session.refresh(user)
    logger.info("admin.email_verified", user_id=str(user.id))
    return user


async def reset_password(
    session: AsyncSession,
    actor: User,
    user_id: UUID,
    *,
    redis,
    emailer: EmailService,
    ip_hash: str | None = None,
) -> User:
    """Сгенерировать reset-токен + отправить письмо сброса (best-effort SMTP).

    Токен кладётся в Redis (тот же flow, что auth /forgot). Само письмо —
    best-effort: сбой SMTP не валит операцию (аудит фиксируется в любом случае).
    """
    user = await _get_user(session, user_id)
    email_sent = False
    try:
        token = await issue_token(redis, RESET_PREFIX, user.id, RESET_TTL_SECONDS)
        await emailer.send_password_reset(
            to=user.email, name=user.name, language=user.language, token=token
        )
        email_sent = True
    except Exception as e:  # noqa: BLE001 — почта/Redis не должны валить admin-action
        logger.warning("admin.reset_password_email_failed", user_id=str(user.id), error=str(e))

    # В аудите честно фиксируем, ушло ли письмо (F1-SEC: не утверждать «done»,
    # если SMTP упал).
    await audit(
        session,
        actor=actor,
        action="user.reset_password",
        target_type="user",
        target_id=user.id,
        payload={"email": user.email, "email_sent": email_sent},
        ip_hash=ip_hash,
    )
    return user


# ─── Overview metrics (GET /admin/overview) ─────────────────────────────


async def overview(session: AsyncSession, *, period_days: int = 30) -> dict:
    """Ключевые метрики дашборда за период (admin PRD §4.1).

    - active_users: уникальных юзеров с attempt за период.
    - new_registrations: аккаунтов, созданных за период (не soft-deleted).
    - active_subscriptions: подписок в доступном статусе сейчас.
    - mrr_kopecks: Σ active amount_kopecks нормировано на 30-дневный месяц
      по периоду подписки (period_days(period)).
    - signup_to_paid_conversion: доля созданных за период юзеров, у которых
      есть хоть одна не-pending/не-failed подписка.
    """
    now = _now()
    since = now - timedelta(days=period_days)

    active_users = (
        await session.execute(
            select(func.count(func.distinct(Attempt.user_id))).where(
                Attempt.created_at >= since
            )
        )
    ).scalar_one()

    new_registrations = (
        await session.execute(
            select(func.count())
            .select_from(User)
            .where(User.created_at >= since, User.deleted_at.is_(None))
        )
    ).scalar_one()

    active_subs = list(
        (
            await session.execute(
                select(Subscription).where(
                    Subscription.status.in_(_ACTIVE_STATUSES),
                    or_(
                        Subscription.expires_at.is_(None),
                        Subscription.expires_at > now,
                    ),
                )
            )
        )
        .scalars()
        .all()
    )
    active_subscriptions = len(active_subs)

    # MRR: нормируем сумму каждой подписки на месяц (30д) по её периоду.
    # period_days из core.billing; неизвестный/None период → трактуем как m1.
    from app.core.billing import period_days as _period_days

    mrr_kopecks = 0
    for sub in active_subs:
        days = _period_days(sub.period) if sub.period else 30
        days = days or 30
        mrr_kopecks += round(sub.amount_kopecks * 30 / days)

    # Конверсия signup→оплата за период: среди созданных за период юзеров —
    # доля с хоть одной подпиской в терминальном оплаченном статусе.
    paid_since = (
        await session.execute(
            select(func.count(func.distinct(Subscription.user_id)))
            .select_from(Subscription)
            .join(User, User.id == Subscription.user_id)
            .where(
                User.created_at >= since,
                Subscription.status.in_(("active", "cancelled", "grace", "expired")),
            )
        )
    ).scalar_one()
    conversion = (paid_since / new_registrations) if new_registrations else 0.0

    return {
        "period_days": period_days,
        "active_users": active_users,
        "new_registrations": new_registrations,
        "active_subscriptions": active_subscriptions,
        "mrr_kopecks": mrr_kopecks,
        "signup_to_paid_conversion": round(conversion, 4),
    }


# ─── Re-auth token issuance ─────────────────────────────────────────────


async def issue_reauth_token(redis, user_id: UUID) -> tuple[str, int]:
    """Выдать scope-токен re-auth в Redis admin:reauth:{user_id} (TTL-окно).

    Возвращает (token, ttl_seconds). Пароль проверяется в endpoint'е (как signin).
    """
    import secrets

    from app.deps import REAUTH_PREFIX, REAUTH_TTL_SECONDS

    token = secrets.token_urlsafe(32)
    await redis.set(f"{REAUTH_PREFIX}{user_id}", token, ex=REAUTH_TTL_SECONDS)
    return token, REAUTH_TTL_SECONDS
