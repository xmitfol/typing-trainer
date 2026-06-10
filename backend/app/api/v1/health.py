"""Health endpoint — для UptimeRobot / Cloud Build healthcheck / Docker.

В минимальной версии (Sprint 0) — просто 200 OK + version + env.
В Sprint 3 добавим проверку DB + Redis (через DI). В Sprint 10 —
полный readiness probe для Kubernetes-style оркестрации.
"""

from fastapi import APIRouter
from pydantic import BaseModel

from app.deps import SettingsDep

router = APIRouter()


class HealthResponse(BaseModel):
    status: str
    app: str
    env: str
    version: str


@router.get("/health", response_model=HealthResponse, summary="Service health check")
async def health(settings: SettingsDep) -> HealthResponse:
    """Liveness probe.

    Возвращает 200 если процесс жив. **НЕ** проверяет DB / Redis — для этого
    отдельный `/ready` (Sprint 3). Цель — чтобы Cloud Build не убил pod из-за
    долгой миграции в стартовый период.
    """
    return HealthResponse(
        status="ok",
        app=settings.app_name,
        env=settings.app_env,
        version=settings.app_version,
    )
