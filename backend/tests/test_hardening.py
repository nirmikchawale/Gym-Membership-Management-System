import logging
from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import inspect, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.db.models.auth import AuthSession, AuthUser
from app.db.session import engine
from app.main import app


def _login_as(role: str) -> tuple[TestClient, str]:
    marker = uuid4().hex
    password = "Gridstone-Hardening-Test-42!"
    user = AuthUser(
        email=f"hardening-{role}-{marker}@example.test",
        full_name=f"Hardening {role.title()}",
        role=role,
        is_active=True,
        password_hash=hash_password(password),
    )
    with Session(engine) as db:
        db.add(user)
        db.commit()
        db.refresh(user)
        user_id = str(user.id)

    client = TestClient(app)
    response = client.post(
        "/api/v1/auth/login",
        json={"email": user.email, "password": password},
    )
    assert response.status_code == 200
    return client, user_id


def _csrf(client: TestClient) -> dict[str, str]:
    token = client.cookies.get(settings.csrf_cookie_name)
    assert token
    return {"X-CSRF-Token": token}


def test_admin_staff_matrix_and_cross_feature_daily_loop() -> None:
    admin, _ = _login_as("admin")
    staff, _ = _login_as("staff")
    admin_csrf = _csrf(admin)
    staff_csrf = _csrf(staff)
    marker = uuid4().hex[:8].upper()

    blocked_plan = staff.post(
        "/api/v1/plans",
        json={
            "code": f"STAFF-{marker}",
            "name": "Staff cannot create this plan",
            "duration_days": 30,
            "price": "1999.00",
            "currency": "INR",
        },
        headers=staff_csrf,
    )
    assert blocked_plan.status_code == 403

    plan = admin.post(
        "/api/v1/plans",
        json={
            "code": f"HARD-{marker}",
            "name": "Hardening Flow Plan",
            "duration_days": 30,
            "price": "2499.00",
            "currency": "INR",
        },
        headers=admin_csrf,
    )
    assert plan.status_code == 201

    member = staff.post(
        "/api/v1/members",
        json={
            "member_code": f"GST-HF-{marker}",
            "first_name": "Cross Feature",
            "last_name": "Member",
            "email": f"hardening-{marker.lower()}@example.test",
        },
        headers=staff_csrf,
    )
    assert member.status_code == 201

    for path in ("/members", "/plans", "/memberships", "/attendance"):
        assert staff.get(f"/api/v1{path}").status_code == 200

    membership = staff.post(
        "/api/v1/memberships",
        json={"member_id": member.json()["id"], "plan_id": plan.json()["id"]},
        headers=staff_csrf,
    )
    assert membership.status_code == 201
    assert membership.json()["price_amount"] == "2499.00"

    access = staff.get(f"/api/v1/attendance/access/{member.json()['id']}")
    assert access.status_code == 200
    assert access.json()["eligible"] is True

    check_in = staff.post(
        "/api/v1/attendance",
        json={"member_id": member.json()["id"]},
        headers=staff_csrf,
    )
    assert check_in.status_code == 201
    assert check_in.json()["membership_id"] == membership.json()["id"]

    duplicate_check_in = staff.post(
        "/api/v1/attendance",
        json={"member_id": member.json()["id"]},
        headers=staff_csrf,
    )
    assert duplicate_check_in.status_code == 409

    checkout = staff.post(
        f"/api/v1/attendance/{check_in.json()['id']}/checkout",
        headers=staff_csrf,
    )
    assert checkout.status_code == 200
    assert checkout.json()["is_open"] is False

    renewed = staff.post(
        f"/api/v1/memberships/{membership.json()['id']}/renew",
        json={},
        headers=staff_csrf,
    )
    assert renewed.status_code == 201
    assert renewed.json()["renewed_from_membership_id"] == membership.json()["id"]

    duplicate_renewal = staff.post(
        f"/api/v1/memberships/{membership.json()['id']}/renew",
        json={},
        headers=staff_csrf,
    )
    assert duplicate_renewal.status_code == 409


def test_csrf_session_expiry_and_api_no_store_are_enforced() -> None:
    staff, user_id = _login_as("staff")
    marker = uuid4().hex[:8].upper()

    blocked = staff.post(
        "/api/v1/members",
        json={
            "member_code": f"GST-CSRF-{marker}",
            "first_name": "CSRF",
            "last_name": "Blocked",
        },
    )
    assert blocked.status_code == 403
    assert blocked.headers["cache-control"] == "no-store"
    assert len(blocked.headers["x-request-id"]) == 32

    with Session(engine) as db:
        session = db.scalar(
            select(AuthSession)
            .where(AuthSession.user_id == user_id)
            .order_by(AuthSession.created_at.desc())
        )
        assert session is not None
        session.expires_at = datetime.now(UTC) - timedelta(seconds=1)
        db.commit()

    expired = staff.get("/api/v1/auth/me")
    assert expired.status_code == 401
    assert expired.headers["cache-control"] == "no-store"


def test_sql_wildcards_are_literal_and_list_boundaries_are_bounded() -> None:
    staff, _ = _login_as("staff")
    headers = _csrf(staff)
    marker = uuid4().hex[:8].upper()

    percent_member = staff.post(
        "/api/v1/members",
        json={
            "member_code": f"GST-PCT-{marker}",
            "first_name": f"Percent%{marker}",
            "last_name": "Literal",
        },
        headers=headers,
    )
    assert percent_member.status_code == 201

    plain_member = staff.post(
        "/api/v1/members",
        json={
            "member_code": f"GST-PLN-{marker}",
            "first_name": f"PercentX{marker}",
            "last_name": "Plain",
        },
        headers=headers,
    )
    assert plain_member.status_code == 201

    wildcard = staff.get("/api/v1/members", params={"query": "%", "limit": 100})
    assert wildcard.status_code == 200
    ids = {item["id"] for item in wildcard.json()["items"]}
    assert percent_member.json()["id"] in ids
    assert plain_member.json()["id"] not in ids

    assert staff.get("/api/v1/members", params={"query": "x" * 121}).status_code == 422
    assert staff.get("/api/v1/members", params={"limit": 101}).status_code == 422


def test_operational_indexes_cover_membership_and_attendance_lists() -> None:
    inspector = inspect(engine)
    membership_indexes = {index["name"] for index in inspector.get_indexes("memberships")}
    attendance_indexes = {index["name"] for index in inspector.get_indexes("attendance")}

    assert {
        "ix_memberships_member_status",
        "ix_memberships_status_end_date",
    }.issubset(membership_indexes)
    assert {
        "ix_attendance_member_checked_in",
        "ix_attendance_membership_checked_in",
        "uq_attendance_one_open_visit_per_member",
    }.issubset(attendance_indexes)


def test_unhandled_errors_are_generic_and_do_not_log_exception_text(
    caplog: pytest.LogCaptureFixture,
) -> None:
    original_routes = list(app.router.routes)
    secret_marker = f"secret-{uuid4().hex}"

    def crash() -> None:
        raise RuntimeError(secret_marker)

    app.add_api_route("/api/v1/__hardening_crash", crash, methods=["GET"])
    try:
        with caplog.at_level(logging.ERROR, logger="gridstone.http"):
            response = TestClient(app, raise_server_exceptions=False).get(
                "/api/v1/__hardening_crash?token=must-not-log"
            )
    finally:
        app.router.routes[:] = original_routes

    assert response.status_code == 500
    assert response.json()["detail"] == "Internal server error"
    assert response.json()["request_id"] == response.headers["x-request-id"]
    assert "RuntimeError" in caplog.text
    assert secret_marker not in caplog.text
    assert "must-not-log" not in caplog.text
