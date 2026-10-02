from collections.abc import Sequence
from datetime import UTC, date, datetime, time, timedelta
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy.sql.elements import ColumnElement

from app.core.config import settings
from app.db.models.attendance import Attendance
from app.db.models.member import Member
from app.db.models.membership import Membership
from app.db.models.plan import MembershipPlan
from app.schemas.attendance import AttendanceCreate
from app.services.memberships import business_date, synchronize_membership_statuses


class AttendanceNotFoundError(Exception):
    pass


class AttendanceMemberNotFoundError(Exception):
    pass


class AttendanceAccessError(Exception):
    pass


class AttendanceConflictError(Exception):
    pass


def _escaped_like(value: str) -> str:
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def _local_day_start(day: date) -> datetime:
    return datetime.combine(day, time.min, tzinfo=settings.timezone).astimezone(UTC)


def _member(db: Session, member_id: UUID) -> Member:
    member = db.get(Member, member_id)
    if member is None:
        raise AttendanceMemberNotFoundError
    return member


def _active_membership(
    db: Session, member_id: UUID
) -> tuple[Membership | None, MembershipPlan | None]:
    synchronize_membership_statuses(db)
    today = business_date()
    row = db.execute(
        select(Membership, MembershipPlan)
        .join(MembershipPlan, MembershipPlan.id == Membership.plan_id)
        .where(
            Membership.member_id == member_id,
            Membership.status == "active",
            Membership.start_date <= today,
            Membership.end_date >= today,
        )
        .order_by(Membership.end_date.desc())
        .limit(1)
    ).first()
    if row is None:
        return None, None
    return row[0], row[1]


def _closest_membership(db: Session, member_id: UUID) -> Membership | None:
    synchronize_membership_statuses(db)
    return db.scalar(
        select(Membership)
        .where(Membership.member_id == member_id)
        .order_by(Membership.end_date.desc(), Membership.created_at.desc())
        .limit(1)
    )


def open_visit_for_member(db: Session, member_id: UUID) -> Attendance | None:
    return db.scalar(
        select(Attendance).where(
            Attendance.member_id == member_id,
            Attendance.checked_out_at.is_(None),
        )
    )


def access_decision(
    db: Session, member_id: UUID
) -> tuple[Member, Membership | None, MembershipPlan | None, Attendance | None, bool, str]:
    member = _member(db, member_id)
    open_visit = open_visit_for_member(db, member_id)
    if not member.is_active:
        return member, None, None, open_visit, False, "Member account is inactive"

    membership, plan = _active_membership(db, member_id)
    if membership is None:
        closest = _closest_membership(db, member_id)
        if closest is None:
            reason = "No membership has been assigned"
        elif closest.status == "frozen":
            reason = "Membership is frozen"
        elif closest.status == "scheduled":
            reason = "Membership has not started yet"
        elif closest.status == "cancelled":
            reason = "Membership is cancelled"
        elif closest.status == "expired":
            reason = "Membership has expired"
        else:
            reason = "No active membership covers today"
        return member, None, None, open_visit, False, reason

    if open_visit is not None:
        return member, membership, plan, open_visit, False, "Member is already checked in"

    return member, membership, plan, None, True, "Access valid for check-in"


def check_in(db: Session, payload: AttendanceCreate) -> Attendance:
    member, membership, _plan, open_visit, eligible, reason = access_decision(db, payload.member_id)
    if open_visit is not None:
        raise AttendanceConflictError("Member already has an open visit")
    if not eligible or membership is None:
        raise AttendanceAccessError(reason)

    visit = Attendance(
        member_id=member.id,
        membership_id=membership.id,
        notes=payload.notes,
    )
    db.add(visit)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise AttendanceConflictError("Member already has an open visit") from exc
    db.refresh(visit)
    return visit


def get_attendance(db: Session, attendance_id: UUID) -> Attendance:
    visit = db.get(Attendance, attendance_id)
    if visit is None:
        raise AttendanceNotFoundError
    return visit


def check_out(db: Session, visit: Attendance) -> Attendance:
    if visit.checked_out_at is not None:
        raise AttendanceConflictError("Visit has already been checked out")
    visit.checked_out_at = datetime.now(UTC)
    db.commit()
    db.refresh(visit)
    return visit


def attendance_context(
    db: Session, visit: Attendance
) -> tuple[Member, Membership | None, MembershipPlan | None]:
    member = db.get(Member, visit.member_id)
    if member is None:
        raise AttendanceMemberNotFoundError
    membership = db.get(Membership, visit.membership_id) if visit.membership_id else None
    plan = db.get(MembershipPlan, membership.plan_id) if membership else None
    return member, membership, plan


def list_attendance(
    db: Session,
    *,
    query: str | None,
    state: str | None,
    from_date: date | None,
    to_date: date | None,
    limit: int,
    offset: int,
) -> tuple[Sequence[tuple[Attendance, Member, Membership | None, MembershipPlan | None]], int]:
    filters: list[ColumnElement[bool]] = []
    if state == "open":
        filters.append(Attendance.checked_out_at.is_(None))
    elif state == "closed":
        filters.append(Attendance.checked_out_at.is_not(None))
    if from_date is not None:
        filters.append(Attendance.checked_in_at >= _local_day_start(from_date))
    if to_date is not None:
        filters.append(Attendance.checked_in_at < _local_day_start(to_date + timedelta(days=1)))
    if query:
        pattern = f"%{_escaped_like(query.strip())}%"
        full_name = func.concat(Member.first_name, " ", Member.last_name)
        filters.append(
            or_(
                Member.member_code.ilike(pattern, escape="\\"),
                Member.first_name.ilike(pattern, escape="\\"),
                Member.last_name.ilike(pattern, escape="\\"),
                full_name.ilike(pattern, escape="\\"),
                Member.email.ilike(pattern, escape="\\"),
                Member.phone.ilike(pattern, escape="\\"),
            )
        )

    statement = (
        select(Attendance, Member, Membership, MembershipPlan)
        .join(Member, Member.id == Attendance.member_id)
        .outerjoin(Membership, Membership.id == Attendance.membership_id)
        .outerjoin(MembershipPlan, MembershipPlan.id == Membership.plan_id)
        .where(*filters)
    )
    total = (
        db.scalar(
            select(func.count())
            .select_from(Attendance)
            .join(Member, Member.id == Attendance.member_id)
            .where(*filters)
        )
        or 0
    )
    rows = db.execute(
        statement.order_by(Attendance.checked_in_at.desc()).offset(offset).limit(limit)
    ).all()
    return rows, total
