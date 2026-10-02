from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_confirms_database_connectivity() -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "database": "ok",
        "service": "gym-membership-api",
        "version": "0.1.0",
    }


def test_openapi_exposes_health_endpoint() -> None:
    response = client.get("/api/openapi.json")

    assert response.status_code == 200
    assert "/api/v1/health" in response.json()["paths"]
