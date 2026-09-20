from backend.app.services.results_service import results_service
from backend.app.services.robustness_service import robustness_service


class DashboardService:
    """Aggregate finalized results for the dashboard."""

    def get_dashboard(self) -> dict:
        return {
            "strategies": results_service.get_strategies(),
            "budgets": results_service.get_budgets(),
            "results": results_service
                .get_all_results()
                .to_dict(orient="records"),
            "model_robustness": (
                robustness_service.get_model_robustness()
            ),
            "targeting_robustness": (
                robustness_service.get_targeting_robustness()
            ),
        }


dashboard_service = DashboardService()
