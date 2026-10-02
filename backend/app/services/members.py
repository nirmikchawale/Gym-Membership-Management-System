from collections.abc import Sequence
from uuid import UUID, uuid4

from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.models.member import Member
from app.schemas.member import MemberCreate, MemberUpdate


class MemberNotFoundError(Exception):
    pass


class MemberConflictError(Exception):
    pass


class MemberInputError(Exception):
    pass


def _escaped_like(value: str) -> str:
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def get_member(db: Session, member_id: UUID) -> Member:
    member = db.get(Member, member_id)
    if member is None:
        raise MemberNotFoundError
    return member


def list_members(
    db: Session,
    *,
    query: str | None,
    active: bool | None,
    limit: int,
    offset: int,
) -> tuple[Sequence[Member], int]:
    filters = []
    if active is not None:
        filters.append(Member.is_active.is_(active))

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

    total = db.scalar(select(func.count()).select_from(Member).where(*filters)) or 0
    members = db.scalars(
        select(Member)
        .where(*filters)
        .order_by(Member.created_at.desc(), Member.member_code.asc())
        .offset(offset)
        .limit(limit)
    ).all()
    return members, total


def create_member(db: Session, payload: MemberCreate) -> Member:
    member = Member(
        member_code=payload.member_code or f"GST-{uuid4().hex[:8].upper()}",
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email,
        phone=payload.phone,
        date_of_birth=payload.date_of_birth,
    )
    if payload.joined_on is not None:
        member.joined_on = payload.joined_on

    db.add(member)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise MemberConflictError from exc
    db.refresh(member)
    return member


def update_member(db: Session, member: Member, payload: MemberUpdate) -> Member:
    changes = payload.model_dump(exclude_unset=True)
    for required_field in ("member_code", "first_name", "last_name", "joined_on"):
        if required_field in changes and changes[required_field] is None:
            raise MemberInputError(f"{required_field} cannot be null")

    for field, value in changes.items():
        setattr(member, field, value)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise MemberConflictError from exc
    db.refresh(member)
    return member


def set_member_active(db: Session, member: Member, *, is_active: bool) -> Member:
    member.is_active = is_active
    db.commit()
    db.refresh(member)
    return member
