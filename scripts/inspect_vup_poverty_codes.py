from pathlib import Path
import pyreadstat
import pandas as pd

files = {
    "VUP households": "data/raw/vup_s01_s5_s7_household.dta",
    "Direct Support": "data/raw/vup_s9d1_direct_support.dta",
    "Classic Public Works": "data/raw/vup_s9d2_classic_public_work.dta",
    "Expanded Public Works": "data/raw/vup_s9d3_expanded_public_work.dta",
    "Nutrition-Sensitive Support": "data/raw/vup_s9d4_nsds.dta",
}

variables = [
    "poverty", "pov_jan", "epov_jan", "quintile",
    "s9d1q1", "s9d1q3", "s9d1q4",
    "s9d2q1", "s9d2q11",
    "s9d3q1", "s9d3q10",
    "s9d4q1", "s9d4q8",
]

for title, filename in files.items():
    path = Path(filename)
    if not path.exists():
        continue

    df, meta = pyreadstat.read_dta(str(path), encoding="latin1")
    labels = dict(zip(meta.column_names, meta.column_labels))
    value_labels = getattr(meta, "variable_value_labels", {}) or {}

    print("\n" + "=" * 85)
    print(f"{title} | rows={len(df):,}")

    for col in variables:
        if col not in df.columns:
            continue

        print(f"\n{col} — {labels.get(col, '')}")
        print("Value labels:", value_labels.get(col, {}))

        counts = df[col].value_counts(dropna=False).sort_index()
        print("Counts:")
        print(counts.to_string())
