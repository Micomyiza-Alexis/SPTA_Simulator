from pydantic import BaseModel


class ModelRobustness(BaseModel):
    strategy: str
    splits: int

    roc_auc_mean: float
    roc_auc_std: float

    pr_auc_mean: float
    pr_auc_std: float


class TargetingRobustness(BaseModel):
    strategy: str
    budget: float
    splits: int

    coverage_mean: float
    coverage_std: float

    severe_poor_coverage_mean: float
    severe_poor_coverage_std: float

    precision_mean: float
    precision_std: float

    inclusion_error_mean: float
    inclusion_error_std: float

    exclusion_error_mean: float
    exclusion_error_std: float


class ModelRobustnessResponse(BaseModel):
    results: list[ModelRobustness]


class TargetingRobustnessResponse(BaseModel):
    results: list[TargetingRobustness]