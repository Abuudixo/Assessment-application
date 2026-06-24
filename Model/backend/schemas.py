from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str]


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class PredictionRequest(BaseModel):
    answers: Dict[str, int]


class PredictionResponse(BaseModel):
    predicted_condition: str
    confidence_score: float
    risk_level: str
    category_scores: Dict[str, int]
    top_feature_contributions: list
    raw_probabilities: Dict[str, float]
