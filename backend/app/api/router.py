from fastapi import APIRouter

from app.api.routes.attendance import router as attendance_router
from app.api.routes.auth import router as auth_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.health import router as health_router
from app.api.routes.members import router as members_router
from app.api.routes.memberships import router as memberships_router
from app.api.routes.plans import router as plans_router

api_router = APIRouter()
api_router.include_router(health_router, prefix="/health", tags=["health"])
api_router.include_router(auth_router, prefix="/auth", tags=["authentication"])
api_router.include_router(members_router, prefix="/members", tags=["members"])
api_router.include_router(plans_router, prefix="/plans", tags=["membership-plans"])
api_router.include_router(memberships_router, prefix="/memberships", tags=["memberships"])
api_router.include_router(attendance_router, prefix="/attendance", tags=["attendance"])
api_router.include_router(dashboard_router, prefix="/dashboard", tags=["dashboard"])
