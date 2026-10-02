from datetime import datetime, timedelta
from decimal import Decimal
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.db.models.auth import AuthUser
from app.db.models.member import Member
from app.db.models.membership import Membership
from app.db.models.plan import MembershipPlan
from app.db.session import engine
from app.main import app


def _login() -> TestClient:
    marker = uuid4().hex
    password = "Gridstone-Attendance-Test-42!"
    email = f"attendance-{marker}@example.test"
    with Session(engine) as db:
        db.add(
            AuthUser(
                email=email,
                full_name="Attendance Test Staff",
                role="staff",
                is_active=True,
                password_hash=hash_password(password),
            )
        )
        db.commit()
    client = TestClient(app)
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    return client


def _csrf(client: TestClient) -> dict[str, str]:
    token = client.cookies.get(settings.csrf_cookie_name)
    assert token
    return {"X-CSRF-Token": token}


def _member_with_membership(
    *,
    member_active: bool = True,
    membership_status: str = "active",
    start_offset: int = -5,
    end_offset: int = 20,
) -> tuple[str, str, str]:
    marker = uuid4().hex[:8].upper()
    today = datetime.now(settings.timezone).date()
    with Session(engine) as db:
        member = Member(
            member_code=f"GST-AT-{marker}",
            first_name="Front",
            last_name=f"Desk{marker[:3]}",
            email=f"attendance-{marker.lower()}@example.test",
            is_active=member_active,
        )
        plan = MembershipPlan(
            code=f"AT-{marker}",
            name="Attendance Access Plan",
            duration_days=30,
            price=Decimal("1800.00"),
            currency="INR",
            is_active=True,
        )
        db.add_all([member, plan])
        db.flush()
        membership = Membership(
            member_id=member.id,
            plan_id=plan.id,
            start_date=today + timedelta(days=start_offset),
            end_date=today + timedelta(days=end_offset),
            status=membership_status,
            price_amount=plan.price,
            currency=plan.currency,
        )
        db.add(membership)
        db.commit()
        db.refresh(member)
        db.refresh(plan)
        db.refresh(membership)
        return str(member.id), str(plan.id), str(membership.id)


def test_attendance_requires_authentication() -> None:
    client = TestClient(app)
    assert client.get("/api/v1/attendance").status_code == 401


def test_access_check_in_duplicate_and_checkout_flow() -> None:
    client = _login()
    member_id, _plan_id, membership_id = _member_with_membership()

    access = client.get(f"/api/v1/attendance/access/{member_id}")
    assert access.status_code == 200
    assert access.json()["eligible"] is True
    assert access.json()["membership"]["id"] == membership_id
    assert access.json()["reason"] == "Access valid for check-in"

    payload = {"member_id": member_id, "notes": "  Morning   visit "}
    assert client.post("/api/v1/attendance", json=payload).status_code == 403

    checked_in = client.post("/api/v1/attendance", json=payload, headers=_csrf(client))
    assert checked_in.status_code == 201
    visit = checked_in.json()
    assert visit["membership_id"] == membership_id
    assert visit["is_open"] is True
    assert visit["notes"] == "Morning visit"

    after = client.get(f"/api/v1/attendance/access/{member_id}")
    assert after.status_code == 200
    assert after.json()["eligible"] is False
    assert after.json()["open_visit"]["id"] == visit["id"]
    assert "already checked in" in after.json()["reason"]

    duplicate = client.post("/api/v1/attendance", json=payload, headers=_csrf(client))
    assert duplicate.status_code == 409

    assert client.post(f"/api/v1/attendance/{visit['id']}/checkout").status_code == 403
    checked_out = client.post(f"/api/v1/attendance/{visit['id']}/checkout", headers=_csrf(client))
    assert checked_out.status_code == 200
    assert checked_out.json()["is_open"] is False
    assert checked_out.json()["checked_out_at"] is not None
    assert checked_out.json()["duration_minutes"] is not None

    repeated = client.post(f"/api/v1/attendance/{visit['id']}/checkout", headers=_csrf(client))
    assert repeated.status_code == 409


def test_attendance_denies_inactive_and_non_active_memberships() -> None:
    client = _login()

    inactive_member, _plan_id, _membership_id = _member_with_membership(member_active=False)
    response = client.get(f"/api/v1/attendance/access/{inactive_member}")
    assert response.status_code == 200
    assert response.json()["eligible"] is False
    assert "inactive" in response.json()["reason"]

    frozen_member, _plan_id, _membership_id = _member_with_membership(membership_status="frozen")
    response = client.get(f"/api/v1/attendance/access/{frozen_member}")
    assert response.status_code == 200
    assert response.json()["eligible"] is False
    assert "frozen" in response.json()["reason"]

    scheduled_member, _plan_id, _membership_id = _member_with_membership(
        membership_status="scheduled", start_offset=5, end_offset=35
    )
    response = client.get(f"/api/v1/attendance/access/{scheduled_member}")
    assert response.status_code == 200
    assert response.json()["eligible"] is False
    assert "not started" in response.json()["reason"]

    cancelled_member, _plan_id, _membership_id = _member_with_membership(
        membership_status="cancelled"
    )
    denied = client.post(
        "/api/v1/attendance",
        json={"member_id": cancelled_member},
        headers=_csrf(client),
    )
    assert denied.status_code == 422
    assert "cancelled" in denied.json()["detail"]


def test_attendance_history_search_state_dates_and_bounds() -> None:
    client = _login()
    headers = _csrf(client)
    member_id, _plan_id, _membership_id = _member_with_membership()
    created = client.post(
        "/api/v1/attendance",
        json={"member_id": member_id},
        headers=headers,
    )
    assert created.status_code == 201
    code = created.json()["member_code"]

    open_rows = client.get("/api/v1/attendance", params={"query": code, "state": "open"})
    assert open_rows.status_code == 200
    assert open_rows.json()["total"] == 1

    assert (
        client.post(
            f"/api/v1/attendance/{created.json()['id']}/checkout", headers=headers
        ).status_code
        == 200
    )
    closed_rows = client.get("/api/v1/attendance", params={"query": code, "state": "closed"})
    assert closed_rows.status_code == 200
    assert closed_rows.json()["total"] == 1

    today = datetime.now(settings.timezone).date()
    date_rows = client.get(
        "/api/v1/attendance",
        params={"query": code, "from": str(today), "to": str(today)},
    )
    assert date_rows.status_code == 200
    assert date_rows.json()["total"] == 1

    invalid = client.get(
        "/api/v1/attendance",
        params={"from": str(today), "to": str(today - timedelta(days=1))},
    )
    assert invalid.status_code == 422
    assert client.get("/api/v1/attendance", params={"limit": 101}).status_code == 422

    wildcard = client.get("/api/v1/attendance", params={"query": "%"})
    assert wildcard.status_code == 200
    assert wildcard.json()["total"] == 0
