from datetime import UTC, datetime, timedelta
from decimal import Decimal
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.models.attendance import Attendance
from app.db.models.auth import AuthUser
from app.db.models.member import Member
from app.db.models.membership import Membership
from app.db.models.plan import MembershipPlan
from app.db.session import engine
from app.main import app
from app.services.memberships import business_date


def _login() -> TestClient:
    marker = uuid4().hex
    password = "Gridstone-Dashboard-Test-42!"
    email = f"dashboard-{marker}@example.test"
    with Session(engine) as db:
        db.add(
            AuthUser(
                email=email,
                full_name="Dashboard Test Staff",
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


def test_dashboard_requires_authentication() -> None:
    client = TestClient(app)
    assert client.get("/api/v1/dashboard").status_code == 401


def test_dashboard_reconciles_new_operational_records() -> None:
    client = _login()
    baseline_response = client.get("/api/v1/dashboard")
    assert baseline_response.status_code == 200
    baseline = baseline_response.json()

    marker = uuid4().hex[:8].upper()
    today = business_date()
    with Session(engine) as db:
        member = Member(
            member_code=f"GST-DASH-{marker}",
            first_name="Metric",
            last_name="Member",
            email=f"metric-{marker.lower()}@example.test",
            is_active=True,
        )
        plan = MembershipPlan(
            code=f"DASH-{marker}",
            name="Dashboard Metric Plan",
            duration_days=30,
            price=Decimal("2100.00"),
            currency="INR",
            is_active=True,
        )
        db.add_all([member, plan])
        db.flush()
        membership = Membership(
            member_id=member.id,
            plan_id=plan.id,
            start_date=today - timedelta(days=5),
            end_date=today + timedelta(days=5),
            status="active",
            price_amount=plan.price,
            currency=plan.currency,
        )
        db.add(membership)
        db.flush()
        visit = Attendance(
            member_id=member.id,
            membership_id=membership.id,
            checked_in_at=datetime.now(UTC),
        )
        db.add(visit)
        db.commit()

    response = client.get("/api/v1/dashboard")
    assert response.status_code == 200
    dashboard = response.json()

    assert dashboard["members"]["total"] == baseline["members"]["total"] + 1
    assert dashboard["members"]["active"] == baseline["members"]["active"] + 1
    assert dashboard["memberships"]["total"] == baseline["memberships"]["total"] + 1
    assert dashboard["memberships"]["active"] == baseline["memberships"]["active"] + 1
    assert dashboard["attendance"]["open_visits"] == baseline["attendance"]["open_visits"] + 1
    assert dashboard["attendance"]["today_checkins"] == baseline["attendance"]["today_checkins"] + 1
    assert (
        dashboard["attendance"]["last_7_days_checkins"]
        == baseline["attendance"]["last_7_days_checkins"] + 1
    )
    assert sum(day["checkins"] for day in dashboard["attendance_trend"]) == dashboard["attendance"][
        "last_7_days_checkins"
    ]

    expiring_codes = {item["member_code"] for item in dashboard["expiring_soon"]}
    assert f"GST-DASH-{marker}" in expiring_codes

    distribution = {item["plan_code"]: item["memberships"] for item in dashboard["plan_distribution"]}
    assert distribution[f"DASH-{marker}"] == 1
    assert "revenue" not in dashboard
    assert "payments" not in dashboard
