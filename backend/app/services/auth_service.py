"""Auth business logic (Sprint 1, S1.4-S1.6).

Тонкие endpoint'ы вызывают эти функции. Транзакции — здесь (commit явный).
HTTP-кодов тут нет: при ошибке кидаем DomainError, api/ мапит на статус.
"""

import structlog
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import EmailTakenError
from app.core.security import hash_password
from app.models.user import User, UserSettings
from app.schemas.auth import SignupRequest

logger = structlog.get_logger(__name__)


async def _email_exists(session: AsyncSession, email: str) -> bool:
    """Есть ли активный (не soft-deleted) юзер с таким email. CITEXT → case-insensitive."""
    stmt = select(User.id).where(User.email == email, User.deleted_at.is_(None)).limit(1)
    return (await session.execute(stmt)).first() is not None


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
