from pathlib import Path
import pyreadstat
import pandas as pd

files = {
    "poverty": "data/raw/CS_EICV7_poverty_file.dta",
    "vup_households": "data/raw/vup_s01_s5_s7_household.dta",
    "direct_support": "data/raw/vup_s9d1_direct_support.dta",
    "classic_work": "data/raw/vup_s9d2_classic_public_work.dta",
    "expanded_work": "data/raw/vup_s9d3_expanded_public_work.dta",
    "nsds": "data/raw/vup_s9d4_nsds.dta",
}

frames = {}

def clean_ids(series):
    values = pd.to_numeric(series, errors="coerce")
    return set(values.dropna().astype("int64"))

for name, filename in files.items():
    path = Path(filename)
    print("\n" + "=" * 75)
    print(name, "-", filename)

    if not path.exists():
        print("FILE NOT FOUND")
        continue

    df, meta = pyreadstat.read_dta(str(path), encoding="latin1")
    frames[name] = df

    print("Rows:", len(df))
    print("Missing hhid:", df["hhid"].isna().sum() if "hhid" in df else "NO HHID")
    print("Unique hhid:", df["hhid"].nunique() if "hhid" in df else "NO HHID")
    print("Duplicate hhid rows:", df["hhid"].duplicated().sum() if "hhid" in df else "NO HHID")

    if name == "poverty":
        labels = dict(zip(meta.column_names, meta.column_labels))
        for col in ("hhid", "hh_index", "weight"):
            if col in labels:
                print(f"Variable label — {col}: {labels[col]}")

if "poverty" in frames and "vup_households" in frames:
    poverty_ids = clean_ids(frames["poverty"]["hhid"])
    vup_ids = clean_ids(frames["vup_households"]["hhid"])
    overlap = poverty_ids & vup_ids

    print("\n" + "=" * 75)
    print("POVERTY ↔ VUP HOUSEHOLD LINK TEST")
    print("Unique poverty household IDs:", len(poverty_ids))
    print("Unique VUP household IDs:", len(vup_ids))
    print("Matching household IDs:", len(overlap))
    print("Poverty IDs found in VUP:", round(100 * len(overlap) / max(1, len(poverty_ids)), 2), "%")
    print("VUP IDs found in poverty:", round(100 * len(overlap) / max(1, len(vup_ids)), 2), "%")
    print("Example matching IDs:", sorted(overlap)[:10])
