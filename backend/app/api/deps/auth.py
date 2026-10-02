from typing import Annotated

from fastapi import Depends, HTTPException, Request, Security, status
from fastapi.security import APIKeyCookie
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.services.auth import AuthContext, csrf_is_valid, resolve_session

session_cookie = APIKeyCookie(name=settings.session_cookie_name, auto_error=False)


def get_current_auth(
    session_token: Annotated[str | None, Security(session_cookie)],
    db: Annotated[Session, Depends(get_db)],
) -> AuthContext:
    if not session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    context = resolve_session(db, session_token)
    if context is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    return context


def require_admin(
    context: Annotated[AuthContext, Depends(get_current_auth)],
) -> AuthContext:
    if context.user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions",
        )
    return context


def validate_csrf(request: Request, context: AuthContext) -> None:
    cookie_token = request.cookies.get(settings.csrf_cookie_name)
    header_token = request.headers.get("X-CSRF-Token")

    if (
        not cookie_token
        or not header_token
        or not csrf_is_valid(context.session, cookie_token, header_token)
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF validation failed",
        )
