from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_auth, validate_csrf
from app.db.models.member import Member
from app.db.models.membership import Membership
from app.db.models.plan import MembershipPlan
from app.db.session import get_db
from app.schemas.membership import (
    MembershipCreate,
    MembershipListResponse,
    MembershipRead,
    MembershipRenew,
)
from app.services.auth import AuthContext
from app.services.memberships import (
    MembershipConflictError,
    MembershipInputError,
    MembershipNotFoundError,
    cancel_membership,
    create_membership,
    freeze_membership,
    get_membership,
    list_memberships,
    membership_context,
    renew_membership,
    resume_membership,
)

router = APIRouter()
Db = Annotated[Session, Depends(get_db)]
CurrentAuth = Annotated[AuthContext, Depends(get_current_auth)]
MembershipStatus = Literal["scheduled", "active", "expired", "cancelled", "frozen"]


def _not_found() -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Membership not found")


def _input_error(exc: MembershipInputError) -> HTTPException:
    return HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(exc))


def _conflict(exc: MembershipConflictError) -> HTTPException:
    return HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))


def _read(membership: Membership, member: Member, plan: MembershipPlan) -> MembershipRead:
    return MembershipRead(
        id=membership.id,
        member_id=member.id,
        member_code=member.member_code,
        member_name=f"{member.first_name} {member.last_name}".strip(),
        plan_id=plan.id,
        plan_code=plan.code,
        plan_name=plan.name,
        renewed_from_membership_id=membership.renewed_from_membership_id,
        start_date=membership.start_date,
        end_date=membership.end_date,
        status=membership.status,
        price_amount=membership.price_amount,
        currency=membership.currency,
        notes=membership.notes,
        created_at=membership.created_at,
        updated_at=membership.updated_at,
    )


def _read_one(db: Session, membership: Membership) -> MembershipRead:
    member, plan = membership_context(db, membership)
    return _read(membership, member, plan)


@router.get("", response_model=MembershipListResponse)
def read_memberships(
    db: Db,
    _auth: CurrentAuth,
    query: Annotated[str | None, Query(max_length=120)] = None,
    status_filter: Annotated[MembershipStatus | Literal["all"], Query(alias="status")] = "all",
    member_id: Annotated[UUID | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 25,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> MembershipListResponse:
    rows, total = list_memberships(
        db,
        query=query,
        status=None if status_filter == "all" else status_filter,
        member_id=member_id,
        limit=limit,
        offset=offset,
    )
    return MembershipListResponse(
        items=[_read(membership, member, plan) for membership, member, plan in rows],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{membership_id}", response_model=MembershipRead)
def read_membership(membership_id: UUID, db: Db, _auth: CurrentAuth) -> MembershipRead:
    try:
        return _read_one(db, get_membership(db, membership_id))
    except MembershipNotFoundError as exc:
        raise _not_found() from exc


@router.post("", response_model=MembershipRead, status_code=status.HTTP_201_CREATED)
def add_membership(
    request: Request,
    payload: MembershipCreate,
    db: Db,
    auth: CurrentAuth,
) -> MembershipRead:
    validate_csrf(request, auth)
    try:
        return _read_one(db, create_membership(db, payload))
    except MembershipInputError as exc:
        raise _input_error(exc) from exc
    except MembershipConflictError as exc:
        raise _conflict(exc) from exc


@router.post("/{membership_id}/renew", response_model=MembershipRead, status_code=status.HTTP_201_CREATED)
def renew(
    membership_id: UUID,
    request: Request,
    payload: MembershipRenew,
    db: Db,
    auth: CurrentAuth,
) -> MembershipRead:
    validate_csrf(request, auth)
    try:
        return _read_one(db, renew_membership(db, get_membership(db, membership_id), payload))
    except MembershipNotFoundError as exc:
        raise _not_found() from exc
    except MembershipInputError as exc:
        raise _input_error(exc) from exc
    except MembershipConflictError as exc:
        raise _conflict(exc) from exc


def _transition(
    membership_id: UUID,
    request: Request,
    db: Session,
    auth: AuthContext,
    action: str,
) -> MembershipRead:
    validate_csrf(request, auth)
    try:
        membership = get_membership(db, membership_id)
        if action == "cancel":
            membership = cancel_membership(db, membership)
        elif action == "freeze":
            membership = freeze_membership(db, membership)
        else:
            membership = resume_membership(db, membership)
        return _read_one(db, membership)
    except MembershipNotFoundError as exc:
        raise _not_found() from exc
    except MembershipInputError as exc:
        raise _input_error(exc) from exc


@router.post("/{membership_id}/cancel", response_model=MembershipRead)
def cancel(membership_id: UUID, request: Request, db: Db, auth: CurrentAuth) -> MembershipRead:
    return _transition(membership_id, request, db, auth, "cancel")


@router.post("/{membership_id}/freeze", response_model=MembershipRead)
def freeze(membership_id: UUID, request: Request, db: Db, auth: CurrentAuth) -> MembershipRead:
    return _transition(membership_id, request, db, auth, "freeze")


@router.post("/{membership_id}/resume", response_model=MembershipRead)
def resume(membership_id: UUID, request: Request, db: Db, auth: CurrentAuth) -> MembershipRead:
    return _transition(membership_id, request, db, auth, "resume")
