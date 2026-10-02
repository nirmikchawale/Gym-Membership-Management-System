import re
from datetime import date, datetime
from typing import Self
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

_EMAIL_RE = re.compile(r"^[^@\s]{1,64}@[^@\s]{1,255}$")
_PHONE_RE = re.compile(r"^[0-9+() .-]{7,32}$")
_CODE_RE = re.compile(r"^[A-Z0-9][A-Z0-9_-]{0,31}$")


def _normalize_email(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = value.strip().lower()
    if not normalized:
        return None
    if len(normalized) > 320 or _EMAIL_RE.fullmatch(normalized) is None:
        raise ValueError("Enter a valid email address")
    return normalized


def _normalize_phone(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = " ".join(value.strip().split())
    if not normalized:
        return None
    if _PHONE_RE.fullmatch(normalized) is None:
        raise ValueError("Enter a valid phone number")
    return normalized


def _normalize_code(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = value.strip().upper()
    if not normalized:
        return None
    if _CODE_RE.fullmatch(normalized) is None:
        raise ValueError("Member code may contain only letters, numbers, hyphens and underscores")
    return normalized


class MemberCreate(BaseModel):
    member_code: str | None = Field(default=None, max_length=32)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: str | None = Field(default=None, max_length=320)
    phone: str | None = Field(default=None, max_length=32)
    date_of_birth: date | None = None
    joined_on: date | None = None

    @field_validator("member_code")
    @classmethod
    def normalize_member_code(cls, value: str | None) -> str | None:
        return _normalize_code(value)

    @field_validator("first_name", "last_name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        normalized = " ".join(value.strip().split())
        if not normalized:
            raise ValueError("Name cannot be blank")
        return normalized

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str | None) -> str | None:
        return _normalize_email(value)

    @field_validator("phone")
    @classmethod
    def normalize_phone(cls, value: str | None) -> str | None:
        return _normalize_phone(value)

    @model_validator(mode="after")
    def validate_dates(self) -> Self:
        today = date.today()
        if self.date_of_birth is not None and self.date_of_birth > today:
            raise ValueError("Date of birth cannot be in the future")
        if self.joined_on is not None and self.joined_on > today:
            raise ValueError("Joined date cannot be in the future")
        return self


class MemberUpdate(BaseModel):
    member_code: str | None = Field(default=None, max_length=32)
    first_name: str | None = Field(default=None, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    email: str | None = Field(default=None, max_length=320)
    phone: str | None = Field(default=None, max_length=32)
    date_of_birth: date | None = None
    joined_on: date | None = None

    @field_validator("member_code")
    @classmethod
    def normalize_member_code(cls, value: str | None) -> str | None:
        return _normalize_code(value)

    @field_validator("first_name", "last_name")
    @classmethod
    def normalize_optional_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = " ".join(value.strip().split())
        if not normalized:
            raise ValueError("Name cannot be blank")
        return normalized

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str | None) -> str | None:
        return _normalize_email(value)

    @field_validator("phone")
    @classmethod
    def normalize_phone(cls, value: str | None) -> str | None:
        return _normalize_phone(value)

    @model_validator(mode="after")
    def validate_dates(self) -> Self:
        today = date.today()
        if self.date_of_birth is not None and self.date_of_birth > today:
            raise ValueError("Date of birth cannot be in the future")
        if self.joined_on is not None and self.joined_on > today:
            raise ValueError("Joined date cannot be in the future")
        return self


class MemberRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    member_code: str
    first_name: str
    last_name: str
    email: str | None
    phone: str | None
    date_of_birth: date | None
    joined_on: date
    is_active: bool
    created_at: datetime
    updated_at: datetime


class MemberListResponse(BaseModel):
    items: list[MemberRead]
    total: int
    limit: int
    offset: int
