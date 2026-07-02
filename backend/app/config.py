"""Application config.

Все настройки через env vars (pydantic-settings). На старте контейнера
переменные читаются один раз; для смены — рестарт. Принципиально:
никаких defaults для secrets (JWT, DB password, OAuth secrets) — упадём
с понятной ошибкой если не задано.

По T2 (TSD §10): env vars в v1.0, Yandex Lockbox в v1.1.
"""

from functools import lru_cache
from typing import Literal

from pydantic import Field, PostgresDsn, RedisDsn, SecretStr, computed_field, model_validator
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

    # ─── OAuth (Sprint 2, ADR-007) ─────────────────────────────────
    yandex_oauth_client_id: str = ""
    yandex_oauth_client_secret: str = ""
    vk_oauth_client_id: str = ""
    vk_oauth_client_secret: str = ""
    # Если провайдерские креды пустые и флаг True (dev/CI) — фабрика отдаёт
    # MockStrategy (весь flow без регистрации приложений). В prod ставим False
    # → пустые креды = fail-fast (как get_payment_provider). Аналог billing stub.
    oauth_allow_mock: bool = True

    # ─── Billing (ADR-008 — provider-agnostic) ─────────────────────
    # Провайдер выбирается конфигом: 'stub' (дев/тест/CI, без реальных денег)
    # или 'yookassa' (prod, когда PO подтвердит shop). Бизнес-логика от выбора
    # не зависит — фабрика get_payment_provider(settings) отдаёт нужный класс.
    billing_provider: Literal["stub", "yookassa"] = "stub"
    billing_currency: str = "RUB"

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
    rate_limit_events_per_minute: int = 120   # Ф3-1: /events/batch анти-флуд (на session/ip)
    # F2-SEC: мутирующие /admin/* (refund/grant/cancel/block/restore/reset/verify)
    # лимитируются per-actor (скомпрометированный админ не крутит в цикле).
    rate_limit_admin_mutations_per_minute: int = 30

    # ─── Admin analytics (Ф3-5) ────────────────────────────────────
    analytics_cache_ttl_seconds: int = 600    # TTL Redis-кэша тяжёлых агрегатов (10 мин)

    # ─── Admin 2FA (Ф4b — TOTP для superadmin) ──────────────────────
    # require_superadmin_2fa: когда True (prod) — superadmin БЕЗ включённой 2FA
    # не проходит /admin/reauth (403 TOTP_ENROLLMENT_REQUIRED), т.е. деньги/роли/
    # имперсонация недоступны до enrollment. В dev (False) — 2FA опциональна.
    require_superadmin_2fa: bool = False
    # totp_encryption_key: Fernet-ключ (base64, 32 байта) для шифрования TOTP-
    # секрета at-rest. Если None (dev) — деривируем из jwt_secret_key через
    # HKDF-SHA256 (см. core/totp.py). PROD ДОЛЖЕН задать явный ключ (ротация без
    # смены jwt_secret_key + отдельный компромат-контур). Ф4-SEC.
    totp_encryption_key: SecretStr | None = None

    @model_validator(mode="after")
    def _require_totp_key_in_prod(self) -> "Settings":
        """Fail-fast (Ф4-SEC MED-2): в prod totp_encryption_key ОБЯЗАТЕЛЕН.

        Без явного ключа core/totp.py деривирует Fernet-ключ из jwt_secret_key
        (HKDF) — тогда ротация jwt_secret_key локаутит всех с включённой 2FA
        (secret at-rest перестаёт расшифровываться). В prod это недопустимо, в
        dev/staging HKDF-fallback остаётся (не ломаем стенд).
        """
        if self.app_env == "prod" and self.totp_encryption_key is None:
            raise ValueError(
                "totp_encryption_key обязателен при app_env=prod "
                "(base64-urlsafe Fernet-ключ, 32 байта). Без него TOTP-секрет "
                "деривируется из jwt_secret_key и ротация JWT локаутит 2FA."
            )
        return self


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Singleton-доступ к настройкам (читается один раз на процесс)."""
    return Settings()  # type: ignore[call-arg]
