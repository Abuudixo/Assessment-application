# Mental Health Prediction Backend

This minimal FastAPI backend loads the trained Random Forest model in `Model/mental_health_rf_model.joblib` and exposes a `/predict` endpoint.

Quick start

1. Install Python dependencies (prefer a virtualenv):

```bash
python -m pip install -r Model/requirements.txt
```

2. Run the server:

```bash
uvicorn Model.backend.app:app --reload --host 0.0.0.0 --port 8000
```

3. Test the health endpoint:

```bash
curl http://localhost:8000/health
```

4. Predict by POSTing a JSON object with `q1`..`q25` integer values (0-3) to `/predict`.

Frontend integration

- The frontend includes a helper `predictRemote(answers)` in `Frontend/src/api.js` which POSTs to `http://localhost:8000/predict`.
- Ensure CORS and host/port are reachable from the frontend runtime.

Optional features

- The backend includes a small SQLite setup in `Model/backend/db.py` and ORM models in `Model/backend/models.py` to persist users and assessments.
- Basic auth utilities exist in `Model/backend/auth.py` (change `SECRET_KEY` before production).

Explanation system

- The `/predict` endpoint returns `top_feature_contributions` computed as `feature_value * feature_importance` to explain influential items.

Security note

- This implementation is meant for development/demo only. Replace the `SECRET_KEY` with a secure random value and secure the endpoints before production deployment.
