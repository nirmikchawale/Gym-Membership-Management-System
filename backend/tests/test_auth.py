from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import inspect, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.db.models.auth import AuthSession, AuthUser
from app.db.session import engine
from app.main import app

client = TestClient(app)


def create_user(*, role: str = "staff", is_active: bool = True) -> tuple[AuthUser, str]:
    marker = uuid4().hex
    password = "Gridstone-Test-Password-42!"
    user = AuthUser(
        email=f"{role}-{marker}@example.test",
        full_name=f"{role.title()} Test User",
        role=role,
        is_active=is_active,
        password_hash=hash_password(password),
    )
    with Session(engine) as db:
        db.add(user)
        db.commit()
        db.refresh(user)
        db.expunge(user)
    return user, password


def login(email: str, password: str) -> TestClient:
    test_client = TestClient(app)
    response = test_client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    return test_client


def test_auth_tables_exist_and_store_no_plaintext_password_or_raw_session_token() -> None:
    inspector = inspect(engine)
    assert {"auth_users", "auth_sessions"}.issubset(set(inspector.get_table_names()))

    user_columns = {column["name"] for column in inspector.get_columns("auth_users")}
    session_columns = {column["name"] for column in inspector.get_columns("auth_sessions")}

    assert "password_hash" in user_columns
    assert "password" not in user_columns
    assert "token_hash" in session_columns
    assert "session_token" not in session_columns


def test_passwords_are_argon2_hashed() -> None:
    encoded = hash_password("Gridstone-Test-Password-42!")
    assert encoded.startswith("$argon2")
    assert "Gridstone-Test-Password-42!" not in encoded


def test_login_sets_secure_session_shape_and_me_returns_current_user() -> None:
    user, password = create_user(role="staff")
    test_client = TestClient(app)

    response = test_client.post(
        "/api/v1/auth/login",
        json={"email": user.email.upper(), "password": password},
    )

    assert response.status_code == 200
    assert response.json()["user"]["email"] == user.email
    cookie_header = response.headers["set-cookie"].lower()
    assert "httponly" in cookie_header
    assert "samesite=strict" in cookie_header

    me_response = test_client.get("/api/v1/auth/me")
    assert me_response.status_code == 200
    assert me_response.json()["role"] == "staff"


@pytest.mark.parametrize("email_kind", ["unknown", "wrong-password"])
def test_login_uses_same_error_for_invalid_credentials(email_kind: str) -> None:
    user, password = create_user()
    email = user.email if email_kind == "wrong-password" else f"missing-{uuid4().hex}@example.test"
    attempted_password = "definitely-wrong" if email_kind == "wrong-password" else password

    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": attempted_password},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


def test_inactive_user_cannot_login() -> None:
    user, password = create_user(is_active=False)
    response = client.post("/api/v1/auth/login", json={"email": user.email, "password": password})
    assert response.status_code == 401


def test_staff_is_forbidden_from_admin_endpoint() -> None:
    user, password = create_user(role="staff")
    test_client = login(user.email, password)

    response = test_client.get("/api/v1/auth/admin")

    assert response.status_code == 403


def test_admin_can_access_admin_endpoint() -> None:
    user, password = create_user(role="admin")
    test_client = login(user.email, password)

    response = test_client.get("/api/v1/auth/admin")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "role": "admin"}


def test_logout_requires_csrf_and_revokes_session() -> None:
    user, password = create_user()
    test_client = login(user.email, password)

    blocked = test_client.post("/api/v1/auth/logout")
    assert blocked.status_code == 403

    csrf_token = test_client.cookies.get(settings.csrf_cookie_name)
    assert csrf_token

    response = test_client.post(
        "/api/v1/auth/logout",
        headers={"X-CSRF-Token": csrf_token},
    )
    assert response.status_code == 204

    assert test_client.get("/api/v1/auth/me").status_code == 401

    with Session(engine) as db:
        stored = db.scalar(
            select(AuthSession)
            .join(AuthUser, AuthUser.id == AuthSession.user_id)
            .where(AuthUser.email == user.email)
        )
        assert stored is not None
        assert stored.revoked_at is not None
