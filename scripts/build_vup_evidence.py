from collections import Counter
from datetime import datetime, timezone
import json
from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
OUTPUT = ROOT / "data" / "processed" / "vup_evidence_summary.json"

MASTER_FILE = "vup_s01_s5_s7_household.dta"

COMPONENTS = {
    "direct_support": (
        "vup_s9d1_direct_support.dta",
        "Direct Support",
    ),
    "classic_public_works": (
        "vup_s9d2_classic_public_work.dta",
        "Classic Public Works",
    ),
    "expanded_public_works": (
        "vup_s9d3_expanded_public_work.dta",
        "Expanded Public Works",
    ),
    "nsds": (
        "vup_s9d4_nsds.dta",
        "Nutrition-Sensitive Direct Support",
    ),
    "financial_services": (
        "vup_s9d5_financial_services.dta",
        "Financial Services",
    ),
}

POVERTY_LABELS = {
    1: "Severely poor",
    2: "Moderately poor",
    3: "Non-poor",
}


def read_household_ids(path: Path) -> pd.DataFrame:
    df = pd.read_stata(path, convert_categoricals=False)

    required = {"hhid"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"{path.name} missing columns: {sorted(missing)}")

    if df["hhid"].isna().any():
        raise ValueError(f"{path.name} contains missing household IDs")

    return df


def count_categories(series: pd.Series, labels: dict) -> list[dict]:
    counts = series.value_counts(dropna=False).to_dict()
    total = int(series.notna().sum())
    result = []

    for code, label in labels.items():
        count = int(counts.get(code, 0))
        result.append({
            "category": label,
            "count": count,
            "percent": round(100 * count / total, 2) if total else None,
        })

    missing = int(series.isna().sum())
    if missing:
        result.append({
            "category": "Missing or unclassified",
            "count": missing,
            "percent": round(100 * missing / len(series), 2),
        })

    return result


def main() -> None:
    master_path = RAW / MASTER_FILE
    if not master_path.exists():
        raise FileNotFoundError(f"Missing master dataset: {master_path}")

    master = read_household_ids(master_path)

    if "poverty" not in master.columns:
        raise ValueError("Master dataset has no 'poverty' variable")

    if master["hhid"].duplicated().any():
        raise ValueError("Master dataset contains duplicate household IDs")

    master["poverty"] = pd.to_numeric(master["poverty"], errors="coerce")
    master_ids = set(master["hhid"].tolist())
    master_poverty = master.set_index("hhid")["poverty"]

    component_id_sets = {}
    component_results = []
    component_duplicates = {}

    for key, (filename, label) in COMPONENTS.items():
        path = RAW / filename
        if not path.exists():
            raise FileNotFoundError(f"Missing component dataset: {path}")

        component = read_household_ids(path)
        duplicate_rows = int(component["hhid"].duplicated().sum())
        unique_ids = set(component["hhid"].tolist())

        unmatched = unique_ids - master_ids
        if unmatched:
            raise ValueError(
                f"{filename}: {len(unmatched)} household IDs do not match "
                "the VUP master. Aggregate generation stopped."
            )

        component_id_sets[key] = unique_ids
        component_duplicates[key] = duplicate_rows

        # Use unique household IDs and the master welfare classification,
        # rather than counting repeated component rows.
        poverty_for_component = master_poverty.reindex(sorted(unique_ids))
        poverty_counts = count_categories(
            poverty_for_component,
            POVERTY_LABELS,
        )

        component_results.append({
            "key": key,
            "label": label,
            "unique_households": len(unique_ids),
            "duplicate_rows_removed": duplicate_rows,
            "poverty_composition": poverty_counts,
        })

    # Include every master household so the zero-component group is counted.
    participation_count = Counter({hhid: 0 for hhid in master_ids})
    for ids in component_id_sets.values():
        participation_count.update(ids)

    union_ids = {
        hhid for hhid, count in participation_count.items() if count > 0
    }
    overlap_distribution = [
        {
            "components_per_household": n,
            "households": sum(
                1 for count in participation_count.values() if count == n
            ),
        }
        for n in range(0, len(COMPONENTS) + 1)
    ]

    # Only aggregate counts are written; no IDs or row-level data are exported.
    payload = {
        "metadata": {
            "title": "VUP programme evidence",
            "source": "VUP household survey files supplied for the research project",
            "master_households": len(master),
            "component_files": len(COMPONENTS),
            "weighting": "Unweighted sample statistics; national estimates not asserted",
            "generated_at_utc": datetime.now(timezone.utc).isoformat(),
            "privacy_note": (
                "Aggregate statistics only. No household IDs, person IDs, "
                "individual records, or individual financial amounts."
            ),
        },
        "overall_poverty_composition": count_categories(
            master["poverty"],
            POVERTY_LABELS,
        ),
        "programme_components": component_results,
        "overlap": {
            "households_in_any_component": len(union_ids),
            "households_in_no_component": len(master_ids - union_ids),
            "households_in_multiple_components": sum(
                1 for count in participation_count.values() if count >= 2
            ),
            "distribution_by_component_count": overlap_distribution,
        },
        "validation": {
            "master_ids_unique": True,
            "all_component_ids_matched_to_master": True,
            "component_ids_deduplicated_for_overlap": True,
            "component_duplicate_rows": component_duplicates,
        },
    }

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    print(f"Aggregate file written: {OUTPUT}")
    print(f"Master households: {len(master):,}")
    print(f"Households in any component: {len(union_ids):,}")
    print(
        "Households in multiple components: "
        f"{payload['overlap']['households_in_multiple_components']:,}"
    )
    print("\nComponent summary:")
    for component in component_results:
        print(
            f"  {component['label']}: "
            f"{component['unique_households']:,} unique households; "
            f"{component['duplicate_rows_removed']} duplicate rows removed"
        )
    print("\nNo household-level records were written to the output.")


if __name__ == "__main__":
    main()
