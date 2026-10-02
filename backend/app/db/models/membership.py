from datetime import date
from decimal import Decimal
from uuid import UUID

from sqlalchemy import CheckConstraint, Date, ForeignKey, Index, Numeric, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Membership(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "memberships"
    __table_args__ = (
        CheckConstraint("end_date >= start_date", name="date_range_valid"),
        CheckConstraint("price_amount >= 0", name="price_amount_non_negative"),
        CheckConstraint("char_length(currency) = 3", name="currency_length"),
        CheckConstraint(
            "status IN ('scheduled', 'active', 'expired', 'cancelled', 'frozen')",
            name="status_valid",
        ),
        Index("ix_memberships_member_status", "member_id", "status"),
        Index("ix_memberships_status_end_date", "status", "end_date"),
    )

    member_id: Mapped[UUID] = mapped_column(
        ForeignKey("members.id", ondelete="RESTRICT"), nullable=False
    )
    plan_id: Mapped[UUID] = mapped_column(
        ForeignKey("membership_plans.id", ondelete="RESTRICT"), nullable=False
    )
    renewed_from_membership_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("memberships.id", ondelete="SET NULL"), nullable=True, unique=True
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(
        String(16), nullable=False, default="scheduled", server_default=text("'scheduled'")
    )
    price_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(
        String(3), nullable=False, default="INR", server_default=text("'INR'")
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
