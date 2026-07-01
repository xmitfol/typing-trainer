"""SQLAlchemy async engine + session factory (Sprint 1, S1.0 wiring).

Один engine на процесс (pool из config). Сессии — per-request через
`deps.db_session()`. Engine создаётся лениво и закрывается в lifespan
shutdown (`dispose_engine`).
"""

from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import get_settings

_engine: AsyncEngine | None = None
_sessionmaker: async_sessionmaker[AsyncSession] | None = None


def get_engine() -> AsyncEngine:
    """Singleton async engine. Создаётся при первом обращении."""
    global _engine
    if _engine is None:
        settings = get_settings()
        _engine = create_async_engine(
            str(settings.database_url),
            pool_size=settings.db_pool_size,
            max_overflow=settings.db_max_overflow,
            pool_pre_ping=True,  # отсекаем «протухшие» коннекты до запроса
            echo=settings.app_debug,
        )
    return _engine


def get_sessionmaker() -> async_sessionmaker[AsyncSession]:
    """Singleton session factory."""
    global _sessionmaker
    if _sessionmaker is None:
        _sessionmaker = async_sessionmaker(
            bind=get_engine(),
            expire_on_commit=False,  # объекты остаются usable после commit
            autoflush=False,
        )
    return _sessionmaker


async def get_session() -> AsyncIterator[AsyncSession]:
    """Per-request сессия. Commit — явный в сервисах; rollback при исключении."""
    factory = get_sessionmaker()
    async with factory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise


async def dispose_engine() -> None:
    """Закрыть пул коннектов (lifespan shutdown)."""
    global _engine, _sessionmaker
    if _engine is not None:
        await _engine.dispose()
        _engine = None
        _sessionmaker = None
