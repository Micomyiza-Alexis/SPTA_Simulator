from fastapi import APIRouter, HTTPException

from backend.app.schemas.results import (
    BudgetsResponse,
    ResultsResponse,
    StrategiesResponse,
    StrategyResult,
)
from backend.app.services.results_service import results_service


router = APIRouter(
    prefix="/api/results",
    tags=["Results"],
)


@router.get(
    "/strategies",
    response_model=StrategiesResponse,
)
def get_strategies():
    return {
        "strategies": results_service.get_strategies()
    }


@router.get(
    "/budgets",
    response_model=BudgetsResponse,
)
def get_budgets():
    return {
        "budgets": results_service.get_budgets()
    }


@router.get(
    "",
    response_model=ResultsResponse,
)
def get_all_results():
    df = results_service.get_all_results()

    return {
        "results": df.to_dict(
            orient="records"
        )
    }


@router.get(
    "/{strategy}/{budget}",
    response_model=StrategyResult,
)
def get_result(
    strategy: str,
    budget: float,
):
    result = results_service.get_result(
        strategy,
        budget,
    )

    if result is None:
        raise HTTPException(
            status_code=404,
            detail=(
                f"No result found for "
                f"strategy='{strategy}', "
                f"budget={budget}"
            ),
        )

    return result