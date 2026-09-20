from pathlib import Path

import numpy as np
import pandas as pd


ROOT = Path(__file__).resolve().parents[1]

DATA_PATH = (
    ROOT
    / "data"
    / "processed"
    / "targeting_features.parquet"
)

OUTPUT_PATH = (
    ROOT
    / "data"
    / "processed"
    / "random_targeting_results.csv"
)

BUDGETS = [0.05, 0.10, 0.20]

N_SIMULATIONS = 1000

RANDOM_SEED = 42


print("=" * 70)
print("RANDOM TARGETING BASELINE SIMULATION")
print("=" * 70)


# ============================================================
# LOAD DATA
# ============================================================

print("\nLoading analytical dataset...")

df = pd.read_parquet(DATA_PATH)

df["is_poor"] = (
    df["poverty"].isin([1, 2])
).astype(int)

df["is_severely_poor"] = (
    df["poverty"] == 1
).astype(int)


# ============================================================
# SAME TRAIN / TEST SPLIT
# ============================================================

from sklearn.model_selection import train_test_split


train_idx, test_idx = train_test_split(
    np.arange(len(df)),
    test_size=0.20,
    random_state=42,
    stratify=df["is_poor"],
)

test_df = df.iloc[test_idx].copy()

print(f"Test households: {len(test_df):,}")

print(
    f"Poor households: "
    f"{test_df['is_poor'].sum():,}"
)

print(
    f"Severely poor households: "
    f"{test_df['is_severely_poor'].sum():,}"
)


# ============================================================
# POPULATION TOTALS
# ============================================================

total_weight = test_df["weight"].sum()

total_poor_weight = test_df.loc[
    test_df["is_poor"] == 1,
    "weight",
].sum()

total_severe_weight = test_df.loc[
    test_df["is_severely_poor"] == 1,
    "weight",
].sum()


# ============================================================
# RANDOM SIMULATION
# ============================================================

rng = np.random.default_rng(RANDOM_SEED)

results = []


for budget in BUDGETS:

    n_select = round(
        len(test_df) * budget
    )

    print(
        f"\nSimulating {budget:.0%} budget "
        f"({n_select} households)..."
    )

    coverage_values = []
    severe_coverage_values = []
    precision_values = []

    weighted_selected_values = []
    weighted_poor_selected_values = []

    inclusion_error_values = []
    exclusion_error_values = []

    for simulation in range(N_SIMULATIONS):

        selected_indices = rng.choice(
            len(test_df),
            size=n_select,
            replace=False,
        )

        selected = test_df.iloc[
            selected_indices
        ]

        selected_weight = selected["weight"].sum()

        selected_poor_weight = selected.loc[
            selected["is_poor"] == 1,
            "weight",
        ].sum()

        selected_severe_weight = selected.loc[
            selected["is_severely_poor"] == 1,
            "weight",
        ].sum()

        selected_nonpoor_weight = selected.loc[
            selected["is_poor"] == 0,
            "weight",
        ].sum()

        poor_not_selected_weight = (
            total_poor_weight
            - selected_poor_weight
        )

        coverage = (
            selected_poor_weight
            / total_poor_weight
        )

        severe_coverage = (
            selected_severe_weight
            / total_severe_weight
        )

        precision = (
            selected_poor_weight
            / selected_weight
        )

        inclusion_error = (
            selected_nonpoor_weight
            / selected_weight
        )

        exclusion_error = (
            poor_not_selected_weight
            / total_poor_weight
        )

        coverage_values.append(coverage)

        severe_coverage_values.append(
            severe_coverage
        )

        precision_values.append(
            precision
        )

        weighted_selected_values.append(
            selected_weight
        )

        weighted_poor_selected_values.append(
            selected_poor_weight
        )

        inclusion_error_values.append(
            inclusion_error
        )

        exclusion_error_values.append(
            exclusion_error
        )

    results.append(
        {
            "strategy": "Random Targeting",
            "budget": budget,
            "households_selected": n_select,

            "weighted_selected": np.mean(
                weighted_selected_values
            ),

            "weighted_poor_selected": np.mean(
                weighted_poor_selected_values
            ),

            "coverage": np.mean(
                coverage_values
            ),

            "severe_poor_coverage": np.mean(
                severe_coverage_values
            ),

            "precision": np.mean(
                precision_values
            ),

            "inclusion_error": np.mean(
                inclusion_error_values
            ),

            "exclusion_error": np.mean(
                exclusion_error_values
            ),

            "coverage_std": np.std(
                coverage_values
            ),

            "severe_poor_coverage_std": np.std(
                severe_coverage_values
            ),
        }
    )


# ============================================================
# SAVE
# ============================================================

results_df = pd.DataFrame(results)

OUTPUT_PATH.parent.mkdir(
    parents=True,
    exist_ok=True,
)

results_df.to_csv(
    OUTPUT_PATH,
    index=False,
)


# ============================================================
# DISPLAY
# ============================================================

print("\n" + "=" * 70)
print("RANDOM TARGETING BASELINE RESULTS")
print("=" * 70)

display_columns = [
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

print(
    results_df[
        display_columns
    ].to_string(index=False)
)

print("\nSaved:")
print(f"  {OUTPUT_PATH}")

print("\n" + "=" * 70)
print("RANDOM BASELINE COMPLETE")
print("=" * 70)