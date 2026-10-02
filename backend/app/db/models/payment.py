from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Numeric, String, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Payment(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "payments"
    __table_args__ = (
        CheckConstraint("amount > 0", name="amount_positive"),
        CheckConstraint("char_length(currency) = 3", name="currency_length"),
        CheckConstraint(
            "status IN ('pending', 'succeeded', 'failed', 'refunded', 'voided')",
            name="status_valid",
        ),
        CheckConstraint(
            "method IN ('cash', 'card', 'upi', 'bank_transfer', 'other')",
            name="method_valid",
        ),
        Index("ix_payments_membership_status", "membership_id", "status"),
        Index("ix_payments_paid_at", "paid_at"),
    )

    membership_id: Mapped[UUID] = mapped_column(
        ForeignKey("memberships.id", ondelete="RESTRICT"), nullable=False
    )
    external_reference: Mapped[str | None] = mapped_column(String(100), nullable=True, unique=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(
        String(3), nullable=False, default="INR", server_default=text("'INR'")
    )
    status: Mapped[str] = mapped_column(
        String(16), nullable=False, default="pending", server_default=text("'pending'")
    )
    method: Mapped[str] = mapped_column(String(20), nullable=False)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
