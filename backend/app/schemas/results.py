from pydantic import BaseModel


class StrategyResult(BaseModel):
    strategy: str
    budget: float
    households_selected: int

    weighted_selected: float
    weighted_poor_selected: float

    coverage: float
    severe_poor_coverage: float
    precision: float

    inclusion_error: float
    exclusion_error: float


class StrategiesResponse(BaseModel):
    strategies: list[str]


class BudgetsResponse(BaseModel):
    budgets: list[float]


class ResultsResponse(BaseModel):
    results: list[StrategyResult]