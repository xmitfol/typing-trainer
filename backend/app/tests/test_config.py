"""Тесты на корректность Settings — что бизнес-инварианты из ADR/PRD
действительно зашиты в дефолты.
"""

import pytest
from pydantic import ValidationError

from app.config import Settings


def test_default_business_rules_match_adrs() -> None:
    """Дефолты должны соответствовать зафиксированным решениям."""
    s = Settings(  # type: ignore[call-arg]
        db_password="any",
        jwt_secret_key="x" * 64,
    )
    # PRD Q1
    assert s.free_lesson_limit == 5
    # ADR-001
    assert s.anonymous_ttl_days == 3
    # ADR-003
    assert s.family_max_subaccounts == 4
    # Sane JWT defaults
    assert s.jwt_access_ttl_minutes == 15
    assert s.jwt_refresh_ttl_days == 30


def test_jwt_secret_too_short_rejected() -> None:
    """Короткие JWT-ключи не должны проходить валидацию (защита от слабых ключей)."""
    with pytest.raises(ValidationError):
        Settings(  # type: ignore[call-arg]
            db_password="any",
            jwt_secret_key="x" * 10,  # < 32 chars
        )


def test_db_password_required() -> None:
    """Без db_password — стартовать не должны (явная ошибка лучше тихих defaults)."""
    with pytest.raises(ValidationError):
        Settings(  # type: ignore[call-arg]
            db_password="",
            jwt_secret_key="x" * 64,
        )


def test_database_url_built_correctly() -> None:
    s = Settings(  # type: ignore[call-arg]
        db_host="db.example.com",
        db_port=5432,
        db_name="tt_prod",
        db_user="bob",
        db_password="secret",
        jwt_secret_key="x" * 64,
    )
    url = str(s.database_url)
    assert "postgresql+asyncpg" in url
    assert "bob:secret" in url
    assert "db.example.com:5432/tt_prod" in url


def test_sync_url_for_alembic() -> None:
    s = Settings(  # type: ignore[call-arg]
        db_password="secret",
        jwt_secret_key="x" * 64,
    )
    assert s.database_url_sync.startswith("postgresql://")
    assert "+asyncpg" not in s.database_url_sync  # sync URL для alembic


def test_env_validation() -> None:
    """app_env принимает только 3 значения."""
    with pytest.raises(ValidationError):
        Settings(  # type: ignore[call-arg]
            app_env="production",  # должно быть "prod", не "production"
            db_password="any",
            jwt_secret_key="x" * 64,
        )
