"""Events ingest endpoint (Ф3-1).

`POST /events/batch` — публичный (current_user_optional) приём клиентских
аналитических событий (фронт Алекс). Пишет строки в `events`:
- user_id из access-cookie если залогинен, иначе NULL (анонимный трейл);
- ip_hash из request.client (SHA256, 152-ФЗ), user_agent из заголовка;
- type валидируется по whitelist (event_service.EVENT_TYPES) — мусорный
  скипается (rejected), не валит весь батч.

Анти-флуд: Redis-счётчик на session_id+ip (как ratelimit:progress в me.py).
Батч ограничен ≤50 событий (schema MAX_BATCH).
"""

import structlog
from fastapi import APIRouter, HTTPException, Request, status

from app.config import get_settings
from app.deps import CurrentUserOptional, DbSession, RedisClient
from app.schemas.events import EventBatchIn, EventBatchResult
from app.services import event_service

logger = structlog.get_logger(__name__)

router = APIRouter()


@router.post(
    "/batch",
    response_model=EventBatchResult,
    summary="Приём батча аналитических событий (публично)",
)
async def ingest_batch(
    payload: EventBatchIn,
    user: CurrentUserOptional,
    session: DbSession,
    redis: RedisClient,
    request: Request,
) -> EventBatchResult:
    ip = request.client.host if request.client else None
    ip_hash = event_service.hash_ip(ip)
    user_agent = request.headers.get("user-agent")

    # Rate-limit на session_id+ip (анти-флуд). Как ratelimit:progress: incr +
    # expire(60) на первом хите; превышение → 429.
    settings = get_settings()
    limit = settings.rate_limit_events_per_minute
    rl_key = f"ratelimit:events:{payload.session_id}:{ip_hash or 'noip'}"
    count = await redis.incr(rl_key)
    if count == 1:
        await redis.expire(rl_key, 60)
    if count > limit:
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            detail={"code": "RATE_LIMITED", "message": "Слишком много событий, подождите"},
        )

    accepted = 0
    rejected = 0
    for ev in payload.events:
        if ev.type not in event_service.EVENT_TYPES:
            rejected += 1
            continue
        await event_service.emit(
            session,
            type=ev.type,
            session_id=payload.session_id,
            user_id=user.id if user is not None else None,
            payload=ev.payload,
            ip_hash=ip_hash,
            user_agent=user_agent,
            commit=False,
        )
        accepted += 1

    if accepted:
        await session.commit()

    logger.info(
        "events.ingest",
        session_id=str(payload.session_id),
        user_id=str(user.id) if user else None,
        accepted=accepted,
        rejected=rejected,
    )
    return EventBatchResult(accepted=accepted, rejected=rejected)
