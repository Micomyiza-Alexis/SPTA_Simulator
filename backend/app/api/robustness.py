from fastapi import APIRouter

from backend.app.schemas.robustness import (
    ModelRobustnessResponse,
    TargetingRobustnessResponse,
)

from backend.app.services.robustness_service import (
    robustness_service,
)

router = APIRouter(
    prefix="/api/robustness",
    tags=["Robustness"],
)


@router.get(
    "/models",
    response_model=ModelRobustnessResponse,
)
def get_model_robustness():
    return {
        "results": (
            robustness_service
            .get_model_robustness()
        )
    }


@router.get(
    "/targeting",
    response_model=TargetingRobustnessResponse,
)
def get_targeting_robustness():
    return {
        "results": (
            robustness_service
            .get_targeting_robustness()
        )
    }