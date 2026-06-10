"""Application config.

Все настройки через env vars (pydantic-settings). На старте контейнера
переменные читаются один раз; для смены — рестарт. Принципиально:
никаких defaults для secrets (JWT, DB password, OAuth secrets) — упадём
с понятной ошибкой если не задано.

По T2 (TSD §10): env vars в v1.0, Yandex Lockbox в v1.1.
"""

from functools import lru_cache
from typing import Literal

from pydantic import Field, PostgresDsn, RedisDsn, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Корневой settings-объект. Подгружается из .env + env vars."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",  # лишние env vars не ломают старт
    )

    # ─── App ───────────────────────────────────────────────────────
    app_name: str = "typing-trainer"
    app_env: Literal["dev", "staging", "prod"] = "dev"
    app_debug: bool = False
    app_log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"
    app_version: str = "0.1.0"

    # ─── HTTP ──────────────────────────────────────────────────────
    http_host: str = "0.0.0.0"
    http_port: int = 8000
    http_cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:8001"])

    # ─── PostgreSQL ────────────────────────────────────────────────
    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "typing_trainer"
    db_user: str = "tt_user"
    db_password: str = Field(min_length=1)  # обязательно
    db_pool_size: int = 10
    db_max_overflow: int = 20

    @computed_field  # type: ignore[prop-decorator]
    @property
    def database_url(self) -> PostgresDsn:
        """SQLAlchemy async URL."""
        return PostgresDsn.build(  # type: ignore[return-value]
            scheme="postgresql+asyncpg",
            username=self.db_user,
            password=self.db_password,
            host=self.db_host,
            port=self.db_port,
            path=self.db_name,
        )

    @computed_field  # type: ignore[prop-decorator]
    @property
    def database_url_sync(self) -> str:
        """Sync URL — нужен alembic."""
        return (
            f"postgresql://{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )

    # ─── Redis ─────────────────────────────────────────────────────
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_db: int = 0
    redis_password: str | None = None

    @computed_field  # type: ignore[prop-decorator]
    @property
    def redis_url(self) -> RedisDsn:
        return RedisDsn.build(  # type: ignore[return-value]
            scheme="redis",
            password=self.redis_password,
            host=self.redis_host,
            port=self.redis_port,
            path=str(self.redis_db),
        )

    # ─── Security / JWT ────────────────────────────────────────────
    jwt_secret_key: str = Field(min_length=32)  # обязательно ≥ 32 chars
    jwt_access_ttl_minutes: int = 15
    jwt_refresh_ttl_days: int = 30
    jwt_algorithm: str = "HS256"
    cookie_domain: str = "localhost"
    cookie_secure: bool = False

    # ─── Email (Yandex 360 SMTP) ───────────────────────────────────
    smtp_host: str = "smtp.yandex.ru"
    smtp_port: int = 465
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_use_tls: bool = True
    smtp_from: str = "typing-trainer <noreply@typing-trainer.ru>"

    # ─── OAuth (Sprint 2) ──────────────────────────────────────────
    yandex_oauth_client_id: str = ""
    yandex_oauth_client_secret: str = ""
    vk_oauth_client_id: str = ""
    vk_oauth_client_secret: str = ""

    # ─── YooKassa (Sprint 6) ───────────────────────────────────────
    yookassa_shop_id: str = ""
    yookassa_secret_key: str = ""
    yookassa_webhook_secret: str = ""
    yookassa_test_mode: bool = True

    # ─── Yandex SmartCaptcha (Sprint 1, R-007 mitigation) ──────────
    yandex_captcha_site_key: str = ""        # frontend, public
    yandex_captcha_server_key: str = ""      # backend, secret
    yandex_captcha_fallback_mode: str = "fail-closed"  # 'fail-closed' | 'fail-open'

    # ─── Business rules (фиксированные ADR/PRD) ────────────────────
    free_lesson_limit: int = 5            # PRD Q1
    anonymous_ttl_days: int = 3           # ADR-001
    family_max_subaccounts: int = 4       # ADR-003

    # ─── Rate limits ───────────────────────────────────────────────
    rate_limit_signup_per_hour: int = 3
    rate_limit_signin_per_minute: int = 5
    rate_limit_progress_per_minute: int = 60


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Singleton-доступ к настройкам (читается один раз на процесс)."""
    return Settings()  # type: ignore[call-arg]
