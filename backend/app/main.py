"""FastAPI app factory + middleware + routers + lifecycle hooks.

Точка входа: `app.main:app` (для gunicorn / uvicorn).
"""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from app.api.router import api_router
from app.config import get_settings
from app.core.db import dispose_engine
from app.core.logging import configure_logging
from app.core.redis import close_redis
from app.core.security import decode_token
from app.deps import ACCESS_COOKIE

logger = structlog.get_logger(__name__)


class ImpersonationLogContextMiddleware(BaseHTTPMiddleware):
    """HIGH-2 (Ф4-SEC): помечает логи запроса следом имперсонации.

    claim imp пишется в access-токен при /impersonate, но нигде не читался →
    действия админа под чужим юзером неотличимы в логах от действий самого
    юзера. Здесь best-effort декодим access-cookie: если есть claim imp —
    биндим impersonator_id (admin) + impersonated_user (target) в structlog
    contextvars, чтобы ВСЕ логи этого запроса несли след. В конце — clear
    (контекст не течёт между запросами). Нет cookie / нет imp / битый токен —
    обычный путь без bind.
    """

    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):
        bound = False
        token = request.cookies.get(ACCESS_COOKIE)
        if token:
            try:
                claims = decode_token(token, "access")
            except JWTError:
                claims = None  # просрочен/битый — без bind
            if claims and claims.get("imp"):
                structlog.contextvars.bind_contextvars(
                    impersonator_id=claims["imp"],
                    impersonated_user=claims.get("sub"),
                )
                bound = True
        try:
            return await call_next(request)
        finally:
            if bound:
                structlog.contextvars.clear_contextvars()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Startup / shutdown hooks.

    Engine/Redis создаются лениво при первом запросе; здесь — корректное
    закрытие пулов на shutdown. Sprint 2+: запуск APScheduler (cleanup
    анонимов 3д), warm-up LessonRepository кеша.
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
    await dispose_engine()
    await close_redis()
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

    # HIGH-2: след имперсонации в логах (bind/clear на каждый запрос).
    app.add_middleware(ImpersonationLogContextMiddleware)

    # Главный router
    app.include_router(api_router, prefix="/api")

    return app


# Экспорт для gunicorn / uvicorn
app = create_app()
