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

frames = {}

for name, filename in files.items():
    path = Path(filename)
    if not path.exists():
        print(f"Missing file: {filename}")
        continue

    df, meta = pyreadstat.read_dta(str(path), encoding="latin1")
    frames[name] = df

    print("\n" + "=" * 75)
    print(f"{name}: {len(df):,} rows")

    if "hhid" not in df.columns:
        print("No hhid column")
        continue

    print("Unique households:", df["hhid"].nunique())
    print("Rows with missing hhid:", int(df["hhid"].isna().sum()))
    print("Households with multiple rows:",
          int((df["hhid"].value_counts() > 1).sum()))

base = frames.get("VUP households")
if base is None:
    raise SystemExit("VUP household file could not be loaded.")

# Compare household-level fields for every linked programme module.
fields = ["poverty", "pov_jan", "epov_jan", "weight", "pop_wt", "province", "district", "ur"]

for name, df in frames.items():
    if name == "VUP households" or "hhid" not in df.columns:
        continue

    print("\n" + "-" * 75)
    print(f"CONSISTENCY CHECK: {name}")

    common = [c for c in fields if c in base.columns and c in df.columns]
    left = base[["hhid"] + common].drop_duplicates("hhid")
    right = df[["hhid"] + common].drop_duplicates()

    joined = right.merge(left, on="hhid", how="left", suffixes=("_module", "_household"), indicator=True)
    print("Module unique households:", df["hhid"].nunique())
    print("Matched to household file:", int((joined["_merge"] == "both").sum()))

    for col in common:
        a, b = f"{col}_module", f"{col}_household"
        if a not in joined.columns or b not in joined.columns:
            continue

        valid = joined[a].notna() & joined[b].notna()
        mismatches = int((joined.loc[valid, a] != joined.loc[valid, b]).sum())
        print(f"{col}: compared={int(valid.sum())}, mismatches={mismatches}")

    if "hhid" in df.columns:
        dupes = df[df["hhid"].duplicated(keep=False)].sort_values("hhid")
        if not dupes.empty:
            print("Example repeated household IDs:", dupes["hhid"].drop_duplicates().head(10).tolist())
