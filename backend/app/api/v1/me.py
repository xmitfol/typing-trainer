"""User /me/* endpoints (Sprint 2/3 sync).

Профиль / настройки / прогресс / история / ачивки. Все под CurrentUser
(401 если не авторизован). Тонкий слой: валидация (Pydantic) + вызов
me_service. Контракт — фронт assets/js/api-client.js + TSD §3.3/§3.7.
"""

import structlog
from fastapi import APIRouter, HTTPException, Query, status

from app.config import get_settings
from app.core.exceptions import AgeDowngradeForbiddenError
from app.deps import CurrentUser, DbSession, RedisClient
from app.schemas.me import (
    AttemptCreate,
    HistoryPage,
    ProfileOut,
    ProfileUpdate,
    ProgressEntry,
    SaveAttemptResult,
    SettingsOut,
    SettingsUpdate,
)
from app.services import me_service

logger = structlog.get_logger(__name__)

router = APIRouter()


# ─── Profile ────────────────────────────────────────────────────────────


@router.get("", response_model=ProfileOut, summary="Текущий профиль")
async def get_me(user: CurrentUser) -> ProfileOut:
    return ProfileOut.model_validate(user)


@router.patch("", response_model=ProfileOut, summary="Обновить профиль")
async def patch_me(
    payload: ProfileUpdate,
    user: CurrentUser,
    session: DbSession,
) -> ProfileOut:
    patch = payload.model_dump(exclude_unset=True)
    try:
        updated = await me_service.patch_profile(session, user, patch)
    except AgeDowngradeForbiddenError as e:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": e.code, "message": e.message},
        ) from e
    return ProfileOut.model_validate(updated)


# ─── Settings ───────────────────────────────────────────────────────────


@router.get("/settings", response_model=SettingsOut, summary="Настройки юзера")
async def get_my_settings(user: CurrentUser, session: DbSession) -> SettingsOut:
    settings = await me_service.get_settings(session, user.id)
    return SettingsOut.model_validate(settings)


@router.patch("/settings", response_model=SettingsOut, summary="Обновить настройки (upsert)")
async def patch_my_settings(
    payload: SettingsUpdate,
    user: CurrentUser,
    session: DbSession,
) -> SettingsOut:
    patch = payload.model_dump(exclude_unset=True)
    settings = await me_service.patch_settings(session, user.id, patch)
    return SettingsOut.model_validate(settings)


# ─── Progress ───────────────────────────────────────────────────────────


@router.get(
    "/progress",
    response_model=dict[str, dict[str, ProgressEntry]],
    summary="Прогресс {tier: {lesson_num: {...}}}",
)
async def get_my_progress(
    user: CurrentUser, session: DbSession
) -> dict[str, dict[str, ProgressEntry]]:
    return await me_service.get_progress(session, user.id)


@router.post(
    "/progress",
    response_model=SaveAttemptResult,
    summary="Сохранить попытку (upsert progress + append attempt)",
)
async def save_my_attempt(
    payload: AttemptCreate,
    user: CurrentUser,
    session: DbSession,
    redis: RedisClient,
) -> SaveAttemptResult:
    # Rate-limit: rate_limit_progress_per_minute (config, default 60) на юзера.
    settings = get_settings()
    limit = settings.rate_limit_progress_per_minute
    key = f"ratelimit:progress:{user.id}"
    count = await redis.incr(key)
    if count == 1:
        await redis.expire(key, 60)
    if count > limit:
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            detail={"code": "RATE_LIMITED", "message": "Слишком много попыток, подождите минуту"},
        )
    return await me_service.save_attempt(session, user.id, payload)


# ─── History ────────────────────────────────────────────────────────────


@router.get("/history", response_model=HistoryPage, summary="История попыток (cursor-пагинация)")
async def get_my_history(
    user: CurrentUser,
    session: DbSession,
    cursor: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
) -> HistoryPage:
    return await me_service.get_history(session, user.id, cursor=cursor, limit=limit)


# ─── Achievements ───────────────────────────────────────────────────────


@router.get("/achievements", response_model=list, summary="Server-computed ачивки (пока [])")
async def get_my_achievements(user: CurrentUser, session: DbSession) -> list:
    return await me_service.get_achievements(session, user.id)


# guest-migration — POST /auth/migrate-guest (контракт-путь фронта). См. auth.py.
