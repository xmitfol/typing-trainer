"""API root router — собирает все версии под `/api`.

Каждая major version (`v1`, `v2`, ...) подключается явно. Breaking
changes → новый префикс, старый продолжает работать в течение
migration window.
"""

from fastapi import APIRouter

from app.api.v1 import router as v1_router

api_router = APIRouter()
api_router.include_router(v1_router, prefix="/v1")
