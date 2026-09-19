from pathlib import Path

import numpy as np
import pandas as pd


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[1]

FEATURES_PATH = (
    BASE_DIR
    / "data"
    / "processed"
    / "targeting_features.parquet"
)

SCORES_PATH = (
    BASE_DIR
    / "data"
    / "processed"
    / "restricted_model_test_scores.parquet"
)

OUTPUT_PATH = (
    BASE_DIR
    / "data"
    / "processed"
    / "restricted_targeting_results.csv"
)


# ============================================================
# CONFIGURATION
# ============================================================

BUDGETS = [0.05, 0.10, 0.20]


# ============================================================
# HELPERS
# ============================================================

def weighted_sum(values, weights):
    return np.sum(values * weights)


def calculate_metrics(
    ranked_df,
    n_select,
    total_poor_weight,
    total_severe_poor_weight,
):
    selected = ranked_df.iloc[:n_select].copy()

    selected["selected"] = 1

    # --------------------------------------------------------
    # Weighted selected population
    # --------------------------------------------------------

    weighted_selected = weighted_sum(
        selected["is_poor"].to_numpy(),
        selected["weight"].to_numpy(),
    )

    # --------------------------------------------------------
    # Weighted poor selected
    # --------------------------------------------------------

    weighted_poor_selected = weighted_sum(
        selected["is_poor"].to_numpy(),
        selected["weight"].to_numpy(),
    )

    # --------------------------------------------------------
    # Weighted severe-poor selected
    # --------------------------------------------------------

    weighted_severe_poor_selected = weighted_sum(
        selected["is_severe_poor"].to_numpy(),
        selected["weight"].to_numpy(),
    )

    # --------------------------------------------------------
    # Coverage
    # --------------------------------------------------------

    coverage = (
        weighted_poor_selected / total_poor_weight
        if total_poor_weight > 0
        else 0
    )

    severe_poor_coverage = (
        weighted_severe_poor_selected
        / total_severe_poor_weight
        if total_severe_poor_weight > 0
        else 0
    )

    # --------------------------------------------------------
    # Inclusion error / precision
    # --------------------------------------------------------

    selected_weight = selected["weight"].sum()

    weighted_selected_poor = weighted_poor_selected

    weighted_selected_nonpoor = (
        selected_weight - weighted_selected_poor
    )

    inclusion_error = (
        weighted_selected_nonpoor / selected_weight
        if selected_weight > 0
        else 0
    )

    precision = (
        weighted_selected_poor / selected_weight
        if selected_weight > 0
        else 0
    )

    # --------------------------------------------------------
    # Exclusion error
    # --------------------------------------------------------

    weighted_poor_not_selected = (
        total_poor_weight
        - weighted_poor_selected
    )

    exclusion_error = (
        weighted_poor_not_selected / total_poor_weight
        if total_poor_weight > 0
        else 0
    )

    return {
        "households_selected": n_select,
        "weighted_selected": selected_weight,
        "weighted_poor_selected": weighted_poor_selected,
        "weighted_severe_poor_selected": weighted_severe_poor_selected,
        "coverage": coverage,
        "severe_poor_coverage": severe_poor_coverage,
        "inclusion_error": inclusion_error,
        "exclusion_error": exclusion_error,
        "precision": precision,
    }


# ============================================================
# MAIN
# ============================================================

def main():

    print("=" * 70)
    print("RESTRICTED-FEATURE TARGETING SIMULATION")
    print("=" * 70)

    # --------------------------------------------------------
    # Load data
    # --------------------------------------------------------

    print("\nLoading analytical dataset...")

    features = pd.read_parquet(FEATURES_PATH)

    print(f"Households in analytical dataset: {len(features):,}")

    print("\nLoading restricted model scores...")

    scores = pd.read_parquet(SCORES_PATH)

    print(f"Test households: {len(scores):,}")

    # --------------------------------------------------------
    # Prepare truth
    # --------------------------------------------------------

    truth = features[
        [
            "hhid",
            "poverty",
            "weight",
            "pop_wt",
        ]
    ].copy()

    truth["is_poor"] = truth["poverty"].isin([1, 2]).astype(int)

    truth["is_severe_poor"] = (
        truth["poverty"] == 1
    ).astype(int)

    # --------------------------------------------------------
    # Merge truth with model scores
    # --------------------------------------------------------

    df = scores[
        [
            "hhid",
            "logistic_vulnerability_score",
            "random_forest_vulnerability_score",
        ]
    ].merge(
        truth,
        on="hhid",
        how="left",
        validate="one_to_one",
    )

    # --------------------------------------------------------
    # Validation
    # --------------------------------------------------------

    if df["poverty"].isna().any():
        raise ValueError(
            "Some test households could not be matched "
            "to poverty truth."
        )

    if df["weight"].isna().any():
        raise ValueError(
            "Some test households are missing survey weights."
        )

    if df["logistic_vulnerability_score"].isna().any():
        raise ValueError(
            "Missing restricted logistic vulnerability scores."
        )

    if df["random_forest_vulnerability_score"].isna().any():
        raise ValueError(
            "Missing restricted random forest vulnerability scores."
        )

    # --------------------------------------------------------
    # Test-set totals
    # --------------------------------------------------------

    total_poor_weight = df.loc[
        df["is_poor"] == 1,
        "weight",
    ].sum()

    total_severe_poor_weight = df.loc[
        df["is_severe_poor"] == 1,
        "weight",
    ].sum()

    print(f"\nPoor households: {df['is_poor'].sum():,}")
    print(
        f"Severe-poor households: "
        f"{df['is_severe_poor'].sum():,}"
    )

    print(
        f"Weighted poor population: "
        f"{total_poor_weight:,.2f}"
    )

    print(
        f"Weighted severe-poor population: "
        f"{total_severe_poor_weight:,.2f}"
    )

    # --------------------------------------------------------
    # Simulate strategies
    # --------------------------------------------------------

    results = []

    strategies = [
        (
            "Restricted Logistic Targeting",
            "logistic_vulnerability_score",
        ),
        (
            "Restricted Random Forest Targeting",
            "random_forest_vulnerability_score",
        ),
    ]

    for strategy_name, score_column in strategies:

        print("\n" + "-" * 70)
        print(strategy_name)
        print("-" * 70)

        ranked_df = df.sort_values(
            by=[score_column, "hhid"],
            ascending=[False, True],
        ).reset_index(drop=True)

        for budget in BUDGETS:

            n_select = round(
                len(ranked_df) * budget
            )

            metrics = calculate_metrics(
                ranked_df=ranked_df,
                n_select=n_select,
                total_poor_weight=total_poor_weight,
                total_severe_poor_weight=total_severe_poor_weight,
            )

            result = {
                "strategy": strategy_name,
                "budget": budget,
                **metrics,
            }

            results.append(result)

            print(
                f"\nBudget: {budget:.0%}"
            )

            print(
                f"  Households selected: "
                f"{metrics['households_selected']}"
            )

            print(
                f"  Poor coverage: "
                f"{metrics['coverage']:.2%}"
            )

            print(
                f"  Severe-poor coverage: "
                f"{metrics['severe_poor_coverage']:.2%}"
            )

            print(
                f"  Precision: "
                f"{metrics['precision']:.2%}"
            )

            print(
                f"  Inclusion error: "
                f"{metrics['inclusion_error']:.2%}"
            )

            print(
                f"  Exclusion error: "
                f"{metrics['exclusion_error']:.2%}"
            )

    # --------------------------------------------------------
    # Save results
    # --------------------------------------------------------

    results_df = pd.DataFrame(results)

    results_df = results_df.sort_values(
        ["budget", "strategy"]
    ).reset_index(drop=True)

    results_df.to_csv(
        OUTPUT_PATH,
        index=False,
    )

    print("\n" + "=" * 70)
    print("RESTRICTED TARGETING RESULTS")
    print("=" * 70)

    print(
        results_df.to_string(
            index=False,
            float_format=lambda x: f"{x:.6f}",
        )
    )

    print("\nSaved:")
    print(f"  {OUTPUT_PATH}")

    print("\n" + "=" * 70)
    print("RESTRICTED TARGETING SIMULATION COMPLETE")
    print("=" * 70)


if __name__ == "__main__":
    main()