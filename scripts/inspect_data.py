from pathlib import Path
import pyreadstat

RAW_DIR = Path("data/raw")

TARGET_FILES = [
    "CS_EICV7_poverty_file.dta",
    "CS_S01_S5_S7_Household.dta",
    "CS_S0_S1_S2_S3_S4_S6A_S6B_S6C_Person.dta",
    "vup_s01_s5_s7_household.dta",
]

def inspect_file(file_path: Path):
    print("\n" + "=" * 100)
    print(f"FILE: {file_path.name}")
    print("=" * 100)

    try:
        _, meta = pyreadstat.read_dta(
            file_path,
            metadataonly=True
        )

        print(f"Rows:    {meta.number_rows:,}")
        print(f"Columns: {meta.number_columns:,}")

        print("\nVariables:")
        for name, label in zip(
            meta.column_names,
            meta.column_labels
        ):
            print(f"{name:<45} | {label}")

    except Exception as e:
        print(f"ERROR: {e}")


def main():
    print("SPTA Simulator — EICV7 Data Inspection")
    print("=" * 100)

    for filename in TARGET_FILES:
        file_path = RAW_DIR / filename

        if not file_path.exists():
            print(f"\n⚠️ NOT FOUND: {filename}")
            continue

        inspect_file(file_path)


if __name__ == "__main__":
    main()