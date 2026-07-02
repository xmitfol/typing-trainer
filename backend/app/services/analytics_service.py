"""Admin analytics (Ф3-3 скилл/деньги + Ф3-4 воронка/retention/drop-off).

КЛЮЧЕВОЕ РЕШЕНИЕ: аналитику считаем из НАЛИЧНЫХ таблиц (users/attempts/
progress/subscriptions/subscription_charges), НЕ дожидаясь накопления events.
Воронка/retention/drop-off выводимы из этих таблиц; events — обогащение (когда
зальются, можно уточнить lesson_started и т.п., но дашборд от их объёма не
зависит).

Тяжёлые агрегаты кэшируются в Redis (`admin:analytics:{metric}:{tier}:{period}`,
TTL из config.analytics_cache_ttl_seconds). Инвалидация — по TTL (достаточно
для v1, admin WORK_PLAN риск F).
"""

import json
from datetime import UTC, date, datetime, timedelta
from typing import Any

import structlog
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.core.billing import period_days as _plan_period_days
from app.models.progress import Attempt, Progress
from app.models.subscription import Subscription, SubscriptionCharge
from app.models.user import User

logger = structlog.get_logger(__name__)

_ALLOWED_PERIODS = (7, 30, 90)
# Статусы подписки, дающие доступ (совпадает с billing_service.has_active_*).
_ACTIVE_STATUSES = ("active", "cancelled", "grace")


def _now() -> datetime:
    return datetime.now(UTC)


def normalize_period(period: int) -> int:
    """Клэмп периода к разрешённым (7/30/90); прочее → 30."""
    return period if period in _ALLOWED_PERIODS else 30


# ─── Redis cache wrapper ────────────────────────────────────────────────


async def _cached(
    redis,
    *,
    metric: str,
    tier: str | None,
    period: int,
    compute,
) -> tuple[dict, bool]:
    """Обёртка кэша: ключ admin:analytics:{metric}:{tier}:{period}.

    Возвращает (data, cache_hit). При недоступности Redis — считаем напрямую
    (аналитика не должна падать из-за кэша). compute — async callable → dict.
    """
    key = f"admin:analytics:{metric}:{tier or 'all'}:{period}"
    ttl = get_settings().analytics_cache_ttl_seconds
    try:
        raw = await redis.get(key)
        if raw is not None:
            return json.loads(raw), True
    except Exception as e:  # noqa: BLE001 — кэш best-effort
        logger.warning("analytics.cache_get_failed", key=key, error=str(e))

    data = await compute()
    try:
        await redis.set(key, json.dumps(data), ex=ttl)
    except Exception as e:  # noqa: BLE001
        logger.warning("analytics.cache_set_failed", key=key, error=str(e))
    return data, False


# ─── Ф3-3: Скилл (распределение WPM/accuracy) ───────────────────────────

# Границы бакетов гистограмм (правый край не включается, последний — открытый).
_WPM_EDGES = [0, 20, 40, 60, 80, 100, 120, 150, 200]      # знаков/мин
_ACC_EDGES = [0, 50, 70, 80, 85, 90, 95, 98, 100]         # проценты


def _buckets(edges: list[int], value_counts: list[tuple[int, int]]) -> list[dict]:
    """Разложить (value, count) по бакетам [lo, hi). Последний бакет [lo, ∞)."""
    out = [{"lo": edges[i], "hi": edges[i + 1], "count": 0} for i in range(len(edges) - 1)]
    out.append({"lo": edges[-1], "hi": None, "count": 0})
    for value, cnt in value_counts:
        placed = False
        for b in out[:-1]:
            if b["lo"] <= value < b["hi"]:
                b["count"] += cnt
                placed = True
                break
        if not placed:
            out[-1]["count"] += cnt
    return out


async def skill(session: AsyncSession, *, tier: str | None, period: int) -> dict:
    """Распределение WPM/accuracy (гистограммы) + средние — из `progress`.

    Из best_wpm/best_accuracy per (user,tier,lesson). Фильтр по tier опционален.
    period — по progress.updated_at (недавно активные достижения). Форма:
    {wpm_buckets, acc_buckets, avg_wpm, avg_accuracy, n}.
    """
    since = _now() - timedelta(days=period)
    conds = [Progress.updated_at >= since]
    if tier:
        conds.append(Progress.tier == tier)
    where = and_(*conds)

    # (value, count) по WPM и accuracy — группировка на стороне БД.
    wpm_rows = (
        await session.execute(
            select(Progress.best_wpm, func.count()).where(where).group_by(Progress.best_wpm)
        )
    ).all()
    acc_rows = (
        await session.execute(
            select(Progress.best_accuracy, func.count()).where(where).group_by(Progress.best_accuracy)
        )
    ).all()

    agg = (
        await session.execute(
            select(
                func.count(),
                func.coalesce(func.avg(Progress.best_wpm), 0),
                func.coalesce(func.avg(Progress.best_accuracy), 0),
            ).where(where)
        )
    ).one()
    n, avg_wpm, avg_acc = int(agg[0]), float(agg[1]), float(agg[2])

    return {
        "tier": tier,
        "period": period,
        "n": n,
        "avg_wpm": round(avg_wpm, 1),
        "avg_accuracy": round(avg_acc, 1),
        "wpm_buckets": _buckets(_WPM_EDGES, [(int(v), int(c)) for v, c in wpm_rows]),
        "acc_buckets": _buckets(_ACC_EDGES, [(int(v), int(c)) for v, c in acc_rows]),
    }


# ─── Ф3-3: Деньги (MRR / подписки / decline rate) ───────────────────────


def _mrr_kopecks(subs: list[Subscription]) -> int:
    """Σ amount, нормировано на 30-дневный месяц по периоду подписки."""
    total = 0
    for sub in subs:
        days = (_plan_period_days(sub.period) if sub.period else 30) or 30
        total += round(sub.amount_kopecks * 30 / days)
    return total


async def revenue(session: AsyncSession, *, period: int) -> dict:
    """MRR / активные / новые / отменённые подписки + decline rate + серия.

    - mrr_kopecks: Σ активных сейчас, нормировано на месяц.
    - active_subscriptions: в доступном статусе сейчас.
    - new_subscriptions: started_at в периоде.
    - cancelled_subscriptions: cancelled_at в периоде.
    - decline_rate: failed / (success+failed) charges за период (0..1).
    - series: MRR по дням (snapshot активных на конец каждого дня периода).
    """
    now = _now()
    since = now - timedelta(days=period)

    active_subs = list(
        (
            await session.execute(
                select(Subscription).where(
                    Subscription.status.in_(_ACTIVE_STATUSES),
                    or_(Subscription.expires_at.is_(None), Subscription.expires_at > now),
                )
            )
        )
        .scalars()
        .all()
    )
    mrr = _mrr_kopecks(active_subs)

    new_subs = (
        await session.execute(
            select(func.count()).select_from(Subscription).where(Subscription.started_at >= since)
        )
    ).scalar_one()
    cancelled_subs = (
        await session.execute(
            select(func.count()).select_from(Subscription).where(Subscription.cancelled_at >= since)
        )
    ).scalar_one()

    charge_rows = (
        await session.execute(
            select(SubscriptionCharge.status, func.count())
            .where(SubscriptionCharge.attempted_at >= since)
            .group_by(SubscriptionCharge.status)
        )
    ).all()
    charges = {status: int(cnt) for status, cnt in charge_rows}
    success = charges.get("success", 0)
    failed = charges.get("failed", 0)
    decline_rate = (failed / (success + failed)) if (success + failed) else 0.0

    # Серия MRR по дням: для каждого дня — активные подписки, чей интервал
    # [started_at, expires_at) накрывает конец дня. Считаем в одном проходе по
    # подпискам с непустым started_at (дневная гранулярность достаточна для UI).
    series = _mrr_series(session_subs=active_subs, since=since.date(), until=now.date())

    return {
        "period": period,
        "mrr_kopecks": mrr,
        "active_subscriptions": len(active_subs),
        "new_subscriptions": int(new_subs),
        "cancelled_subscriptions": int(cancelled_subs),
        "decline_rate": round(decline_rate, 4),
        "series": series,
    }


def _mrr_series(*, session_subs: list[Subscription], since: date, until: date) -> list[dict]:
    """MRR-снимок на конец каждого дня [since..until] по текущим активным.

    Упрощение: используем множество сейчас-активных подписок и их интервалы
    started_at..expires_at. Отменённые/истёкшие в прошлом в серию прошлых дней
    не попадут (нет исторической выборки) — это осознанный дефолт для v1; точная
    историческая MRR-серия — оптимизация (материализованная вью) при росте.
    """
    out: list[dict] = []
    d = since
    while d <= until:
        day_end = datetime(d.year, d.month, d.day, 23, 59, 59, tzinfo=UTC)
        active = [
            s
            for s in session_subs
            if (s.started_at is None or s.started_at <= day_end)
            and (s.expires_at is None or s.expires_at >= day_end)
        ]
        out.append({"date": d.isoformat(), "mrr_kopecks": _mrr_kopecks(active)})
        d += timedelta(days=1)
    return out


# ─── Ф3-4: Воронка (из наличных таблиц) ─────────────────────────────────


async def funnel(session: AsyncSession, *, period: int) -> dict:
    """signup → activated → subscribed → churned за период (из таблиц).

    - signups: users.created_at в периоде (не soft-deleted).
    - activated: из них с ≥1 attempt.
    - subscribed: из них с подпиской в оплаченном статусе (когда-либо).
    - churned: из них с подпиской cancelled/expired.
    rates: activation/subscription/churn (доли от предыдущего шага/signups).
    """
    now = _now()
    since = now - timedelta(days=period)

    signups = (
        await session.execute(
            select(func.count())
            .select_from(User)
            .where(User.created_at >= since, User.deleted_at.is_(None))
        )
    ).scalar_one()

    activated = (
        await session.execute(
            select(func.count(func.distinct(User.id)))
            .select_from(User)
            .join(Attempt, Attempt.user_id == User.id)
            .where(User.created_at >= since, User.deleted_at.is_(None))
        )
    ).scalar_one()

    subscribed = (
        await session.execute(
            select(func.count(func.distinct(User.id)))
            .select_from(User)
            .join(Subscription, Subscription.user_id == User.id)
            .where(
                User.created_at >= since,
                User.deleted_at.is_(None),
                Subscription.status.in_(("active", "cancelled", "grace", "expired")),
            )
        )
    ).scalar_one()

    churned = (
        await session.execute(
            select(func.count(func.distinct(User.id)))
            .select_from(User)
            .join(Subscription, Subscription.user_id == User.id)
            .where(
                User.created_at >= since,
                User.deleted_at.is_(None),
                Subscription.status.in_(("cancelled", "expired")),
            )
        )
    ).scalar_one()

    signups, activated, subscribed, churned = (
        int(signups), int(activated), int(subscribed), int(churned)
    )

    def _rate(num: int, den: int) -> float:
        return round(num / den, 4) if den else 0.0

    return {
        "period": period,
        "signups": signups,
        "activated": activated,
        "subscribed": subscribed,
        "churned": churned,
        "rates": {
            "activation": _rate(activated, signups),
            "subscription": _rate(subscribed, activated),
            "churn": _rate(churned, subscribed),
        },
    }


# ─── Ф3-4: Retention (D1/D7/D30 из attempts) ────────────────────────────


async def retention(session: AsyncSession, *, period: int) -> dict:
    """Доли вернувшихся D1/D7/D30 (по attempts относительно первого attempt).

    Когорта: юзеры, чей ПЕРВЫЙ attempt попал в период. dN = доля из них, у кого
    есть attempt в окне [first + N дней, first + (N+1) дней) — т.е. вернулись
    на N-й день. Считаем в БД: first_attempt на юзера + наличие attempt в окне.
    """
    now = _now()
    since = now - timedelta(days=period)

    # Первый attempt на юзера (когорта: first в [since, now]).
    first_sq = (
        select(
            Attempt.user_id.label("uid"),
            func.min(Attempt.created_at).label("first_at"),
        )
        .group_by(Attempt.user_id)
        .subquery()
    )
    cohort_rows = (
        await session.execute(
            select(first_sq.c.uid, first_sq.c.first_at).where(first_sq.c.first_at >= since)
        )
    ).all()
    cohort_size = len(cohort_rows)
    if cohort_size == 0:
        return {"period": period, "cohort_size": 0, "d1": 0.0, "d7": 0.0, "d30": 0.0}

    first_by_user = {uid: first_at for uid, first_at in cohort_rows}
    uids = list(first_by_user.keys())

    # Все attempts когорты (один запрос) → считаем возвраты в памяти.
    attempts = (
        await session.execute(
            select(Attempt.user_id, Attempt.created_at).where(Attempt.user_id.in_(uids))
        )
    ).all()

    def _returned_on(day: int) -> int:
        cnt = 0
        by_user: dict[Any, list[datetime]] = {}
        for uid, ts in attempts:
            by_user.setdefault(uid, []).append(ts)
        for uid, first_at in first_by_user.items():
            lo = first_at + timedelta(days=day)
            hi = first_at + timedelta(days=day + 1)
            if any(lo <= ts < hi for ts in by_user.get(uid, [])):
                cnt += 1
        return cnt

    return {
        "period": period,
        "cohort_size": cohort_size,
        "d1": round(_returned_on(1) / cohort_size, 4),
        "d7": round(_returned_on(7) / cohort_size, 4),
        "d30": round(_returned_on(30) / cohort_size, 4),
    }


# ─── Ф3-4: Drop-off по урокам ───────────────────────────────────────────


async def lessons(session: AsyncSession, *, tier: str | None) -> dict:
    """Drop-off по урокам из `attempts`/`progress`.

    Для каждого урока N в тире:
    - reached: сколько юзеров сделали ≥1 attempt на этом уроке.
    - completed: сколько имеют запись в progress (урок пройден со звёздами).
    - dropoff_rate: 1 - completed/reached (доля дошедших, но не завершивших).
    Без tier — агрегируем по всем тирам вместе по lesson_num (грубее; для
    осмысленного drop-off фронт передаёт конкретный tier).
    """
    reached_conds = []
    prog_conds = []
    if tier:
        reached_conds.append(Attempt.tier == tier)
        prog_conds.append(Progress.tier == tier)

    reached_rows = (
        await session.execute(
            select(Attempt.lesson_num, func.count(func.distinct(Attempt.user_id)))
            .where(and_(*reached_conds) if reached_conds else True)
            .group_by(Attempt.lesson_num)
        )
    ).all()
    completed_rows = (
        await session.execute(
            select(Progress.lesson_num, func.count(func.distinct(Progress.user_id)))
            .where(and_(*prog_conds) if prog_conds else True)
            .group_by(Progress.lesson_num)
        )
    ).all()

    reached = {int(ln): int(c) for ln, c in reached_rows}
    completed = {int(ln): int(c) for ln, c in completed_rows}
    lesson_nums = sorted(set(reached) | set(completed))

    items = []
    for ln in lesson_nums:
        r = reached.get(ln, 0)
        c = completed.get(ln, 0)
        dropoff = round(1 - c / r, 4) if r else 0.0
        items.append({"lesson_num": ln, "reached": r, "completed": c, "dropoff_rate": dropoff})

    return {"tier": tier, "items": items}
