"""Pydantic v2 schemas для /events/batch (Ф3-1 ingest).

Публичный ingest клиентских событий (фронт Алекс). Стиль — как schemas/me.py:
extra=forbid на входе. Валидация type по whitelist делается в сервисе/эндпоинте
(EVENT_TYPES) — мусорный type скипается, не валит весь батч.
"""

from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

# Максимум событий в одном батче (анти-флуд, TSD §6 / задача Ф3-1).
MAX_BATCH = 50


class EventIn(BaseModel):
    """Одно клиентское событие в батче."""

    model_config = ConfigDict(extra="forbid")

    type: str = Field(min_length=1, max_length=40)
    payload: dict[str, Any] = Field(default_factory=dict)


class EventBatchIn(BaseModel):
    """Тело POST /events/batch."""

    model_config = ConfigDict(extra="forbid")

    session_id: UUID
    events: list[EventIn] = Field(min_length=1, max_length=MAX_BATCH)


class EventBatchResult(BaseModel):
    """Ответ ingest'а: сколько принято / отброшено (мусорный type)."""

    accepted: int
    rejected: int
