from pathlib import Path

import numpy as np
import pandas as pd


ROOT = Path(__file__).resolve().parents[1]

DATA_DIR = ROOT / "data" / "processed"
FEATURES_PATH = DATA_DIR / "targeting_features.parquet"


BUDGETS = [0.05, 0.10, 0.20]


print("=" * 70)
print("SPTA SEVERE-POOR TARGETING COMPARISON")
print("=" * 70)


# ============================================================
# LOAD ANALYTICAL DATA
# ============================================================

print("\nLoading analytical dataset...")

df = pd.read_parquet(FEATURES_PATH)

df["is_poor"] = df["poverty"].isin([1, 2]).astype(int)

df["is_severely_poor"] = (
    df["poverty"] == 1
).astype(int)


# ============================================================
# REPRODUCE SAME TRAIN / TEST SPLIT
# ============================================================

from sklearn.model_selection import train_test_split


train_idx, test_idx = train_test_split(
    np.arange(len(df)),
    test_size=0.20,
    random_state=42,
    stratify=df["is_poor"],
)

train_df = df.iloc[train_idx].copy()
test_df = df.iloc[test_idx].copy()


print(f"Train households: {len(train_df):,}")
print(f"Test households:  {len(test_df):,}")


# ============================================================
# TOTAL TEST-SET TARGET POPULATIONS
# ============================================================

total_poor_weight = test_df.loc[
    test_df["is_poor"] == 1,
    "weight",
].sum()

total_severe_weight = test_df.loc[
    test_df["is_severely_poor"] == 1,
    "weight",
].sum()


# ============================================================
# STRATEGY SCORE FILES
# ============================================================

STRATEGIES = [
    (
        "Rule-Based Targeting",
        DATA_DIR / "rule_based_household_scores.parquet",
    ),
    (
        "Logistic Targeting",
        DATA_DIR / "test_household_scores.parquet",
    ),
    (
        "Random Forest Targeting",
        DATA_DIR / "random_forest_household_scores.parquet",
    ),
]


results = []


# ============================================================
# GEOGRAPHIC TARGETING
# ============================================================

print("\nBuilding geographic targeting ranking...")

# Calculate district poverty prevalence using TRAINING data only
district_stats = (
    train_df
    .groupby("district")
    .apply(
        lambda x: pd.Series(
            {
                "weighted_poor": (
                    x["is_poor"] * x["weight"]
                ).sum(),
                "weighted_total": x["weight"].sum(),
            }
        ),
        include_groups=False,
    )
)

district_stats["poverty_rate"] = (
    district_stats["weighted_poor"]
    / district_stats["weighted_total"]
)

district_ranking = (
    district_stats["poverty_rate"]
    .sort_values(ascending=False)
)


# Map district to ranking position
district_rank = {
    district: rank
    for rank, district in enumerate(
        district_ranking.index
    )
}


geo_test = test_df.copy()

geo_test["district_rank"] = (
    geo_test["district"]
    .map(district_rank)
    .fillna(len(district_rank))
)

# Same deterministic ordering used by geographic simulation
geo_test = geo_test.sort_values(
    ["district_rank", "hhid"]
).reset_index(drop=True)


# ============================================================
# EVALUATION FUNCTION
# ============================================================

def evaluate_strategy(
    strategy_name,
    ranked_df,
):

    for budget in BUDGETS:

        n_select = round(
            len(ranked_df) * budget
        )

        selected = ranked_df.head(n_select)

        severe_selected_weight = selected.loc[
            selected["is_severely_poor"] == 1,
            "weight",
        ].sum()

        poor_selected_weight = selected.loc[
            selected["is_poor"] == 1,
            "weight",
        ].sum()

        severe_coverage = (
            severe_selected_weight
            / total_severe_weight
            if total_severe_weight > 0
            else 0
        )

        poor_coverage = (
            poor_selected_weight
            / total_poor_weight
            if total_poor_weight > 0
            else 0
        )

        results.append(
            {
                "strategy": strategy_name,
                "budget": budget,
                "households_selected": n_select,
                "severe_poor_selected": int(
                    selected["is_severely_poor"].sum()
                ),
                "severe_poor_coverage": severe_coverage,
                "poor_coverage": poor_coverage,
                "weighted_severe_poor_selected": (
                    severe_selected_weight
                ),
            }
        )


# Geographic
evaluate_strategy(
    "Geographic Targeting",
    geo_test,
)


# ============================================================
# OTHER STRATEGIES
# ============================================================

for strategy_name, path in STRATEGIES:

    print(f"\nLoading: {path.name}")

    scores = pd.read_parquet(path)

    # Add poverty truth from analytical dataset.
    # This avoids depending on whether the score file
    # retained every original variable.
    truth = test_df[
        [
            "hhid",
            "poverty",
            "weight",
            "is_poor",
            "is_severely_poor",
        ]
    ].copy()

    scores = scores.drop(
        columns=[
            "poverty",
            "weight",
            "is_poor",
        ],
        errors="ignore",
    )

    scores = scores.merge(
        truth,
        on="hhid",
        how="inner",
    )

    if "vulnerability_score" not in scores.columns:
        raise ValueError(
            f"vulnerability_score not found in {path.name}"
        )

    scores = scores.sort_values(
        "vulnerability_score",
        ascending=False,
    ).reset_index(drop=True)

    evaluate_strategy(
        strategy_name,
        scores,
    )


# ============================================================
# RESULTS
# ============================================================

results_df = pd.DataFrame(results)

strategy_order = [
    "Geographic Targeting",
    "Rule-Based Targeting",
    "Logistic Targeting",
    "Random Forest Targeting",
]

results_df["strategy"] = pd.Categorical(
    results_df["strategy"],
    categories=strategy_order,
    ordered=True,
)

results_df = results_df.sort_values(
    ["budget", "strategy"]
).reset_index(drop=True)


# ============================================================
# SAVE
# ============================================================

output_path = (
    DATA_DIR
    / "severe_poor_targeting_comparison.csv"
)

results_df.to_csv(
    output_path,
    index=False,
)


# ============================================================
# DISPLAY
# ============================================================

print("\n" + "=" * 70)
print("SEVERE-POOR TARGETING RESULTS")
print("=" * 70)

display_columns = [
    "strategy",
    "budget",
    "households_selected",
    "severe_poor_selected",
    "severe_poor_coverage",
    "poor_coverage",
]

print(
    results_df[display_columns].to_string(
        index=False
    )
)

print("\nSaved:")
print(f"  {output_path}")

print("\n" + "=" * 70)
print("SEVERE-POOR COMPARISON COMPLETE")
print("=" * 70)