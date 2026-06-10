"""Structured logging — JSON в prod, pretty в dev.

По TSD §9.1: structlog с полями request_id / user_id / path / status / latency_ms.
В dev — human-readable; в staging/prod — JSON для Yandex Cloud Logging (T3).
"""

import logging
import sys

import structlog
from structlog.types import Processor

from app.config import get_settings


def configure_logging() -> None:
    """Настраивает stdlib logging + structlog. Зовётся один раз на старте."""
    settings = get_settings()
    log_level = getattr(logging, settings.app_log_level)

    # Stdlib root logger → stdout
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=log_level,
    )

    shared_processors: list[Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]

    if settings.app_env == "dev":
        renderer: Processor = structlog.dev.ConsoleRenderer(colors=True)
    else:
        renderer = structlog.processors.JSONRenderer()

    structlog.configure(
        processors=[*shared_processors, renderer],
        wrapper_class=structlog.make_filtering_bound_logger(log_level),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )
