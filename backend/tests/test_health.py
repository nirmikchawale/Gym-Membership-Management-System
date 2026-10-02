from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_confirms_database_connectivity() -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "database": "ok",
        "service": "gridstone-api",
        "version": "0.2.0",
    }


def test_openapi_exposes_health_and_auth_endpoints() -> None:
    response = client.get("/api/openapi.json")

    assert response.status_code == 200
    paths = response.json()["paths"]
    assert "/api/v1/health" in paths
    assert "/api/v1/auth/login" in paths
    assert "/api/v1/auth/me" in paths
