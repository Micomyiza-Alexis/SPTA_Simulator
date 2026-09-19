"""
SPTA Simulator - Geographic Targeting Strategy

Strategy:
    Rank districts by weighted poverty prevalence using TRAINING data only.

Then:
    Apply that district ranking to the held-out TEST set.

Budgets:
    5%, 10%, 20% of test households.

Important:
    Test-set poverty labels are used ONLY for evaluation,
    never for deciding who receives assistance.
"""

from pathlib import Path

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
    / "geographic_targeting_results.csv"
)

RANKING_PATH = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "district_poverty_ranking.csv"
)

RANDOM_STATE = 42
TEST_SIZE = 0.20

BUDGETS = [0.05, 0.10, 0.20]


print("=" * 70)
print("SPTA GEOGRAPHIC TARGETING SIMULATOR")
print("=" * 70)


# ---------------------------------------------------------------------
# 1. LOAD DATA
# ---------------------------------------------------------------------

print("\nLoading dataset...")

df = pd.read_parquet(DATA_PATH)

print(f"Total households: {len(df):,}")

df["is_poor"] = df["poverty"].isin([1, 2]).astype(int)


# ---------------------------------------------------------------------
# 2. RECREATE THE SAME TRAIN / TEST SPLIT
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
# 3. CALCULATE DISTRICT POVERTY RATES USING TRAINING DATA ONLY
# ---------------------------------------------------------------------

print("\nCalculating district poverty rates from training data...")

district_stats = (
    train_df
    .groupby("district")
    .apply(
        lambda group: pd.Series(
            {
                "weighted_households": group["weight"].sum(),
                "weighted_poor": (
                    group["is_poor"] * group["weight"]
                ).sum(),
            }
        ),
        include_groups=False,
    )
    .reset_index()
)

district_stats["poverty_rate"] = (
    district_stats["weighted_poor"]
    / district_stats["weighted_households"]
)

district_stats = district_stats.sort_values(
    "poverty_rate",
    ascending=False,
).reset_index(drop=True)

district_stats["district_rank"] = (
    district_stats.index + 1
)


print("\nDistrict ranking:")
print(
    district_stats[
        [
            "district_rank",
            "district",
            "poverty_rate",
            "weighted_households",
        ]
    ].to_string(index=False)
)


# Save ranking for transparency / reproducibility
district_stats.to_csv(
    RANKING_PATH,
    index=False,
)

print(f"\nDistrict ranking saved:")
print(f"  {RANKING_PATH}")


# ---------------------------------------------------------------------
# 4. APPLY TRAINING-DERIVED RANKING TO TEST HOUSEHOLDS
# ---------------------------------------------------------------------

rank_map = district_stats.set_index(
    "district"
)["district_rank"]

test_df["district_rank"] = (
    test_df["district"]
    .map(rank_map)
)

# Unknown districts should not occur, but put them at the end
test_df["district_rank"] = (
    test_df["district_rank"]
    .fillna(district_stats["district_rank"].max() + 1)
)

# Deterministic ordering:
#   1. poorest district first
#   2. hhid for stable ordering inside district
test_df = test_df.sort_values(
    ["district_rank", "hhid"],
    ascending=[True, True],
).reset_index(drop=True)


print(
    "\nTest households ordered by training-derived "
    "district poverty ranking."
)


# ---------------------------------------------------------------------
# 5. WEIGHTED METRICS
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
# 6. RUN BUDGET SCENARIOS
# ---------------------------------------------------------------------

results = []

print("\n" + "=" * 70)
print("GEOGRAPHIC TARGETING SIMULATION")
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
            "strategy": "Geographic Targeting",
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
# 7. SAVE RESULTS
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


print("\n" + "=" * 70)
print("GEOGRAPHIC TARGETING COMPLETE")
print("=" * 70)