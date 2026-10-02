from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from hmac import compare_digest

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    generate_secret,
    hash_secret,
    verify_dummy_password,
    verify_password,
)
from app.db.models.auth import AuthSession, AuthUser


@dataclass(frozen=True)
class AuthContext:
    user: AuthUser
    session: AuthSession


def authenticate_user(db: Session, email: str, password: str) -> AuthUser | None:
    normalized_email = email.strip().lower()
    user = db.scalar(select(AuthUser).where(AuthUser.email == normalized_email))

    if user is None:
        verify_dummy_password(password)
        return None

    if not verify_password(password, user.password_hash):
        return None

    if not user.is_active:
        return None

    return user


def create_session(db: Session, user: AuthUser) -> tuple[AuthSession, str, str]:
    session_token = generate_secret()
    csrf_token = generate_secret()
    expires_at = datetime.now(UTC) + timedelta(hours=settings.session_lifetime_hours)

    auth_session = AuthSession(
        user_id=user.id,
        token_hash=hash_secret(session_token),
        csrf_token_hash=hash_secret(csrf_token),
        expires_at=expires_at,
    )
    db.add(auth_session)

    return auth_session, session_token, csrf_token


def resolve_session(db: Session, session_token: str) -> AuthContext | None:
    token_hash = hash_secret(session_token)
    auth_session = db.scalar(
        select(AuthSession).where(
            AuthSession.token_hash == token_hash,
            AuthSession.revoked_at.is_(None),
        )
    )

    if auth_session is None or auth_session.expires_at <= datetime.now(UTC):
        return None

    user = db.get(AuthUser, auth_session.user_id)
    if user is None or not user.is_active:
        return None

    return AuthContext(user=user, session=auth_session)


def revoke_session(auth_session: AuthSession) -> None:
    auth_session.revoked_at = datetime.now(UTC)


def csrf_is_valid(auth_session: AuthSession, cookie_token: str, header_token: str) -> bool:
    if not compare_digest(cookie_token, header_token):
        return False
    return compare_digest(auth_session.csrf_token_hash, hash_secret(header_token))
