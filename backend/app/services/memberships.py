from collections.abc import Sequence
from datetime import date, datetime, timedelta
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy.sql.elements import ColumnElement

from app.core.config import settings
from app.db.models.member import Member
from app.db.models.membership import Membership
from app.db.models.plan import MembershipPlan
from app.schemas.membership import MembershipCreate, MembershipRenew

LIVE_STATUSES = ("scheduled", "active", "frozen")


class MembershipNotFoundError(Exception):
    pass


class MembershipConflictError(Exception):
    pass


class MembershipInputError(Exception):
    pass


def business_date() -> date:
    return datetime.now(settings.timezone).date()


def _escaped_like(value: str) -> str:
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def _effective_status(membership: Membership, today: date) -> str:
    if membership.status == "cancelled":
        return "cancelled"
    if membership.end_date < today:
        return "expired"
    if membership.status == "frozen":
        return "frozen"
    if membership.start_date > today:
        return "scheduled"
    return "active"


def synchronize_membership_statuses(db: Session) -> None:
    today = business_date()
    memberships = db.scalars(
        select(Membership).where(Membership.status.in_(("scheduled", "active", "frozen")))
    ).all()
    changed = False
    for membership in memberships:
        effective = _effective_status(membership, today)
        if effective != membership.status:
            membership.status = effective
            changed = True
    if changed:
        db.commit()


def get_membership(db: Session, membership_id: UUID) -> Membership:
    synchronize_membership_statuses(db)
    membership = db.get(Membership, membership_id)
    if membership is None:
        raise MembershipNotFoundError
    return membership


def membership_context(db: Session, membership: Membership) -> tuple[Member, MembershipPlan]:
    member = db.get(Member, membership.member_id)
    plan = db.get(MembershipPlan, membership.plan_id)
    if member is None or plan is None:
        raise MembershipInputError("Membership references unavailable member or plan data")
    return member, plan


def list_memberships(
    db: Session,
    *,
    query: str | None,
    status: str | None,
    member_id: UUID | None,
    limit: int,
    offset: int,
) -> tuple[Sequence[tuple[Membership, Member, MembershipPlan]], int]:
    synchronize_membership_statuses(db)
    filters: list[ColumnElement[bool]] = []
    if status is not None:
        filters.append(Membership.status == status)
    if member_id is not None:
        filters.append(Membership.member_id == member_id)
    if query:
        pattern = f"%{_escaped_like(query.strip())}%"
        full_name = func.concat(Member.first_name, " ", Member.last_name)
        filters.append(
            or_(
                Member.member_code.ilike(pattern, escape="\\"),
                Member.first_name.ilike(pattern, escape="\\"),
                Member.last_name.ilike(pattern, escape="\\"),
                full_name.ilike(pattern, escape="\\"),
                MembershipPlan.code.ilike(pattern, escape="\\"),
                MembershipPlan.name.ilike(pattern, escape="\\"),
            )
        )

    joined = (
        select(Membership, Member, MembershipPlan)
        .join(Member, Member.id == Membership.member_id)
        .join(MembershipPlan, MembershipPlan.id == Membership.plan_id)
        .where(*filters)
    )
    total = (
        db.scalar(
            select(func.count())
            .select_from(Membership)
            .join(Member, Member.id == Membership.member_id)
            .join(MembershipPlan, MembershipPlan.id == Membership.plan_id)
            .where(*filters)
        )
        or 0
    )
    rows = db.execute(
        joined.order_by(Membership.end_date.asc(), Membership.created_at.desc())
        .offset(offset)
        .limit(limit)
    ).all()
    return rows, total


def _validate_assignment(
    db: Session, member_id: UUID, plan_id: UUID
) -> tuple[Member, MembershipPlan]:
    member = db.get(Member, member_id)
    if member is None:
        raise MembershipInputError("Member not found")
    if not member.is_active:
        raise MembershipInputError("Inactive members cannot receive a new membership")
    plan = db.get(MembershipPlan, plan_id)
    if plan is None:
        raise MembershipInputError("Membership plan not found")
    if not plan.is_active:
        raise MembershipInputError("Inactive plans cannot be assigned")
    return member, plan


def _dates_for_plan(plan: MembershipPlan, start_date: date) -> tuple[date, date]:
    return start_date, start_date + timedelta(days=plan.duration_days - 1)


def _ensure_no_overlap(
    db: Session,
    *,
    member_id: UUID,
    start_date: date,
    end_date: date,
) -> None:
    existing = db.scalar(
        select(Membership.id).where(
            Membership.member_id == member_id,
            Membership.status.in_(LIVE_STATUSES),
            Membership.start_date <= end_date,
            Membership.end_date >= start_date,
        )
    )
    if existing is not None:
        raise MembershipConflictError("Member already has an overlapping live membership")


def create_membership(
    db: Session,
    payload: MembershipCreate,
    *,
    renewed_from_membership_id: UUID | None = None,
) -> Membership:
    _member, plan = _validate_assignment(db, payload.member_id, payload.plan_id)
    today = business_date()
    start_date = payload.start_date or today
    start_date, end_date = _dates_for_plan(plan, start_date)
    if end_date < today:
        raise MembershipInputError("Membership cannot end before the current business date")
    _ensure_no_overlap(
        db,
        member_id=payload.member_id,
        start_date=start_date,
        end_date=end_date,
    )
    membership = Membership(
        member_id=payload.member_id,
        plan_id=payload.plan_id,
        renewed_from_membership_id=renewed_from_membership_id,
        start_date=start_date,
        end_date=end_date,
        status="scheduled" if start_date > today else "active",
        price_amount=plan.price,
        currency=plan.currency,
        notes=payload.notes,
    )
    db.add(membership)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise MembershipConflictError("Membership could not be created") from exc
    db.refresh(membership)
    return membership


def renew_membership(db: Session, membership: Membership, payload: MembershipRenew) -> Membership:
    synchronize_membership_statuses(db)
    db.refresh(membership)
    if membership.status in {"cancelled", "scheduled"}:
        raise MembershipInputError(f"Cannot renew a {membership.status} membership")
    existing_child = db.scalar(
        select(Membership.id).where(Membership.renewed_from_membership_id == membership.id)
    )
    if existing_child is not None:
        raise MembershipConflictError("This membership has already been renewed")

    today = business_date()
    default_start = max(today, membership.end_date + timedelta(days=1))
    start_date = payload.start_date or default_start
    if start_date <= membership.end_date:
        raise MembershipInputError("Renewal must start after the membership being renewed")
    plan_id = payload.plan_id or membership.plan_id
    create_payload = MembershipCreate(
        member_id=membership.member_id,
        plan_id=plan_id,
        start_date=start_date,
        notes=payload.notes,
    )
    return create_membership(db, create_payload, renewed_from_membership_id=membership.id)


def cancel_membership(db: Session, membership: Membership) -> Membership:
    synchronize_membership_statuses(db)
    db.refresh(membership)
    if membership.status in {"expired", "cancelled"}:
        raise MembershipInputError(f"Cannot cancel a {membership.status} membership")
    membership.status = "cancelled"
    db.commit()
    db.refresh(membership)
    return membership


def freeze_membership(db: Session, membership: Membership) -> Membership:
    synchronize_membership_statuses(db)
    db.refresh(membership)
    if membership.status != "active":
        raise MembershipInputError("Only active memberships can be frozen")
    membership.status = "frozen"
    db.commit()
    db.refresh(membership)
    return membership


def resume_membership(db: Session, membership: Membership) -> Membership:
    synchronize_membership_statuses(db)
    db.refresh(membership)
    if membership.status != "frozen":
        raise MembershipInputError("Only frozen memberships can be resumed")
    membership.status = "expired" if membership.end_date < business_date() else "active"
    db.commit()
    db.refresh(membership)
    return membership
