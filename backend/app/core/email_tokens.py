"""Одноразовые email-токены (S1.8): подтверждение email + сброс пароля.

Случайный непредсказуемый токен (`secrets.token_urlsafe`) хранится в Redis
`<prefix><token> → user_id` с TTL. Потребление — атомарный GETDEL: токен
действует ровно один раз. JWT здесь не используем намеренно — нужна
серверная инвалидация (одноразовость), а не stateless-проверка.
"""

import secrets
from uuid import UUID

VERIFY_PREFIX = "email_verify:"
RESET_PREFIX = "pwd_reset:"

VERIFY_TTL_SECONDS = 24 * 3600  # 24 ч
RESET_TTL_SECONDS = 3600  # 1 ч


async def issue_token(redis, prefix: str, user_id: UUID, ttl: int) -> str:
    """Сгенерировать и сохранить одноразовый токен, вернуть его."""
    token = secrets.token_urlsafe(32)
    await redis.set(f"{prefix}{token}", str(user_id), ex=ttl)
    return token


async def consume_token(redis, prefix: str, token: str | None) -> UUID | None:
    """Извлечь и инвалидировать токен (GETDEL). None если нет/истёк/использован."""
    if not token:
        return None
    raw = await redis.getdel(f"{prefix}{token}")
    if raw is None:
        return None
    try:
        return UUID(raw)
    except (ValueError, TypeError):
        return None
