from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_auth, require_admin, validate_csrf
from app.db.session import get_db
from app.schemas.plan import PlanCreate, PlanListResponse, PlanRead, PlanUpdate
from app.services.auth import AuthContext
from app.services.plans import (
    PlanConflictError,
    PlanInputError,
    PlanNotFoundError,
    create_plan,
    get_plan,
    list_plans,
    set_plan_active,
    update_plan,
)

router = APIRouter()
Db = Annotated[Session, Depends(get_db)]
CurrentAuth = Annotated[AuthContext, Depends(get_current_auth)]
AdminAuth = Annotated[AuthContext, Depends(require_admin)]


def _not_found() -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Membership plan not found")


def _conflict() -> HTTPException:
    return HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Plan code already exists")


@router.get("", response_model=PlanListResponse)
def read_plans(
    db: Db,
    _auth: CurrentAuth,
    query: Annotated[str | None, Query(max_length=120)] = None,
    status_filter: Annotated[Literal["all", "active", "inactive"], Query(alias="status")] = "all",
    limit: Annotated[int, Query(ge=1, le=100)] = 25,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> PlanListResponse:
    active = None if status_filter == "all" else status_filter == "active"
    plans, total = list_plans(db, query=query, active=active, limit=limit, offset=offset)
    return PlanListResponse(
        items=[PlanRead.model_validate(plan) for plan in plans],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{plan_id}", response_model=PlanRead)
def read_plan(plan_id: UUID, db: Db, _auth: CurrentAuth) -> PlanRead:
    try:
        return PlanRead.model_validate(get_plan(db, plan_id))
    except PlanNotFoundError as exc:
        raise _not_found() from exc


@router.post("", response_model=PlanRead, status_code=status.HTTP_201_CREATED)
def add_plan(request: Request, payload: PlanCreate, db: Db, auth: AdminAuth) -> PlanRead:
    validate_csrf(request, auth)
    try:
        return PlanRead.model_validate(create_plan(db, payload))
    except PlanConflictError as exc:
        raise _conflict() from exc


@router.patch("/{plan_id}", response_model=PlanRead)
def edit_plan(
    plan_id: UUID,
    request: Request,
    payload: PlanUpdate,
    db: Db,
    auth: AdminAuth,
) -> PlanRead:
    validate_csrf(request, auth)
    try:
        plan = get_plan(db, plan_id)
        return PlanRead.model_validate(update_plan(db, plan, payload))
    except PlanNotFoundError as exc:
        raise _not_found() from exc
    except PlanConflictError as exc:
        raise _conflict() from exc
    except PlanInputError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(exc)
        ) from exc


@router.post("/{plan_id}/deactivate", response_model=PlanRead)
def deactivate_plan(plan_id: UUID, request: Request, db: Db, auth: AdminAuth) -> PlanRead:
    validate_csrf(request, auth)
    try:
        return PlanRead.model_validate(set_plan_active(db, get_plan(db, plan_id), is_active=False))
    except PlanNotFoundError as exc:
        raise _not_found() from exc


@router.post("/{plan_id}/activate", response_model=PlanRead)
def activate_plan(plan_id: UUID, request: Request, db: Db, auth: AdminAuth) -> PlanRead:
    validate_csrf(request, auth)
    try:
        return PlanRead.model_validate(set_plan_active(db, get_plan(db, plan_id), is_active=True))
    except PlanNotFoundError as exc:
        raise _not_found() from exc
