from sqlalchemy import select

from app.db.models.attendance import Attendance
from app.db.models.member import Member
from app.db.models.membership import Membership
from app.db.models.plan import MembershipPlan
from app.db.session import SessionLocal

MEMBER_PREFIX = "PH4H-VERIFY-M-%"
PLAN_PREFIX = "PH4H-VERIFY-P-%"


def main() -> None:
    with SessionLocal() as db:
        member = db.scalar(
            select(Member)
            .where(Member.member_code.like(MEMBER_PREFIX))
            .order_by(Member.created_at.desc())
            .limit(1)
        )
        if member is None:
            raise SystemExit("No Phase 4H verification member found")

        plan = db.scalar(
            select(MembershipPlan)
            .where(MembershipPlan.code.like(PLAN_PREFIX))
            .order_by(MembershipPlan.created_at.desc())
            .limit(1)
        )
        if plan is None:
            raise SystemExit("No Phase 4H verification plan found")

        memberships = list(
            db.scalars(
                select(Membership)
                .where(Membership.member_id == member.id)
                .order_by(Membership.created_at.asc())
            )
        )
        if len(memberships) < 2:
            raise SystemExit("Phase 4H membership renewal history is incomplete")

        membership_ids = {item.id for item in memberships}
        renewal = next(
            (item for item in memberships if item.renewed_from_membership_id in membership_ids),
            None,
        )
        if renewal is None:
            raise SystemExit("Phase 4H renewal lineage was not preserved")

        visits = list(
            db.scalars(
                select(Attendance)
                .where(Attendance.member_id == member.id)
                .order_by(Attendance.created_at.asc())
            )
        )
        closed_visits = [visit for visit in visits if visit.checked_out_at is not None]
        if not closed_visits:
            raise SystemExit("Phase 4H closed attendance visit was not preserved")

        if not any(item.plan_id == plan.id for item in memberships):
            raise SystemExit("Phase 4H verification plan is not linked to the persisted membership")

        print(
            "PASS release.persistence "
            f"member_id={member.id} member_code={member.member_code} "
            f"plan_id={plan.id} plan_code={plan.code} "
            f"memberships={len(memberships)} closed_visits={len(closed_visits)} "
            f"renewal_id={renewal.id}"
        )


if __name__ == "__main__":
    main()
