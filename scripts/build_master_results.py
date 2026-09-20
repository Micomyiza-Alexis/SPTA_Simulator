from pathlib import Path

import pandas as pd


# ============================================================
# CONFIGURATION
# ============================================================

ROOT = Path(__file__).resolve().parents[1]

PROCESSED_DIR = ROOT / "data" / "processed"


STRATEGY_COMPARISON_PATH = (
    PROCESSED_DIR / "strategy_comparison.csv"
)

MODEL_ROBUSTNESS_PATH = (
    PROCESSED_DIR / "repeated_split_model_metrics.csv"
)

TARGETING_ROBUSTNESS_PATH = (
    PROCESSED_DIR / "repeated_split_targeting_results.csv"
)


MASTER_RESULTS_PATH = (
    PROCESSED_DIR / "master_strategy_results.csv"
)

MODEL_SUMMARY_PATH = (
    PROCESSED_DIR / "model_robustness_summary.csv"
)

TARGETING_SUMMARY_PATH = (
    PROCESSED_DIR / "targeting_robustness_summary.csv"
)


# ============================================================
# HEADER
# ============================================================

print("=" * 70)
print("SPTA MASTER RESULTS BUILDER")
print("=" * 70)


# ============================================================
# LOAD STRATEGY RESULTS
# ============================================================

print("\nLoading strategy comparison...")

strategy_df = pd.read_csv(
    STRATEGY_COMPARISON_PATH
)

print(
    f"Strategy rows: {len(strategy_df):,}"
)


# ============================================================
# STANDARDIZE STRATEGY RESULTS
# ============================================================

master_columns = [
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
]

missing_columns = [
    column
    for column in master_columns
    if column not in strategy_df.columns
]

if missing_columns:
    raise ValueError(
        "Missing columns in strategy comparison: "
        f"{missing_columns}"
    )


master_df = strategy_df[
    master_columns
].copy()


# ============================================================
# VALIDATION
# ============================================================

print("\nValidating master strategy results...")

expected_strategies = {
    "Random Targeting",
    "Geographic Targeting",
    "Rule-Based Targeting",
    "Logistic Targeting",
    "Random Forest Targeting",
}

actual_strategies = set(
    master_df["strategy"].unique()
)

missing_strategies = (
    expected_strategies - actual_strategies
)

if missing_strategies:
    raise ValueError(
        "Missing strategies: "
        f"{sorted(missing_strategies)}"
    )


expected_budgets = {
    0.05,
    0.10,
    0.20,
}

actual_budgets = set(
    master_df["budget"].round(2).unique()
)

if actual_budgets != expected_budgets:
    raise ValueError(
        "Unexpected budget levels: "
        f"{sorted(actual_budgets)}"
    )


expected_rows = (
    len(expected_strategies)
    * len(expected_budgets)
)

if len(master_df) != expected_rows:
    raise ValueError(
        f"Expected {expected_rows} rows, "
        f"found {len(master_df)}"
    )


if master_df[
    [
        "weighted_selected",
        "weighted_poor_selected",
        "coverage",
        "precision",
        "inclusion_error",
        "exclusion_error",
    ]
].isna().any().any():

    raise ValueError(
        "Master strategy results contain missing "
        "metric values."
    )


# ============================================================
# SAVE MASTER RESULTS
# ============================================================

master_df = master_df.sort_values(
    ["budget", "strategy"]
).reset_index(drop=True)

master_df.to_csv(
    MASTER_RESULTS_PATH,
    index=False,
)

print(
    f"\nSaved master results:"
    f"\n  {MASTER_RESULTS_PATH}"
)


# ============================================================
# MODEL ROBUSTNESS SUMMARY
# ============================================================

print("\nBuilding model robustness summary...")

model_metrics_df = pd.read_csv(
    MODEL_ROBUSTNESS_PATH
)

model_summary = (
    model_metrics_df
    .groupby("strategy")
    .agg(
        splits=("split", "count"),
        roc_auc_mean=("roc_auc", "mean"),
        roc_auc_std=("roc_auc", "std"),
        pr_auc_mean=("pr_auc", "mean"),
        pr_auc_std=("pr_auc", "std"),
    )
    .reset_index()
)

model_summary.to_csv(
    MODEL_SUMMARY_PATH,
    index=False,
)

print(
    f"Saved model robustness:"
    f"\n  {MODEL_SUMMARY_PATH}"
)


# ============================================================
# TARGETING ROBUSTNESS SUMMARY
# ============================================================

print("\nBuilding targeting robustness summary...")

targeting_metrics_df = pd.read_csv(
    TARGETING_ROBUSTNESS_PATH
)

targeting_summary = (
    targeting_metrics_df
    .groupby(
        ["strategy", "budget"]
    )
    .agg(
        splits=("split", "count"),

        weighted_selected_mean=(
            "weighted_selected",
            "mean",
        ),

        weighted_selected_std=(
            "weighted_selected",
            "std",
        ),

        weighted_poor_selected_mean=(
            "weighted_poor_selected",
            "mean",
        ),

        weighted_poor_selected_std=(
            "weighted_poor_selected",
            "std",
        ),

        coverage_mean=(
            "coverage",
            "mean",
        ),

        coverage_std=(
            "coverage",
            "std",
        ),

        severe_poor_coverage_mean=(
            "severe_poor_coverage",
            "mean",
        ),

        severe_poor_coverage_std=(
            "severe_poor_coverage",
            "std",
        ),

        precision_mean=(
            "precision",
            "mean",
        ),

        precision_std=(
            "precision",
            "std",
        ),

        inclusion_error_mean=(
            "inclusion_error",
            "mean",
        ),

        inclusion_error_std=(
            "inclusion_error",
            "std",
        ),

        exclusion_error_mean=(
            "exclusion_error",
            "mean",
        ),

        exclusion_error_std=(
            "exclusion_error",
            "std",
        ),
    )
    .reset_index()
)

targeting_summary.to_csv(
    TARGETING_SUMMARY_PATH,
    index=False,
)

print(
    f"Saved targeting robustness:"
    f"\n  {TARGETING_SUMMARY_PATH}"
)


# ============================================================
# FINAL VALIDATION
# ============================================================

print("\n" + "=" * 70)
print("MASTER RESULTS VALIDATION")
print("=" * 70)

print(
    f"\nMaster strategy rows: "
    f"{len(master_df):,}"
)

print(
    f"Strategies: "
    f"{master_df['strategy'].nunique()}"
)

print(
    f"Budgets: "
    f"{master_df['budget'].nunique()}"
)

print(
    f"Model robustness rows: "
    f"{len(model_summary):,}"
)

print(
    f"Targeting robustness rows: "
    f"{len(targeting_summary):,}"
)

print("\nMaster strategy results:")

print(
    master_df.to_string(
        index=False
    )
)

print("\n" + "=" * 70)
print("MASTER RESULTS BUILD COMPLETE")
print("=" * 70)