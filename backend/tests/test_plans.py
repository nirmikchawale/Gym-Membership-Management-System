from datetime import date
from decimal import Decimal
from uuid import UUID, uuid4

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.db.models.auth import AuthUser
from app.db.models.member import Member
from app.db.models.membership import Membership
from app.db.session import engine
from app.main import app


def _login(role: str) -> TestClient:
    marker = uuid4().hex
    password = "Gridstone-Plan-Test-42!"
    email = f"plan-{role}-{marker}@example.test"
    user = AuthUser(
        email=email,
        full_name=f"Plan Test {role.title()}",
        role=role,
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


def _plan_payload(marker: str) -> dict[str, object]:
    return {
        "code": f" pro-{marker[:8]} ",
        "name": "  Forge  Plus  ",
        "description": "  Six months   of focused access.  ",
        "duration_days": 180,
        "price": "6999.00",
        "currency": " inr ",
    }


def test_plans_require_authentication() -> None:
    response = TestClient(app).get("/api/v1/plans")
    assert response.status_code == 401


def test_staff_can_read_but_only_admin_can_mutate_plans() -> None:
    staff = _login("staff")
    assert staff.get("/api/v1/plans").status_code == 200

    blocked = staff.post(
        "/api/v1/plans",
        json=_plan_payload(uuid4().hex),
        headers=_csrf_headers(staff),
    )
    assert blocked.status_code == 403
    assert blocked.json()["detail"] == "Insufficient permissions"


def test_plan_create_requires_csrf_and_normalizes_fields() -> None:
    client = _login("admin")
    marker = uuid4().hex
    payload = _plan_payload(marker)

    blocked = client.post("/api/v1/plans", json=payload)
    assert blocked.status_code == 403

    response = client.post("/api/v1/plans", json=payload, headers=_csrf_headers(client))
    assert response.status_code == 201
    body = response.json()
    assert body["code"] == f"PRO-{marker[:8].upper()}"
    assert body["name"] == "Forge Plus"
    assert body["description"] == "Six months of focused access."
    assert body["currency"] == "INR"
    assert body["price"] == "6999.00"
    assert body["is_active"] is True


def test_plan_list_search_status_and_wildcards_are_safe() -> None:
    client = _login("admin")
    marker = uuid4().hex
    headers = _csrf_headers(client)
    created = client.post("/api/v1/plans", json=_plan_payload(marker), headers=headers)
    assert created.status_code == 201
    plan_id = created.json()["id"]

    search = client.get("/api/v1/plans", params={"query": marker[:8], "status": "active"})
    assert search.status_code == 200
    assert any(item["id"] == plan_id for item in search.json()["items"])

    wildcard = client.get("/api/v1/plans", params={"query": "%"})
    assert wildcard.status_code == 200
    assert wildcard.json()["total"] == 0


def test_plan_update_deactivate_and_reactivate() -> None:
    client = _login("admin")
    marker = uuid4().hex
    headers = _csrf_headers(client)
    created = client.post("/api/v1/plans", json=_plan_payload(marker), headers=headers)
    assert created.status_code == 201
    plan_id = created.json()["id"]

    updated = client.patch(
        f"/api/v1/plans/{plan_id}",
        json={"name": "Forge Max", "price": "7499.50", "description": None},
        headers=headers,
    )
    assert updated.status_code == 200
    assert updated.json()["name"] == "Forge Max"
    assert updated.json()["price"] == "7499.50"
    assert updated.json()["description"] is None

    deactivated = client.post(f"/api/v1/plans/{plan_id}/deactivate", headers=headers)
    assert deactivated.status_code == 200
    assert deactivated.json()["is_active"] is False

    inactive = client.get("/api/v1/plans", params={"status": "inactive", "query": marker[:8]})
    assert inactive.status_code == 200
    assert inactive.json()["total"] == 1

    reactivated = client.post(f"/api/v1/plans/{plan_id}/activate", headers=headers)
    assert reactivated.status_code == 200
    assert reactivated.json()["is_active"] is True


def test_plan_duplicate_code_returns_conflict() -> None:
    client = _login("admin")
    marker = uuid4().hex
    headers = _csrf_headers(client)
    payload = _plan_payload(marker)

    first = client.post("/api/v1/plans", json=payload, headers=headers)
    assert first.status_code == 201

    duplicate = client.post(
        "/api/v1/plans",
        json={**_plan_payload(uuid4().hex), "code": payload["code"]},
        headers=headers,
    )
    assert duplicate.status_code == 409
    assert duplicate.json()["detail"] == "Plan code already exists"


def test_plan_validation_and_pagination_limits() -> None:
    client = _login("admin")
    headers = _csrf_headers(client)

    invalid = client.post(
        "/api/v1/plans",
        json={
            "code": "BAD PLAN",
            "name": "Invalid",
            "duration_days": 0,
            "price": "-1.00",
            "currency": "INR",
        },
        headers=headers,
    )
    assert invalid.status_code == 422

    oversized_page = client.get("/api/v1/plans", params={"limit": 101})
    assert oversized_page.status_code == 422


def test_editing_plan_price_does_not_rewrite_membership_snapshot() -> None:
    client = _login("admin")
    marker = uuid4().hex
    headers = _csrf_headers(client)
    created = client.post("/api/v1/plans", json=_plan_payload(marker), headers=headers)
    assert created.status_code == 201
    plan_id = created.json()["id"]

    member = Member(
        member_code=f"GST-PL-{marker[:8].upper()}",
        first_name="Snapshot",
        last_name="Member",
    )
    with Session(engine) as db:
        db.add(member)
        db.commit()
        db.refresh(member)
        membership = Membership(
            member_id=member.id,
            plan_id=UUID(plan_id),
            start_date=date(2026, 10, 2),
            end_date=date(2027, 3, 30),
            status="active",
            price_amount=Decimal("6999.00"),
            currency="INR",
        )
        db.add(membership)
        db.commit()
        membership_id = membership.id

    changed = client.patch(
        f"/api/v1/plans/{plan_id}",
        json={"price": "7999.00"},
        headers=headers,
    )
    assert changed.status_code == 200

    with Session(engine) as db:
        persisted = db.get(Membership, membership_id)
        assert persisted is not None
        assert persisted.price_amount == Decimal("6999.00")


def test_plan_not_found_is_generic() -> None:
    client = _login("staff")
    response = client.get(f"/api/v1/plans/{uuid4()}")
    assert response.status_code == 404
    assert response.json()["detail"] == "Membership plan not found"
