import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
# Ensure Model package root is importable
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
from backend.app import app

import pytest
from fastapi.testclient import TestClient

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

def test_health(client):
    r = client.get('/health')
    assert r.status_code == 200
    assert r.json().get('status') == 'ok'


def test_register_and_login_and_predict_and_persist(client):
    email = 'unittest@example.com'
    pw = 'testpw'
    # register
    r = client.post('/auth/register', json={'email': email, 'password': pw, 'name': 'Unit Test'})
    if r.status_code == 400:
        # maybe already registered from prior run
        detail = r.json().get('detail')
        assert 'Email already registered' in str(detail)
        # login instead
        rlogin = client.post('/auth/login', json={'email': email, 'password': pw})
        assert rlogin.status_code == 200
        tok = rlogin.json().get('access_token')
    else:
        assert r.status_code == 200
        tok = r.json().get('access_token')
    assert tok
    headers = {'Authorization': f'Bearer {tok}'}
    # predict
    answers = {f'q{i}': 0 for i in range(1,26)}
    r2 = client.post('/predict', json=answers, headers=headers)
    assert r2.status_code == 200
    data = r2.json()
    assert 'predicted_condition' in data
    # save
    r3 = client.post('/assessments', json={'answers': answers}, headers=headers)
    assert r3.status_code == 200
    r4 = client.get('/assessments', headers=headers)
    assert r4.status_code == 200
    assert isinstance(r4.json(), list)
