"""
Build household-level targeting features for the SPTA Simulator.

Unit of analysis:
    One row = one household.

Important:
    Poverty/welfare variables are deliberately excluded from predictors.
"""

from pathlib import Path

import numpy as np
import pandas as pd
import pyreadstat


# ---------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------

ROOT = Path(__file__).resolve().parents[1]

HOUSEHOLD_FILE = ROOT / "data/raw/CS_S01_S5_S7_Household.dta"
PERSON_FILE = ROOT / "data/raw/CS_S0_S1_S2_S3_S4_S6A_S6B_S6C_Person.dta"

OUTPUT_DIR = ROOT / "data/processed"
OUTPUT_FILE = OUTPUT_DIR / "targeting_features.parquet"


# ---------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------

def yes_count(series):
    """Count records coded 1 = Yes."""
    return (series == 1).sum()


def valid_mean(series):
    """Mean ignoring missing/special values."""
    series = series.replace([998, 999, 9999], np.nan)
    return series.mean()


# ---------------------------------------------------------------------
# Load data
# ---------------------------------------------------------------------

print("Loading household data...")
households, hh_meta = pyreadstat.read_dta(
    HOUSEHOLD_FILE,
    encoding="latin1",
)

print("Loading person data...")
persons, person_meta = pyreadstat.read_dta(
    PERSON_FILE,
    encoding="latin1",
)

print(f"Households loaded: {len(households):,}")
print(f"Persons loaded:    {len(persons):,}")


# ---------------------------------------------------------------------
# Clean identifiers
# ---------------------------------------------------------------------

households["hhid"] = households["hhid"].astype(str)
persons["hhid"] = persons["hhid"].astype(str)


# ---------------------------------------------------------------------
# PERSON-LEVEL AGGREGATION
# ---------------------------------------------------------------------

print("\nBuilding person-level household aggregates...")

p = persons.copy()

# Age
p["age"] = pd.to_numeric(p["s1q3y"], errors="coerce")
p.loc[p["age"].isin([97, 98, 99, 998, 999, 9999]), "age"] = np.nan

# Basic demographic groups
p["is_female"] = (p["s1q1"] == 2).astype(int)
p["is_child"] = p["age"].between(0, 14, inclusive="both").astype(int)
p["is_school_age"] = p["age"].between(5, 17, inclusive="both").astype(int)
p["is_working_age"] = p["age"].between(15, 64, inclusive="both").astype(int)
p["is_elderly"] = (p["age"] >= 65).astype(int)

# Employment / economic activity
p["agricultural_activity"] = (p["s6aq4"] == 1).astype(int)
p["nonfarm_wage_work"] = (p["s6aq5"] == 1).astype(int)
p["nonfarm_business"] = (p["s6aq6"] == 1).astype(int)

# Employment status
p["is_employee"] = (p["s6bq7"] == 1).astype(int)
p["is_own_account_worker"] = (p["s6bq7"] == 4).astype(int)
p["is_contributing_family_worker"] = (p["s6bq7"] == 6).astype(int)

# Disability: any difficulty in at least one domain
disability_cols = [
    "s3q7",
    "s3q8",
    "s3q9",
    "s3q10",
    "s3q11",
    "s3q12",
]

p["has_disability_difficulty"] = (
    p[disability_cols]
    .fillna(1)
    .gt(1)
    .any(axis=1)
    .astype(int)
)

# Severe disability: a lot of difficulty / cannot do
p["has_severe_disability"] = (
    p[disability_cols]
    .fillna(1)
    .ge(3)
    .any(axis=1)
    .astype(int)
)

# Education level
p["education_level"] = pd.to_numeric(
    p["s4aq2"],
    errors="coerce",
)

# Diploma / qualification
p["has_tertiary_education"] = (
    p["s4aq2"] == 7
).astype(int)

# ---------------------------------------------------------------------
# Aggregate to household
# ---------------------------------------------------------------------

person_features = (
    p.groupby("hhid")
    .agg(
        household_size=("pid", "count"),
        female_count=("is_female", "sum"),
        child_count=("is_child", "sum"),
        school_age_count=("is_school_age", "sum"),
        working_age_count=("is_working_age", "sum"),
        elderly_count=("is_elderly", "sum"),
        mean_age=("age", valid_mean),

        agricultural_worker_count=("agricultural_activity", "sum"),
        nonfarm_worker_count=("nonfarm_wage_work", "sum"),
        nonfarm_business_count=("nonfarm_business", "sum"),

        employee_count=("is_employee", "sum"),
        own_account_worker_count=("is_own_account_worker", "sum"),
        contributing_family_worker_count=(
            "is_contributing_family_worker",
            "sum",
        ),

        disability_count=("has_disability_difficulty", "sum"),
        severe_disability_count=("has_severe_disability", "sum"),

        tertiary_education_count=("has_tertiary_education", "sum"),
        mean_education_level=("education_level", "mean"),
    )
    .reset_index()
)


# ---------------------------------------------------------------------
# HOUSEHOLD FEATURES
# ---------------------------------------------------------------------

print("Selecting household-level features...")

household_feature_columns = [
    "hhid",
    "province",
    "district",
    "ur",

    # Housing
    "s5aq1",
    "s5aq2",
    "s5aq3",
    "s5aq5",
    "s5aq7",
    "s5aq8",

    # Housing value / rent
    "s5bq1",
    "s5bq2a",
    "s5bq3a",
    "s5bq6",

    # Water
    "s5cq1",
    "s5cq2a",
    "s5cq2b",
    "s5cq3",
    "s5cq4b",
    "s5cq8",

    # Electricity / internet
    "s5cq14",
    "s5cq16",
    "s5cq17",
    "s5cq20",
    "s5cq20a",
    "s5cq20b",

    # Cooking / sanitation
    "s5cq21",
    "s5cq22a",
    "s5cq23",
    "s5cq24",
    "s5cq25",
    "s5cq26",

    # Housing materials
    "s5dq1",
    "s5dq2",
    "s5dq3",
    "s5dq4",

    # Shocks
    "s5eq1",
    "s5eq2a",
    "s5eq2b",
    "s5eq2c",

    # Livestock
    "s7aq4",
    "s7aq4a",
    "s7aq4b",
    "s7aq4c",
    "s7aq4d",
    "s7aq4e",
    "s7aq4f",

    # Survey weights
    "weight",
    "pop_wt",

    # Truth / evaluation only
    "poverty",
    "pov_jan",
    "epov_jan",
    "quintile",
]

household_features = households[
    household_feature_columns
].copy()


# ---------------------------------------------------------------------
# Derived household features
# ---------------------------------------------------------------------

# Housing conditions
household_features["owns_dwelling"] = (
    household_features["s5aq7"] == 1
).astype(int)

household_features["owns_other_residential_house"] = (
    households["s5bq6"] == 1
).astype(int)

# Electricity
household_features["has_grid_electricity"] = (
    household_features["s5cq14"] == 1
).astype(int)

# Internet
household_features["has_internet"] = (
    household_features["s5cq20a"] == 1
).astype(int)

# Livestock
livestock_cols = [
    "s7aq4a",
    "s7aq4b",
    "s7aq4c",
    "s7aq4d",
    "s7aq4e",
    "s7aq4f",
]

household_features["total_livestock"] = (
    household_features[livestock_cols]
    .fillna(0)
    .sum(axis=1)
)

# Any livestock
household_features["has_livestock"] = (
    household_features["total_livestock"] > 0
).astype(int)


# ---------------------------------------------------------------------
# Merge
# ---------------------------------------------------------------------

print("Merging household and person features...")

features = household_features.merge(
    person_features,
    on="hhid",
    how="left",
    validate="one_to_one",
)


# ---------------------------------------------------------------------
# Clean special missing values
# ---------------------------------------------------------------------

SPECIAL_MISSING_BY_COLUMN = {
    "s5cq1": [99],
    "s5cq2a": [999],
    "s5cq3": [99],
    "s5cq20": [9999],
}

for column, codes in SPECIAL_MISSING_BY_COLUMN.items():
    if column in features.columns:
        features[column] = features[column].replace(codes, np.nan)


# ---------------------------------------------------------------------
# Ensure person aggregates are zero for households with no match
# ---------------------------------------------------------------------

person_columns = [
    "household_size",
    "female_count",
    "child_count",
    "school_age_count",
    "working_age_count",
    "elderly_count",
    "agricultural_worker_count",
    "nonfarm_worker_count",
    "nonfarm_business_count",
    "employee_count",
    "own_account_worker_count",
    "contributing_family_worker_count",
    "disability_count",
    "severe_disability_count",
    "tertiary_education_count",
]

for column in person_columns:
    features[column] = features[column].fillna(0)


# ---------------------------------------------------------------------
# Remove direct identifiers
# ---------------------------------------------------------------------

# hhid is useful for joining/debugging but must not be a model predictor.
# We keep it in the analytical dataset for traceability.


# ---------------------------------------------------------------------
# Separate truth variables from predictors
# ---------------------------------------------------------------------

truth_columns = [
    "poverty",
    "pov_jan",
    "epov_jan",
    "quintile",
]

print("\nTruth/evaluation variables:")
print(truth_columns)

print("\nFinal feature table shape:")
print(features.shape)


# ---------------------------------------------------------------------
# Save
# ---------------------------------------------------------------------

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

features.to_parquet(
    OUTPUT_FILE,
    index=False,
)

print(f"\nSaved: {OUTPUT_FILE}")


# ---------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------

print("\nMissingness — top 20 columns:")
print(
    features.isna()
    .mean()
    .sort_values(ascending=False)
    .head(20)
    .mul(100)
    .round(2)
    .to_string()
)

print("\nPoverty distribution:")
print(
    features["poverty"]
    .value_counts(dropna=False)
    .sort_index()
)

print("\nHousehold size summary:")
print(
    features["household_size"]
    .describe()
    .round(2)
)

print("\nFeature-building complete.")