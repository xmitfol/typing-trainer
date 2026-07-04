"""Profile / settings / progress / history sync — бизнес-логика /me/* + guest-migration.

Sprint 2/3 sync: «прогресс на сервере, подписку не обойти». Тонкие endpoint'ы
(api/v1/me.py) вызывают эти функции. Транзакции — здесь (commit явный).

Семантика прогресса зеркалит api-client.js local-режим:
  - stars: max(prev, new); best_wpm/best_accuracy: max; best_time: min.
  - star-формула по errors: 0→5, ≤2→4, ≤5→3, ≤10→2, иначе 1.
  - каждый POST — новый Attempt (append-only), Progress — upsert.
"""

from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

import structlog
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AgeDowngradeForbiddenError
from app.models.progress import Attempt, Progress
from app.models.user import User, UserSettings
from app.schemas.me import (
    AchievementOut,
    AttemptCreate,
    GuestData,
    HistoryItem,
    HistoryPage,
    NextUnlocked,
    ProgressEntry,
    SaveAttemptResult,
)

logger = structlog.get_logger(__name__)

# Кап значений по CHECK-constraints (progress/attempts).
WPM_CAP = 1500
ACC_CAP = 100


def _stars_for(errors: int) -> int:
    """Звёзды по числу ошибок — зеркало api-client.js local-семантики."""
    if errors == 0:
        return 5
    if errors <= 2:
        return 4
    if errors <= 5:
        return 3
    if errors <= 10:
        return 2
    return 1


def _interval_to_seconds(td: timedelta) -> float:
    return td.total_seconds()


def _progress_entry(p: Progress) -> ProgressEntry:
    return ProgressEntry(
        stars=p.stars,
        bestWPM=p.best_wpm,
        bestAccuracy=p.best_accuracy,
        bestTime=_interval_to_seconds(p.best_time),
        completedAt=p.completed_at,
    )


# ─── Profile ────────────────────────────────────────────────────────────


async def get_profile(user: User) -> User:
    """Профиль — уже загруженный CurrentUser (без доп. запроса)."""
    return user


async def patch_profile(session: AsyncSession, user: User, patch: dict[str, Any]) -> User:
    """Обновить разрешённые поля профиля.

    email/password здесь НЕ трогаем. audience-downgrade adult→kid запрещён
    (TSD §4a.3). Валидные значения гарантированы Pydantic-enum'ами.
    """
    new_audience = patch.get("audience")
    if new_audience is not None and user.audience == "adult" and new_audience == "kid":
        # TSD §4a.3: нельзя «омолодить» аккаунт.
        raise AgeDowngradeForbiddenError("Нельзя понизить возрастную аудиторию")

    for field in ("name", "audience", "character", "gender", "language"):
        if field in patch:
            setattr(user, field, patch[field])

    await session.commit()
    await session.refresh(user)
    logger.info("me.profile_patched", user_id=str(user.id), fields=list(patch.keys()))
    return user


# ─── Settings ───────────────────────────────────────────────────────────


async def _get_or_create_settings(session: AsyncSession, user_id: UUID) -> UserSettings:
    stmt = select(UserSettings).where(UserSettings.user_id == user_id)
    settings = (await session.execute(stmt)).scalar_one_or_none()
    if settings is None:
        settings = UserSettings(user_id=user_id)
        session.add(settings)
        await session.commit()
        await session.refresh(settings)
    return settings


async def get_settings(session: AsyncSession, user_id: UUID) -> UserSettings:
    return await _get_or_create_settings(session, user_id)


async def patch_settings(
    session: AsyncSession, user_id: UUID, patch: dict[str, Any]
) -> UserSettings:
    """Upsert: создать строку если нет, обновить переданные поля."""
    settings = await _get_or_create_settings(session, user_id)
    for field, value in patch.items():
        setattr(settings, field, value)
    await session.commit()
    await session.refresh(settings)
    logger.info("me.settings_patched", user_id=str(user_id), fields=list(patch.keys()))
    return settings


# ─── Progress ───────────────────────────────────────────────────────────


async def get_progress(session: AsyncSession, user_id: UUID) -> dict[str, dict[str, ProgressEntry]]:
    """Весь прогресс юзера, сгруппированный {tier: {lesson_num: ProgressEntry}}.

    См. расхождение #1 в schemas/me.py — фронт ждёт плоскую форму, адаптер
    надо научить разворачивать по активному тиру.
    """
    stmt = select(Progress).where(Progress.user_id == user_id)
    rows = (await session.execute(stmt)).scalars().all()
    out: dict[str, dict[str, ProgressEntry]] = {}
    for p in rows:
        out.setdefault(p.tier, {})[str(p.lesson_num)] = _progress_entry(p)
    return out


async def _upsert_progress(
    session: AsyncSession,
    user_id: UUID,
    *,
    tier: str,
    lesson_num: int,
    stars: int,
    wpm: int,
    accuracy: int,
    best_time: timedelta,
    completed_at: datetime,
) -> Progress:
    """Max-merge upsert Progress по (user, tier, lesson_num).

    best_wpm/best_accuracy/stars → max; best_time → min. Не ухудшаем существующее.
    """
    wpm = min(WPM_CAP, max(0, wpm))
    accuracy = min(ACC_CAP, max(0, accuracy))

    stmt = select(Progress).where(
        Progress.user_id == user_id,
        Progress.tier == tier,
        Progress.lesson_num == lesson_num,
    )
    prog = (await session.execute(stmt)).scalar_one_or_none()

    if prog is None:
        prog = Progress(
            user_id=user_id,
            tier=tier,
            lesson_num=lesson_num,
            stars=stars,
            best_wpm=wpm,
            best_accuracy=accuracy,
            best_time=best_time,
            completed_at=completed_at,
        )
        session.add(prog)
    else:
        prog.stars = max(prog.stars, stars)
        prog.best_wpm = max(prog.best_wpm, wpm)
        prog.best_accuracy = max(prog.best_accuracy, accuracy)
        if best_time < prog.best_time:
            prog.best_time = best_time
        prog.completed_at = completed_at
    return prog


async def save_attempt(
    session: AsyncSession, user_id: UUID, dto: AttemptCreate
) -> SaveAttemptResult:
    """POST /me/progress — атомарно: upsert Progress (max-merge) + insert Attempt.

    Возвращает {progress, newly_earned:[] (TODO ачивки), next_unlocked}.
    """
    completed_at = dto.completed_at or datetime.now(UTC)
    stars = _stars_for(dto.errors)
    best_time = timedelta(milliseconds=dto.duration_ms)
    wpm = min(WPM_CAP, max(0, dto.wpm))
    accuracy = min(ACC_CAP, max(0, dto.accuracy))

    prog = await _upsert_progress(
        session,
        user_id,
        tier=dto.tier,
        lesson_num=dto.lesson_num,
        stars=stars,
        wpm=wpm,
        accuracy=accuracy,
        best_time=best_time,
        completed_at=completed_at,
    )

    # Append-only Attempt (audit/streaks/analytics).
    attempt = Attempt(
        user_id=user_id,
        tier=dto.tier,
        lesson_num=dto.lesson_num,
        wpm=wpm,
        accuracy=accuracy,
        duration_ms=dto.duration_ms,
        errors=dto.errors,
        rhythm=dto.rhythm,
        created_at=completed_at,
    )
    session.add(attempt)

    await session.commit()
    await session.refresh(prog)

    logger.info(
        "me.attempt_saved",
        user_id=str(user_id),
        tier=dto.tier,
        lesson_num=dto.lesson_num,
        wpm=wpm,
    )

    return SaveAttemptResult(
        progress=_progress_entry(prog),
        newly_earned=[],  # TODO: server-computed achievements (сейчас клиентские)
        next_unlocked=NextUnlocked(tier=dto.tier, lesson_num=dto.lesson_num + 1),
    )


# ─── History ────────────────────────────────────────────────────────────


async def get_history(
    session: AsyncSession, user_id: UUID, *, cursor: str | None, limit: int
) -> HistoryPage:
    """Пагинированная история (DESC by created_at, id-based opaque cursor).

    cursor = id последнего элемента предыдущей страницы (as string). Возвращаем
    записи с id < cursor. next_cursor = id последнего элемента страницы, или None.
    """
    limit = max(1, min(limit, 200))

    total = (
        await session.execute(
            select(func.count()).select_from(Attempt).where(Attempt.user_id == user_id)
        )
    ).scalar_one()

    stmt = select(Attempt).where(Attempt.user_id == user_id)
    if cursor:
        try:
            cursor_id = int(cursor)
            stmt = stmt.where(Attempt.id < cursor_id)
        except ValueError:
            pass  # битый cursor — игнорируем, отдаём с начала
    stmt = stmt.order_by(Attempt.id.desc()).limit(limit + 1)

    rows = list((await session.execute(stmt)).scalars().all())
    has_more = len(rows) > limit
    page = rows[:limit]

    items = [
        HistoryItem(
            lesson=a.lesson_num,
            tier=a.tier,
            completedAt=a.created_at,
            duration=a.duration_ms / 1000,
            wpm=a.wpm,
            accuracy=a.accuracy,
            errors=a.errors,
        )
        for a in page
    ]
    next_cursor = str(page[-1].id) if has_more and page else None
    return HistoryPage(items=items, next_cursor=next_cursor, total=total)


# ─── Achievements ───────────────────────────────────────────────────────


async def get_achievements(session: AsyncSession, user_id: UUID) -> list[AchievementOut]:
    """Server-computed ачивки. Пока клиентские (achievements.js) → []."""
    return []  # TODO: server-side achievement engine


# ─── Guest migration ────────────────────────────────────────────────────


def _normalize_progress_bundle(progress: dict[str, Any], default_tier: str) -> list[dict[str, Any]]:
    """Разворачивает guest progress в список записей {tier, lesson_num, entry}.

    Поддерживает обе формы:
      - плоская {lesson_num: {...}}  → tier = default_tier
      - сгруппированная {tier: {lesson_num: {...}}}
    Определяем по типу значений: если значение — dict с ключами прогресса
    (stars/bestWPM/...) → плоская; если dict из dict'ов → сгруппированная.
    """
    records: list[dict[str, Any]] = []
    if not progress:
        return records

    def _is_entry(v: object) -> bool:
        return isinstance(v, dict) and any(
            k in v for k in ("stars", "bestWPM", "bestAccuracy", "bestTime", "completedAt")
        )

    grouped = all(isinstance(v, dict) and not _is_entry(v) for v in progress.values())

    if grouped:
        for tier, lessons in progress.items():
            if not isinstance(lessons, dict):
                continue
            for lesson_num, entry in lessons.items():
                if _is_entry(entry):
                    records.append({"tier": tier, "lesson_num": lesson_num, "entry": entry})
    else:
        for lesson_num, entry in progress.items():
            if _is_entry(entry):
                records.append({"tier": default_tier, "lesson_num": lesson_num, "entry": entry})
    return records


async def migrate_guest(
    session: AsyncSession, user: User, guest_data: GuestData
) -> tuple[int, int]:
    """Залить guest localStorage-прогресс в аккаунт (ADR-007/R-005).

    Идемпотентно по прогрессу (max-merge не задваивает). Attempts из history —
    append-audit; чтобы повторный вызов не задваивал, вставляем только history-
    записи, которых ещё нет (matched by tier+lesson+created_at).

    Возвращает (progress_count, attempts_count) — сколько upsert'нуто/вставлено.
    """
    progress_count = 0
    attempts_count = 0
    default_tier = getattr(guest_data, "default_tier", "tier1")

    # 1. Progress — max-merge upsert.
    records = _normalize_progress_bundle(guest_data.progress or {}, default_tier)
    for rec in records:
        entry = rec["entry"]
        try:
            lesson_num = int(rec["lesson_num"])
        except (ValueError, TypeError):
            continue
        if lesson_num <= 0:
            continue
        best_time_sec = float(entry.get("bestTime") or 0)
        completed_at = _parse_dt(entry.get("completedAt"))
        await _upsert_progress(
            session,
            user.id,
            tier=rec["tier"],
            lesson_num=lesson_num,
            stars=int(entry.get("stars") or 0),
            wpm=int(entry.get("bestWPM") or 0),
            accuracy=int(entry.get("bestAccuracy") or 0),
            best_time=timedelta(seconds=best_time_sec),
            completed_at=completed_at,
        )
        progress_count += 1

    # 2. History → Attempts (append, dedupe by tier+lesson+created_at).
    for h in guest_data.history or []:
        if not isinstance(h, dict):
            continue
        raw_lesson = h.get("lesson") or h.get("lesson_num")
        if raw_lesson is None:
            continue
        try:
            lesson_num = int(raw_lesson)
        except (ValueError, TypeError):
            continue
        tier = h.get("tier") or default_tier
        created_at = _parse_dt(h.get("completedAt") or h.get("completed_at"))
        duration_sec = float(h.get("duration") or 0)
        duration_ms = h.get("duration_ms")
        duration_ms = int(duration_ms) if duration_ms is not None else int(duration_sec * 1000)

        # Dedupe: не льём если уже есть attempt с тем же tier+lesson+created_at.
        exists = (
            await session.execute(
                select(Attempt.id)
                .where(
                    Attempt.user_id == user.id,
                    Attempt.tier == tier,
                    Attempt.lesson_num == lesson_num,
                    Attempt.created_at == created_at,
                )
                .limit(1)
            )
        ).first()
        if exists:
            continue

        session.add(
            Attempt(
                user_id=user.id,
                tier=tier,
                lesson_num=lesson_num,
                wpm=min(WPM_CAP, max(0, int(h.get("wpm") or 0))),
                accuracy=min(ACC_CAP, max(0, int(h.get("accuracy") or 0))),
                duration_ms=max(0, duration_ms),
                errors=int(h.get("errors") or 0),
                rhythm=h.get("rhythm"),
                created_at=created_at,
            )
        )
        attempts_count += 1

    # 3. Профиль — заполняем только пустые поля (не перезаписываем существующее).
    prof = guest_data.profile or {}
    # Только gender может быть пуст у существующего юзера (остальные NOT NULL
    # и заданы при signup). Осторожно, чтобы не сломать CHECK.
    if isinstance(prof, dict) and user.gender is None and prof.get("gender") in ("m", "f"):
        user.gender = prof["gender"]

    await session.commit()
    logger.info(
        "me.guest_migrated",
        user_id=str(user.id),
        progress=progress_count,
        attempts=attempts_count,
    )
    return progress_count, attempts_count


def _parse_dt(value: object) -> datetime:
    """ISO-строка → aware datetime (UTC). None/битое → now(UTC)."""
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=UTC)
    if isinstance(value, str) and value:
        try:
            dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
            return dt if dt.tzinfo else dt.replace(tzinfo=UTC)
        except ValueError:
            pass
    return datetime.now(UTC)
