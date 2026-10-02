from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_auth
from app.db.session import get_db
from app.schemas.dashboard import DashboardOverview
from app.services.auth import AuthContext
from app.services.dashboard import get_dashboard_overview

router = APIRouter()
Db = Annotated[Session, Depends(get_db)]
CurrentAuth = Annotated[AuthContext, Depends(get_current_auth)]


@router.get("", response_model=DashboardOverview)
def read_dashboard(
    db: Db,
    _auth: CurrentAuth,
    trend_days: Annotated[int, Query(ge=7, le=30)] = 7,
    expiring_days: Annotated[int, Query(ge=30, le=90)] = 30,
) -> DashboardOverview:
    return get_dashboard_overview(
        db,
        trend_days=trend_days,
        expiring_within_days=expiring_days,
    )
