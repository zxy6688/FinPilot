"""V3 API smoke on a fresh, isolated workspace database (never the demo DB)."""

import json
import os
from pathlib import Path
import sys
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))
(ROOT / "tmp").mkdir(exist_ok=True)
db_path = (
    ROOT / "tmp" / ("v3-smoke-" + datetime.now().strftime("%Y%m%d%H%M%S%f") + ".db")
)
os.environ.update(
    DATABASE_URL="sqlite:///" + db_path.as_posix(),
    JWT_SECRET="v3-smoke-only-not-used-for-local-service-12345678",
    LLM_API_KEY="",
    LLM_MODEL="",
)
from fastapi.testclient import TestClient
from app.main import app

checks = []
with TestClient(app) as client:
    login = client.post(
        "/api/auth/login", json={"email": "demo@finpilot.app", "password": "demo123456"}
    )
    assert login.status_code == 200, login.text
    headers = {"Authorization": "Bearer " + login.json()["token"]}
    paths = [
        "/health",
        "/topics",
        "/topics/9",
        "/articles",
        "/learning-paths",
        "/learning-paths/1",
        "/lessons/1",
        "/labs",
        "/labs/5",
        "/posts",
        "/posts/1",
        "/users/me",
        "/favorites",
        "/badges",
        "/recommendations",
        "/search?q=bonds",
        "/chat/sessions",
        "/v2/home",
        "/v2/understanding-map",
        "/v2/learning-routes/6",
        "/v2/topics/9/connections",
        "/v2/discover/relevant",
        "/v2/labs/recommended",
        "/v3/home",
        "/v3/world",
        "/v3/world?mode=explore",
        "/v3/articles/1",
        "/v3/articles/101",
        "/v3/compare",
        "/v3/compare/apr-apy",
        "/v3/memory",
        "/v3/moments",
        "/v3/routes",
        "/v3/notebook",
        "/v3/labs/1/prediction",
    ]
    for path in paths:
        response = client.get("/api" + path, headers=headers)
        assert response.status_code == 200, (path, response.text)
        checks.append(
            {"method": "GET", "path": "/api" + path, "status": response.status_code}
        )
    for source, ident in [
        ("lesson", 1),
        ("topic", 9),
        ("article", 101),
        ("lab", 5),
        ("relation", 1),
        ("route", 6),
        ("compare", 4),
    ]:
        response = client.post(
            "/api/chat",
            headers=headers,
            json={
                "message": "解释当前内容",
                "context": {"source_type": source, "source_id": ident},
            },
        )
        assert (
            response.status_code == 200 and response.json()["provider"] == "demo"
        ), response.text
        checks.append(
            {
                "method": "POST",
                "path": "/api/chat",
                "context": source,
                "status": response.status_code,
            }
        )
    assert not client.get("/api/v2/home", headers=headers).json()["has_evidence"]
report = {
    "date": datetime.now(timezone.utc).isoformat(),
    "passed": len(checks),
    "database": "isolated tmp/v3-smoke-*.db",
    "checks": checks,
}
(ROOT / "docs/v3-api-check.json").write_text(
    json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
)
print("V3 API SMOKE PASSED", len(checks))
