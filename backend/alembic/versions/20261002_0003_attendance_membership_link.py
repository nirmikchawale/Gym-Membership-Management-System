"""link attendance visits to the membership that authorized access

Revision ID: 20261002_0003
Revises: 20261002_0002
Create Date: 2026-10-02
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20261002_0003"
down_revision: str | None = "20261002_0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("attendance", sa.Column("membership_id", sa.Uuid(), nullable=True))
    op.create_foreign_key(
        "fk_attendance_membership_id_memberships",
        "attendance",
        "memberships",
        ["membership_id"],
        ["id"],
        ondelete="RESTRICT",
    )
    op.create_index(
        "ix_attendance_membership_checked_in",
        "attendance",
        ["membership_id", "checked_in_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_attendance_membership_checked_in", table_name="attendance")
    op.drop_constraint(
        "fk_attendance_membership_id_memberships",
        "attendance",
        type_="foreignkey",
    )
    op.drop_column("attendance", "membership_id")
