from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parents[3]

RESULTS_PATH = (
    ROOT
    / "data"
    / "processed"
    / "master_strategy_results.csv"
)


class ResultsService:
    """Read and serve finalized SPTA simulation results."""

    def __init__(self) -> None:
        self._results = self._load_results()

    def _load_results(self) -> pd.DataFrame:
        if not RESULTS_PATH.exists():
            raise FileNotFoundError(
                f"Master results file not found: {RESULTS_PATH}"
            )

        df = pd.read_csv(RESULTS_PATH)

        required_columns = {
            "strategy",
            "budget",
            "households_selected",
            "weighted_selected",
            "weighted_poor_selected",
            "coverage",
            "severe_poor_coverage",
            "precision",
            "inclusion_error",
            "exclusion_error",
        }

        missing = required_columns - set(df.columns)

        if missing:
            raise ValueError(
                f"Master results missing columns: {sorted(missing)}"
            )

        return df

    def get_all_results(self) -> pd.DataFrame:
        return self._results.copy()

    def get_strategies(self) -> list[str]:
        return sorted(
            self._results["strategy"]
            .dropna()
            .unique()
            .tolist()
        )

    def get_budgets(self) -> list[float]:
        return sorted(
            self._results["budget"]
            .dropna()
            .unique()
            .tolist()
        )

    def get_result(
        self,
        strategy: str,
        budget: float,
    ) -> dict | None:

        matches = self._results[
            (self._results["strategy"] == strategy)
            & (
                self._results["budget"].round(2)
                == round(budget, 2)
            )
        ]

        if matches.empty:
            return None

        return matches.iloc[0].to_dict()


results_service = ResultsService()