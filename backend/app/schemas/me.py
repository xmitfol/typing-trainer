"""Pydantic v2 schemas для /me/* (Sprint 2/3 sync).

Контракт продиктован фронтом (assets/js/api-client.js) + TSD §3.3/§3.7.
Enum'ы совпадают с CHECK-constraints моделей User/UserSettings/Progress.

РАСХОЖДЕНИЯ с api-client.js (для координатора — поправить фронт-адаптер):
  1. getProgress: локальный фронт возвращает ПЛОСКО {lesson_num: {...}} без
     tier (однотировый local-режим). Сервер мультитировый (PK с tier), поэтому
     возвращаем СГРУППИРОВАННО {tier: {lesson_num: {...}}}. TSD §3.3 показывает
     список [{tier, lesson_num, ...}] — тоже с tier. Выбрана map-форма (ближе к
     фронтовому dict-доступу progress[lesson_num]); api-client-адаптер надо
     научить разворачивать по активному тиру.
  2. saveAttempt result.progress: api-client local кладёт camelCase
     (bestWPM/bestAccuracy/bestTime/completedAt). Сервер отдаёт ту же camelCase-
     форму (ProgressEntry) для консистентности с getProgress-значениями.
  3. next_unlocked: api-client local отдаёт `null`; TSD §3.7 — объект
     {tier, lesson_num}. Отдаём объект (или null на последнем уроке). Фронт
     трактует truthy → следующий доступен.
"""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

Audience = Literal["adult", "teen", "kid"]
Character = Literal["anna", "maxim", "knopych", "klavochka"]
Language = Literal["ru", "en"]
Gender = Literal["m", "f"]
KeyboardType = Literal["classic", "laptop", "ergonomic"]
KeyboardLayout = Literal["standard", "phonetic", "typewriter", "mac"]


# ─── Profile (GET/PATCH /me) ────────────────────────────────────────────


class ProfileOut(BaseModel):
    """GET /me — публичная проекция User."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    email_verified: bool
    name: str
    audience: Audience
    character: Character
    gender: Gender | None
    language: Language
    is_anonymous: bool
    created_at: datetime


class ProfileUpdate(BaseModel):
    """PATCH /me — все поля optional. email/password здесь НЕ меняются
    (отдельные endpoint'ы, TSD §4a.3). audience-downgrade запрещён в сервисе."""

    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(default=None, min_length=1, max_length=80)
    audience: Audience | None = None
    character: Character | None = None
    gender: Gender | None = None
    language: Language | None = None


# ─── Settings (GET/PATCH /me/settings) ──────────────────────────────────


class SettingsOut(BaseModel):
    """GET /me/settings — UserSettings проекция.

    Фронтовый getSettings отдаёт camelCase (keyboardType/fingerHint/...). Сервер
    отдаёт snake_case (соответствует колонкам); фронт-адаптер маппит имена.
    """

    model_config = ConfigDict(from_attributes=True)

    keyboard_type: KeyboardType
    keyboard_layout: KeyboardLayout
    finger_hint: bool
    key_sound: bool
    metronome: bool
    task_zoom: int
    hide_indicator: bool
    preview_off: bool
    time_limit_minutes_per_day: int | None


class SettingsUpdate(BaseModel):
    """PATCH /me/settings — любое подмножество полей."""

    model_config = ConfigDict(extra="forbid")

    keyboard_type: KeyboardType | None = None
    keyboard_layout: KeyboardLayout | None = None
    finger_hint: bool | None = None
    key_sound: bool | None = None
    metronome: bool | None = None
    task_zoom: int | None = Field(default=None, ge=70, le=150)
    hide_indicator: bool | None = None
    preview_off: bool | None = None
    time_limit_minutes_per_day: int | None = Field(default=None, ge=5, le=240)


# ─── Progress (GET/POST /me/progress) ───────────────────────────────────


class ProgressEntry(BaseModel):
    """Значение прогресса одного урока (camelCase — зеркало local-фронта).

    best_time → секунды (число), а не Interval-строка (фронт делит duration_ms
    на 1000 и сравнивает как число).
    """

    stars: int
    bestWPM: int  # noqa: N815 — camelCase намеренно (контракт фронта)
    bestAccuracy: int  # noqa: N815
    bestTime: float  # noqa: N815 — секунды
    completedAt: datetime  # noqa: N815


# GET /me/progress → {tier: {lesson_num(str): ProgressEntry}}
# tier и lesson_num — строковые ключи (JSON object keys). См. расхождение #1.
ProgressMap = dict[str, dict[str, ProgressEntry]]


class AttemptCreate(BaseModel):
    """POST /me/progress body — одна завершённая попытка."""

    tier: str = Field(min_length=1, max_length=20)
    lesson_num: int = Field(gt=0, le=999)
    wpm: int = Field(ge=0)
    accuracy: int = Field(ge=0, le=100)
    duration_ms: int = Field(ge=0)
    errors: int = Field(default=0, ge=0)
    rhythm: int | None = Field(default=None, ge=0, le=100)
    completed_at: datetime | None = None


class NextUnlocked(BaseModel):
    """Следующий разблокированный урок (TSD §3.7)."""

    tier: str
    lesson_num: int


class SaveAttemptResult(BaseModel):
    """POST /me/progress response (TSD §3.7)."""

    progress: ProgressEntry
    newly_earned: list[dict] = Field(default_factory=list)  # ачивки — TODO (клиентские)
    next_unlocked: NextUnlocked | None = None


# ─── History (GET /me/history) ──────────────────────────────────────────


class HistoryItem(BaseModel):
    """Один элемент истории (зеркало local appendHistory)."""

    lesson: int
    tier: str
    completedAt: datetime  # noqa: N815
    duration: float  # noqa: N815 — секунды
    wpm: int
    accuracy: int
    errors: int


class HistoryPage(BaseModel):
    """GET /me/history — cursor-пагинация."""

    items: list[HistoryItem]
    next_cursor: str | None = None
    total: int


# ─── Achievements (GET /me/achievements) ────────────────────────────────


class AchievementOut(BaseModel):
    """Server-computed ачивка (TSD §3.7). Пока сервер отдаёт []."""

    id: str
    label: str
    earned_at: datetime


# ─── Guest migration (POST /auth/migrate-guest) ─────────────────────────


class GuestData(BaseModel):
    """Бандл из guest localStorage. Все части опциональны.

    progress: плоский dict {lesson_num: {stars,bestWPM,bestAccuracy,bestTime,
              completedAt}} ЛИБО сгруппированный {tier: {lesson_num: {...}}}.
              Плоский трактуем под default_tier.
    history:  список HistoryItem-подобных записей (для attempts backfill).
    profile:  опц. поля профиля (заполняем только пустые — не перезаписываем).
    """

    progress: dict | None = None
    history: list[dict] | None = None
    profile: dict | None = None
    default_tier: str = Field(default="tier1", max_length=20)


class MigrateGuestRequest(BaseModel):
    """POST /auth/migrate-guest body."""

    guest_data: GuestData


class MigrateCounts(BaseModel):
    progress: int
    attempts: int


class MigrateGuestResult(BaseModel):
    migrated: bool
    counts: MigrateCounts
