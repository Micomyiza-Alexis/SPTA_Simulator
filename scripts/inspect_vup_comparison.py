from pathlib import Path
import pyreadstat

files = {
    "VUP households": "data/raw/vup_s01_s5_s7_household.dta",
    "Direct Support": "data/raw/vup_s9d1_direct_support.dta",
    "Classic Public Works": "data/raw/vup_s9d2_classic_public_work.dta",
    "Expanded Public Works": "data/raw/vup_s9d3_expanded_public_work.dta",
    "Nutrition-Sensitive Support": "data/raw/vup_s9d4_nsds.dta",
}

keywords = (
    "vup", "beneficiar", "participat", "enrol", "poverty",
    "quintile", "weight", "strata", "direct support",
    "public work", "nsds", "nutrition"
)

data = {}

for title, filename in files.items():
    path = Path(filename)
    if not path.exists():
        continue

    df, meta = pyreadstat.read_dta(str(path), encoding="latin1")
    data[title] = df

    labels = dict(zip(meta.column_names, meta.column_labels))
    print("\n" + "=" * 75)
    print(f"{title}: {len(df):,} rows")

    print("Relevant variables:")
    for col in meta.column_names:
        label = labels.get(col) or ""
        if any(k in col.lower() or k in label.lower() for k in keywords):
            non_missing = int(df[col].notna().sum())
            print(f"  {col} | {label} | non-missing={non_missing}/{len(df)}")

base = data.get("VUP households")
if base is not None and "hhid" in base:
    base_ids = set(base["hhid"].dropna())

    print("\n" + "=" * 75)
    print("HOUSEHOLD ID OVERLAP WITH VUP HOUSEHOLD FILE")

    for title, df in data.items():
        if title == "VUP households" or "hhid" not in df:
            continue

        ids = set(df["hhid"].dropna())
        overlap = base_ids & ids
        print(
            f"{title}: {len(overlap)} matching unique households "
            f"out of {len(ids)} unique household IDs"
        )
