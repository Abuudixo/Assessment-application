import json
from pathlib import Path
from typing import Dict, List

import joblib
import numpy as np
import pandas as pd

MODEL_PATH = Path(__file__).resolve().parent / "mental_health_rf_model.joblib"
METADATA_PATH = Path(__file__).resolve().parent / "mental_health_metadata.json"

CATEGORY_DEFS = {
    "anxiety_score": ["q1", "q2", "q3", "q4", "q5"],
    "depression_score": ["q6", "q7", "q8", "q9", "q10"],
    "stress_score": ["q11", "q12", "q13", "q14", "q15"],
    "attention_score": ["q16", "q17", "q18", "q19", "q20"],
    "trauma_score": ["q21", "q22", "q23", "q24", "q25"],
}


def load_metadata() -> Dict:
    if not METADATA_PATH.exists():
        raise FileNotFoundError(f"Metadata file not found: {METADATA_PATH}")
    with open(METADATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def compute_category_scores(answers: Dict[str, int]) -> Dict[str, int]:
    return {
        category: sum(answers[q] for q in questions)
        for category, questions in CATEGORY_DEFS.items()
    }


def validate_answers(answers: Dict[str, int]) -> None:
    expected = [f"q{i}" for i in range(1, 26)]
    missing = [q for q in expected if q not in answers]
    if missing:
        raise ValueError(f"Missing answers for questions: {missing}")
    invalid = [q for q, value in answers.items() if q in expected and value not in {0, 1, 2, 3}]
    if invalid:
        raise ValueError(f"Invalid answer values for questions: {invalid}. Allowed scores are 0, 1, 2, 3.")


def build_prediction_input(answers: Dict[str, int]) -> pd.DataFrame:
    validate_answers(answers)
    category_scores = compute_category_scores(answers)
    row = {**answers, **category_scores}
    return pd.DataFrame([row]), category_scores


def get_risk_level(confidence_score: float) -> str:
    if confidence_score >= 0.80:
        return "High"
    if confidence_score >= 0.50:
        return "Medium"
    return "Low"


def predict_condition(answers: Dict[str, int]) -> Dict[str, object]:
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")

    clf = joblib.load(MODEL_PATH)
    metadata = load_metadata()
    label_encoder = {i: label for i, label in enumerate(metadata["classes"])}

    X, category_scores = build_prediction_input(answers)
    proba = clf.predict_proba(X)[0]
    pred_idx = int(np.argmax(proba))
    predicted_condition = label_encoder[pred_idx]
    confidence_score = float(proba[pred_idx])
    return {
        "predicted_condition": predicted_condition,
        "confidence_score": round(confidence_score, 4),
        "risk_level": get_risk_level(confidence_score),
        "category_scores": category_scores,
        "raw_probabilities": {label_encoder[i]: float(scores) for i, scores in enumerate(proba)},
    }


def example_usage() -> None:
    sample_answers = {f"q{i}": 2 for i in range(1, 26)}
    result = predict_condition(sample_answers)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    example_usage()
