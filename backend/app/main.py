"""FastAPI app factory + middleware + routers + lifecycle hooks.

Точка входа: `app.main:app` (для gunicorn / uvicorn).
"""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.config import get_settings
from app.core.logging import configure_logging

logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Startup / shutdown hooks.

    Sprint 0 — пусто. Sprint 1+: подключение к DB / Redis, запуск APScheduler
    (cleanup анонимов 3д), warm-up LessonRepository кеша.
    """
    configure_logging()
    settings = get_settings()
    logger.info(
        "app.startup",
        env=settings.app_env,
        version=settings.app_version,
        debug=settings.app_debug,
    )
    yield
    logger.info("app.shutdown")


def create_app() -> FastAPI:
    """App factory — нужен для тестов (override deps)."""
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="Backend API для typing-trainer SaaS. См. docs/spec/backend/02_TSD.md.",
        docs_url="/docs" if settings.app_env != "prod" else None,
        redoc_url="/redoc" if settings.app_env != "prod" else None,
        openapi_url="/openapi.json" if settings.app_env != "prod" else None,
        lifespan=lifespan,
    )

    # CORS — frontend на отдельном порту в dev, на том же домене в prod
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.http_cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    # Главный router
    app.include_router(api_router, prefix="/api")

    return app


# Экспорт для gunicorn / uvicorn
app = create_app()
