from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class AttendanceCreate(BaseModel):
    member_id: UUID
    notes: str | None = Field(default=None, max_length=1000)

    @field_validator("notes", mode="before")
    @classmethod
    def normalize_notes(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = " ".join(value.strip().split())
        return normalized or None


class AttendanceRead(BaseModel):
    id: UUID
    member_id: UUID
    member_code: str
    member_name: str
    membership_id: UUID | None
    plan_code: str | None
    plan_name: str | None
    checked_in_at: datetime
    checked_out_at: datetime | None
    is_open: bool
    duration_minutes: int | None
    notes: str | None
    created_at: datetime
    updated_at: datetime


class AttendanceListResponse(BaseModel):
    items: list[AttendanceRead]
    total: int
    limit: int
    offset: int


class AttendanceAccessMembership(BaseModel):
    id: UUID
    plan_code: str
    plan_name: str
    start_date: str
    end_date: str
    status: str


class AttendanceAccessRead(BaseModel):
    member_id: UUID
    member_code: str
    member_name: str
    member_active: bool
    eligible: bool
    reason: str
    membership: AttendanceAccessMembership | None
    open_visit: AttendanceRead | None
