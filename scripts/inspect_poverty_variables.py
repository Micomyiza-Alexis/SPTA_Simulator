from pathlib import Path
import pyreadstat

files = [
    "data/raw/CS_EICV7_poverty_file.dta",
    "data/raw/vup_s01_s5_s7_household.dta",
    "data/raw/vup_s9d1_direct_support.dta",
]

keywords = (
    "poverty", "poor", "welfare", "consumption", "expenditure",
    "poverty line", "quintile", "decile", "welfare index",
    "eligibility", "beneficiar", "vup", "target"
)

for filename in files:
    path = Path(filename)
    print("\n" + "=" * 85)
    print("FILE:", path.name)

    df, meta = pyreadstat.read_dta(str(path), encoding="latin1")

    print("Rows:", len(df))
    print("File label:", getattr(meta, "file_label", None))

    if "hhid" in df:
        ids = df["hhid"].dropna()
        print("HHID minimum:", ids.min() if len(ids) else None)
        print("HHID maximum:", ids.max() if len(ids) else None)
        print("First 10 HHIDs:", ids.head(10).tolist())

    if "hhid" in df and "province" in df:
        print("Households per province:")
        print(df.groupby("province")["hhid"].nunique().to_string())

    labels = dict(zip(meta.column_names, meta.column_labels))
    print("\nRelevant variables:")
    found = False

    for col in meta.column_names:
        label = labels.get(col) or ""
        if any(word in col.lower() or word in label.lower()
               for word in keywords):
            print(f"  {col} | {label}")
            found = True

    if not found:
        print("  No variables matched the search terms.")
