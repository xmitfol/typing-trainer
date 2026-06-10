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


async def _find_active_by_email(session: AsyncSession, email: str) -> User | None:
    """Активный (не soft-deleted) юзер по email или None."""
    stmt = select(User).where(User.email == email, User.deleted_at.is_(None)).limit(1)
    return (await session.execute(stmt)).scalar_one_or_none()


async def get_active_user(session: AsyncSession, user_id: UUID) -> User | None:
    """Активный юзер по id или None (для refresh — проверить, что не удалён)."""
    stmt = select(User).where(User.id == user_id, User.deleted_at.is_(None)).limit(1)
    return (await session.execute(stmt)).scalar_one_or_none()


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
    user = await _find_active_by_email(session, email)
    has_password = bool(user and user.password_hash)
    target_hash = user.password_hash if has_password else get_dummy_hash()

    ok = verify_password(password, target_hash)  # type: ignore[arg-type]
    if not (has_password and ok):
        logger.info("signin.invalid", email=email)
        raise InvalidCredentialsError()

    assert user is not None and user.password_hash is not None  # для mypy после has_password
    # Прозрачный re-hash при усилении Argon2-параметров (security spec §1)
    if needs_rehash(user.password_hash):
        user.password_hash = hash_password(password)
        await session.commit()
        logger.info("signin.password_rehash", user_id=str(user.id))

    logger.info("signin.ok", user_id=str(user.id))
    return user
