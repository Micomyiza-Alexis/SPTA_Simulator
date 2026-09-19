from pathlib import Path
import pandas as pd


BASE_DIR = Path(__file__).resolve().parents[1]
PROCESSED_DIR = BASE_DIR / "data" / "processed"

FILES = [
    ("Random Targeting", "random_targeting_results.csv"),
    ("Geographic Targeting", "geographic_targeting_results.csv"),
    ("Rule-Based Targeting", "rule_based_targeting_results.csv"),
    ("Logistic Targeting", "targeting_simulation_results.csv"),
    ("Random Forest Targeting", "random_forest_targeting_results.csv"),
]

SEVERE_FILE = PROCESSED_DIR / "severe_poor_targeting_comparison.csv"

STRATEGY_ORDER = [
    "Random Targeting",
    "Geographic Targeting",
    "Rule-Based Targeting",
    "Logistic Targeting",
    "Random Forest Targeting",
]


def load_strategy_results():
    frames = []

    for strategy_name, filename in FILES:
        path = PROCESSED_DIR / filename

        print(f"\nLoading: {filename}")

        df = pd.read_csv(path)

        df["strategy"] = strategy_name

        frames.append(df)

    return pd.concat(frames, ignore_index=True)


def main():

    print("=" * 70)
    print("SPTA STRATEGY COMPARISON BUILDER")
    print("=" * 70)

    # ---------------------------------------------------------
    # Load five strategy results
    # ---------------------------------------------------------

    comparison = load_strategy_results()

    # ---------------------------------------------------------
    # Load severe-poor comparison
    # ---------------------------------------------------------

    print(f"\nLoading: {SEVERE_FILE.name}")

    severe = pd.read_csv(SEVERE_FILE)

    severe = severe[
        [
            "strategy",
            "budget",
            "severe_poor_coverage",
        ]
    ].copy()

    # ---------------------------------------------------------
    # Merge severe-poor coverage
    # ---------------------------------------------------------

    comparison = comparison.merge(
        severe,
        on=["strategy", "budget"],
        how="left",
        suffixes=("", "_severe"),
    )

    # Random Targeting already contains severe-poor coverage.
    # Other strategies receive their values from the severe-poor
    # comparison file.

    if "severe_poor_coverage_severe" in comparison.columns:

        if "severe_poor_coverage" not in comparison.columns:
            comparison["severe_poor_coverage"] = (
                comparison["severe_poor_coverage_severe"]
            )
        else:
            comparison["severe_poor_coverage"] = (
                comparison["severe_poor_coverage"]
                .fillna(comparison["severe_poor_coverage_severe"])
            )

        comparison.drop(
            columns=["severe_poor_coverage_severe"],
            inplace=True,
        )

    # ---------------------------------------------------------
    # Standardize strategy order
    # ---------------------------------------------------------

    comparison["strategy"] = pd.Categorical(
        comparison["strategy"],
        categories=STRATEGY_ORDER,
        ordered=True,
    )

    comparison = comparison.sort_values(
        ["budget", "strategy"]
    ).reset_index(drop=True)

    # ---------------------------------------------------------
    # Keep final columns
    # ---------------------------------------------------------

    columns = [
        "strategy",
        "budget",
        "households_selected",
        "weighted_selected",
        "weighted_poor_selected",
        "coverage",
        "severe_poor_coverage",
        "inclusion_error",
        "exclusion_error",
        "precision",
    ]

    # Random Targeting does not currently provide
    # weighted_selected and weighted_poor_selected.
    # Those values remain NaN for that strategy.

    comparison = comparison[columns]

    # ---------------------------------------------------------
    # Save
    # ---------------------------------------------------------

    output_path = PROCESSED_DIR / "strategy_comparison.csv"

    comparison.to_csv(
        output_path,
        index=False,
    )

    # ---------------------------------------------------------
    # Display
    # ---------------------------------------------------------

    print("\n" + "=" * 70)
    print("FIVE-STRATEGY COMPARISON")
    print("=" * 70)

    print(
        comparison.to_string(
            index=False,
            float_format=lambda x: f"{x:.6f}",
        )
    )

    print("\nSaved:")
    print(f"  {output_path}")

    print("\n" + "=" * 70)
    print("COMPARISON COMPLETE")
    print("=" * 70)


if __name__ == "__main__":
    main()