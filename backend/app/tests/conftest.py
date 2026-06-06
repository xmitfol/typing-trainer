"""Общие pytest fixtures.

Sprint 0: минимум — sync TestClient + override settings.
Sprint 1+: добавим async db session через testcontainers (postgres-15-alpine).
"""

from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.deps import settings_dep
from app.main import create_app


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
