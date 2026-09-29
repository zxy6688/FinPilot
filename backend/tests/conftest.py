import os, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend"))
os.environ["DATABASE_URL"] = (
    "sqlite:///" + (ROOT / "tmp" / "test-finpilot.db").as_posix()
)
os.environ["JWT_SECRET"] = "test-only-secret-never-used-by-local-demo-123456789"
os.environ["LLM_API_KEY"] = ""
os.environ["LLM_MODEL"] = ""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db import Base, engine
from app.seed import seed


@pytest.fixture()
def client():
    Base.metadata.drop_all(engine)
    seed()
    with TestClient(app) as c:
        yield c


@pytest.fixture()
def auth(client):
    r = client.post(
        "/api/auth/register",
        json={
            "email": "learner@example.com",
            "name": "学习者",
            "password": "test123456",
        },
    )
    assert r.status_code == 201, r.text
    return {"Authorization": "Bearer " + r.json()["token"]}
