"""Pydantic schemas для lessons endpoints."""

from typing import Literal

from pydantic import BaseModel, Field


class LessonAccessOut(BaseModel):
    """GET /lessons/{tier}/{n}/access — результат paywall-проверки.

    Совпадает по форме с фронтовым api-client.checkLessonAccess local-fallback.
    """

    allowed: bool
    reason: Literal["paywall"] | None = Field(
        default=None,
        description="Причина запрета (paywall) или null если доступ есть.",
    )
    free_limit: int = Field(description="Сколько первых уроков тира бесплатны.")
