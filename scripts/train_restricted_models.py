from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[1]

DATA_PATH = BASE_DIR / "data" / "processed" / "targeting_features.parquet"
MODEL_DIR = BASE_DIR / "models"
PROCESSED_DIR = BASE_DIR / "data" / "processed"

MODEL_DIR.mkdir(exist_ok=True)
PROCESSED_DIR.mkdir(exist_ok=True)


# ============================================================
# CONFIGURATION
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

REMOVED_FEATURES = [
    "s5bq1",
    "s5bq2a",
    "s5bq3a",
]


# ============================================================
# LOAD DATA
# ============================================================

print("=" * 70)
print("RESTRICTED-FEATURE TARGETING EXPERIMENT")
print("=" * 70)

print("\nLoading analytical dataset...")

df = pd.read_parquet(DATA_PATH)

print(f"Households: {len(df):,}")


# ============================================================
# TARGET
# ============================================================

df["is_poor"] = df["poverty"].isin([1, 2]).astype(int)


# ============================================================
# DEFINE FEATURES
# ============================================================

EXCLUDED_COLUMNS = {
    "hhid",
    "poverty",
    "pov_jan",
    "epov_jan",
    "quintile",
    "weight",
    "pop_wt",
    "is_poor",
}

ALL_FEATURES = [
    col for col in df.columns
    if col not in EXCLUDED_COLUMNS
]

RESTRICTED_FEATURES = [
    col for col in ALL_FEATURES
    if col not in REMOVED_FEATURES
]

CATEGORICAL_FEATURES = [
    col for col in CATEGORICAL_FEATURES
    if col in RESTRICTED_FEATURES
]

NUMERIC_FEATURES = [
    col for col in RESTRICTED_FEATURES
    if col not in CATEGORICAL_FEATURES
]


print(f"\nFull feature count:       {len(ALL_FEATURES)}")
print(f"Restricted feature count: {len(RESTRICTED_FEATURES)}")

print("\nRemoved features:")

for feature in REMOVED_FEATURES:
    print(f"  - {feature}")

print(f"\nCategorical predictors: {len(CATEGORICAL_FEATURES)}")
print(f"Numeric predictors:     {len(NUMERIC_FEATURES)}")


# ============================================================
# TRAIN / TEST SPLIT
# ============================================================

X = df[RESTRICTED_FEATURES]
y = df["is_poor"]

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y,
)

train_indices = X_train.index
test_indices = X_test.index

print(f"\nTrain households: {len(X_train):,}")
print(f"Test households:  {len(X_test):,}")


# ============================================================
# PREPROCESSING
# ============================================================

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

categorical_pipeline = Pipeline(
    steps=[
        (
            "imputer",
            SimpleImputer(strategy="most_frequent"),
        ),
        (
            "encoder",
            OneHotEncoder(
                handle_unknown="ignore",
                sparse_output=True,
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
# LOGISTIC REGRESSION
# ============================================================

print("\n" + "-" * 70)
print("TRAINING RESTRICTED LOGISTIC REGRESSION")
print("-" * 70)

logistic_model = Pipeline(
    steps=[
        (
            "preprocessor",
            preprocessor,
        ),
        (
            "classifier",
            LogisticRegression(
                max_iter=2000,
                class_weight="balanced",
                random_state=42,
            ),
        ),
    ]
)

logistic_model.fit(X_train, y_train)

logistic_probabilities = logistic_model.predict_proba(
    X_test
)[:, 1]

logistic_roc_auc = roc_auc_score(
    y_test,
    logistic_probabilities,
)

logistic_pr_auc = average_precision_score(
    y_test,
    logistic_probabilities,
)

print(f"ROC-AUC: {logistic_roc_auc:.4f}")
print(f"PR-AUC:  {logistic_pr_auc:.4f}")


# ============================================================
# SAVE LOGISTIC MODEL
# ============================================================

logistic_path = MODEL_DIR / "logistic_restricted_targeting_model.joblib"

joblib.dump(
    logistic_model,
    logistic_path,
)

print(f"\nSaved:")
print(f"  {logistic_path}")


# ============================================================
# RANDOM FOREST
# ============================================================

print("\n" + "-" * 70)
print("TRAINING RESTRICTED RANDOM FOREST")
print("-" * 70)

rf_preprocessor = ColumnTransformer(
    transformers=[
        (
            "numeric",
            SimpleImputer(strategy="median"),
            NUMERIC_FEATURES,
        ),
        (
            "categorical",
            Pipeline(
                steps=[
                    (
                        "imputer",
                        SimpleImputer(
                            strategy="most_frequent"
                        ),
                    ),
                    (
                        "encoder",
                        OneHotEncoder(
                            handle_unknown="ignore",
                            sparse_output=False,
                        ),
                    ),
                ]
            ),
            CATEGORICAL_FEATURES,
        ),
    ]
)

rf_model = Pipeline(
    steps=[
        (
            "preprocessor",
            rf_preprocessor,
        ),
        (
            "classifier",
            RandomForestClassifier(
                n_estimators=500,
                max_depth=12,
                min_samples_leaf=5,
                class_weight="balanced",
                random_state=42,
                n_jobs=-1,
            ),
        ),
    ]
)

rf_model.fit(X_train, y_train)

rf_probabilities = rf_model.predict_proba(
    X_test
)[:, 1]

rf_roc_auc = roc_auc_score(
    y_test,
    rf_probabilities,
)

rf_pr_auc = average_precision_score(
    y_test,
    rf_probabilities,
)

print(f"ROC-AUC: {rf_roc_auc:.4f}")
print(f"PR-AUC:  {rf_pr_auc:.4f}")


# ============================================================
# SAVE RANDOM FOREST MODEL
# ============================================================

rf_path = MODEL_DIR / "random_forest_restricted_targeting_model.joblib"

joblib.dump(
    rf_model,
    rf_path,
)

print(f"\nSaved:")
print(f"  {rf_path}")


# ============================================================
# SAVE TEST SCORES
# ============================================================

score_df = df.loc[
    test_indices,
    [
        "hhid",
        "poverty",
        "weight",
        "pop_wt",
        "is_poor",
    ],
].copy()

score_df["logistic_vulnerability_score"] = logistic_probabilities
score_df["random_forest_vulnerability_score"] = rf_probabilities

score_path = (
    PROCESSED_DIR
    / "restricted_model_test_scores.parquet"
)

score_df.to_parquet(
    score_path,
    index=False,
)

print(f"\nSaved:")
print(f"  {score_path}")


# ============================================================
# SUMMARY
# ============================================================

summary = pd.DataFrame(
    [
        {
            "model": "Restricted Logistic",
            "roc_auc": logistic_roc_auc,
            "pr_auc": logistic_pr_auc,
            "features": len(RESTRICTED_FEATURES),
        },
        {
            "model": "Restricted Random Forest",
            "roc_auc": rf_roc_auc,
            "pr_auc": rf_pr_auc,
            "features": len(RESTRICTED_FEATURES),
        },
    ]
)

summary_path = (
    PROCESSED_DIR
    / "restricted_model_metrics.csv"
)

summary.to_csv(
    summary_path,
    index=False,
)

print(f"  {summary_path}")

print("\n" + "=" * 70)
print("RESTRICTED-FEATURE EXPERIMENT COMPLETE")
print("=" * 70)