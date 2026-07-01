"""Redis async client (Sprint 1, S1.0 wiring).

Один пул на процесс. Используется captcha replay-guard'ом (ADR-006) и
rate-limit'ом (slowapi). Закрывается в lifespan shutdown.
"""

from redis.asyncio import Redis

from app.config import get_settings

_redis: Redis | None = None


def get_redis() -> Redis:
    """Singleton async Redis-клиент (decode_responses=True → строки, не bytes)."""
    global _redis
    if _redis is None:
        settings = get_settings()
        _redis = Redis.from_url(
            str(settings.redis_url),
            decode_responses=True,
            socket_connect_timeout=5,
            health_check_interval=30,
        )
    return _redis


async def close_redis() -> None:
    """Закрыть пул (lifespan shutdown)."""
    global _redis
    if _redis is not None:
        await _redis.aclose()
        _redis = None
