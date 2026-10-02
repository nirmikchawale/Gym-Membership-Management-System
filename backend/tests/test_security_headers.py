from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_browser_security_headers_are_present() -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert response.headers["referrer-policy"] == "no-referrer"
    assert "frame-ancestors 'none'" in response.headers["content-security-policy"]
    assert response.headers["cache-control"] == "no-store"


def test_api_routes_do_not_fall_through_to_frontend() -> None:
    response = client.get("/api/definitely-not-a-route")
    assert response.status_code == 404
