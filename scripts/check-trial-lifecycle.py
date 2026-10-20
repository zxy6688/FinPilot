"""Verify retained records across own-service restart and reversible code rollback."""
import hashlib
import json
from pathlib import Path
import sqlite3
import subprocess
import sys
import urllib.request

root = Path(__file__).resolve().parents[1]
state = root.parent / "trial-runtime"


def digest():
    with sqlite3.connect((state / "data/trial.db").as_uri() + "?mode=ro", uri=True) as db:
        assert db.execute("PRAGMA integrity_check").fetchone()[0] == "ok"
        rows = db.execute("SELECT * FROM learning_artifacts ORDER BY id").fetchall()
        return len(rows), hashlib.sha256(json.dumps(rows, ensure_ascii=False).encode()).hexdigest()


before = digest()
original = json.loads((state / "state.json").read_text())
for action in ("start", "rollback", "rollback"):
    subprocess.run([sys.executable, str(root / "scripts/trial-release.py"), action], check=True)
    assert digest() == before, "Saved artifacts changed across lifecycle action"
    with urllib.request.urlopen("http://127.0.0.1:8186/trial/health", timeout=5) as r:
        assert r.status == 200
after = json.loads((state / "state.json").read_text())
assert original["current"] == after["current"]
assert original["tunnel"] == after["tunnel"]
assert Path(after["last_backup"]).exists()
report = {"status": "passed", "actions": ["restart", "rollback", "return to latest"],
          "saved_records": before[0], "record_digest_unchanged": True,
          "sqlite_integrity": "ok", "backup_exists": True,
          "tunnel_unchanged": True, "note": "Code rollback only; database retained."}
(root / "docs/deployment/lifecycle-checks.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
print(json.dumps(report, indent=2))
