from fastapi import APIRouter

from backend.app.schemas.dashboard import DashboardResponse
from backend.app.services.dashboard_service import dashboard_service


router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"],
)


@router.get("", response_model=DashboardResponse)
def get_dashboard():
    return dashboard_service.get_dashboard()
