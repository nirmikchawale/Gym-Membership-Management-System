"""Create the Phase 3B database foundation.

Revision ID: 20261002_0001
Revises: None
Create Date: 2026-10-02
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "20261002_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _timestamps() -> list[sa.Column[object]]:
    return [
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    ]


def upgrade() -> None:
    op.create_table(
        "members",
        sa.Column("member_code", sa.String(length=32), nullable=False),
        sa.Column("first_name", sa.String(length=100), nullable=False),
        sa.Column("last_name", sa.String(length=100), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=True),
        sa.Column("phone", sa.String(length=32), nullable=True),
        sa.Column("date_of_birth", sa.Date(), nullable=True),
        sa.Column(
            "joined_on", sa.Date(), server_default=sa.text("CURRENT_DATE"), nullable=False
        ),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        *_timestamps(),
        sa.CheckConstraint(
            "email IS NULL OR email = lower(email)",
            name=op.f("ck_members_email_lowercase"),
        ),
        sa.CheckConstraint(
            "length(trim(first_name)) > 0", name=op.f("ck_members_first_name_not_blank")
        ),
        sa.CheckConstraint(
            "length(trim(last_name)) > 0", name=op.f("ck_members_last_name_not_blank")
        ),
        sa.CheckConstraint(
            "length(trim(member_code)) > 0", name=op.f("ck_members_member_code_not_blank")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_members")),
        sa.UniqueConstraint("email", name=op.f("uq_members_email")),
        sa.UniqueConstraint("member_code", name=op.f("uq_members_member_code")),
        sa.UniqueConstraint("phone", name=op.f("uq_members_phone")),
    )

    op.create_table(
        "membership_plans",
        sa.Column("code", sa.String(length=32), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("duration_days", sa.Integer(), nullable=False),
        sa.Column("price", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("currency", sa.String(length=3), server_default=sa.text("'INR'"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        *_timestamps(),
        sa.CheckConstraint(
            "length(trim(code)) > 0", name=op.f("ck_membership_plans_code_not_blank")
        ),
        sa.CheckConstraint(
            "char_length(currency) = 3", name=op.f("ck_membership_plans_currency_length")
        ),
        sa.CheckConstraint(
            "duration_days > 0", name=op.f("ck_membership_plans_duration_days_positive")
        ),
        sa.CheckConstraint(
            "length(trim(name)) > 0", name=op.f("ck_membership_plans_name_not_blank")
        ),
        sa.CheckConstraint(
            "price >= 0", name=op.f("ck_membership_plans_price_non_negative")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_membership_plans")),
        sa.UniqueConstraint("code", name=op.f("uq_membership_plans_code")),
    )

    op.create_table(
        "memberships",
        sa.Column("member_id", sa.Uuid(), nullable=False),
        sa.Column("plan_id", sa.Uuid(), nullable=False),
        sa.Column("renewed_from_membership_id", sa.Uuid(), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column(
            "status", sa.String(length=16), server_default=sa.text("'scheduled'"), nullable=False
        ),
        sa.Column("price_amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("currency", sa.String(length=3), server_default=sa.text("'INR'"), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        *_timestamps(),
        sa.CheckConstraint(
            "char_length(currency) = 3", name=op.f("ck_memberships_currency_length")
        ),
        sa.CheckConstraint("end_date >= start_date", name=op.f("ck_memberships_date_range_valid")),
        sa.CheckConstraint(
            "price_amount >= 0", name=op.f("ck_memberships_price_amount_non_negative")
        ),
        sa.CheckConstraint(
            "status IN ('scheduled', 'active', 'expired', 'cancelled', 'frozen')",
            name=op.f("ck_memberships_status_valid"),
        ),
        sa.ForeignKeyConstraint(
            ["member_id"],
            ["members.id"],
            name=op.f("fk_memberships_member_id_members"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["plan_id"],
            ["membership_plans.id"],
            name=op.f("fk_memberships_plan_id_membership_plans"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["renewed_from_membership_id"],
            ["memberships.id"],
            name=op.f("fk_memberships_renewed_from_membership_id_memberships"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_memberships")),
        sa.UniqueConstraint(
            "renewed_from_membership_id",
            name=op.f("uq_memberships_renewed_from_membership_id"),
        ),
    )
    op.create_index(
        "ix_memberships_member_status", "memberships", ["member_id", "status"], unique=False
    )
    op.create_index(
        "ix_memberships_status_end_date", "memberships", ["status", "end_date"], unique=False
    )

    op.create_table(
        "attendance",
        sa.Column("member_id", sa.Uuid(), nullable=False),
        sa.Column(
            "checked_in_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("checked_out_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        *_timestamps(),
        sa.CheckConstraint(
            "checked_out_at IS NULL OR checked_out_at >= checked_in_at",
            name=op.f("ck_attendance_checkout_after_checkin"),
        ),
        sa.ForeignKeyConstraint(
            ["member_id"],
            ["members.id"],
            name=op.f("fk_attendance_member_id_members"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_attendance")),
    )
    op.create_index(
        "ix_attendance_member_checked_in",
        "attendance",
        ["member_id", "checked_in_at"],
        unique=False,
    )
    op.create_index(
        "uq_attendance_one_open_visit_per_member",
        "attendance",
        ["member_id"],
        unique=True,
        postgresql_where=sa.text("checked_out_at IS NULL"),
    )

    op.create_table(
        "payments",
        sa.Column("membership_id", sa.Uuid(), nullable=False),
        sa.Column("external_reference", sa.String(length=100), nullable=True),
        sa.Column("amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("currency", sa.String(length=3), server_default=sa.text("'INR'"), nullable=False),
        sa.Column(
            "status", sa.String(length=16), server_default=sa.text("'pending'"), nullable=False
        ),
        sa.Column("method", sa.String(length=20), nullable=False),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        *_timestamps(),
        sa.CheckConstraint("amount > 0", name=op.f("ck_payments_amount_positive")),
        sa.CheckConstraint(
            "char_length(currency) = 3", name=op.f("ck_payments_currency_length")
        ),
        sa.CheckConstraint(
            "method IN ('cash', 'card', 'upi', 'bank_transfer', 'other')",
            name=op.f("ck_payments_method_valid"),
        ),
        sa.CheckConstraint(
            "status IN ('pending', 'succeeded', 'failed', 'refunded', 'voided')",
            name=op.f("ck_payments_status_valid"),
        ),
        sa.ForeignKeyConstraint(
            ["membership_id"],
            ["memberships.id"],
            name=op.f("fk_payments_membership_id_memberships"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_payments")),
        sa.UniqueConstraint("external_reference", name=op.f("uq_payments_external_reference")),
    )
    op.create_index("ix_payments_paid_at", "payments", ["paid_at"], unique=False)
    op.create_index(
        "ix_payments_membership_status", "payments", ["membership_id", "status"], unique=False
    )


def downgrade() -> None:
    op.drop_index("ix_payments_membership_status", table_name="payments")
    op.drop_index("ix_payments_paid_at", table_name="payments")
    op.drop_table("payments")

    op.drop_index("uq_attendance_one_open_visit_per_member", table_name="attendance")
    op.drop_index("ix_attendance_member_checked_in", table_name="attendance")
    op.drop_table("attendance")

    op.drop_index("ix_memberships_status_end_date", table_name="memberships")
    op.drop_index("ix_memberships_member_status", table_name="memberships")
    op.drop_table("memberships")

    op.drop_table("membership_plans")
    op.drop_table("members")
