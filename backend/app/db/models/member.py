from datetime import date

from sqlalchemy import Boolean, CheckConstraint, Date, String, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Member(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "members"
    __table_args__ = (
        CheckConstraint("length(trim(member_code)) > 0", name="member_code_not_blank"),
        CheckConstraint("length(trim(first_name)) > 0", name="first_name_not_blank"),
        CheckConstraint("length(trim(last_name)) > 0", name="last_name_not_blank"),
        CheckConstraint("email IS NULL OR email = lower(email)", name="email_lowercase"),
    )

    member_code: Mapped[str] = mapped_column(String(32), nullable=False, unique=True)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str | None] = mapped_column(String(320), nullable=True, unique=True)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True, unique=True)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    joined_on: Mapped[date] = mapped_column(
        Date, nullable=False, server_default=text("CURRENT_DATE")
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("true"), default=True
    )
