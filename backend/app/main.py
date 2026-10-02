import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

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
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="frontend")
