from decimal import Decimal

from sqlalchemy import Boolean, CheckConstraint, Integer, Numeric, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class MembershipPlan(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "membership_plans"
    __table_args__ = (
        CheckConstraint("length(trim(code)) > 0", name="code_not_blank"),
        CheckConstraint("length(trim(name)) > 0", name="name_not_blank"),
        CheckConstraint("duration_days > 0", name="duration_days_positive"),
        CheckConstraint("price >= 0", name="price_non_negative"),
        CheckConstraint("char_length(currency) = 3", name="currency_length"),
    )

    code: Mapped[str] = mapped_column(String(32), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    duration_days: Mapped[int] = mapped_column(Integer, nullable=False)
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(
        String(3), nullable=False, default="INR", server_default=text("'INR'")
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default=text("true")
    )
