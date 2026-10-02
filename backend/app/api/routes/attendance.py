from datetime import date
from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_auth, validate_csrf
from app.db.models.attendance import Attendance
from app.db.models.member import Member
from app.db.models.membership import Membership
from app.db.models.plan import MembershipPlan
from app.db.session import get_db
from app.schemas.attendance import (
    AttendanceAccessMembership,
    AttendanceAccessRead,
    AttendanceCreate,
    AttendanceListResponse,
    AttendanceRead,
)
from app.services.attendance import (
    AttendanceAccessError,
    AttendanceConflictError,
    AttendanceMemberNotFoundError,
    AttendanceNotFoundError,
    access_decision,
    attendance_context,
    check_in,
    check_out,
    get_attendance,
    list_attendance,
)
from app.services.auth import AuthContext

router = APIRouter()
Db = Annotated[Session, Depends(get_db)]
CurrentAuth = Annotated[AuthContext, Depends(get_current_auth)]
AttendanceState = Literal["open", "closed"]


def _member_not_found() -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")


def _visit_not_found() -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attendance visit not found")


def _duration_minutes(visit: Attendance) -> int | None:
    if visit.checked_out_at is None:
        return None
    return max(0, int((visit.checked_out_at - visit.checked_in_at).total_seconds() // 60))


def _read(
    visit: Attendance,
    member: Member,
    membership: Membership | None,
    plan: MembershipPlan | None,
) -> AttendanceRead:
    return AttendanceRead(
        id=visit.id,
        member_id=member.id,
        member_code=member.member_code,
        member_name=f"{member.first_name} {member.last_name}".strip(),
        membership_id=membership.id if membership else None,
        plan_code=plan.code if plan else None,
        plan_name=plan.name if plan else None,
        checked_in_at=visit.checked_in_at,
        checked_out_at=visit.checked_out_at,
        is_open=visit.checked_out_at is None,
        duration_minutes=_duration_minutes(visit),
        notes=visit.notes,
        created_at=visit.created_at,
        updated_at=visit.updated_at,
    )


def _read_one(db: Session, visit: Attendance) -> AttendanceRead:
    member, membership, plan = attendance_context(db, visit)
    return _read(visit, member, membership, plan)


@router.get("", response_model=AttendanceListResponse)
def read_attendance(
    db: Db,
    _auth: CurrentAuth,
    query: Annotated[str | None, Query(max_length=120)] = None,
    state_filter: Annotated[AttendanceState | Literal["all"], Query(alias="state")] = "all",
    from_date: Annotated[date | None, Query(alias="from")] = None,
    to_date: Annotated[date | None, Query(alias="to")] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 25,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> AttendanceListResponse:
    if from_date and to_date and from_date > to_date:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Attendance date range is invalid",
        )
    rows, total = list_attendance(
        db,
        query=query,
        state=None if state_filter == "all" else state_filter,
        from_date=from_date,
        to_date=to_date,
        limit=limit,
        offset=offset,
    )
    return AttendanceListResponse(
        items=[_read(visit, member, membership, plan) for visit, member, membership, plan in rows],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/access/{member_id}", response_model=AttendanceAccessRead)
def read_access(member_id: UUID, db: Db, _auth: CurrentAuth) -> AttendanceAccessRead:
    try:
        member, membership, plan, open_visit, eligible, reason = access_decision(db, member_id)
    except AttendanceMemberNotFoundError as exc:
        raise _member_not_found() from exc

    membership_read = None
    if membership is not None and plan is not None:
        membership_read = AttendanceAccessMembership(
            id=membership.id,
            plan_code=plan.code,
            plan_name=plan.name,
            start_date=str(membership.start_date),
            end_date=str(membership.end_date),
            status=membership.status,
        )

    return AttendanceAccessRead(
        member_id=member.id,
        member_code=member.member_code,
        member_name=f"{member.first_name} {member.last_name}".strip(),
        member_active=member.is_active,
        eligible=eligible,
        reason=reason,
        membership=membership_read,
        open_visit=_read_one(db, open_visit) if open_visit is not None else None,
    )


@router.get("/{attendance_id}", response_model=AttendanceRead)
def read_visit(attendance_id: UUID, db: Db, _auth: CurrentAuth) -> AttendanceRead:
    try:
        return _read_one(db, get_attendance(db, attendance_id))
    except AttendanceNotFoundError as exc:
        raise _visit_not_found() from exc


@router.post("", response_model=AttendanceRead, status_code=status.HTTP_201_CREATED)
def add_check_in(
    request: Request,
    payload: AttendanceCreate,
    db: Db,
    auth: CurrentAuth,
) -> AttendanceRead:
    validate_csrf(request, auth)
    try:
        return _read_one(db, check_in(db, payload))
    except AttendanceMemberNotFoundError as exc:
        raise _member_not_found() from exc
    except AttendanceAccessError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(exc)
        ) from exc
    except AttendanceConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.post("/{attendance_id}/checkout", response_model=AttendanceRead)
def add_check_out(
    attendance_id: UUID,
    request: Request,
    db: Db,
    auth: CurrentAuth,
) -> AttendanceRead:
    validate_csrf(request, auth)
    try:
        return _read_one(db, check_out(db, get_attendance(db, attendance_id)))
    except AttendanceNotFoundError as exc:
        raise _visit_not_found() from exc
    except AttendanceConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
