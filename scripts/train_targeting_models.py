"""
SPTA Simulator - Baseline Targeting Model

Purpose:
    Train a transparent baseline model for identifying poor households.

Target:
    1 = Poor (severely + moderately poor)
    0 = Non-poor

This is the first predictive component of the SPTA Simulator.
The model score will later be converted into beneficiary rankings
under different budget constraints.
"""

from pathlib import Path

import joblib
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    average_precision_score,
    classification_report,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


# ---------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parents[1]

DATA_PATH = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "targeting_features.parquet"
)

MODEL_DIR = PROJECT_ROOT / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

MODEL_PATH = MODEL_DIR / "logistic_targeting_model.joblib"

RANDOM_STATE = 42
TEST_SIZE = 0.20


# ---------------------------------------------------------------------
# Load data
# ---------------------------------------------------------------------

print("=" * 70)
print("SPTA BASELINE TARGETING MODEL")
print("=" * 70)

print(f"\nLoading data:")
print(f"  {DATA_PATH}")

df = pd.read_parquet(DATA_PATH)

print(f"\nDataset shape: {df.shape}")


# ---------------------------------------------------------------------
# Create binary targeting outcome
# ---------------------------------------------------------------------

# poverty:
#   1 = Severely Poor
#   2 = Moderately Poor
#   3 = Non Poor

df["is_poor"] = df["poverty"].isin([1, 2]).astype(int)

print("\nTarget distribution:")
print(
    df["is_poor"]
    .value_counts()
    .rename(index={0: "Non-poor", 1: "Poor"})
    .to_string()
)


# ---------------------------------------------------------------------
# Define excluded variables
# ---------------------------------------------------------------------

EXCLUDED_COLUMNS = [
    "hhid",

    # Poverty/evaluation truth
    "poverty",
    "pov_jan",
    "epov_jan",
    "quintile",

    # Survey weights
    "weight",
    "pop_wt",

    # Target
    "is_poor",
]


# ---------------------------------------------------------------------
# Define feature types
# ---------------------------------------------------------------------

feature_columns = [
    column
    for column in df.columns
    if column not in EXCLUDED_COLUMNS
]

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

NUMERIC_FEATURES = [
    column
    for column in feature_columns
    if column not in CATEGORICAL_FEATURES
]


# ---------------------------------------------------------------------
# Build X and y
# ---------------------------------------------------------------------

X = df[feature_columns].copy()
y = df["is_poor"].copy()


# ---------------------------------------------------------------------
# Train/test split
# ---------------------------------------------------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=TEST_SIZE,
    random_state=RANDOM_STATE,
    stratify=y,
)

print("\nTrain/test split:")
print(f"  Training households: {len(X_train):,}")
print(f"  Testing households:  {len(X_test):,}")


# ---------------------------------------------------------------------
# Numeric preprocessing
# ---------------------------------------------------------------------

numeric_pipeline = Pipeline(
    steps=[
        (
            "imputer",
            SimpleImputer(strategy="median"),
        ),
        (
            "scaler",
            StandardScaler(),
        ),
    ]
)


# ---------------------------------------------------------------------
# Categorical preprocessing
# ---------------------------------------------------------------------

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
                sparse_output=True,
            ),
        ),
    ]
)


# ---------------------------------------------------------------------
# Combined preprocessing
# ---------------------------------------------------------------------

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


# ---------------------------------------------------------------------
# Logistic regression model
# ---------------------------------------------------------------------

model = LogisticRegression(
    max_iter=2000,
    class_weight="balanced",
    random_state=RANDOM_STATE,
)


# ---------------------------------------------------------------------
# Complete pipeline
# ---------------------------------------------------------------------

pipeline = Pipeline(
    steps=[
        ("preprocessor", preprocessor),
        ("model", model),
    ]
)


# ---------------------------------------------------------------------
# Train
# ---------------------------------------------------------------------

print("\nTraining logistic regression...")

pipeline.fit(X_train, y_train)

print("Training complete.")


# ---------------------------------------------------------------------
# Predict probabilities
# ---------------------------------------------------------------------

y_probability = pipeline.predict_proba(X_test)[:, 1]

y_prediction = (
    y_probability >= 0.50
).astype(int)


# ---------------------------------------------------------------------
# Evaluate predictive discrimination
# ---------------------------------------------------------------------

roc_auc = roc_auc_score(
    y_test,
    y_probability,
)

pr_auc = average_precision_score(
    y_test,
    y_probability,
)

print("\n" + "=" * 70)
print("MODEL PERFORMANCE")
print("=" * 70)

print(f"\nROC-AUC: {roc_auc:.4f}")
print(f"PR-AUC:  {pr_auc:.4f}")

print("\nClassification report:")
print(
    classification_report(
        y_test,
        y_prediction,
        target_names=["Non-poor", "Poor"],
        digits=4,
    )
)


# ---------------------------------------------------------------------
# Save model
# ---------------------------------------------------------------------

joblib.dump(
    pipeline,
    MODEL_PATH,
)

print("\nModel saved:")
print(f"  {MODEL_PATH}")


# ---------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------

print("\n" + "=" * 70)
print("BASELINE MODEL COMPLETE")
print("=" * 70)

print("\nNext:")
print("  1. Generate vulnerability scores for all households")
print("  2. Create budget-constrained beneficiary selection")
print("  3. Calculate weighted targeting metrics")
print("  4. Compare against alternative targeting strategies")