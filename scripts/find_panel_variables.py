import glob
import os
import pyreadstat

keywords = [
    "panel",
    "wave",
    "round",
    "year",
    "old",
    "new",
    "previous",
    "prior",
    "hhid"
]

for path in glob.glob("data/raw/*.dta"):
    name = os.path.basename(path)

    try:
        df, meta = pyreadstat.read_dta(
            path,
            metadataonly=True,
            encoding="latin1"
        )

        matches = []

        for col in df.columns:
            col_lower = col.lower()

            if any(k in col_lower for k in keywords):
                matches.append(col)

        if matches:
            print("\n" + "=" * 70)
            print(name)
            print("Matches:", matches)

    except Exception as e:
        print(f"\nERROR: {name}")
        print(e)