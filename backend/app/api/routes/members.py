from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_auth, validate_csrf
from app.db.session import get_db
from app.schemas.member import MemberCreate, MemberListResponse, MemberRead, MemberUpdate
from app.services.auth import AuthContext
from app.services.members import (
    MemberConflictError,
    MemberInputError,
    MemberNotFoundError,
    create_member,
    get_member,
    list_members,
    set_member_active,
    update_member,
)

router = APIRouter()
Db = Annotated[Session, Depends(get_db)]
CurrentAuth = Annotated[AuthContext, Depends(get_current_auth)]


def _not_found() -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")


def _conflict() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="Member code, email, or phone already exists",
    )


@router.get("", response_model=MemberListResponse)
def read_members(
    db: Db,
    _auth: CurrentAuth,
    query: Annotated[str | None, Query(max_length=120)] = None,
    status_filter: Annotated[Literal["all", "active", "inactive"], Query(alias="status")] = "all",
    limit: Annotated[int, Query(ge=1, le=100)] = 25,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> MemberListResponse:
    active = None if status_filter == "all" else status_filter == "active"
    members, total = list_members(
        db,
        query=query,
        active=active,
        limit=limit,
        offset=offset,
    )
    return MemberListResponse(
        items=[MemberRead.model_validate(member) for member in members],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{member_id}", response_model=MemberRead)
def read_member(member_id: UUID, db: Db, _auth: CurrentAuth) -> MemberRead:
    try:
        return MemberRead.model_validate(get_member(db, member_id))
    except MemberNotFoundError as exc:
        raise _not_found() from exc


@router.post("", response_model=MemberRead, status_code=status.HTTP_201_CREATED)
def add_member(request: Request, payload: MemberCreate, db: Db, auth: CurrentAuth) -> MemberRead:
    validate_csrf(request, auth)
    try:
        return MemberRead.model_validate(create_member(db, payload))
    except MemberConflictError as exc:
        raise _conflict() from exc


@router.patch("/{member_id}", response_model=MemberRead)
def edit_member(
    member_id: UUID,
    request: Request,
    payload: MemberUpdate,
    db: Db,
    auth: CurrentAuth,
) -> MemberRead:
    validate_csrf(request, auth)
    try:
        member = get_member(db, member_id)
        return MemberRead.model_validate(update_member(db, member, payload))
    except MemberNotFoundError as exc:
        raise _not_found() from exc
    except MemberConflictError as exc:
        raise _conflict() from exc
    except MemberInputError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(exc)
        ) from exc


@router.post("/{member_id}/deactivate", response_model=MemberRead)
def deactivate_member(member_id: UUID, request: Request, db: Db, auth: CurrentAuth) -> MemberRead:
    validate_csrf(request, auth)
    try:
        return MemberRead.model_validate(
            set_member_active(db, get_member(db, member_id), is_active=False)
        )
    except MemberNotFoundError as exc:
        raise _not_found() from exc


@router.post("/{member_id}/activate", response_model=MemberRead)
def activate_member(member_id: UUID, request: Request, db: Db, auth: CurrentAuth) -> MemberRead:
    validate_csrf(request, auth)
    try:
        return MemberRead.model_validate(
            set_member_active(db, get_member(db, member_id), is_active=True)
        )
    except MemberNotFoundError as exc:
        raise _not_found() from exc
