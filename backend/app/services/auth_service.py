"""Auth business logic (Sprint 1, S1.4-S1.6).

Тонкие endpoint'ы вызывают эти функции. Транзакции — здесь (commit явный).
HTTP-кодов тут нет: при ошибке кидаем DomainError, api/ мапит на статус.
"""

from uuid import UUID

import structlog
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import EmailTakenError, InvalidCredentialsError
from app.core.security import (
    get_dummy_hash,
    hash_password,
    needs_rehash,
    verify_password,
)
from app.models.user import User, UserSettings
from app.schemas.auth import SignupRequest

logger = structlog.get_logger(__name__)


async def _email_exists(session: AsyncSession, email: str) -> bool:
    """Есть ли активный (не soft-deleted) юзер с таким email. CITEXT → case-insensitive."""
    stmt = select(User.id).where(User.email == email, User.deleted_at.is_(None)).limit(1)
    return (await session.execute(stmt)).first() is not None


async def find_active_by_email(session: AsyncSession, email: str) -> User | None:
    """Активный (не soft-deleted) юзер по email или None."""
    stmt = select(User).where(User.email == email, User.deleted_at.is_(None)).limit(1)
    return (await session.execute(stmt)).scalar_one_or_none()


async def get_active_user(session: AsyncSession, user_id: UUID) -> User | None:
    """Активный юзер по id или None (для refresh — проверить, что не удалён)."""
    stmt = select(User).where(User.id == user_id, User.deleted_at.is_(None)).limit(1)
    return (await session.execute(stmt)).scalar_one_or_none()


async def mark_email_verified(session: AsyncSession, user_id: UUID) -> None:
    """Пометить email подтверждённым (S1.8 verify-email). Идемпотентно."""
    user = await get_active_user(session, user_id)
    if user is None:
        return
    if not user.email_verified:
        user.email_verified = True
        await session.commit()
        logger.info("email.verified", user_id=str(user_id))


async def set_password(session: AsyncSession, user_id: UUID, new_password: str) -> None:
    """Установить новый пароль (S1.8 reset). Хеширует Argon2id."""
    user = await get_active_user(session, user_id)
    if user is None:
        return
    user.password_hash = hash_password(new_password)
    await session.commit()
    logger.info("password.reset", user_id=str(user_id))


async def signup(session: AsyncSession, dto: SignupRequest) -> User:
    """Создать пользователя + авто-создать user_settings (одна транзакция).

    Raises:
        EmailTakenError: email уже занят (явная проверка + защита от гонки
            через unique partial index ix_users_email_active).
    """
    if await _email_exists(session, dto.email):
        raise EmailTakenError()

    user = User(
        email=dto.email,
        password_hash=hash_password(dto.password),
        name=dto.name,
        audience=dto.audience,
        character=dto.character,
        gender=dto.gender,
        language=dto.language,
        email_verified=False,
        is_anonymous=False,
    )
    # cascade="all, delete-orphan" → settings персистится вместе с user
    user.settings = UserSettings()
    session.add(user)

    try:
        await session.commit()
    except IntegrityError:
        # Гонка: между _email_exists и commit кто-то занял email.
        await session.rollback()
        logger.info("signup.race_email_taken", email=dto.email)
        raise EmailTakenError() from None

    await session.refresh(user)
    logger.info("signup.created", user_id=str(user.id), audience=user.audience)
    return user


async def signin(session: AsyncSession, email: str, password: str) -> User:
    """Проверить учётные данные. Возвращает User или кидает InvalidCredentialsError.

    Anti-timing (security spec §1): hash считается ВСЕГДА — и для
    несуществующего email (dummy-hash), и для OAuth-юзера без пароля, —
    чтобы время ответа не выдавало существование аккаунта. Один и тот же
    error для всех веток.
    """
    user = await find_active_by_email(session, email)
    # stored_hash: None/"" — нет юзера или OAuth-юзер без пароля → dummy-hash.
    # Гард видим mypy: после raise ниже user — User, stored_hash — непустой str.
    stored_hash = user.password_hash if user is not None else None
    target_hash = stored_hash if stored_hash else get_dummy_hash()

    ok = verify_password(password, target_hash)
    if user is None or not stored_hash or not ok:
        logger.info("signin.invalid", email=email)
        raise InvalidCredentialsError()

    # Прозрачный re-hash при усилении Argon2-параметров (security spec §1)
    if needs_rehash(stored_hash):
        user.password_hash = hash_password(password)
        await session.commit()
        logger.info("signin.password_rehash", user_id=str(user.id))

    logger.info("signin.ok", user_id=str(user.id))
    return user
