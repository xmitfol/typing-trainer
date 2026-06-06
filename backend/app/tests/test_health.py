"""Sanity tests для /api/v1/health.

Это первый gate из IMPL_PLAN Sprint 0: `curl /health` → 200.
"""

from fastapi.testclient import TestClient


def test_health_returns_200(client: TestClient) -> None:
    r = client.get("/api/v1/health")
    assert r.status_code == 200


def test_health_payload_shape(client: TestClient) -> None:
    r = client.get("/api/v1/health")
    data = r.json()
    assert data["status"] == "ok"
    assert data["app"] == "typing-trainer"
    assert data["env"] in {"dev", "staging", "prod"}
    assert "version" in data
    assert isinstance(data["version"], str)


def test_openapi_schema_available(client: TestClient) -> None:
    """В dev-окружении OpenAPI должна быть открыта."""
    r = client.get("/openapi.json")
    assert r.status_code == 200
    schema = r.json()
    assert schema["info"]["title"] == "typing-trainer"
    assert "/api/v1/health" in schema["paths"]


def test_docs_available_in_dev(client: TestClient) -> None:
    """Swagger UI доступен в dev."""
    r = client.get("/docs")
    assert r.status_code == 200
