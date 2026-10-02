import re
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

_CODE_RE = re.compile(r"^[A-Z0-9][A-Z0-9_-]{0,31}$")
_CURRENCY_RE = re.compile(r"^[A-Z]{3}$")
_MAX_PRICE = Decimal("9999999999.99")


def _normalize_code(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = value.strip().upper()
    if not normalized:
        return None
    if _CODE_RE.fullmatch(normalized) is None:
        raise ValueError("Plan code may contain only letters, numbers, hyphens and underscores")
    return normalized


def _normalize_name(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = " ".join(value.strip().split())
    if not normalized:
        raise ValueError("Plan name cannot be blank")
    return normalized


def _normalize_description(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = " ".join(value.strip().split())
    return normalized or None


def _normalize_currency(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = value.strip().upper()
    if _CURRENCY_RE.fullmatch(normalized) is None:
        raise ValueError("Currency must be a three-letter code")
    return normalized


class PlanCreate(BaseModel):
    code: str = Field(min_length=1, max_length=32)
    name: str = Field(min_length=1, max_length=120)
    description: str | None = None
    duration_days: int = Field(ge=1, le=3650)
    price: Decimal = Field(ge=Decimal("0"), le=_MAX_PRICE, max_digits=12, decimal_places=2)
    currency: str = Field(default="INR", min_length=3, max_length=3)

    @field_validator("code")
    @classmethod
    def normalize_code(cls, value: str) -> str:
        normalized = _normalize_code(value)
        if normalized is None:
            raise ValueError("Plan code cannot be blank")
        return normalized

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        normalized = _normalize_name(value)
        if normalized is None:
            raise ValueError("Plan name cannot be blank")
        return normalized

    @field_validator("description")
    @classmethod
    def normalize_description(cls, value: str | None) -> str | None:
        return _normalize_description(value)

    @field_validator("currency")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        normalized = _normalize_currency(value)
        if normalized is None:
            raise ValueError("Currency cannot be blank")
        return normalized


class PlanUpdate(BaseModel):
    code: str | None = Field(default=None, max_length=32)
    name: str | None = Field(default=None, max_length=120)
    description: str | None = None
    duration_days: int | None = Field(default=None, ge=1, le=3650)
    price: Decimal | None = Field(
        default=None, ge=Decimal("0"), le=_MAX_PRICE, max_digits=12, decimal_places=2
    )
    currency: str | None = Field(default=None, min_length=3, max_length=3)

    @field_validator("code")
    @classmethod
    def normalize_code(cls, value: str | None) -> str | None:
        return _normalize_code(value)

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str | None) -> str | None:
        return _normalize_name(value)

    @field_validator("description")
    @classmethod
    def normalize_description(cls, value: str | None) -> str | None:
        return _normalize_description(value)

    @field_validator("currency")
    @classmethod
    def normalize_currency(cls, value: str | None) -> str | None:
        return _normalize_currency(value)


class PlanRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    code: str
    name: str
    description: str | None
    duration_days: int
    price: Decimal
    currency: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class PlanListResponse(BaseModel):
    items: list[PlanRead]
    total: int
    limit: int
    offset: int
