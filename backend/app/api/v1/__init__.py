"""API v1 — основная версия. Все будущие routers (auth, me, lessons,
pricing, webhooks, events) подключаются здесь."""

from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.billing import router as billing_router
from app.api.v1.health import router as health_router
from app.api.v1.lessons import router as lessons_router
from app.api.v1.me import router as me_router
from app.api.v1.oauth import router as oauth_router

router = APIRouter()
router.include_router(health_router, tags=["meta"])
router.include_router(auth_router, prefix="/auth", tags=["auth"])
# OAuth под /auth/oauth (ADR-007). Отдельный router — не смешиваем с
# email/password auth; префикс не конфликтует (start/callback под /{provider}).
router.include_router(oauth_router, prefix="/auth/oauth", tags=["auth"])
router.include_router(billing_router, prefix="/billing", tags=["billing"])
router.include_router(lessons_router, prefix="/lessons", tags=["lessons"])
router.include_router(me_router, prefix="/me", tags=["me"])

# TODO Sprint 8: router.include_router(events_router, prefix="/events", tags=["events"])
