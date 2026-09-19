"""
Random Forest Targeting Strategy

Trains a nonlinear Random Forest classifier on the same EICV7
train/test split used by the other targeting strategies.

The model produces a vulnerability probability for each test
household. Households are ranked by that probability and the
top 5%, 10%, and 20% are selected.

Evaluation uses survey weights.
"""

from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import average_precision_score, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder


# ============================================================
# PATHS
# ============================================================

ROOT = Path(__file__).resolve().parents[1]

DATA_PATH = ROOT / "data" / "processed" / "targeting_features.parquet"
OUTPUT_RESULTS = ROOT / "data" / "processed" / "random_forest_targeting_results.csv"
OUTPUT_SCORES = ROOT / "data" / "processed" / "random_forest_household_scores.parquet"
MODEL_PATH = ROOT / "models" / "random_forest_targeting_model.joblib"


# ============================================================
# FEATURES
# ============================================================

CATEGORICAL_FEATURES = [
    "province",
    "district",
    "ur",
    "s5aq1",
    "s5aq2",
    "s5aq5",
    "s5aq7",
    "s5aq8",
    "s5cq1",
    "s5cq3",
    "s5cq14",
    "s5cq16",
    "s5cq17",
    "s5cq21",
    "s5cq22a",
    "s5cq23",
    "s5cq24",
    "s5cq25",
    "s5cq26",
    "s5dq1",
    "s5dq2",
    "s5dq3",
    "s5eq1",
    "s5eq2a",
    "s5eq2b",
    "s5eq2c",
    "s7aq4",
]


EXCLUDED_FEATURES = [
    "hhid",
    "poverty",
    "pov_jan",
    "epov_jan",
    "quintile",
    "weight",
    "pop_wt",
    "is_poor",
]


# ============================================================
# LOAD DATA
# ============================================================

print("=" * 70)
print("RANDOM FOREST TARGETING SIMULATION")
print("=" * 70)

print("\nLoading analytical dataset...")

df = pd.read_parquet(DATA_PATH)

df["is_poor"] = df["poverty"].isin([1, 2]).astype(int)

print(f"Households: {len(df):,}")
print(f"Poor households: {df['is_poor'].sum():,}")


# ============================================================
# BUILD FEATURE LIST
# ============================================================

feature_columns = [
    col
    for col in df.columns
    if col not in EXCLUDED_FEATURES
]

NUMERIC_FEATURES = [
    col
    for col in feature_columns
    if col not in CATEGORICAL_FEATURES
]

print(f"\nTotal predictors: {len(feature_columns)}")
print(f"Categorical predictors: {len(CATEGORICAL_FEATURES)}")
print(f"Numeric predictors: {len(NUMERIC_FEATURES)}")


# ============================================================
# TRAIN / TEST SPLIT
# ============================================================

X = df[feature_columns]
y = df["is_poor"]

train_idx, test_idx = train_test_split(
    np.arange(len(df)),
    test_size=0.20,
    random_state=42,
    stratify=y,
)

train_df = df.iloc[train_idx].copy()
test_df = df.iloc[test_idx].copy()

X_train = train_df[feature_columns]
X_test = test_df[feature_columns]

y_train = train_df["is_poor"]
y_test = test_df["is_poor"]

print("\nTrain households:", len(train_df))
print("Test households:", len(test_df))


# ============================================================
# PREPROCESSING
# ============================================================

numeric_pipeline = Pipeline(
    steps=[
        (
            "imputer",
            SimpleImputer(strategy="median"),
        )
    ]
)

categorical_pipeline = Pipeline(
    steps=[
        (
            "imputer",
            SimpleImputer(strategy="most_frequent"),
        ),
        (
            "onehot",
            OneHotEncoder(
                handle_unknown="ignore",
                sparse_output=False,
            ),
        ),
    ]
)

preprocessor = ColumnTransformer(
    transformers=[
        (
            "numeric",
            numeric_pipeline,
            NUMERIC_FEATURES,
        ),
        (
            "categorical",
            categorical_pipeline,
            CATEGORICAL_FEATURES,
        ),
    ]
)


# ============================================================
# RANDOM FOREST
# ============================================================

model = RandomForestClassifier(
    n_estimators=500,
    max_depth=12,
    min_samples_leaf=5,
    class_weight="balanced",
    random_state=42,
    n_jobs=-1,
)

pipeline = Pipeline(
    steps=[
        ("preprocessor", preprocessor),
        ("model", model),
    ]
)


# ============================================================
# TRAIN
# ============================================================

print("\nTraining Random Forest...")

pipeline.fit(X_train, y_train)

print("Training complete.")


# ============================================================
# SAVE MODEL
# ============================================================

MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)

joblib.dump(
    pipeline,
    MODEL_PATH,
)

print(f"\nSaved model:")
print(f"  {MODEL_PATH}")


# ============================================================
# PREDICTIONS
# ============================================================

test_probability = pipeline.predict_proba(X_test)[:, 1]

roc_auc = roc_auc_score(
    y_test,
    test_probability,
)

pr_auc = average_precision_score(
    y_test,
    test_probability,
)

print("\nModel performance")
print("-" * 70)
print(f"ROC-AUC: {roc_auc:.4f}")
print(f"PR-AUC:  {pr_auc:.4f}")


# ============================================================
# HOUSEHOLD SCORES
# ============================================================

scores = test_df[
    [
        "hhid",
        "poverty",
        "is_poor",
        "weight",
        "pop_wt",
    ]
].copy()

scores["vulnerability_score"] = test_probability

scores = scores.sort_values(
    "vulnerability_score",
    ascending=False,
).reset_index(drop=True)


# ============================================================
# BUDGET SIMULATION
# ============================================================

BUDGETS = [0.05, 0.10, 0.20]

results = []

total_weighted_poor = (
    scores.loc[scores["is_poor"] == 1, "weight"].sum()
)

total_weighted_households = scores["weight"].sum()

for budget in BUDGETS:

    n_select = round(len(scores) * budget)

    selected = scores.head(n_select)

    selected_weight = selected["weight"].sum()

    selected_poor_weight = selected.loc[
        selected["is_poor"] == 1,
        "weight",
    ].sum()

    selected_nonpoor_weight = selected.loc[
        selected["is_poor"] == 0,
        "weight",
    ].sum()

    poor_not_selected_weight = (
        total_weighted_poor - selected_poor_weight
    )

    coverage = (
        selected_poor_weight / total_weighted_poor
        if total_weighted_poor > 0
        else 0
    )

    precision = (
        selected_poor_weight / selected_weight
        if selected_weight > 0
        else 0
    )

    inclusion_error = (
        selected_nonpoor_weight / selected_weight
        if selected_weight > 0
        else 0
    )

    exclusion_error = (
        poor_not_selected_weight / total_weighted_poor
        if total_weighted_poor > 0
        else 0
    )

    results.append(
        {
            "strategy": "Random Forest Targeting",
            "budget": budget,
            "households_selected": n_select,
            "weighted_selected": selected_weight,
            "weighted_poor_selected": selected_poor_weight,
            "coverage": coverage,
            "inclusion_error": inclusion_error,
            "exclusion_error": exclusion_error,
            "precision": precision,
        }
    )


# ============================================================
# SAVE RESULTS
# ============================================================

results_df = pd.DataFrame(results)

OUTPUT_RESULTS.parent.mkdir(parents=True, exist_ok=True)

results_df.to_csv(
    OUTPUT_RESULTS,
    index=False,
)

scores.to_parquet(
    OUTPUT_SCORES,
    index=False,
)


# ============================================================
# DISPLAY
# ============================================================

print("\n" + "=" * 70)
print("RANDOM FOREST TARGETING RESULTS")
print("=" * 70)

display_columns = [
    "strategy",
    "budget",
    "households_selected",
    "coverage",
    "inclusion_error",
    "exclusion_error",
    "precision",
]

print(
    results_df[display_columns].to_string(
        index=False
    )
)

print("\nSaved:")
print(f"  {OUTPUT_RESULTS}")
print(f"  {OUTPUT_SCORES}")

print("\n" + "=" * 70)
print("RANDOM FOREST SIMULATION COMPLETE")
print("=" * 70)