from pathlib import Path
import pyreadstat

RAW_DIR = Path("data/raw")

TERMS = [
    "transfer",
    "cash",
    "public",
    "work",
    "direct",
    "social",
    "assistance",
    "benefit",
    "received",
    "member",
    "program",
    "support",
    "payment",
    "financial",
]


def main():
    files = sorted(RAW_DIR.glob("vup_*.dta"))

    print("SPTA Simulator - VUP Variable Inspection")
    print("=" * 100)

    for file_path in files:
        print("\n" + "=" * 100)
        print("FILE:", file_path.name)
        print("=" * 100)

        try:
            _, meta = pyreadstat.read_dta(
                file_path,
                metadataonly=True,
                encoding="latin1"
            )

            print(f"Rows: {meta.number_rows:,}")
            print(f"Columns: {meta.number_columns:,}")

            found = False

            for name, label in zip(
                meta.column_names,
                meta.column_labels
            ):
                label_lower = label.lower()

                if any(term in label_lower for term in TERMS):
                    print(f"{name:<45} | {label}")
                    found = True

            if not found:
                print("No matching variables found.")

        except Exception as e:
            print("ERROR:", e)


if __name__ == "__main__":
    main()