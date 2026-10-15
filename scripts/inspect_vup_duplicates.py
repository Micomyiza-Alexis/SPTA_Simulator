from pathlib import Path
import pyreadstat

files = {
    "Direct Support": "data/raw/vup_s9d1_direct_support.dta",
    "Classic Public Works": "data/raw/vup_s9d2_classic_public_work.dta",
    "Expanded Public Works": "data/raw/vup_s9d3_expanded_public_work.dta",
}

for name, filename in files.items():
    df, meta = pyreadstat.read_dta(str(Path(filename)), encoding="latin1")
    duplicated = df[df["hhid"].duplicated(keep=False)].sort_values("hhid")

    print("\n" + "=" * 80)
    print(name)

    if duplicated.empty:
        print("No repeated household IDs.")
        continue

    labels = dict(zip(meta.column_names, meta.column_labels))

    for hhid, group in duplicated.groupby("hhid", sort=True):
        print(f"\nHousehold ID: {hhid} | rows: {len(group)}")

        # Show only ID, member, poverty, and programme/payment variables.
        selected = [
            col for col in group.columns
            if col in ("hhid", "pid", "poverty", "pov_jan", "epov_jan",
                       "s9d1q1", "s9d1q3", "s9d1q4",
                       "s9d2q1", "s9d2q11",
                       "s9d3q1", "s9d3q10")
        ]

        for col in selected:
            print(f"  {col} ({labels.get(col, '')}): {group[col].tolist()}")

        # Count columns that differ across rows, excluding hhid.
        differing = [
            col for col in group.columns
            if col != "hhid" and group[col].nunique(dropna=False) > 1
        ]
        print("Columns differing across rows:", differing[:20])
        if len(differing) > 20:
            print(f"... plus {len(differing) - 20} more")
