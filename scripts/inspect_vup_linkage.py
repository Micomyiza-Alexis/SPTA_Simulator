from pathlib import Path
import pyreadstat

FILES = [
    "data/raw/CS_EICV7_poverty_file.dta",
    "data/raw/vup_s01_s5_s7_household.dta",
    "data/raw/vup_s0_s1_s2_s3_s4_s6a_s6b_s6c_person.dta",
    "data/raw/vup_s9d1_direct_support.dta",
    "data/raw/vup_s9d2_classic_public_work.dta",
    "data/raw/vup_s9d3_expanded_public_work.dta",
    "data/raw/vup_s9d4_nsds.dta",
]

terms = ("id", "hh", "household", "cluster", "district",
         "sector", "cell", "village", "province", "pid", "psu")

for filename in FILES:
    path = Path(filename)
    print("\n" + "=" * 90)
    print(f"FILE: {path.name}")

    if not path.exists():
        print("FILE NOT FOUND")
        continue

    try:
        df, meta = pyreadstat.read_dta(
            str(path), row_limit=3, encoding="latin1"
        )

        labels = dict(zip(meta.column_names, meta.column_labels))
        columns = [
            c for c in meta.column_names
            if any(term in c.lower() for term in terms)
            or any(term in (labels.get(c) or "").lower()
                   for term in terms)
        ]

        print(f"Rows: {meta.number_rows:,}")
        print("Potential ID/linkage columns:")
        for col in columns:
            print(f"  {col} | {labels.get(col, '')}")

        print("First 3 records for these columns:")
        if columns:
            print(df[columns].to_string(index=False))
        else:
            print("No obvious ID columns found.")

    except Exception as exc:
        print("ERROR:", exc)
