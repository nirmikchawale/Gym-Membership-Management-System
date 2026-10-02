from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy.sql.elements import ColumnElement

from app.db.models.plan import MembershipPlan
from app.schemas.plan import PlanCreate, PlanUpdate


class PlanNotFoundError(Exception):
    pass


class PlanConflictError(Exception):
    pass


class PlanInputError(Exception):
    pass


def _escaped_like(value: str) -> str:
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def get_plan(db: Session, plan_id: UUID) -> MembershipPlan:
    plan = db.get(MembershipPlan, plan_id)
    if plan is None:
        raise PlanNotFoundError
    return plan


def list_plans(
    db: Session,
    *,
    query: str | None,
    active: bool | None,
    limit: int,
    offset: int,
) -> tuple[Sequence[MembershipPlan], int]:
    filters: list[ColumnElement[bool]] = []
    if active is not None:
        filters.append(MembershipPlan.is_active.is_(active))

    if query:
        pattern = f"%{_escaped_like(query.strip())}%"
        filters.append(
            or_(
                MembershipPlan.code.ilike(pattern, escape="\\"),
                MembershipPlan.name.ilike(pattern, escape="\\"),
                MembershipPlan.description.ilike(pattern, escape="\\"),
            )
        )

    total = db.scalar(select(func.count()).select_from(MembershipPlan).where(*filters)) or 0
    plans = db.scalars(
        select(MembershipPlan)
        .where(*filters)
        .order_by(
            MembershipPlan.is_active.desc(),
            MembershipPlan.duration_days.asc(),
            MembershipPlan.code.asc(),
        )
        .offset(offset)
        .limit(limit)
    ).all()
    return plans, total


def create_plan(db: Session, payload: PlanCreate) -> MembershipPlan:
    plan = MembershipPlan(
        code=payload.code,
        name=payload.name,
        description=payload.description,
        duration_days=payload.duration_days,
        price=payload.price,
        currency=payload.currency,
    )
    db.add(plan)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise PlanConflictError from exc
    db.refresh(plan)
    return plan


def update_plan(db: Session, plan: MembershipPlan, payload: PlanUpdate) -> MembershipPlan:
    changes = payload.model_dump(exclude_unset=True)
    for required_field in ("code", "name", "duration_days", "price", "currency"):
        if required_field in changes and changes[required_field] is None:
            raise PlanInputError(f"{required_field} cannot be null")

    for field, value in changes.items():
        setattr(plan, field, value)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise PlanConflictError from exc
    db.refresh(plan)
    return plan


def set_plan_active(db: Session, plan: MembershipPlan, *, is_active: bool) -> MembershipPlan:
    plan.is_active = is_active
    db.commit()
    db.refresh(plan)
    return plan
