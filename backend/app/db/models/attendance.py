from datetime import datetime
from uuid import UUID

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Attendance(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "attendance"
    __table_args__ = (
        CheckConstraint(
            "checked_out_at IS NULL OR checked_out_at >= checked_in_at",
            name="checkout_after_checkin",
        ),
        Index("ix_attendance_member_checked_in", "member_id", "checked_in_at"),
        Index("ix_attendance_membership_checked_in", "membership_id", "checked_in_at"),
        Index(
            "uq_attendance_one_open_visit_per_member",
            "member_id",
            unique=True,
            postgresql_where=text("checked_out_at IS NULL"),
        ),
    )

    member_id: Mapped[UUID] = mapped_column(
        ForeignKey("members.id", ondelete="RESTRICT"), nullable=False
    )
    membership_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("memberships.id", ondelete="RESTRICT"), nullable=True
    )
    checked_in_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )
    checked_out_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
