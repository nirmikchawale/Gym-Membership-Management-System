from datetime import UTC, date, datetime, time, timedelta
from decimal import Decimal
from uuid import NAMESPACE_URL, UUID, uuid5

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models.attendance import Attendance
from app.db.models.member import Member
from app.db.models.membership import Membership
from app.db.models.plan import MembershipPlan
from app.db.session import SessionLocal

SEED_ANCHOR = date(2026, 10, 2)
SEED_NAMESPACE = "https://gridstone.app/demo/v1"
DEMO_MEMBER_COUNT = 112
ALLOWED_ENVIRONMENTS = {"development", "test", "staging"}

FIRST_NAMES = (
    "Aarav",
    "Isha",
    "Rohan",
    "Mira",
    "Kabir",
    "Anaya",
    "Vihaan",
    "Sara",
    "Arjun",
    "Naina",
    "Dev",
    "Riya",
)
LAST_NAMES = (
    "Mehta",
    "Kulkarni",
    "Shah",
    "Patil",
    "Kapoor",
    "Joshi",
    "Rao",
    "Deshmukh",
    "Nair",
    "Verma",
    "Singh",
    "Iyer",
)

PLAN_DEFINITIONS = (
    ("DEMO-1M", "Foundation Monthly", 30, Decimal("1499.00")),
    ("DEMO-3M", "Momentum Quarterly", 90, Decimal("3499.00")),
    ("DEMO-6M", "Forge Half-Year", 180, Decimal("6499.00")),
    ("DEMO-12M", "Gridstone Annual", 365, Decimal("10999.00")),
)


def _stable_id(kind: str, value: str) -> UUID:
    return uuid5(NAMESPACE_URL, f"{SEED_NAMESPACE}/{kind}/{value}")


def _require_safe_environment(environment: str) -> None:
    if environment not in ALLOWED_ENVIRONMENTS:
        raise RuntimeError(
            "Demo seeding is blocked outside development, test, and staging environments."
        )


def _membership_window(index: int, duration_days: int) -> tuple[date, date, str]:
    if index % 23 == 0:
        return SEED_ANCHOR - timedelta(days=90), SEED_ANCHOR - timedelta(days=1), "expired"
    if index % 19 == 0:
        return SEED_ANCHOR - timedelta(days=60), SEED_ANCHOR + timedelta(days=30), "cancelled"
    if index % 17 == 0:
        start = SEED_ANCHOR + timedelta(days=1 + (index % 7))
        return start, start + timedelta(days=duration_days - 1), "scheduled"
    start = SEED_ANCHOR - timedelta(days=index % 25)
    status = "frozen" if index % 13 == 0 else "active"
    return start, start + timedelta(days=duration_days - 1), status


def seed_demo(
    db: Session, *, member_count: int = DEMO_MEMBER_COUNT, environment: str
) -> dict[str, int]:
    _require_safe_environment(environment)
    created = {"plans": 0, "members": 0, "memberships": 0, "attendance": 0}

    plans: list[MembershipPlan] = []
    for code, name, duration_days, price in PLAN_DEFINITIONS:
        plan_id = _stable_id("plan", code)
        plan = db.get(MembershipPlan, plan_id)
        if plan is None:
            conflicting = db.scalar(select(MembershipPlan).where(MembershipPlan.code == code))
            if conflicting is not None:
                raise RuntimeError(f"Reserved demo plan code {code} is already in use.")
            plan = MembershipPlan(
                id=plan_id,
                code=code,
                name=name,
                description=(
                    "Synthetic Gridstone demonstration plan; never production customer data."
                ),
                duration_days=duration_days,
                price=price,
                currency="INR",
                is_active=True,
            )
            db.add(plan)
            created["plans"] += 1
        plans.append(plan)
    db.flush()

    for index in range(1, member_count + 1):
        code = f"GST-DEMO-{index:04d}"
        member_id = _stable_id("member", code)
        member = db.get(Member, member_id)
        if member is None:
            conflicting = db.scalar(select(Member).where(Member.member_code == code))
            if conflicting is not None:
                raise RuntimeError(f"Reserved demo member code {code} is already in use.")
            member = Member(
                id=member_id,
                member_code=code,
                first_name=FIRST_NAMES[(index - 1) % len(FIRST_NAMES)],
                last_name=LAST_NAMES[((index - 1) // len(FIRST_NAMES)) % len(LAST_NAMES)],
                email=f"member{index:04d}@demo.gridstone.invalid",
                phone=f"+9191{index:08d}",
                joined_on=SEED_ANCHOR - timedelta(days=30 + index),
                is_active=index % 11 != 0,
            )
            db.add(member)
            created["members"] += 1
        db.flush()

        plan = plans[(index - 1) % len(plans)]
        membership_id = _stable_id("membership", code)
        membership = db.get(Membership, membership_id)
        if membership is None:
            start_date, end_date, status = _membership_window(index, plan.duration_days)
            membership = Membership(
                id=membership_id,
                member_id=member.id,
                plan_id=plan.id,
                start_date=start_date,
                end_date=end_date,
                status=status,
                price_amount=plan.price,
                currency=plan.currency,
                notes="Synthetic demo membership.",
            )
            db.add(membership)
            created["memberships"] += 1
        db.flush()

        if index <= 70:
            attendance_id = _stable_id("attendance", code)
            if db.get(Attendance, attendance_id) is None:
                day = SEED_ANCHOR - timedelta(days=index % 14)
                local_check_in = datetime.combine(
                    day,
                    time(hour=6 + (index % 10)),
                    tzinfo=settings.timezone,
                )
                checked_in_at = local_check_in.astimezone(UTC)
                is_open = index <= 4 and membership.status == "active" and member.is_active
                checked_out_at = (
                    None
                    if is_open
                    else checked_in_at + timedelta(minutes=45 + index % 75)
                )
                db.add(
                    Attendance(
                        id=attendance_id,
                        member_id=member.id,
                        membership_id=membership.id,
                        checked_in_at=checked_in_at,
                        checked_out_at=checked_out_at,
                        notes="Synthetic demo visit.",
                    )
                )
                created["attendance"] += 1

    db.commit()
    return created


def main() -> None:
    _require_safe_environment(settings.app_env)
    with SessionLocal() as db:
        created = seed_demo(db, environment=settings.app_env)
    summary = ", ".join(f"{key}={value}" for key, value in created.items())
    print(f"Gridstone demo seed complete ({summary}).")


if __name__ == "__main__":
    main()
