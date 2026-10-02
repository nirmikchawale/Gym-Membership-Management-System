from datetime import UTC, date, datetime, time, timedelta
from typing import Any

from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models.attendance import Attendance
from app.db.models.member import Member
from app.db.models.membership import Membership
from app.db.models.plan import MembershipPlan
from app.schemas.dashboard import (
    DashboardAttendanceCounts,
    DashboardAttendanceDay,
    DashboardExpiringMembership,
    DashboardMemberCounts,
    DashboardMembershipCounts,
    DashboardOverview,
    DashboardPlanDistribution,
)
from app.services.memberships import business_date, synchronize_membership_statuses

MEMBERSHIP_STATUSES = ("scheduled", "active", "frozen", "expired", "cancelled")
LIVE_MEMBERSHIP_STATUSES = ("scheduled", "active", "frozen")


def _local_day_start(day: date) -> datetime:
    return datetime.combine(day, time.min, tzinfo=settings.timezone).astimezone(UTC)


def _count(db: Session, statement: Any) -> int:
    return int(db.scalar(statement) or 0)


def get_dashboard_overview(
    db: Session,
    *,
    trend_days: int = 7,
    expiring_within_days: int = 30,
) -> DashboardOverview:
    synchronize_membership_statuses(db)
    today = business_date()

    member_total = _count(db, select(func.count()).select_from(Member))
    member_active = _count(
        db, select(func.count()).select_from(Member).where(Member.is_active.is_(True))
    )

    membership_rows = db.execute(
        select(Membership.status, func.count()).group_by(Membership.status)
    ).all()
    status_counts = {status: 0 for status in MEMBERSHIP_STATUSES}
    for membership_status, count in membership_rows:
        if membership_status in status_counts:
            status_counts[membership_status] = int(count)

    membership_total = sum(status_counts.values())
    renewals = _count(
        db,
        select(func.count())
        .select_from(Membership)
        .where(Membership.renewed_from_membership_id.is_not(None)),
    )

    today_start = _local_day_start(today)
    tomorrow_start = _local_day_start(today + timedelta(days=1))
    trend_start = _local_day_start(today - timedelta(days=trend_days - 1))
    open_visits = _count(
        db,
        select(func.count()).select_from(Attendance).where(Attendance.checked_out_at.is_(None)),
    )
    today_checkins = _count(
        db,
        select(func.count())
        .select_from(Attendance)
        .where(Attendance.checked_in_at >= today_start, Attendance.checked_in_at < tomorrow_start),
    )
    period_checkins = _count(
        db,
        select(func.count())
        .select_from(Attendance)
        .where(Attendance.checked_in_at >= trend_start, Attendance.checked_in_at < tomorrow_start),
    )

    attendance_trend: list[DashboardAttendanceDay] = []
    for days_ago in range(trend_days - 1, -1, -1):
        day = today - timedelta(days=days_ago)
        start = _local_day_start(day)
        end = _local_day_start(day + timedelta(days=1))
        attendance_trend.append(
            DashboardAttendanceDay(
                date=day,
                checkins=_count(
                    db,
                    select(func.count())
                    .select_from(Attendance)
                    .where(Attendance.checked_in_at >= start, Attendance.checked_in_at < end),
                ),
            )
        )

    expiring_rows = db.execute(
        select(Membership, Member, MembershipPlan)
        .join(Member, Member.id == Membership.member_id)
        .join(MembershipPlan, MembershipPlan.id == Membership.plan_id)
        .where(
            Membership.status.in_(("active", "frozen")),
            Membership.end_date >= today,
            Membership.end_date <= today + timedelta(days=expiring_within_days),
        )
        .order_by(Membership.end_date.asc(), Member.member_code.asc())
        .limit(12)
    ).all()
    expiring_soon = [
        DashboardExpiringMembership(
            membership_id=membership.id,
            member_id=member.id,
            member_code=member.member_code,
            member_name=f"{member.first_name} {member.last_name}".strip(),
            plan_code=plan.code,
            plan_name=plan.name,
            end_date=membership.end_date,
            days_remaining=(membership.end_date - today).days,
        )
        for membership, member, plan in expiring_rows
    ]

    distribution_rows = db.execute(
        select(
            MembershipPlan.id,
            MembershipPlan.code,
            MembershipPlan.name,
            func.count(Membership.id).label("memberships"),
        )
        .outerjoin(
            Membership,
            and_(
                Membership.plan_id == MembershipPlan.id,
                Membership.status.in_(LIVE_MEMBERSHIP_STATUSES),
            ),
        )
        .group_by(MembershipPlan.id, MembershipPlan.code, MembershipPlan.name)
        .having(func.count(Membership.id) > 0)
        .order_by(func.count(Membership.id).desc(), MembershipPlan.code.asc())
        .limit(8)
    ).all()
    plan_distribution = [
        DashboardPlanDistribution(
            plan_id=plan_id,
            plan_code=plan_code,
            plan_name=plan_name,
            memberships=int(count),
        )
        for plan_id, plan_code, plan_name, count in distribution_rows
    ]

    return DashboardOverview(
        as_of=today,
        trend_days=trend_days,
        expiring_within_days=expiring_within_days,
        members=DashboardMemberCounts(
            total=member_total,
            active=member_active,
            inactive=member_total - member_active,
        ),
        memberships=DashboardMembershipCounts(
            total=membership_total,
            scheduled=status_counts["scheduled"],
            active=status_counts["active"],
            frozen=status_counts["frozen"],
            expired=status_counts["expired"],
            cancelled=status_counts["cancelled"],
            renewals=renewals,
        ),
        attendance=DashboardAttendanceCounts(
            open_visits=open_visits,
            today_checkins=today_checkins,
            period_checkins=period_checkins,
        ),
        expiring_soon=expiring_soon,
        attendance_trend=attendance_trend,
        plan_distribution=plan_distribution,
    )
