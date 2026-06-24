import json
import os
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.preprocessing import LabelEncoder


DATA_PATH = Path(__file__).resolve().parent.parent / "Data" / "mental_health_1000_q1_q25_dataset.csv"
MODEL_PATH = Path(__file__).resolve().parent / "mental_health_rf_model.joblib"
METADATA_PATH = Path(__file__).resolve().parent / "mental_health_metadata.json"
RANDOM_STATE = 42

CATEGORY_DEFS = {
    "anxiety_score": ["q1", "q2", "q3", "q4", "q5"],
    "depression_score": ["q6", "q7", "q8", "q9", "q10"],
    "stress_score": ["q11", "q12", "q13", "q14", "q15"],
    "attention_score": ["q16", "q17", "q18", "q19", "q20"],
    "trauma_score": ["q21", "q22", "q23", "q24", "q25"],
}


def load_dataset(csv_path: Path) -> pd.DataFrame:
    df = pd.read_csv(csv_path)
    expected = [f"q{i}" for i in range(1, 26)] + ["label"]
    if list(df.columns)[: len(expected)] != expected:
        raise ValueError(f"Dataset columns do not match expected schema. Expected: {expected}")
    return df


def add_category_scores(df: pd.DataFrame) -> pd.DataFrame:
    for category, questions in CATEGORY_DEFS.items():
        df[category] = df[questions].sum(axis=1)
    return df


def build_feature_matrix(df: pd.DataFrame) -> (pd.DataFrame, np.ndarray, LabelEncoder):
    df = add_category_scores(df.copy())
    feature_columns = [f"q{i}" for i in range(1, 26)] + list(CATEGORY_DEFS.keys())
    X = df[feature_columns]
    y = df["label"]
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)
    return X, y_encoded, le


def train_random_forest(X: pd.DataFrame, y: np.ndarray) -> RandomForestClassifier:
    clf = RandomForestClassifier(
        n_estimators=200,
        random_state=RANDOM_STATE,
        class_weight="balanced",
        n_jobs=-1,
    )
    clf.fit(X, y)
    return clf


def evaluate_model(clf: RandomForestClassifier, X_test: pd.DataFrame, y_test: np.ndarray, label_encoder: LabelEncoder) -> None:
    y_pred = clf.predict(X_test)
    y_proba = clf.predict_proba(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, target_names=label_encoder.classes_)
    print("Test accuracy:", round(accuracy, 4))
    print("Classification report:")
    print(report)
    top_confidence = np.max(y_proba, axis=1).mean()
    print("Mean top probability:", round(top_confidence, 4))


def cross_validate_model(clf: RandomForestClassifier, X: pd.DataFrame, y: np.ndarray, folds: int = 5) -> None:
    cv = StratifiedKFold(n_splits=folds, shuffle=True, random_state=RANDOM_STATE)
    accuracy_scores = cross_val_score(clf, X, y, cv=cv, scoring="accuracy", n_jobs=-1)
    print(f"{folds}-fold cross-validation accuracy:")
    print([round(score, 4) for score in accuracy_scores])
    print("Mean CV accuracy:", round(np.mean(accuracy_scores), 4))


def save_artifacts(clf: RandomForestClassifier, label_encoder: LabelEncoder, feature_names: list[str]) -> None:
    joblib.dump(clf, MODEL_PATH)
    metadata = {
        "feature_names": feature_names,
        "classes": label_encoder.classes_.tolist(),
        "category_definitions": CATEGORY_DEFS,
    }
    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"Saved model to: {MODEL_PATH}")
    print(f"Saved metadata to: {METADATA_PATH}")


def main() -> None:
    print("Loading dataset from:", DATA_PATH)
    df = load_dataset(DATA_PATH)
    X, y, le = build_feature_matrix(df)
    feature_names = X.columns.tolist()

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=RANDOM_STATE,
        stratify=y,
    )

    clf = train_random_forest(X_train, y_train)

    print("\n=== Evaluation on holdout test set ===")
    evaluate_model(clf, X_test, y_test, le)

    print("\n=== Cross-validation ===")
    cross_validate_model(clf, X, y)

    save_artifacts(clf, le, feature_names)


if __name__ == "__main__":
    main()
