import os
from pathlib import Path
from time import perf_counter
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse, Response
from starlette.middleware.base import RequestResponseEndpoint

from app.api.router import api_router
from app.core.config import settings
from app.core.http_logging import log_http_request

_is_nonproduction = settings.app_env in {"development", "test"}

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    docs_url="/api/docs" if _is_nonproduction else None,
    redoc_url="/api/redoc" if _is_nonproduction else None,
    openapi_url="/api/openapi.json" if _is_nonproduction else None,
)
app.include_router(api_router, prefix="/api/v1")


def _route_label(request: Request) -> str:
    route = request.scope.get("route")
    route_path = getattr(route, "path", None)
    return route_path if isinstance(route_path, str) else request.url.path


def _apply_security_headers(request: Request, response: Response) -> None:
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Permitted-Cross-Domain-Policies"] = "none"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=()"
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
    response.headers["Cross-Origin-Resource-Policy"] = "same-origin"

    if request.url.path.startswith("/api/"):
        response.headers["Content-Security-Policy"] = "frame-ancestors 'none'"
        response.headers["Cache-Control"] = "no-store"
    else:
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; "
            "form-action 'self'; img-src 'self' data:; font-src 'self'; "
            "script-src 'self'; style-src 'self'; connect-src 'self'"
        )

    if not _is_nonproduction:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"


@app.middleware("http")
async def add_security_and_observability(
    request: Request, call_next: RequestResponseEndpoint
) -> Response:
    request_id = uuid4().hex
    request.state.request_id = request_id
    started = perf_counter()

    try:
        response = await call_next(request)
    except Exception as exc:
        duration_ms = (perf_counter() - started) * 1000
        log_http_request(
            request_id=request_id,
            method=request.method,
            route=_route_label(request),
            status_code=500,
            duration_ms=duration_ms,
            error_type=type(exc).__name__,
        )
        response = JSONResponse(
            status_code=500,
            content={"detail": "Internal server error", "request_id": request_id},
        )
    else:
        duration_ms = (perf_counter() - started) * 1000
        log_http_request(
            request_id=request_id,
            method=request.method,
            route=_route_label(request),
            status_code=response.status_code,
            duration_ms=duration_ms,
        )

    response.headers["X-Request-ID"] = request_id
    _apply_security_headers(request, response)
    return response


static_dir = Path(os.getenv("STATIC_DIR", "static"))
if static_dir.is_dir():
    static_root = static_dir.resolve()
    index_file = static_root / "index.html"

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend(full_path: str) -> FileResponse:
        if full_path == "api" or full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found")

        requested_file = (static_root / full_path).resolve()
        if requested_file.is_relative_to(static_root) and requested_file.is_file():
            return FileResponse(requested_file)

        return FileResponse(index_file)
