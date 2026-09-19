"""
Repeated train/test split robustness experiment.

Tests Logistic Regression and Random Forest targeting across
multiple stratified 80/20 train/test splits.

Outputs:
    data/processed/repeated_split_model_metrics.csv
    data/processed/repeated_split_targeting_results.csv
    data/processed/repeated_split_summary.csv
"""

from pathlib import Path

import numpy as np
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


# ============================================================
# CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[1]

DATA_PATH = BASE_DIR / "data" / "processed" / "targeting_features.parquet"
OUTPUT_DIR = BASE_DIR / "data" / "processed"

RANDOM_SEEDS = [42, 123, 2024, 31415, 2718]

BUDGETS = [0.05, 0.10, 0.20]


# ============================================================
# FEATURES
# ============================================================

CATEGORICAL_FEATURES = [
    "province",
    "district",
    "ur",
    "s5aq1",
    "s5aq2",
    "s5aq5",
    "s5aq7",
    "s5aq8",
    "s5cq1",
    "s5cq3",
    "s5cq14",
    "s5cq16",
    "s5cq17",
    "s5cq21",
    "s5cq22a",
    "s5cq23",
    "s5cq24",
    "s5cq25",
    "s5cq26",
    "s5dq1",
    "s5dq2",
    "s5dq3",
    "s5eq1",
    "s5eq2a",
    "s5eq2b",
    "s5eq2c",
    "s7aq4",
]

EXCLUDED_COLUMNS = [
    "hhid",
    "poverty",
    "pov_jan",
    "epov_jan",
    "quintile",
    "weight",
    "pop_wt",
    "is_poor",
]


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def weighted_targeting_metrics(
    selected_df: pd.DataFrame,
    test_df: pd.DataFrame,
) -> dict:
    """
    Calculate weighted targeting metrics.

    Poverty definition:
        poverty in {1, 2}

    Severe poverty:
        poverty == 1
    """

    total_poor_weight = test_df.loc[
        test_df["is_poor"] == 1, "weight"
    ].sum()

    total_severe_weight = test_df.loc[
        test_df["poverty"] == 1, "weight"
    ].sum()

    selected_weight = selected_df["weight"].sum()

    selected_poor_weight = selected_df.loc[
        selected_df["is_poor"] == 1, "weight"
    ].sum()

    selected_severe_weight = selected_df.loc[
        selected_df["poverty"] == 1, "weight"
    ].sum()

    selected_nonpoor_weight = selected_weight - selected_poor_weight

    poor_coverage = (
        selected_poor_weight / total_poor_weight
        if total_poor_weight > 0
        else np.nan
    )

    severe_poor_coverage = (
        selected_severe_weight / total_severe_weight
        if total_severe_weight > 0
        else np.nan
    )

    precision = (
        selected_poor_weight / selected_weight
        if selected_weight > 0
        else np.nan
    )

    inclusion_error = (
        selected_nonpoor_weight / selected_weight
        if selected_weight > 0
        else np.nan
    )

    exclusion_error = 1 - poor_coverage

    return {
        "weighted_selected": selected_weight,
        "weighted_poor_selected": selected_poor_weight,
        "weighted_severe_poor_selected": selected_severe_weight,
        "coverage": poor_coverage,
        "severe_poor_coverage": severe_poor_coverage,
        "inclusion_error": inclusion_error,
        "exclusion_error": exclusion_error,
        "precision": precision,
    }


def build_preprocessor(numeric_features):
    """Build the preprocessing pipeline."""

    numeric_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )

    categorical_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            (
                "onehot",
                OneHotEncoder(
                    handle_unknown="ignore",
                    sparse_output=True,
                ),
            ),
        ]
    )

    return ColumnTransformer(
        transformers=[
            ("numeric", numeric_pipeline, numeric_features),
            ("categorical", categorical_pipeline, CATEGORICAL_FEATURES),
        ]
    )


# ============================================================
# LOAD DATA
# ============================================================

print("=" * 70)
print("REPEATED TRAIN/TEST SPLIT ROBUSTNESS EXPERIMENT")
print("=" * 70)

print("\nLoading analytical dataset...")

df = pd.read_parquet(DATA_PATH)

print(f"Households: {len(df):,}")

# Create binary poverty target
df["is_poor"] = df["poverty"].isin([1, 2]).astype(int)

print(f"Poor households: {df['is_poor'].sum():,}")

# Predictor columns
feature_columns = [
    col
    for col in df.columns
    if col not in EXCLUDED_COLUMNS
]

numeric_features = [
    col
    for col in feature_columns
    if col not in CATEGORICAL_FEATURES
]

# Safety check
missing_categorical = [
    col for col in CATEGORICAL_FEATURES
    if col not in df.columns
]

if missing_categorical:
    raise ValueError(
        f"Missing categorical features: {missing_categorical}"
    )

print(f"\nTotal predictors: {len(feature_columns)}")
print(f"Categorical predictors: {len(CATEGORICAL_FEATURES)}")
print(f"Numeric predictors: {len(numeric_features)}")

print(f"\nRandom seeds: {RANDOM_SEEDS}")
print(f"Budgets: {[f'{b:.0%}' for b in BUDGETS]}")


# ============================================================
# RUN EXPERIMENT
# ============================================================

model_metrics = []
targeting_results = []

X = df[feature_columns]
y = df["is_poor"]

for split_number, seed in enumerate(RANDOM_SEEDS, start=1):

    print("\n" + "=" * 70)
    print(f"SPLIT {split_number}/{len(RANDOM_SEEDS)} — RANDOM STATE {seed}")
    print("=" * 70)

    train_idx, test_idx = train_test_split(
        np.arange(len(df)),
        test_size=0.20,
        random_state=seed,
        stratify=y,
    )

    X_train = X.iloc[train_idx]
    X_test = X.iloc[test_idx]

    y_train = y.iloc[train_idx]
    y_test = y.iloc[test_idx]

    train_df = df.iloc[train_idx].copy()
    test_df = df.iloc[test_idx].copy()

    print(f"Train households: {len(train_df):,}")
    print(f"Test households:  {len(test_df):,}")
    print(f"Test poor households: {test_df['is_poor'].sum():,}")
    print(
        f"Test severe-poor households: "
        f"{(test_df['poverty'] == 1).sum():,}"
    )

    # --------------------------------------------------------
    # PREPROCESSOR
    # --------------------------------------------------------

    preprocessor = build_preprocessor(numeric_features)

    # --------------------------------------------------------
    # LOGISTIC REGRESSION
    # --------------------------------------------------------

    logistic_pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            (
                "model",
                LogisticRegression(
                    max_iter=2000,
                    class_weight="balanced",
                    random_state=seed,
                ),
            ),
        ]
    )

    print("\nTraining Logistic Regression...")

    logistic_pipeline.fit(X_train, y_train)

    logistic_prob = logistic_pipeline.predict_proba(X_test)[:, 1]

    logistic_roc_auc = roc_auc_score(
        y_test,
        logistic_prob,
    )

    logistic_pr_auc = average_precision_score(
        y_test,
        logistic_prob,
    )

    print(
        f"  ROC-AUC: {logistic_roc_auc:.4f}"
    )
    print(
        f"  PR-AUC:  {logistic_pr_auc:.4f}"
    )

    model_metrics.append(
        {
            "split": split_number,
            "seed": seed,
            "strategy": "Logistic Targeting",
            "roc_auc": logistic_roc_auc,
            "pr_auc": logistic_pr_auc,
            "test_households": len(test_df),
        }
    )

    # --------------------------------------------------------
    # RANDOM FOREST
    # --------------------------------------------------------

    rf_preprocessor = build_preprocessor(numeric_features)

    rf_pipeline = Pipeline(
        steps=[
            ("preprocessor", rf_preprocessor),
            (
                "model",
                RandomForestClassifier(
                    n_estimators=500,
                    max_depth=12,
                    min_samples_leaf=5,
                    class_weight="balanced",
                    random_state=seed,
                    n_jobs=-1,
                ),
            ),
        ]
    )

    print("\nTraining Random Forest...")

    rf_pipeline.fit(X_train, y_train)

    rf_prob = rf_pipeline.predict_proba(X_test)[:, 1]

    rf_roc_auc = roc_auc_score(
        y_test,
        rf_prob,
    )

    rf_pr_auc = average_precision_score(
        y_test,
        rf_prob,
    )

    print(
        f"  ROC-AUC: {rf_roc_auc:.4f}"
    )
    print(
        f"  PR-AUC:  {rf_pr_auc:.4f}"
    )

    model_metrics.append(
        {
            "split": split_number,
            "seed": seed,
            "strategy": "Random Forest Targeting",
            "roc_auc": rf_roc_auc,
            "pr_auc": rf_pr_auc,
            "test_households": len(test_df),
        }
    )

    # --------------------------------------------------------
    # TARGETING SIMULATION
    # --------------------------------------------------------

    model_scores = {
        "Logistic Targeting": logistic_prob,
        "Random Forest Targeting": rf_prob,
    }

    for strategy, scores in model_scores.items():

        scored_test = test_df.copy()
        scored_test["vulnerability_score"] = scores

        scored_test = scored_test.sort_values(
            "vulnerability_score",
            ascending=False,
        ).reset_index(drop=True)

        for budget in BUDGETS:

            n_select = round(
                len(scored_test) * budget
            )

            selected = scored_test.iloc[:n_select].copy()

            metrics = weighted_targeting_metrics(
                selected,
                test_df,
            )

            targeting_results.append(
                {
                    "split": split_number,
                    "seed": seed,
                    "strategy": strategy,
                    "budget": budget,
                    "households_selected": n_select,
                    **metrics,
                }
            )

            print(
                f"  {strategy} | "
                f"Budget {budget:.0%} | "
                f"Poor coverage "
                f"{metrics['coverage']:.2%} | "
                f"Severe coverage "
                f"{metrics['severe_poor_coverage']:.2%} | "
                f"Precision "
                f"{metrics['precision']:.2%}"
            )


# ============================================================
# SAVE RAW RESULTS
# ============================================================

model_metrics_df = pd.DataFrame(model_metrics)
targeting_results_df = pd.DataFrame(targeting_results)

model_metrics_path = (
    OUTPUT_DIR /
    "repeated_split_model_metrics.csv"
)

targeting_results_path = (
    OUTPUT_DIR /
    "repeated_split_targeting_results.csv"
)

model_metrics_df.to_csv(
    model_metrics_path,
    index=False,
)

targeting_results_df.to_csv(
    targeting_results_path,
    index=False,
)


# ============================================================
# SUMMARY — MEAN ± STANDARD DEVIATION
# ============================================================

print("\n" + "=" * 70)
print("MODEL ROBUSTNESS SUMMARY")
print("=" * 70)

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

print("\nModel performance across repeated splits:\n")

for _, row in model_summary.iterrows():

    print(
        f"{row['strategy']}"
    )

    print(
        f"  ROC-AUC: "
        f"{row['roc_auc_mean']:.4f} "
        f"± {row['roc_auc_std']:.4f}"
    )

    print(
        f"  PR-AUC:  "
        f"{row['pr_auc_mean']:.4f} "
        f"± {row['pr_auc_std']:.4f}"
    )


targeting_summary = (
    targeting_results_df
    .groupby(["strategy", "budget"])
    .agg(
        splits=("split", "count"),
        coverage_mean=("coverage", "mean"),
        coverage_std=("coverage", "std"),
        severe_poor_coverage_mean=(
            "severe_poor_coverage",
            "mean",
        ),
        severe_poor_coverage_std=(
            "severe_poor_coverage",
            "std",
        ),
        precision_mean=("precision", "mean"),
        precision_std=("precision", "std"),
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

summary_path = (
    OUTPUT_DIR /
    "repeated_split_summary.csv"
)

targeting_summary.to_csv(
    summary_path,
    index=False,
)


# ============================================================
# PRINT TARGETING SUMMARY
# ============================================================

print("\n" + "=" * 70)
print("TARGETING ROBUSTNESS SUMMARY")
print("=" * 70)

for _, row in targeting_summary.iterrows():

    print(
        f"\n{row['strategy']} "
        f"— Budget {row['budget']:.0%}"
    )

    print(
        f"  Poor coverage: "
        f"{row['coverage_mean']:.2%} "
        f"± {row['coverage_std']:.2%}"
    )

    print(
        f"  Severe-poor coverage: "
        f"{row['severe_poor_coverage_mean']:.2%} "
        f"± {row['severe_poor_coverage_std']:.2%}"
    )

    print(
        f"  Precision: "
        f"{row['precision_mean']:.2%} "
        f"± {row['precision_std']:.2%}"
    )

    print(
        f"  Inclusion error: "
        f"{row['inclusion_error_mean']:.2%} "
        f"± {row['inclusion_error_std']:.2%}"
    )

    print(
        f"  Exclusion error: "
        f"{row['exclusion_error_mean']:.2%} "
        f"± {row['exclusion_error_std']:.2%}"
    )


# ============================================================
# FINAL OUTPUT
# ============================================================

print("\n" + "=" * 70)
print("FILES SAVED")
print("=" * 70)

print(f"\n  {model_metrics_path}")
print(f"  {targeting_results_path}")
print(f"  {summary_path}")

print("\n" + "=" * 70)
print("REPEATED SPLIT ROBUSTNESS EXPERIMENT COMPLETE")
print("=" * 70)