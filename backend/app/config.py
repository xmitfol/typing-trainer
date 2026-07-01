"""Application config.

Все настройки через env vars (pydantic-settings). На старте контейнера
переменные читаются один раз; для смены — рестарт. Принципиально:
никаких defaults для secrets (JWT, DB password, OAuth secrets) — упадём
с понятной ошибкой если не задано.

По T2 (TSD §10): env vars в v1.0, Yandex Lockbox в v1.1.
"""

from functools import lru_cache
from typing import Literal

from pydantic import Field, PostgresDsn, RedisDsn, SecretStr, computed_field
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

    # ─── Email ─────────────────────────────────────────────────────
    # PO-решение 2026-06-11: реальная Y360-интеграция отложена. На dev —
    # mailhog (SMTP localhost:1025, web UI :8025, без TLS/creds). Prod-креды
    # Y360 (noreply@typing-trainer.ru) подставляются позже (Sprint 1 day 4+).
    smtp_host: str = "localhost"   # dev: mailhog | prod: smtp.yandex.ru
    smtp_port: int = 1025          # dev: mailhog | prod: 465
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_use_tls: bool = False     # dev: mailhog (no TLS) | prod: True
    smtp_from: str = "typing-trainer <noreply@typing-trainer.ru>"
    # Базовый URL фронта — для ссылок в письмах (verify-email / reset).
    frontend_base_url: str = "http://localhost:8001"

    # ─── OAuth (Sprint 2) ──────────────────────────────────────────
    yandex_oauth_client_id: str = ""
    yandex_oauth_client_secret: str = ""
    vk_oauth_client_id: str = ""
    vk_oauth_client_secret: str = ""

    # ─── Billing (ADR-008 — provider-agnostic) ─────────────────────
    # Провайдер выбирается конфигом: 'stub' (дев/тест/CI, без реальных денег)
    # или 'yookassa' (prod, когда PO подтвердит shop). Бизнес-логика от выбора
    # не зависит — фабрика get_payment_provider(settings) отдаёт нужный класс.
    billing_provider: Literal["stub", "yookassa"] = "stub"
    billing_currency: str = "RUB"
    # Paywall: сколько первых уроков КАЖДОГО тира доступны без подписки.
    # Серверный gate /lessons/{tier}/{n}/access опирается на это + has_active_subscription.
    # Совпадает с фронтовым FREE_LIMIT в api-client.js (local fallback).
    free_lesson_limit: int = 5

    # ─── YooKassa (Sprint 6, ADR-005/ADR-008) ──────────────────────
    # None-defaults: без реального shop поля не заданы; YooKassaProvider —
    # скелет с TODO, включается только при billing_provider='yookassa'.
    yookassa_shop_id: str | None = None
    yookassa_secret_key: SecretStr | None = None
    yookassa_webhook_secret: SecretStr | None = None
    yookassa_test_mode: bool = True

    # ─── Self-hosted anti-bot (Sprint 1, R-007 mitigation, ADR-006) ─
    captcha_pow_difficulty: int = 18           # ведущих нулевых бит; 18≈0.1-0.5s в браузере
    captcha_challenge_ttl_seconds: int = 600   # время жизни PoW-challenge
    captcha_honeypot_field: str = "nickname2"  # имя скрытого поля формы
    # HMAC-подпись challenge переиспользует jwt_secret_key (отдельный секрет не вводим)

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
