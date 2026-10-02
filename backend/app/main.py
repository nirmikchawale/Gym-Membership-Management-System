import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse

from app.api.router import api_router
from app.core.config import settings

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)
app.include_router(api_router, prefix="/api/v1")

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
