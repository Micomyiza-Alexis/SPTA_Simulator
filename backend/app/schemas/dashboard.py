from pydantic import BaseModel

from backend.app.schemas.results import StrategyResult
from backend.app.schemas.robustness import (
    ModelRobustness,
    TargetingRobustness,
)


class DashboardResponse(BaseModel):
    strategies: list[str]
    budgets: list[float]
    results: list[StrategyResult]
    model_robustness: list[ModelRobustness]
    targeting_robustness: list[TargetingRobustness]
