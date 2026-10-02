from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.db.models.auth import AuthUser
from app.db.session import engine
from app.main import app


def _login_staff() -> TestClient:
    marker = uuid4().hex
    password = "Gridstone-Member-Test-42!"
    email = f"member-staff-{marker}@example.test"
    user = AuthUser(
        email=email,
        full_name="Member Test Staff",
        role="staff",
        is_active=True,
        password_hash=hash_password(password),
    )
    with Session(engine) as db:
        db.add(user)
        db.commit()

    client = TestClient(app)
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    return client


def _csrf_headers(client: TestClient) -> dict[str, str]:
    token = client.cookies.get(settings.csrf_cookie_name)
    assert token
    return {"X-CSRF-Token": token}


def _member_payload(marker: str) -> dict[str, str]:
    return {
        "first_name": "  Asha  ",
        "last_name": f"Member {marker[:6]}",
        "email": f"ASHA.{marker}@EXAMPLE.TEST",
        "phone": f"+91 98{int(marker[:8], 16) % 100000000:08d}",
        "joined_on": "2026-10-01",
    }


def test_members_require_authentication() -> None:
    response = TestClient(app).get("/api/v1/members")
    assert response.status_code == 401


def test_member_create_requires_csrf_and_normalizes_fields() -> None:
    client = _login_staff()
    marker = uuid4().hex
    payload = _member_payload(marker)

    blocked = client.post("/api/v1/members", json=payload)
    assert blocked.status_code == 403

    response = client.post("/api/v1/members", json=payload, headers=_csrf_headers(client))
    assert response.status_code == 201
    body = response.json()
    assert body["member_code"].startswith("GST-")
    assert body["first_name"] == "Asha"
    assert body["email"] == payload["email"].lower()
    assert body["is_active"] is True


def test_member_list_search_status_and_wildcards_are_safe() -> None:
    client = _login_staff()
    marker = uuid4().hex
    headers = _csrf_headers(client)
    created = client.post(
        "/api/v1/members",
        json=_member_payload(marker),
        headers=headers,
    )
    assert created.status_code == 201
    member_id = created.json()["id"]

    search = client.get("/api/v1/members", params={"query": marker[:6], "status": "active"})
    assert search.status_code == 200
    assert any(item["id"] == member_id for item in search.json()["items"])

    wildcard = client.get("/api/v1/members", params={"query": "%"})
    assert wildcard.status_code == 200
    assert all(item["id"] != member_id for item in wildcard.json()["items"])


def test_member_update_deactivate_and_reactivate() -> None:
    client = _login_staff()
    marker = uuid4().hex
    headers = _csrf_headers(client)
    created = client.post("/api/v1/members", json=_member_payload(marker), headers=headers)
    assert created.status_code == 201
    member_id = created.json()["id"]

    updated = client.patch(
        f"/api/v1/members/{member_id}",
        json={"first_name": "Mira", "phone": None},
        headers=headers,
    )
    assert updated.status_code == 200
    assert updated.json()["first_name"] == "Mira"
    assert updated.json()["phone"] is None

    deactivated = client.post(f"/api/v1/members/{member_id}/deactivate", headers=headers)
    assert deactivated.status_code == 200
    assert deactivated.json()["is_active"] is False

    inactive = client.get("/api/v1/members", params={"status": "inactive", "query": marker[:6]})
    assert inactive.status_code == 200
    assert inactive.json()["total"] == 1

    reactivated = client.post(f"/api/v1/members/{member_id}/activate", headers=headers)
    assert reactivated.status_code == 200
    assert reactivated.json()["is_active"] is True


def test_member_duplicate_contact_returns_conflict() -> None:
    client = _login_staff()
    marker = uuid4().hex
    headers = _csrf_headers(client)
    payload = _member_payload(marker)

    first = client.post("/api/v1/members", json=payload, headers=headers)
    assert first.status_code == 201

    duplicate = client.post(
        "/api/v1/members",
        json={**_member_payload(uuid4().hex), "email": payload["email"]},
        headers=headers,
    )
    assert duplicate.status_code == 409
    assert duplicate.json()["detail"] == "Member code, email, or phone already exists"


def test_member_validation_and_pagination_limits() -> None:
    client = _login_staff()
    headers = _csrf_headers(client)

    future_birth = client.post(
        "/api/v1/members",
        json={
            "first_name": "Future",
            "last_name": "Person",
            "date_of_birth": "2099-01-01",
        },
        headers=headers,
    )
    assert future_birth.status_code == 422

    oversized_page = client.get("/api/v1/members", params={"limit": 101})
    assert oversized_page.status_code == 422


def test_member_not_found_is_generic() -> None:
    client = _login_staff()
    response = client.get(f"/api/v1/members/{uuid4()}")
    assert response.status_code == 404
    assert response.json()["detail"] == "Member not found"
