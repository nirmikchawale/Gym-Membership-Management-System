from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db

router = APIRouter()


class HealthResponse(BaseModel):
    status: str
    database: str
    service: str
    version: str


@router.get("", response_model=HealthResponse, summary="Check API and database health")
def health(db: Session = Depends(get_db)) -> HealthResponse:
    try:
        db.execute(text("SELECT 1"))
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connectivity check failed",
        ) from exc

    return HealthResponse(
        status="ok",
        database="ok",
        service="gym-membership-api",
        version=settings.app_version,
    )
