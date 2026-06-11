"""Общие pytest fixtures.

Sprint 0: минимум — sync TestClient + override settings.
Sprint 1 (B1-001): async DB-стек через testcontainers (postgres:16-alpine):
  - поднимаем реальный Postgres в контейнере,
  - прогоняем alembic `upgrade head` (CITEXT + pgcrypto + partial unique index),
  - отдаём async engine/session + override FastAPI-зависимостей.
Sprint-0 sync-фикстуры (`test_settings`/`client`) остаются нетронутыми —
они не требуют БД и используются captcha-gate / валидационными тестами.
"""

import os
from collections.abc import AsyncIterator, Iterator

import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.deps import settings_dep
from app.main import create_app

# ─────────────────────────────────────────────────────────────────────────
#  Доступность Docker / testcontainers. Если их нет — DB-фикстуры скипаются
#  целиком (через skipif на тесте; см. db_skip ниже), а Sprint-0 sync-тесты
#  продолжают работать как раньше.
# ─────────────────────────────────────────────────────────────────────────
try:
    import sqlalchemy  # noqa: F401
    from testcontainers.postgres import PostgresContainer  # noqa: F401

    _HAS_TC = True
except ImportError:  # pragma: no cover - окружение без dev-deps
    _HAS_TC = False


def _docker_available() -> bool:
    """Есть ли рабочий Docker-демон (testcontainers без него бесполезен)."""
    if not _HAS_TC:
        return False
    import shutil
    import subprocess

    if shutil.which("docker") is None:
        return False
    try:
        return (
            subprocess.run(
                ["docker", "info"],
                capture_output=True,
                timeout=5,
            ).returncode
            == 0
        )
    except (OSError, subprocess.SubprocessError):  # pragma: no cover
        return False


#: Маркер для integration-тестов, которым нужен живой Postgres.
#: test_auth.py должен заменить свой локальный `requires_db` (skipif на
#: TEST_DATABASE_URL) на импорт этого маркера:
#:     from app.tests.conftest import requires_db
#: Тогда тесты включаются автоматически, когда доступен Docker, — отдельная
#: env-переменная не нужна.
requires_db = pytest.mark.skipif(
    not _docker_available(),
    reason="нужен Docker для testcontainers Postgres (CITEXT/partial index)",
)


# ─────────────────────────────────────────────────────────────────────────
#  Sprint-0 sync-фикстуры (без БД) — НЕ ТРОГАЕМ.
# ─────────────────────────────────────────────────────────────────────────
@pytest.fixture
def test_settings() -> Settings:
    """Settings с безопасными dev-defaults — не дёргаем .env / окружение."""
    return Settings(  # type: ignore[call-arg]
        app_env="dev",
        app_debug=True,
        db_password="test-only-not-used",
        jwt_secret_key="x" * 64,  # 64 chars — проходит min_length
    )


@pytest.fixture
def client(test_settings: Settings) -> Iterator[TestClient]:
    """TestClient с override'нутыми settings."""
    app = create_app()
    app.dependency_overrides[settings_dep] = lambda: test_settings
    try:
        with TestClient(app) as c:
            yield c
    finally:
        app.dependency_overrides.clear()


# ─────────────────────────────────────────────────────────────────────────
#  Sprint-1 async DB-стек (B1-001). Все фикстуры ниже зависят от Docker;
#  применяй их только в тестах, помеченных `@requires_db`.
# ─────────────────────────────────────────────────────────────────────────
@pytest.fixture(scope="session")
def postgres_container():  # type: ignore[no-untyped-def]
    """Поднимает postgres:16-alpine на всю сессию (дорого — переиспользуем).

    Не запускается, если Docker недоступен — тесты с @requires_db уже
    заскипаны, а фикстуру для них pytest не инстанцирует.
    """
    from testcontainers.postgres import PostgresContainer

    with PostgresContainer(
        "postgres:16-alpine",
        username="tt_user",
        password="test-pw",
        dbname="typing_trainer_test",
    ) as pg:
        yield pg


@pytest.fixture(scope="session")
def _migrated_db(postgres_container) -> Iterator[dict[str, str]]:  # type: ignore[no-untyped-def]
    """Выставляет DB-env на контейнер, сбрасывает кэш settings и гоняет alembic.

    Миграция сама делает `CREATE EXTENSION citext / pgcrypto` (см.
    versions/202606071800_initial_schema.py), поэтому отдельный bootstrap
    extension'ов здесь не нужен — нужен лишь суперюзер (в testcontainers
    Postgres дефолтный пользователь им является).
    """
    from app.config import get_settings

    host = postgres_container.get_container_host_ip()
    port = postgres_container.get_exposed_port(5432)

    # Прокидываем coordinates контейнера в окружение — config.Settings и
    # alembic env.py читают именно эти переменные.
    prev_env = {
        k: os.environ.get(k)
        for k in (
            "DB_HOST",
            "DB_PORT",
            "DB_NAME",
            "DB_USER",
            "DB_PASSWORD",
            "JWT_SECRET_KEY",
            "TEST_DATABASE_URL",
        )
    }
    os.environ.update(
        {
            "DB_HOST": str(host),
            "DB_PORT": str(port),
            "DB_NAME": "typing_trainer_test",
            "DB_USER": "tt_user",
            "DB_PASSWORD": "test-pw",
            "JWT_SECRET_KEY": "x" * 64,
        }
    )
    # Для обратной совместимости со старым skipif-маркером в test_auth.py.
    os.environ["TEST_DATABASE_URL"] = (
        f"postgresql+asyncpg://tt_user:test-pw@{host}:{port}/typing_trainer_test"
    )

    # Settings кэшируется через lru_cache — сбрасываем, чтобы подхватить env.
    get_settings.cache_clear()

    # alembic upgrade head (sync engine — alembic не умеет async; URL берётся
    # из app.config внутри alembic/env.py).
    from pathlib import Path

    from alembic import command
    from alembic.config import Config

    backend_root = Path(__file__).resolve().parents[2]  # .../backend
    alembic_cfg = Config(str(backend_root / "alembic.ini"))
    alembic_cfg.set_main_option("script_location", str(backend_root / "alembic"))
    command.upgrade(alembic_cfg, "head")

    try:
        yield {"host": str(host), "port": str(port)}
    finally:
        # Откатываем env и кэш settings, чтобы не протекало в другие тесты.
        for k, v in prev_env.items():
            if v is None:
                os.environ.pop(k, None)
            else:
                os.environ[k] = v
        get_settings.cache_clear()


@pytest.fixture
async def db_engine(_migrated_db):  # type: ignore[no-untyped-def]
    """Async engine на тестовый контейнер. NullPool — без удержания коннектов."""
    from sqlalchemy.ext.asyncio import create_async_engine
    from sqlalchemy.pool import NullPool

    from app.config import get_settings

    engine = create_async_engine(
        str(get_settings().database_url),
        poolclass=NullPool,
    )
    try:
        yield engine
    finally:
        await engine.dispose()


@pytest.fixture
async def db_session_fixture(db_engine) -> AsyncIterator["AsyncSession"]:  # type: ignore[no-untyped-def,name-defined] # noqa: F821
    """Изолированная сессия per-test: всё в транзакции, откатывается в конце.

    Откат вместо TRUNCATE — между тестами БД остаётся чистой, миграцию
    гоняем один раз на сессию.
    """
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

    connection = await db_engine.connect()
    trans = await connection.begin()
    maker = async_sessionmaker(bind=connection, expire_on_commit=False, autoflush=False)
    session = maker()
    try:
        yield session
    finally:
        await session.close()
        await trans.rollback()
        await connection.close()


@pytest.fixture
async def redis_fake():  # type: ignore[no-untyped-def]
    """Лёгкий in-memory async-Redis для DB-тестов (тот же контракт, что в test_auth).

    Реальный Redis в integration-тестах auth не нужен (используется только
    captcha replay-guard + signin fail-counter) — мокаем, чтобы не плодить
    ещё один контейнер.
    """

    class _FakeRedis:
        def __init__(self) -> None:
            self.store: dict[str, str] = {}

        async def set(self, key, val, nx=False, ex=None):  # noqa: A002
            if nx and key in self.store:
                return None
            self.store[key] = str(val)
            return True

        async def get(self, key):
            return self.store.get(key)

        async def incr(self, key):
            new = int(self.store.get(key, "0")) + 1
            self.store[key] = str(new)
            return new

        async def expire(self, key, ttl):
            return True

        async def delete(self, key):
            self.store.pop(key, None)
            return True

    return _FakeRedis()


@pytest.fixture
def db_client(  # type: ignore[no-untyped-def]
    db_session_fixture, redis_fake
) -> Iterator[TestClient]:
    """TestClient для integration-тестов: db_session/redis_client → реальный
    Postgres-сеанс + fake Redis. settings берёт env (выставлены _migrated_db),
    captcha-difficulty снижаем для быстрого PoW-solve.

    Использование в test_auth.py (happy-path/duplicate/refresh):
        def test_signup_happy_path_201(db_client):
            r = db_client.post("/api/v1/auth/signup", json=...)
            assert r.status_code == 201
    """
    from app.deps import db_session, redis_client

    app = create_app()
    app.dependency_overrides[db_session] = lambda: db_session_fixture
    app.dependency_overrides[redis_client] = lambda: redis_fake
    try:
        with TestClient(app) as c:
            yield c
    finally:
        app.dependency_overrides.clear()
