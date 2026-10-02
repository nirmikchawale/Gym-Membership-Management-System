from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.cli.seed_demo import PLAN_DEFINITIONS, _require_safe_environment, seed_demo
from app.cli.validate_environment import production_configuration_errors
from app.core.config import Settings
from app.db.models.attendance import Attendance
from app.db.models.member import Member
from app.db.models.membership import Membership
from app.db.models.plan import MembershipPlan
from app.db.session import engine


def _cleanup_demo_rows(db: Session) -> None:
    member_ids = db.scalars(select(Member.id).where(Member.member_code.like("GST-DEMO-%"))).all()
    if member_ids:
        db.execute(delete(Attendance).where(Attendance.member_id.in_(member_ids)))
        db.execute(delete(Membership).where(Membership.member_id.in_(member_ids)))
        db.execute(delete(Member).where(Member.id.in_(member_ids)))
    plan_codes = [definition[0] for definition in PLAN_DEFINITIONS]
    db.execute(delete(MembershipPlan).where(MembershipPlan.code.in_(plan_codes)))
    db.commit()


def test_demo_seed_is_deterministic_and_idempotent() -> None:
    with Session(engine) as db:
        _cleanup_demo_rows(db)
        first = seed_demo(db, member_count=6, environment="test")
        second = seed_demo(db, member_count=6, environment="test")
        assert first == {"plans": 4, "members": 6, "memberships": 6, "attendance": 6}
        assert second == {"plans": 0, "members": 0, "memberships": 0, "attendance": 0}
        demo_members = db.scalars(select(Member).where(Member.member_code.like("GST-DEMO-%"))).all()
        assert len(demo_members) == 6
        _cleanup_demo_rows(db)


def test_demo_seed_is_blocked_in_production() -> None:
    try:
        _require_safe_environment("production")
    except RuntimeError as exc:
        assert "blocked" in str(exc).lower()
    else:
        raise AssertionError("Production demo seeding must be blocked")


def test_production_configuration_validation_rejects_local_defaults() -> None:
    config = Settings(
        app_env="production",
        database_url="postgresql+psycopg://gym_app:gym_dev_password@localhost:5432/gym_membership",
    )
    errors = production_configuration_errors(config)
    assert any("managed/non-local" in error for error in errors)
    assert any("development password" in error for error in errors)


def test_production_configuration_validation_accepts_managed_postgres_shape() -> None:
    config = Settings(
        app_env="production",
        database_url="postgresql+psycopg://gridstone:secret-value@db.internal.example:5432/gridstone",
    )
    assert production_configuration_errors(config) == []
