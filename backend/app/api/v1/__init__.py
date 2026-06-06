"""API v1 — основная версия. Все будущие routers (auth, me, lessons,
pricing, webhooks, events) подключаются здесь."""

from fastapi import APIRouter

from app.api.v1.health import router as health_router

router = APIRouter()
router.include_router(health_router, tags=["meta"])

# TODO Sprint 1: router.include_router(auth_router, prefix="/auth", tags=["auth"])
# TODO Sprint 3: router.include_router(me_router, prefix="/me", tags=["me"])
# TODO Sprint 5: router.include_router(lessons_router, prefix="/lessons", tags=["lessons"])
# TODO Sprint 6: router.include_router(pricing_router, prefix="/pricing", tags=["pricing"])
# TODO Sprint 6: router.include_router(webhooks_router, prefix="/webhooks", tags=["webhooks"])
# TODO Sprint 8: router.include_router(events_router, prefix="/events", tags=["events"])
