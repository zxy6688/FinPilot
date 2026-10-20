"""Exercise the running isolated trial, using only synthetic accounts."""
import hashlib
import hmac
import json
from pathlib import Path
import time
import httpx

state = Path(__file__).resolve().parents[2] / "trial-runtime"
private = json.loads((state / "private.json").read_text(encoding="utf-8"))
port = json.loads((state / "state.json").read_text())["port"]
base = f"http://127.0.0.1:{port}"
expiry = str(int(time.time()) + 3600)
cookie = expiry + "." + hmac.new(private["gate_secret"].encode(), expiry.encode(), hashlib.sha256).hexdigest()
checks = []
with httpx.Client(base_url=base, timeout=30) as c:
    assert c.get("/").status_code == 401
    assert c.get("/api/v3/artifacts").status_code == 401
    assert c.get("/trial/health").json()["status"] == "ok"
    code = (state / "INVITATION.txt").read_text(encoding="utf-8").splitlines()[1]
    enter = c.post("/trial/enter", data={"code": code})
    assert enter.status_code == 303
    assert all(x in enter.headers["set-cookie"].lower() for x in ["secure", "httponly", "samesite=strict"])
    # Secure cookies are intentionally not sent over HTTP; signed cookie for loopback tests only.
    c.headers["Cookie"] = "finpilot_trial=" + cookie
    assert c.get("/").status_code == 200
    for path in ["/.env", "/.git/config", "/docs", "/openapi.json", "/data/trial.db", "/logs/backend.log"]:
        assert c.get(path).status_code == 404, path
    assert c.post("/api/auth/login", content=b"x" * 270000).status_code == 413
    assert c.post("/api/auth/register", headers={"Origin": "https://evil.example"}, json={}).status_code == 403
    assert c.post("/api/auth/login", json={"email": "demo@finpilot.app", "password": "demo123456"}).status_code in (401, 403)
    checks.append("Invitation enforced; Secure HttpOnly SameSite cookie; private paths blocked; body and origin limits; shared demo blocked")
    users = []
    for n in range(2):
        data = {"email": f"trial-{time.time_ns()}@example.test", "name": "合成测试", "password": "synthetic-test-123"}
        response = c.post("/api/auth/register", json=data)
        assert response.status_code == 201, response.status_code
        users.append({"Authorization": "Bearer " + response.json()["token"]})
        assert c.post("/api/auth/login", json={"email": data["email"], "password": data["password"]}).status_code == 200
    record = {"id": "trial-isolation", "kind": "receipt", "title": "合成预算",
              "url": "/money-lab/budget", "detail": "synthetic test",
              "payload": {"inputs": {"income": 2500}}}
    assert c.post("/api/v3/artifacts", json=record, headers=users[0]).status_code == 200
    assert c.post("/api/v3/artifacts", json=record, headers=users[0]).status_code == 200
    assert c.get("/api/v3/artifacts/trial-isolation", headers=users[1]).status_code == 404
    assert c.delete("/api/v3/artifacts/trial-isolation", headers=users[1]).status_code == 404
    assert c.get("/api/v3/artifacts/trial-isolation", headers=users[0]).json()["payload"] == record["payload"]
    for tool in ["savings", "compound", "inflation", "loan"]:
        assert c.post("/api/v3/tools/" + tool, json={}).status_code == 200, tool
    assert c.post("/api/v3/tools/budget", json={"income":2500,"reserve":300,"expenses":[]}).status_code == 200
    checks.append("Independent accounts; owner read/delete isolation; idempotent save and restore; five tool APIs")
    # Test throttling last, so this local client does not interfere with functional checks.
    statuses = [c.post("/trial/enter", data={"code": "wrong"}).status_code for _ in range(13)]
    assert 429 in statuses
    checks.append("Invitation brute-force throttled")
out = Path(__file__).resolve().parents[1] / "docs/deployment"
out.mkdir(exist_ok=True)
(out / "security-checks.json").write_text(json.dumps({"status": "passed", "checks": checks}, indent=2), encoding="utf-8")
print(json.dumps({"status": "passed", "checks": checks}, indent=2))
