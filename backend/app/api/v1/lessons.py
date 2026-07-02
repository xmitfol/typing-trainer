"""Lessons endpoints — серверный paywall-gate доступа к урокам.

Контент уроков отдаётся статикой (data/lessons/*.json), в БД его нет. Здесь
только ПРОВЕРКА ДОСТУПА: первые `free_lesson_limit` уроков каждого тира —
бесплатно, дальше нужна активная подписка. Это даёт paywall «зубы»: фронтовый
FREE_LIMIT обходится через localStorage, а этот gate опирается на серверный
has_active_subscription (ADR-008) и не подделывается.

Гость (нет cookie) → доступны только бесплатные уроки. Залогиненный без
подписки → так же. С активной подпиской → всё.
"""

from fastapi import APIRouter

from app.deps import SettingsDep, SubscriptionStatus
from app.schemas.lessons import LessonAccessOut

router = APIRouter()


@router.get(
    "/{tier}/{lesson_num}/access",
    response_model=LessonAccessOut,
    summary="Проверка доступа к уроку (paywall-gate)",
)
async def check_lesson_access(
    tier: str,
    lesson_num: int,
    has_subscription: SubscriptionStatus,
    settings: SettingsDep,
) -> LessonAccessOut:
    """allowed=true если урок бесплатный (n ≤ free_lesson_limit) или есть подписка."""
    free_limit = settings.free_lesson_limit
    allowed = lesson_num <= free_limit or has_subscription
    return LessonAccessOut(
        allowed=allowed,
        reason=None if allowed else "paywall",
        free_limit=free_limit,
    )
