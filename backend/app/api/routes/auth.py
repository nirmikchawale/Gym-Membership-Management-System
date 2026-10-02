from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_auth, require_admin, validate_csrf
from app.core.config import settings
from app.db.session import get_db
from app.schemas.auth import (
    AuthorizationResponse,
    AuthUserResponse,
    LoginRequest,
    LoginResponse,
)
from app.services.auth import AuthContext, authenticate_user, create_session, revoke_session

router = APIRouter()


def _set_auth_cookies(response: Response, session_token: str, csrf_token: str) -> None:
    response.set_cookie(
        key=settings.session_cookie_name,
        value=session_token,
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite="strict",
        path="/",
    )
    response.set_cookie(
        key=settings.csrf_cookie_name,
        value=csrf_token,
        httponly=False,
        secure=settings.session_cookie_secure,
        samesite="strict",
        path="/",
    )
    response.headers["Cache-Control"] = "no-store"


def _delete_auth_cookies(response: Response) -> None:
    response.delete_cookie(
        key=settings.session_cookie_name,
        path="/",
        secure=settings.session_cookie_secure,
        httponly=True,
        samesite="strict",
    )
    response.delete_cookie(
        key=settings.csrf_cookie_name,
        path="/",
        secure=settings.session_cookie_secure,
        httponly=False,
        samesite="strict",
    )


@router.post("/login", response_model=LoginResponse)
def login(
    payload: LoginRequest,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
) -> LoginResponse:
    user = authenticate_user(db, payload.email, payload.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    _, session_token, csrf_token = create_session(db, user)
    user.last_login_at = datetime.now(UTC)
    db.commit()

    _set_auth_cookies(response, session_token, csrf_token)
    return LoginResponse(user=AuthUserResponse.model_validate(user))


@router.get("/me", response_model=AuthUserResponse)
def me(
    response: Response,
    context: Annotated[AuthContext, Depends(get_current_auth)],
) -> AuthUserResponse:
    response.headers["Cache-Control"] = "no-store"
    return AuthUserResponse.model_validate(context.user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    request: Request,
    response: Response,
    context: Annotated[AuthContext, Depends(get_current_auth)],
    db: Annotated[Session, Depends(get_db)],
) -> None:
    validate_csrf(request, context)
    revoke_session(context.session)
    db.commit()

    _delete_auth_cookies(response)
    response.headers["Cache-Control"] = "no-store"
    response.headers["Clear-Site-Data"] = '"cache", "cookies", "storage"'


@router.get("/admin", response_model=AuthorizationResponse)
def admin_check(
    response: Response,
    context: Annotated[AuthContext, Depends(require_admin)],
) -> AuthorizationResponse:
    response.headers["Cache-Control"] = "no-store"
    return AuthorizationResponse(status="ok", role=context.user.role)
