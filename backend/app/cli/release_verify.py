import os
from datetime import date
from uuid import uuid4

from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app

VERIFY_EMAIL = "release-verification@gridstone.local"
PASSWORD_ENV = "GRIDSTONE_BOOTSTRAP_PASSWORD"
PREFIX = "PH4H-VERIFY"


def _expect(response, status_code: int, label: str):
    if response.status_code != status_code:
        raise SystemExit(
            f"{label} failed: expected {status_code}, got {response.status_code}: {response.text}"
        )
    return response


def _csrf(client: TestClient) -> str:
    token = client.cookies.get(settings.csrf_cookie_name)
    if not token:
        raise SystemExit("CSRF cookie was not issued")
    return token


def main() -> None:
    password = os.environ.get(PASSWORD_ENV)
    if not password:
        raise SystemExit(f"{PASSWORD_ENV} is required for release verification")

    suffix = uuid4().hex[:8].upper()
    member_code = f"{PREFIX}-M-{suffix}"
    plan_code = f"{PREFIX}-P-{suffix}"

    with TestClient(app, base_url="https://testserver") as client:
        login = _expect(
            client.post(
                "/api/v1/auth/login",
                json={"email": VERIFY_EMAIL, "password": password},
            ),
            200,
            "login",
        )
        user = login.json()["user"]
        if user["role"] != "admin":
            raise SystemExit("Release verification account is not an admin")
        print(f"PASS auth.login user_id={user['id']} role={user['role']}")

        me = _expect(client.get("/api/v1/auth/me"), 200, "auth.me").json()
        print(f"PASS auth.me user_id={me['id']}")

        rejected_missing = client.post(
            "/api/v1/members",
            json={"first_name": "Rejected", "last_name": "MissingCsrf"},
        )
        _expect(rejected_missing, 403, "csrf.missing")
        rejected_invalid = client.post(
            "/api/v1/members",
            headers={"X-CSRF-Token": "invalid"},
            json={"first_name": "Rejected", "last_name": "InvalidCsrf"},
        )
        _expect(rejected_invalid, 403, "csrf.invalid")
        print("PASS csrf.missing_and_invalid_rejected")

        csrf = _csrf(client)
        headers = {"X-CSRF-Token": csrf}
        today = date.today().isoformat()

        member = _expect(
            client.post(
                "/api/v1/members",
                headers=headers,
                json={
                    "member_code": member_code,
                    "first_name": "Phase Four H",
                    "last_name": "Verification",
                    "email": f"ph4h-verify-{suffix.lower()}@example.invalid",
                    "joined_on": today,
                },
            ),
            201,
            "member.create",
        ).json()
        print(f"PASS member.create id={member['id']} code={member['member_code']}")

        plan = _expect(
            client.post(
                "/api/v1/plans",
                headers=headers,
                json={
                    "code": plan_code,
                    "name": f"{PREFIX} Plan {suffix}",
                    "description": "Synthetic production release verification plan",
                    "duration_days": 30,
                    "price": "1499.00",
                    "currency": "INR",
                },
            ),
            201,
            "plan.create",
        ).json()
        print(f"PASS plan.create id={plan['id']} code={plan['code']}")

        membership = _expect(
            client.post(
                "/api/v1/memberships",
                headers=headers,
                json={
                    "member_id": member["id"],
                    "plan_id": plan["id"],
                    "start_date": today,
                    "notes": f"{PREFIX} initial membership",
                },
            ),
            201,
            "membership.create",
        ).json()
        print(
            "PASS membership.create "
            f"id={membership['id']} status={membership['status']} end={membership['end_date']}"
        )

        renewal = _expect(
            client.post(
                f"/api/v1/memberships/{membership['id']}/renew",
                headers=headers,
                json={"notes": f"{PREFIX} renewal"},
            ),
            201,
            "membership.renew",
        ).json()
        if renewal["renewed_from_membership_id"] != membership["id"]:
            raise SystemExit("Renewal lineage did not reference the original membership")
        print(
            f"PASS membership.renew id={renewal['id']} from={renewal['renewed_from_membership_id']}"
        )

        access = _expect(
            client.get(f"/api/v1/attendance/access/{member['id']}"),
            200,
            "attendance.access",
        ).json()
        if not access["eligible"]:
            raise SystemExit(f"Attendance access unexpectedly denied: {access['reason']}")
        print(f"PASS attendance.access eligible=true reason={access['reason']}")

        visit = _expect(
            client.post(
                "/api/v1/attendance",
                headers=headers,
                json={"member_id": member["id"], "notes": f"{PREFIX} check-in"},
            ),
            201,
            "attendance.check_in",
        ).json()
        print(f"PASS attendance.check_in id={visit['id']} open={visit['is_open']}")

        closed_visit = _expect(
            client.post(
                f"/api/v1/attendance/{visit['id']}/checkout",
                headers=headers,
            ),
            200,
            "attendance.check_out",
        ).json()
        if closed_visit["is_open"]:
            raise SystemExit("Attendance visit remained open after checkout")
        print(f"PASS attendance.check_out id={closed_visit['id']} open=false")

        memberships = _expect(
            client.get("/api/v1/memberships", params={"member_id": member["id"], "limit": 100}),
            200,
            "membership.history",
        ).json()
        membership_ids = {item["id"] for item in memberships["items"]}
        if membership["id"] not in membership_ids or renewal["id"] not in membership_ids:
            raise SystemExit("Membership history did not include both original and renewal")
        print(f"PASS membership.history count={memberships['total']}")

        attendance = _expect(
            client.get("/api/v1/attendance", params={"query": member_code, "limit": 100}),
            200,
            "attendance.history",
        ).json()
        if not any(item["id"] == visit["id"] for item in attendance["items"]):
            raise SystemExit("Attendance history did not include the release verification visit")
        print(f"PASS attendance.history count={attendance['total']}")

        dashboard = _expect(client.get("/api/v1/dashboard"), 200, "dashboard").json()
        if dashboard["members"]["total"] < 1:
            raise SystemExit("Dashboard member totals are unexpectedly empty")
        if dashboard["attendance"]["period_checkins"] < 1:
            raise SystemExit("Dashboard attendance totals did not include verification visit")
        print(
            "PASS dashboard "
            f"members_total={dashboard['members']['total']} "
            f"period_checkins={dashboard['attendance']['period_checkins']}"
        )

        report = _expect(
            client.get("/api/v1/dashboard", params={"trend_days": 30, "expiring_days": 90}),
            200,
            "reporting",
        ).json()
        if report["trend_days"] != 30 or report["expiring_within_days"] != 90:
            raise SystemExit("Reporting window did not match the requested values")
        print(
            "PASS reporting "
            f"trend_days={report['trend_days']} expiring_days={report['expiring_within_days']}"
        )

        _expect(client.post("/api/v1/auth/logout", headers=headers), 204, "logout")
        _expect(client.get("/api/v1/auth/me"), 401, "session.invalidated")
        print("PASS auth.logout_and_session_invalidation")

    print(
        "RELEASE_VERIFY_COMPLETE "
        f"member_id={member['id']} member_code={member_code} "
        f"plan_id={plan['id']} plan_code={plan_code} "
        f"membership_id={membership['id']} renewal_id={renewal['id']} "
        f"attendance_id={visit['id']}"
    )


if __name__ == "__main__":
    main()
