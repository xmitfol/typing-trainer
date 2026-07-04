"""Event emission (analytics + инструментация P0).

Ф3-1. Единая точка записи в таблицу `events` — и для клиентского ingest'а
(`POST /events/batch`, фронт Алекса), и для server-side эмиссии (billing:
subscribed/churned, где сервер — источник истины).

`events` — ОБОГАЩЕНИЕ аналитики, не её основа: воронка/retention/drop-off
выводимы из users/attempts/subscriptions без накопления событий (см.
analytics_service). Поэтому emit не должен валить основной flow — server-side
вызовы делают emit best-effort в той же транзакции (commit=False).

PII: IP в plain не храним (152-ФЗ) — sha256 hash (`hash_ip`, единый с admin).
"""

import hashlib
from typing import Any
from uuid import NAMESPACE_URL, UUID, uuid5

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.event import Event

logger = structlog.get_logger(__name__)


# ─── Whitelist типов событий (валидация ingest'а) ───────────────────────
#
# Клиент (фронт) эмитит signup/lesson_*/checkout_started. Сервер (billing)
# эмитит subscribed/churned. Всё вместе — единый словарь допустимых типов;
# ingest пропускает только эти (мусорный type → скип/400).
EVENT_TYPES: frozenset[str] = frozenset(
    {
        "signup",
        "lesson_started",
        "lesson_completed",
        "lesson_failed",
        "subscribed",
        "churned",
        "checkout_started",
    }
)

# Фиксированный namespace-UUID для server-side событий, у которых нет
# браузерной session_id (billing webhook/cron). РЕШЕНИЕ: session_id в модели
# NOT NULL, поэтому вместо NULL пишем ДЕТЕРМИНИРОВАННЫЙ UUIDv5 из user_id в
# этом namespace — server-события юзера группируются стабильно и отличимы от
# браузерных сессий (payload.source="server"). См. server_session_id().
_SERVER_SESSION_NS = uuid5(NAMESPACE_URL, "typing-trainer:events:server")


def hash_ip(ip: str | None) -> str | None:
    """SHA256(IP) → 64 hex (152-ФЗ). None → None (server-side/без IP).

    Единый хелпер для events и admin_audit_log; admin_service.hash_ip
    делегирует сюда (без дублирования).
    """
    if not ip:
        return None
    return hashlib.sha256(ip.encode()).hexdigest()


def server_session_id(user_id: UUID | None) -> UUID:
    """Детерминированный session_id для server-side событий.

    session_id в events NOT NULL. Для событий, инициированных сервером
    (webhook/cron), браузерной сессии нет — генерим UUIDv5 из user_id в
    выделенном namespace. Для событий без user_id (не должно случаться на
    server-side) — сам namespace-UUID как «anonymous server».
    """
    if user_id is None:
        return _SERVER_SESSION_NS
    return uuid5(_SERVER_SESSION_NS, str(user_id))


async def emit(
    session: AsyncSession,
    *,
    type: str,
    session_id: UUID,
    user_id: UUID | None = None,
    payload: dict[str, Any] | None = None,
    ip_hash: str | None = None,
    user_agent: str | None = None,
    commit: bool = False,
) -> Event:
    """Записать одно событие в `events`.

    commit=False (дефолт) — событие добавляется в текущую транзакцию, коммит
    делает вызывающий (server-side эмиссия внутри billing-транзакции). Ingest-
    эндпоинт коммитит батч сам (commit=False на каждый emit, один commit в конце).

    type НЕ валидируется здесь (доверенный слой) — валидацию whitelist'а делает
    ingest-эндпоинт до вызова; server-side передаёт известные константы.
    """
    event = Event(
        user_id=user_id,
        session_id=session_id,
        type=type,
        payload=payload or {},
        user_agent=(user_agent[:255] if user_agent else None),
        ip_hash=ip_hash,
    )
    session.add(event)
    if commit:
        await session.commit()
    return event


async def emit_server(
    session: AsyncSession,
    *,
    type: str,
    user_id: UUID | None,
    payload: dict[str, Any] | None = None,
    commit: bool = False,
) -> Event:
    """Эмиссия server-side события (billing subscribed/churned).

    session_id — детерминированный server-UUID из user_id (см.
    server_session_id). ip_hash/user_agent = NULL (нет HTTP-контекста клиента).
    payload обогащается source="server". best-effort: не должно валить
    основную транзакцию — исключение проглатываем и логируем.
    """
    body = {"source": "server", **(payload or {})}
    try:
        return await emit(
            session,
            type=type,
            session_id=server_session_id(user_id),
            user_id=user_id,
            payload=body,
            commit=commit,
        )
    except Exception as e:  # аналитика не должна ломать billing
        logger.warning(
            "event.emit_server_failed",
            type=type,
            user_id=str(user_id) if user_id else None,
            error=str(e),
        )
        # Пустой transient-объект чтобы сигнатура не падала у вызывающего.
        return Event(
            user_id=user_id, session_id=server_session_id(user_id), type=type, payload=body
        )
