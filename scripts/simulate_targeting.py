"""
SPTA Simulator - Budget-Constrained Targeting Simulation

This script:
1. Loads the trained targeting model.
2. Creates an independent test set.
3. Scores households by predicted probability of being poor.
4. Ranks households from highest to lowest vulnerability.
5. Simulates different beneficiary budgets.
6. Calculates weighted targeting performance.

Important:
    Model evaluation is performed on the held-out test set.
"""

from pathlib import Path

import joblib
import pandas as pd

from sklearn.model_selection import train_test_split


# ---------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parents[1]

DATA_PATH = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "targeting_features.parquet"
)

MODEL_PATH = (
    PROJECT_ROOT
    / "models"
    / "logistic_targeting_model.joblib"
)

RANDOM_STATE = 42
TEST_SIZE = 0.20

# Budget scenarios.
# These represent the percentage of households that can receive support.
BUDGETS = [0.05, 0.10, 0.20]


# ---------------------------------------------------------------------
# Load data
# ---------------------------------------------------------------------

print("=" * 70)
print("SPTA BUDGET-CONSTRAINED TARGETING SIMULATOR")
print("=" * 70)

print("\nLoading dataset...")

df = pd.read_parquet(DATA_PATH)

print(f"Total households: {len(df):,}")


# ---------------------------------------------------------------------
# Create target
# ---------------------------------------------------------------------

df["is_poor"] = df["poverty"].isin([1, 2]).astype(int)


# ---------------------------------------------------------------------
# Recreate the same test split used during training
# ---------------------------------------------------------------------

_, test_df = train_test_split(
    df,
    test_size=TEST_SIZE,
    random_state=RANDOM_STATE,
    stratify=df["is_poor"],
)

test_df = test_df.copy()

print(f"Test households:  {len(test_df):,}")


# ---------------------------------------------------------------------
# Load trained model
# ---------------------------------------------------------------------

print("\nLoading trained model...")

model = joblib.load(MODEL_PATH)

print(f"Model: {MODEL_PATH.name}")


# ---------------------------------------------------------------------
# Prepare model input
# ---------------------------------------------------------------------

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

feature_columns = [
    column
    for column in test_df.columns
    if column not in EXCLUDED_COLUMNS
]

X_test = test_df[feature_columns]


# ---------------------------------------------------------------------
# Generate vulnerability scores
# ---------------------------------------------------------------------

print("\nGenerating vulnerability scores...")

test_df["vulnerability_score"] = model.predict_proba(
    X_test
)[:, 1]


# ---------------------------------------------------------------------
# Rank households
# ---------------------------------------------------------------------

test_df = test_df.sort_values(
    "vulnerability_score",
    ascending=False,
).reset_index(drop=True)

print("Households ranked from highest to lowest vulnerability.")


# ---------------------------------------------------------------------
# Weighted metric functions
# ---------------------------------------------------------------------

def weighted_sum(series, weights):
    """Return weighted sum."""
    return (series * weights).sum()


def calculate_metrics(selected):
    """
    Calculate weighted targeting metrics for selected households.
    """

    weights = test_df["weight"]

    poor = test_df["is_poor"] == 1
    non_poor = test_df["is_poor"] == 0

    selected_mask = selected

    # Weighted population of poor households.
    total_poor = weighted_sum(
        poor.astype(int),
        weights,
    )

    # Weighted poor households selected.
    selected_poor = weighted_sum(
        (selected_mask & poor).astype(int),
        weights,
    )

    # Weighted selected households.
    total_selected = weighted_sum(
        selected_mask.astype(int),
        weights,
    )

    # Weighted selected non-poor households.
    selected_non_poor = weighted_sum(
        (selected_mask & non_poor).astype(int),
        weights,
    )

    # Weighted poor households missed.
    excluded_poor = total_poor - selected_poor

    # Coverage / recall of poor.
    coverage = (
        selected_poor / total_poor
        if total_poor > 0
        else 0
    )

    # Inclusion error.
    inclusion_error = (
        selected_non_poor / total_selected
        if total_selected > 0
        else 0
    )

    # Exclusion error.
    exclusion_error = (
        excluded_poor / total_poor
        if total_poor > 0
        else 0
    )

    # Precision / positive predictive value.
    precision = (
        selected_poor / total_selected
        if total_selected > 0
        else 0
    )

    return {
        "coverage": coverage,
        "inclusion_error": inclusion_error,
        "exclusion_error": exclusion_error,
        "precision": precision,
        "weighted_selected": total_selected,
        "weighted_poor_selected": selected_poor,
    }


# ---------------------------------------------------------------------
# Simulate budgets
# ---------------------------------------------------------------------

results = []

print("\n" + "=" * 70)
print("TARGETING SIMULATION")
print("=" * 70)

for budget in BUDGETS:

    number_to_select = round(
        len(test_df) * budget
    )

    selected_mask = pd.Series(
        False,
        index=test_df.index,
    )

    selected_mask.iloc[
        :number_to_select
    ] = True

    metrics = calculate_metrics(
        selected_mask
    )

    results.append(
        {
            "budget": budget,
            "households_selected": number_to_select,
            **metrics,
        }
    )

    print(
        f"\nBudget: {budget:.0%}"
    )

    print(
        f"  Households selected: "
        f"{number_to_select:,}"
    )

    print(
        f"  Poor coverage:       "
        f"{metrics['coverage']:.2%}"
    )

    print(
        f"  Inclusion error:     "
        f"{metrics['inclusion_error']:.2%}"
    )

    print(
        f"  Exclusion error:     "
        f"{metrics['exclusion_error']:.2%}"
    )

    print(
        f"  Precision:            "
        f"{metrics['precision']:.2%}"
    )


# ---------------------------------------------------------------------
# Results table
# ---------------------------------------------------------------------

results_df = pd.DataFrame(results)

print("\n" + "=" * 70)
print("SUMMARY")
print("=" * 70)

display_columns = [
    "budget",
    "households_selected",
    "coverage",
    "inclusion_error",
    "exclusion_error",
    "precision",
]

print(
    results_df[display_columns].to_string(
        index=False
    )
)


# ---------------------------------------------------------------------
# Save results
# ---------------------------------------------------------------------

output_path = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "targeting_simulation_results.csv"
)

results_df.to_csv(
    output_path,
    index=False,
)

print("\nResults saved:")
print(f"  {output_path}")


# ---------------------------------------------------------------------
# Save scored test households
# ---------------------------------------------------------------------

scores_path = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "test_household_scores.parquet"
)

test_df.to_parquet(
    scores_path,
    index=False,
)

print("\nScored households saved:")
print(f"  {scores_path}")

print("\n" + "=" * 70)
print("SIMULATION COMPLETE")
print("=" * 70)