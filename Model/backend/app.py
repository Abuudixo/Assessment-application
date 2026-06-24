from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
import joblib
from pathlib import Path
import numpy as np
import json
import os
from datetime import datetime
from sqlalchemy.orm import Session
from .db import SessionLocal, engine, Base
from . import models, auth
from . import schemas
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from typing import Optional
import gspread
from google.oauth2.service_account import Credentials

MODEL_FILE = Path(__file__).resolve().parent.parent / "mental_health_rf_model.joblib"
METADATA_FILE = Path(__file__).resolve().parent.parent / "mental_health_metadata.json"

app = FastAPI(title="Mental Health Prediction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Environment
import os
ENV = os.environ.get('MH_ENV', 'development')
GOOGLE_SHEET_ID = os.environ.get('GOOGLE_SHEET_ID', '1ltDXoIvCisCPTMRZm0zIm_160UON4S0cdMWN6eKe348')
GOOGLE_SERVICE_ACCOUNT_FILE = os.environ.get('GOOGLE_SERVICE_ACCOUNT_FILE')
GOOGLE_SERVICE_ACCOUNT_JSON = os.environ.get('GOOGLE_SERVICE_ACCOUNT_JSON')


def get_sheets_client():
    if not GOOGLE_SHEET_ID:
        return None
    creds = None
    if GOOGLE_SERVICE_ACCOUNT_JSON:
        try:
            info = json.loads(GOOGLE_SERVICE_ACCOUNT_JSON)
            creds = Credentials.from_service_account_info(info, scopes=["https://www.googleapis.com/auth/spreadsheets"])
        except Exception:
            return None
    elif GOOGLE_SERVICE_ACCOUNT_FILE:
        try:
            creds = Credentials.from_service_account_file(GOOGLE_SERVICE_ACCOUNT_FILE, scopes=["https://www.googleapis.com/auth/spreadsheets"])
        except Exception:
            return None
    else:
        return None

    try:
        return gspread.authorize(creds)
    except Exception:
        return None


def append_assessment_to_sheet(user, assessment):
    client = get_sheets_client()
    if not client:
        return

    try:
        sheet = client.open_by_key(GOOGLE_SHEET_ID).sheet1
        timestamp = assessment.created_at.isoformat() if assessment.created_at else datetime.utcnow().isoformat()
        category_scores = assessment.result.get("category_scores", {})
        category_summary = "; ".join([f"{k}: {v}" for k, v in category_scores.items()])
        row = [
            timestamp,
            getattr(user, 'email', 'anonymous'),
            getattr(user, 'name', ''),
            assessment.id,
            assessment.result.get('predicted_condition'),
            assessment.result.get('confidence_score'),
            category_summary,
            json.dumps(assessment.answers, ensure_ascii=False),
            json.dumps(assessment.result, ensure_ascii=False),
        ]
        sheet.append_row(row, value_input_option='USER_ENTERED')
    except Exception as e:
        print('Failed to append assessment to Google Sheet:', str(e))


@app.middleware("http")
async def enforce_https(request, call_next):
    # In production, require HTTPS or X-Forwarded-Proto header
    if ENV == 'production':
        proto = request.headers.get('x-forwarded-proto', request.url.scheme)
        if proto != 'https':
            raise HTTPException(status_code=400, detail="HTTPS required")
    return await call_next(request)
def load_model_and_metadata():
    if not MODEL_FILE.exists() or not METADATA_FILE.exists():
        raise RuntimeError("Model artifact or metadata not found. Run the training script first.")
    clf = joblib.load(MODEL_FILE)
    with open(METADATA_FILE, "r", encoding="utf-8") as f:
        metadata = json.load(f)
    return clf, metadata


@app.on_event("startup")
def startup_event():
    global MODEL, METADATA
    MODEL, METADATA = load_model_and_metadata()
    # create DB tables if they don't exist
    Base.metadata.create_all(bind=engine)


def validate_answers_dict(d: dict):
    expected = [f"q{i}" for i in range(1, 26)]
    missing = [q for q in expected if q not in d]
    if missing:
        raise HTTPException(status_code=400, detail={"error": "missing_questions", "missing": missing})
    invalid = [q for q in expected if not isinstance(d[q], int) or d[q] not in {0, 1, 2, 3}]
    if invalid:
        raise HTTPException(status_code=400, detail={"error": "invalid_values", "invalid": invalid})


def compute_category_scores(answers: dict, category_defs: dict):
    return {k: sum(answers[q] for q in qs) for k, qs in category_defs.items()}


def get_risk_level(conf: float, condition: str = "") -> str:
    if condition == "Healthy":
        return "Low"
    if conf >= 0.80:
        return "High"
    if conf >= 0.50:
        return "Medium"
    return "Low"


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication credentials")
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication credentials")
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


@app.post("/predict")
def predict(answers: dict):
    validate_answers_dict(answers)
    category_defs = METADATA.get("category_definitions")
    category_scores = compute_category_scores(answers, category_defs)

    feature_names = METADATA.get("feature_names")
    row = [answers.get(fname, category_scores.get(fname, 0)) for fname in feature_names]
    X = np.array(row).reshape(1, -1)

    proba = MODEL.predict_proba(X)[0]
    pred_idx = int(np.argmax(proba))
    predicted = METADATA.get("classes")[pred_idx]
    confidence = float(proba[pred_idx])

    importances = MODEL.feature_importances_
    contributions = {fname: float(imp * val) for fname, imp, val in zip(feature_names, importances, row)}
    top_features = sorted(contributions.items(), key=lambda x: x[1], reverse=True)[:6]

    return {
        "predicted_condition": predicted,
        "confidence_score": round(confidence, 4),
        "risk_level": get_risk_level(confidence, predicted),
        "category_scores": category_scores,
        "top_feature_contributions": [{"feature": f, "contribution": round(v, 4)} for f, v in top_features],
        "raw_probabilities": {cls: float(p) for cls, p in zip(METADATA.get("classes"), proba)},
    }


@app.post("/auth/register", response_model=schemas.Token)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = auth.get_password_hash(user_in.password)
    user = models.User(email=user_in.email, name=user_in.name, hashed_password=hashed)
    db.add(user)
    db.commit()
    db.refresh(user)
    token = auth.create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}


@app.post("/auth/login", response_model=schemas.Token)
def login(form_data: dict, db: Session = Depends(get_db)):
    email = form_data.get("email")
    password = form_data.get("password")
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not auth.verify_password(password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    token = auth.create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}


@app.post("/assessments")
def create_assessment(payload: dict, db: Session = Depends(get_db), current_user: Optional[models.User] = Depends(get_current_user)):
    # payload expected to have 'answers' key or be raw answers dict
    answers = payload.get("answers") if isinstance(payload, dict) and payload.get("answers") else payload
    validate_answers_dict(answers)
    # reuse predict logic
    category_defs = METADATA.get("category_definitions")
    category_scores = compute_category_scores(answers, category_defs)
    feature_names = METADATA.get("feature_names")
    row = [answers.get(fname, category_scores.get(fname, 0)) for fname in feature_names]
    X = np.array(row).reshape(1, -1)
    proba = MODEL.predict_proba(X)[0]
    pred_idx = int(np.argmax(proba))
    predicted = METADATA.get("classes")[pred_idx]
    confidence = float(proba[pred_idx])

    result = {
        "predicted_condition": predicted,
        "confidence_score": round(confidence, 4),
        "risk_level": get_risk_level(confidence, predicted),
        "category_scores": category_scores,
        "raw_probabilities": {cls: float(p) for cls, p in zip(METADATA.get("classes"), proba)},
    }

    assessment = models.Assessment(user_id=getattr(current_user, 'id', None), answers=answers, result=result)
    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    append_assessment_to_sheet(current_user, assessment)

    return {"id": assessment.id, "result": result}


@app.get("/assessments")
def list_assessments(db: Session = Depends(get_db), current_user: Optional[models.User] = Depends(get_current_user)):
    # return assessments for the current user
    assessments = db.query(models.Assessment).filter(models.Assessment.user_id == current_user.id).all()
    return [{"id": a.id, "answers": a.answers, "result": a.result, "created_at": a.created_at.isoformat()} for a in assessments]


@app.get("/auth/me")
def get_me(current_user: models.User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "is_admin": bool(current_user.is_admin),
    }


# ─── Admin Endpoints ───────────────────────────────────────

def require_admin(current_user: models.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@app.get("/admin/stats")
def admin_stats(db: Session = Depends(get_db), admin: models.User = Depends(require_admin)):
    total_users = db.query(models.User).count()
    total_assessments = db.query(models.Assessment).count()

    # Get condition distribution
    all_assessments = db.query(models.Assessment).all()
    condition_counts = {}
    risk_counts = {"High": 0, "Medium": 0, "Low": 0}
    for a in all_assessments:
        cond = a.result.get("predicted_condition", "Unknown")
        condition_counts[cond] = condition_counts.get(cond, 0) + 1
        risk = a.result.get("risk_level", "Unknown")
        if risk in risk_counts:
            risk_counts[risk] += 1

    return {
        "total_users": total_users,
        "total_assessments": total_assessments,
        "condition_distribution": condition_counts,
        "risk_distribution": risk_counts,
    }


@app.get("/admin/users")
def admin_list_users(db: Session = Depends(get_db), admin: models.User = Depends(require_admin)):
    users = db.query(models.User).all()
    result = []
    for u in users:
        assessment_count = db.query(models.Assessment).filter(models.Assessment.user_id == u.id).count()
        result.append({
            "id": u.id,
            "email": u.email,
            "name": u.name,
            "is_admin": bool(u.is_admin),
            "assessment_count": assessment_count,
        })
    return result


@app.get("/admin/assessments")
def admin_list_assessments(db: Session = Depends(get_db), admin: models.User = Depends(require_admin)):
    assessments = db.query(models.Assessment).order_by(models.Assessment.created_at.desc()).all()
    result = []
    for a in assessments:
        user = db.query(models.User).filter(models.User.id == a.user_id).first()
        result.append({
            "id": a.id,
            "user_email": user.email if user else "anonymous",
            "user_name": user.name if user else "Unknown",
            "predicted_condition": a.result.get("predicted_condition"),
            "confidence_score": a.result.get("confidence_score"),
            "risk_level": a.result.get("risk_level"),
            "category_scores": a.result.get("category_scores"),
            "created_at": a.created_at.isoformat() if a.created_at else None,
        })
    return result


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
