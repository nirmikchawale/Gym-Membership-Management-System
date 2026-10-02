from datetime import datetime, timedelta
from decimal import Decimal
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.db.models.auth import AuthUser
from app.db.models.member import Member
from app.db.models.plan import MembershipPlan
from app.db.session import engine
from app.main import app


def _login() -> TestClient:
    marker = uuid4().hex
    password = "Gridstone-Membership-Test-42!"
    email = f"membership-{marker}@example.test"
    with Session(engine) as db:
        db.add(
            AuthUser(
                email=email,
                full_name="Membership Test Staff",
                role="staff",
                is_active=True,
                password_hash=hash_password(password),
            )
        )
        db.commit()
    client = TestClient(app)
    assert (
        client.post("/api/v1/auth/login", json={"email": email, "password": password}).status_code
        == 200
    )
    return client


def _csrf(client: TestClient) -> dict[str, str]:
    token = client.cookies.get(settings.csrf_cookie_name)
    assert token
    return {"X-CSRF-Token": token}


def _member_and_plan(*, member_active: bool = True, plan_active: bool = True) -> tuple[str, str]:
    marker = uuid4().hex[:8].upper()
    with Session(engine) as db:
        member = Member(
            member_code=f"GST-MS-{marker}",
            first_name="Lifecycle",
            last_name="Member",
            email=f"membership-{marker.lower()}@example.test",
            is_active=member_active,
        )
        plan = MembershipPlan(
            code=f"MS-{marker}",
            name="Lifecycle Plan",
            duration_days=30,
            price=Decimal("2499.00"),
            currency="INR",
            is_active=plan_active,
        )
        db.add_all([member, plan])
        db.commit()
        db.refresh(member)
        db.refresh(plan)
        return str(member.id), str(plan.id)


def test_memberships_require_authentication() -> None:
    assert TestClient(app).get("/api/v1/memberships").status_code == 401


def test_membership_create_requires_csrf_and_snapshots_plan() -> None:
    client = _login()
    member_id, plan_id = _member_and_plan()
    payload = {"member_id": member_id, "plan_id": plan_id, "notes": "  Front desk   assignment "}
    assert client.post("/api/v1/memberships", json=payload).status_code == 403

    response = client.post("/api/v1/memberships", json=payload, headers=_csrf(client))
    assert response.status_code == 201
    body = response.json()
    assert body["member_id"] == member_id
    assert body["plan_id"] == plan_id
    assert body["price_amount"] == "2499.00"
    assert body["currency"] == "INR"
    assert body["notes"] == "Front desk assignment"
    assert body["status"] == "active"


def test_membership_rejects_inactive_member_and_plan() -> None:
    client = _login()
    headers = _csrf(client)
    member_id, plan_id = _member_and_plan(member_active=False)
    response = client.post(
        "/api/v1/memberships", json={"member_id": member_id, "plan_id": plan_id}, headers=headers
    )
    assert response.status_code == 422
    assert "Inactive members" in response.json()["detail"]

    member_id, plan_id = _member_and_plan(plan_active=False)
    response = client.post(
        "/api/v1/memberships", json={"member_id": member_id, "plan_id": plan_id}, headers=headers
    )
    assert response.status_code == 422
    assert "Inactive plans" in response.json()["detail"]


def test_overlap_search_filters_and_wildcards() -> None:
    client = _login()
    headers = _csrf(client)
    member_id, plan_id = _member_and_plan()
    created = client.post(
        "/api/v1/memberships", json={"member_id": member_id, "plan_id": plan_id}, headers=headers
    )
    assert created.status_code == 201

    duplicate = client.post(
        "/api/v1/memberships", json={"member_id": member_id, "plan_id": plan_id}, headers=headers
    )
    assert duplicate.status_code == 409

    code = created.json()["member_code"]
    search = client.get("/api/v1/memberships", params={"query": code, "status": "active"})
    assert search.status_code == 200
    assert search.json()["total"] == 1

    wildcard = client.get("/api/v1/memberships", params={"query": "%"})
    assert wildcard.status_code == 200
    assert wildcard.json()["total"] == 0


def test_renewal_lineage_and_single_child_rule() -> None:
    client = _login()
    headers = _csrf(client)
    member_id, plan_id = _member_and_plan()
    today = datetime.now(settings.timezone).date()
    source = client.post(
        "/api/v1/memberships",
        json={
            "member_id": member_id,
            "plan_id": plan_id,
            "start_date": str(today - timedelta(days=29)),
        },
        headers=headers,
    )
    assert source.status_code == 201
    source_body = source.json()

    renewed = client.post(
        f"/api/v1/memberships/{source_body['id']}/renew", json={}, headers=headers
    )
    assert renewed.status_code == 201
    body = renewed.json()
    assert body["renewed_from_membership_id"] == source_body["id"]
    assert body["start_date"] > source_body["end_date"]
    assert body["price_amount"] == "2499.00"

    duplicate = client.post(
        f"/api/v1/memberships/{source_body['id']}/renew", json={}, headers=headers
    )
    assert duplicate.status_code == 409


def test_freeze_resume_cancel_and_invalid_transitions() -> None:
    client = _login()
    headers = _csrf(client)
    member_id, plan_id = _member_and_plan()
    created = client.post(
        "/api/v1/memberships", json={"member_id": member_id, "plan_id": plan_id}, headers=headers
    )
    membership_id = created.json()["id"]

    frozen = client.post(f"/api/v1/memberships/{membership_id}/freeze", headers=headers)
    assert frozen.status_code == 200
    assert frozen.json()["status"] == "frozen"

    resumed = client.post(f"/api/v1/memberships/{membership_id}/resume", headers=headers)
    assert resumed.status_code == 200
    assert resumed.json()["status"] == "active"

    cancelled = client.post(f"/api/v1/memberships/{membership_id}/cancel", headers=headers)
    assert cancelled.status_code == 200
    assert cancelled.json()["status"] == "cancelled"

    invalid = client.post(f"/api/v1/memberships/{membership_id}/freeze", headers=headers)
    assert invalid.status_code == 422


def test_scheduled_membership_and_pagination_limit() -> None:
    client = _login()
    member_id, plan_id = _member_and_plan()
    future = datetime.now(settings.timezone).date() + timedelta(days=10)
    created = client.post(
        "/api/v1/memberships",
        json={"member_id": member_id, "plan_id": plan_id, "start_date": str(future)},
        headers=_csrf(client),
    )
    assert created.status_code == 201
    assert created.json()["status"] == "scheduled"
    assert client.get("/api/v1/memberships", params={"limit": 101}).status_code == 422
