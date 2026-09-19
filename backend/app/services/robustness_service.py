from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parents[3]

MODEL_ROBUSTNESS_PATH = (
    ROOT
    / "data"
    / "processed"
    / "model_robustness_summary.csv"
)

TARGETING_ROBUSTNESS_PATH = (
    ROOT
    / "data"
    / "processed"
    / "targeting_robustness_summary.csv"
)


class RobustnessService:
    """Read finalized repeated-split robustness results."""

    def __init__(self) -> None:
        self._model_results = self._load_model_results()
        self._targeting_results = self._load_targeting_results()

    @staticmethod
    def _load_csv(path: Path) -> pd.DataFrame:
        if not path.exists():
            raise FileNotFoundError(
                f"Robustness results file not found: {path}"
            )

        return pd.read_csv(path)

    def _load_model_results(self) -> pd.DataFrame:
        df = self._load_csv(MODEL_ROBUSTNESS_PATH)

        required_columns = {
            "strategy",
            "splits",
            "roc_auc_mean",
            "roc_auc_std",
            "pr_auc_mean",
            "pr_auc_std",
        }

        missing = required_columns - set(df.columns)

        if missing:
            raise ValueError(
                "Model robustness results missing columns: "
                f"{sorted(missing)}"
            )

        return df

    def _load_targeting_results(self) -> pd.DataFrame:
        df = self._load_csv(TARGETING_ROBUSTNESS_PATH)

        required_columns = {
            "strategy",
            "budget",
            "splits",
            "coverage_mean",
            "coverage_std",
            "severe_poor_coverage_mean",
            "severe_poor_coverage_std",
            "precision_mean",
            "precision_std",
            "inclusion_error_mean",
            "inclusion_error_std",
            "exclusion_error_mean",
            "exclusion_error_std",
        }

        missing = required_columns - set(df.columns)

        if missing:
            raise ValueError(
                "Targeting robustness results missing columns: "
                f"{sorted(missing)}"
            )

        return df

    def get_model_robustness(self) -> list[dict]:
        return self._model_results.to_dict(
            orient="records"
        )

    def get_targeting_robustness(self) -> list[dict]:
        return self._targeting_results.to_dict(
            orient="records"
        )


robustness_service = RobustnessService()