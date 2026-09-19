"""
SPTA Simulator - Transparent Rule-Based Targeting

Strategy:
    Construct a simple, transparent vulnerability index from
    observable household characteristics.

Components:
    1. Household size
    2. Average education level
    3. Livestock ownership
    4. Urban/Rural residence

No machine-learning model is trained.

The index is used only to rank households. Poverty labels are
used only for final evaluation on the held-out test set.
"""

from pathlib import Path

import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split


PROJECT_ROOT = Path(__file__).resolve().parents[1]

DATA_PATH = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "targeting_features.parquet"
)

OUTPUT_PATH = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "rule_based_targeting_results.csv"
)

SCORES_PATH = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "rule_based_household_scores.parquet"
)

RANDOM_STATE = 42
TEST_SIZE = 0.20

BUDGETS = [0.05, 0.10, 0.20]


print("=" * 70)
print("SPTA TRANSPARENT RULE-BASED TARGETING SIMULATOR")
print("=" * 70)


# ---------------------------------------------------------------------
# 1. LOAD DATA
# ---------------------------------------------------------------------

print("\nLoading dataset...")

df = pd.read_parquet(DATA_PATH)

print(f"Total households: {len(df):,}")

df["is_poor"] = df["poverty"].isin([1, 2]).astype(int)


# ---------------------------------------------------------------------
# 2. SAME TRAIN / TEST SPLIT
# ---------------------------------------------------------------------

train_df, test_df = train_test_split(
    df,
    test_size=TEST_SIZE,
    random_state=RANDOM_STATE,
    stratify=df["is_poor"],
)

train_df = train_df.copy()
test_df = test_df.copy()

print(f"Training households: {len(train_df):,}")
print(f"Test households:     {len(test_df):,}")


# ---------------------------------------------------------------------
# 3. CHECK REQUIRED FEATURES
# ---------------------------------------------------------------------

REQUIRED_FEATURES = [
    "household_size",
    "mean_education_level",
    "total_livestock",
    "ur",
]

missing_features = [
    column
    for column in REQUIRED_FEATURES
    if column not in df.columns
]

if missing_features:
    raise ValueError(
        "Required features are missing from the dataset: "
        + ", ".join(missing_features)
    )


# ---------------------------------------------------------------------
# 4. HELPER FUNCTIONS
# ---------------------------------------------------------------------

def min_max_from_training(train_series, test_series):
    """
    Normalize using training-set minimum and maximum only.
    """

    minimum = train_series.min()
    maximum = train_series.max()

    if maximum == minimum:
        return (
            pd.Series(0.0, index=train_series.index),
            pd.Series(0.0, index=test_series.index),
        )

    train_scaled = (
        (train_series - minimum)
        / (maximum - minimum)
    )

    test_scaled = (
        (test_series - minimum)
        / (maximum - minimum)
    )

    # Keep values within the training-derived range.
    test_scaled = test_scaled.clip(0, 1)

    return train_scaled, test_scaled


# ---------------------------------------------------------------------
# 5. BUILD TRANSPARENT COMPONENT SCORES
# ---------------------------------------------------------------------

print("\nBuilding transparent vulnerability components...")


# Larger household = higher vulnerability
train_hh_size, test_hh_size = min_max_from_training(
    train_df["household_size"],
    test_df["household_size"],
)


# Lower education = higher vulnerability
# Impute missing education using the TRAINING median only.
education_median = train_df["mean_education_level"].median()

train_education_raw = train_df["mean_education_level"].fillna(
    education_median
)

test_education_raw = test_df["mean_education_level"].fillna(
    education_median
)
# Lower education = higher vulnerability
#
# Some households have missing mean_education_level.
# Use the TRAINING median for imputation so that
# the test set does not influence the targeting rule.

education_median = train_df["mean_education_level"].median()

train_education_raw = train_df["mean_education_level"].fillna(
    education_median
)

test_education_raw = test_df["mean_education_level"].fillna(
    education_median
)

train_education, test_education = min_max_from_training(
    train_education_raw,
    test_education_raw,
)

print(
    f"\nEducation median used for imputation: "
    f"{education_median:.4f}"
)

print("Missing education values after imputation:")
print(
    f"  Train: {train_education.isna().sum()}"
)
print(
    f"  Test:  {test_education.isna().sum()}"
)

train_low_education = 1 - train_education
test_low_education = 1 - test_education


# Fewer livestock = higher vulnerability
train_livestock, test_livestock = min_max_from_training(
    train_df["total_livestock"],
    test_df["total_livestock"],
)

train_low_livestock = 1 - train_livestock
test_low_livestock = 1 - test_livestock


# Rural = higher vulnerability
#
# We explicitly inspect the observed coding rather than assuming
# a particular numeric code represents rural.
print("\nObserved residence codes:")

print(
    sorted(
        df["ur"]
        .dropna()
        .unique()
        .tolist()
    )
)

# Use the training poverty rate to identify which observed
# residence category is associated with the higher poverty rate.
residence_rates = (
    train_df
    .groupby("ur")
    .apply(
        lambda group: (
            group["is_poor"] * group["weight"]
        ).sum()
        / group["weight"].sum(),
        include_groups=False,
    )
    .sort_values(ascending=False)
)

highest_poverty_residence = residence_rates.index[0]

print(
    "\nResidence category with highest weighted "
    f"training poverty rate: {highest_poverty_residence}"
)

train_rural = (
    train_df["ur"] == highest_poverty_residence
).astype(float)

test_rural = (
    test_df["ur"] == highest_poverty_residence
).astype(float)


# ---------------------------------------------------------------------
# 6. EQUAL-WEIGHT TRANSPARENT INDEX
# ---------------------------------------------------------------------

train_df["vulnerability_score"] = (
    train_hh_size
    + train_low_education
    + train_low_livestock
    + train_rural
) / 4


test_df["vulnerability_score"] = (
    test_hh_size
    + test_low_education
    + test_low_livestock
    + test_rural
) / 4


print("\nVulnerability score created.")

print(
    test_df["vulnerability_score"].describe().to_string()
)


# ---------------------------------------------------------------------
# 7. RANK TEST HOUSEHOLDS
# ---------------------------------------------------------------------

test_df = test_df.sort_values(
    ["vulnerability_score", "hhid"],
    ascending=[False, True],
).reset_index(drop=True)

print(
    "\nTest households ranked from highest "
    "to lowest vulnerability."
)


# ---------------------------------------------------------------------
# 8. WEIGHTED METRICS
# ---------------------------------------------------------------------

def weighted_sum(series, weights):
    return (series * weights).sum()


def calculate_metrics(selected_mask):

    weights = test_df["weight"]

    poor = test_df["is_poor"] == 1
    non_poor = test_df["is_poor"] == 0

    total_poor = weighted_sum(
        poor.astype(int),
        weights,
    )

    selected_poor = weighted_sum(
        (selected_mask & poor).astype(int),
        weights,
    )

    total_selected = weighted_sum(
        selected_mask.astype(int),
        weights,
    )

    selected_non_poor = weighted_sum(
        (selected_mask & non_poor).astype(int),
        weights,
    )

    excluded_poor = (
        total_poor - selected_poor
    )

    coverage = (
        selected_poor / total_poor
        if total_poor > 0
        else 0
    )

    inclusion_error = (
        selected_non_poor / total_selected
        if total_selected > 0
        else 0
    )

    exclusion_error = (
        excluded_poor / total_poor
        if total_poor > 0
        else 0
    )

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
# 9. RUN BUDGET SCENARIOS
# ---------------------------------------------------------------------

results = []

print("\n" + "=" * 70)
print("RULE-BASED TARGETING SIMULATION")
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
            "strategy": "Rule-Based Targeting",
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
# 10. SAVE RESULTS
# ---------------------------------------------------------------------

results_df = pd.DataFrame(results)

print("\n" + "=" * 70)
print("SUMMARY")
print("=" * 70)

print(
    results_df[
        [
            "strategy",
            "budget",
            "households_selected",
            "coverage",
            "inclusion_error",
            "exclusion_error",
            "precision",
        ]
    ].to_string(index=False)
)

results_df.to_csv(
    OUTPUT_PATH,
    index=False,
)

print("\nResults saved:")
print(f"  {OUTPUT_PATH}")


# Save scored test households
test_df.to_parquet(
    SCORES_PATH,
    index=False,
)

print("\nScored households saved:")
print(f"  {SCORES_PATH}")


print("\n" + "=" * 70)
print("RULE-BASED TARGETING COMPLETE")
print("=" * 70)