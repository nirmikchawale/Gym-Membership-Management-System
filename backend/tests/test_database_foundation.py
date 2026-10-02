from datetime import date
from decimal import Decimal

import pytest
from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory
from sqlalchemy import inspect
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.models import Attendance, Member, Membership, MembershipPlan
from app.db.session import engine


def test_database_is_at_alembic_head() -> None:
    config = Config("alembic.ini")
    expected_head = ScriptDirectory.from_config(config).get_current_head()

    with engine.connect() as connection:
        current_revision = MigrationContext.configure(connection).get_current_revision()

    assert current_revision == expected_head


def test_expected_domain_tables_exist() -> None:
    inspector = inspect(engine)
    table_names = set(inspector.get_table_names())

    assert {
        "alembic_version",
        "attendance",
        "members",
        "membership_plans",
        "memberships",
        "payments",
    }.issubset(table_names)


def test_database_has_foundational_indexes() -> None:
    inspector = inspect(engine)

    attendance_indexes = {item["name"] for item in inspector.get_indexes("attendance")}
    membership_indexes = {item["name"] for item in inspector.get_indexes("memberships")}
    payment_indexes = {item["name"] for item in inspector.get_indexes("payments")}

    assert "uq_attendance_one_open_visit_per_member" in attendance_indexes
    assert "ix_memberships_member_status" in membership_indexes
    assert "ix_memberships_status_end_date" in membership_indexes
    assert "ix_payments_membership_status" in payment_indexes


def test_membership_rejects_an_invalid_date_range() -> None:
    with Session(engine) as session:
        member = Member(
            member_code="TEST-DATE-RANGE",
            first_name="Database",
            last_name="Constraint",
            email="database.constraint@example.test",
        )
        plan = MembershipPlan(
            code="TEST-PLAN-DATE-RANGE",
            name="Constraint Plan",
            duration_days=30,
            price=Decimal("1000.00"),
        )
        session.add_all([member, plan])
        session.flush()

        session.add(
            Membership(
                member_id=member.id,
                plan_id=plan.id,
                start_date=date(2026, 10, 10),
                end_date=date(2026, 10, 1),
                status="scheduled",
                price_amount=Decimal("1000.00"),
            )
        )

        with pytest.raises(IntegrityError):
            session.flush()

        session.rollback()


def test_member_email_is_normalized_at_database_boundary() -> None:
    with Session(engine) as session:
        session.add(
            Member(
                member_code="TEST-UPPERCASE-EMAIL",
                first_name="Email",
                last_name="Constraint",
                email="UPPERCASE@example.test",
            )
        )

        with pytest.raises(IntegrityError):
            session.flush()

        session.rollback()


def test_only_one_open_attendance_visit_is_allowed_per_member() -> None:
    with Session(engine) as session:
        member = Member(
            member_code="TEST-OPEN-ATTENDANCE",
            first_name="Attendance",
            last_name="Constraint",
            email="attendance.constraint@example.test",
        )
        session.add(member)
        session.flush()

        session.add(Attendance(member_id=member.id))
        session.flush()
        session.add(Attendance(member_id=member.id))

        with pytest.raises(IntegrityError):
            session.flush()

        session.rollback()


def test_payments_store_no_sensitive_payment_credentials() -> None:
    payment_columns = {column["name"] for column in inspect(engine).get_columns("payments")}

    forbidden_columns = {
        "bank_account_number",
        "card_number",
        "cvv",
        "pin",
        "upi_pin",
    }

    assert payment_columns.isdisjoint(forbidden_columns)
