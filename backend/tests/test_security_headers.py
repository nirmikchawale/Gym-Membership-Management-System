from fastapi import Request, Response
from fastapi.testclient import TestClient

from app.main import _apply_security_headers, app

client = TestClient(app)


def _request(path: str) -> Request:
    return Request(
        {
            "type": "http",
            "method": "GET",
            "scheme": "https",
            "path": path,
            "raw_path": path.encode(),
            "query_string": b"",
            "headers": [],
            "server": ("testserver", 443),
            "client": ("testclient", 50000),
            "root_path": "",
        }
    )


def test_browser_security_headers_are_present() -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert response.headers["x-permitted-cross-domain-policies"] == "none"
    assert response.headers["cross-origin-opener-policy"] == "same-origin"
    assert response.headers["cross-origin-resource-policy"] == "same-origin"
    assert response.headers["referrer-policy"] == "no-referrer"
    assert response.headers["permissions-policy"] == (
        "camera=(), microphone=(), geolocation=(), payment=()"
    )
    assert "default-src 'none'" in response.headers["content-security-policy"]
    assert "frame-ancestors 'none'" in response.headers["content-security-policy"]
    assert response.headers["cache-control"] == "no-store"
    assert len(response.headers["x-request-id"]) == 32


def test_frontend_documents_revalidate_after_deploys() -> None:
    response = Response()
    _apply_security_headers(_request("/members"), response)
    assert response.headers["cache-control"] == "no-cache"


def test_hashed_frontend_assets_are_immutable() -> None:
    response = Response()
    _apply_security_headers(_request("/assets/index-example.js"), response)
    assert response.headers["cache-control"] == "public, max-age=31536000, immutable"


def test_api_routes_do_not_fall_through_to_frontend() -> None:
    response = client.get("/api/definitely-not-a-route")
    assert response.status_code == 404
