from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class MembershipCreate(BaseModel):
    member_id: UUID
    plan_id: UUID
    start_date: date | None = None
    notes: str | None = Field(default=None, max_length=2000)

    @field_validator("notes", mode="before")
    @classmethod
    def normalize_notes(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = " ".join(value.strip().split())
        return normalized or None


class MembershipRenew(BaseModel):
    plan_id: UUID | None = None
    start_date: date | None = None
    notes: str | None = Field(default=None, max_length=2000)

    @field_validator("notes", mode="before")
    @classmethod
    def normalize_notes(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = " ".join(value.strip().split())
        return normalized or None


class MembershipRead(BaseModel):
    id: UUID
    member_id: UUID
    member_code: str
    member_name: str
    plan_id: UUID
    plan_code: str
    plan_name: str
    renewed_from_membership_id: UUID | None
    start_date: date
    end_date: date
    status: str
    price_amount: Decimal
    currency: str
    notes: str | None
    created_at: datetime
    updated_at: datetime


class MembershipListResponse(BaseModel):
    items: list[MembershipRead]
    total: int
    limit: int
    offset: int
