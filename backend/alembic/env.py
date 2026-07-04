"""Alembic env.py — читает URL из app.config (env vars), не из alembic.ini.

Это позволяет использовать одни и те же creds в коде и миграциях,
без хардкода паролей в файле.
"""

from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool

# Загружаем все модели — реальный import регистрирует их в Base.metadata.
import app.models  # noqa: F401
from alembic import context

# Импорт нужен чтобы Base.metadata содержал все таблицы (для autogenerate)
from app.config import get_settings
from app.models.base import Base

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Подставляем DB URL из настроек (sync — alembic не умеет async)
settings = get_settings()
config.set_main_option("sqlalchemy.url", settings.database_url_sync)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Offline mode — генерирует SQL без подключения к БД (для preview)."""
    context.configure(
        url=config.get_main_option("sqlalchemy.url"),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Online mode — подключается к БД и применяет миграции."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
