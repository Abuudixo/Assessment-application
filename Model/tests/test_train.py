import os
import sys
import json
from pathlib import Path
import pytest
import pandas as pd
# Ensure Model directory is importable
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
from train_model import load_dataset, add_category_scores, build_feature_matrix

# Data file is stored at workspace Data/; resolve from repository root
DATA_CSV = Path(__file__).resolve().parents[2] / 'Data' / 'mental_health_1000_q1_q25_dataset.csv'

def test_load_dataset_columns():
    df = load_dataset(DATA_CSV)
    assert 'q1' in df.columns and 'q25' in df.columns and 'label' in df.columns

def test_add_category_scores():
    df = load_dataset(DATA_CSV)
    df2 = add_category_scores(df)
    for cat in ['anxiety_score','depression_score','stress_score','attention_score','trauma_score']:
        assert cat in df2.columns

def test_build_feature_matrix_label_encoding():
    df = load_dataset(DATA_CSV)
    X, y_encoded, le = build_feature_matrix(df)
    assert X.shape[0] == df.shape[0]
    assert len(y_encoded) == df.shape[0]
    assert hasattr(le, 'classes_')
