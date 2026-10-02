"""Read a V1 SQLite snapshot; run V2 only against its isolated copy."""

import argparse
import hashlib
import json
import os
from pathlib import Path
import sqlite3
import sys
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument("v1_database", type=Path)
args = parser.parse_args()
source = args.v1_database.resolve(strict=True)
target = (
    ROOT / "tmp" / ("v2-compat-" + datetime.now().strftime("%Y%m%d%H%M%S%f") + ".db")
)
target.parent.mkdir(exist_ok=True)
with sqlite3.connect(source.as_uri() + "?mode=ro", uri=True) as old, sqlite3.connect(
    target
) as copy:
    old.backup(copy)


def snapshot():
    with sqlite3.connect(target) as db:
        tables = [
            r[0]
            for r in db.execute(
                "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
            )
        ]
        result = {}
        for table in tables:
            rows = sorted(
                repr(row)
                for row in db.execute(
                    'SELECT * FROM "' + table.replace('"', '""') + '"'
                )
            )
            result[table] = (
                len(rows),
                hashlib.sha256("\n".join(rows).encode()).hexdigest(),
            )
        return result


before = snapshot()
os.environ.update(
    DATABASE_URL="sqlite:///" + target.as_posix(),
    JWT_SECRET="v2-compat-test-only-12345678901234567890",
    LLM_API_KEY="",
    LLM_MODEL="",
)
sys.path.insert(0, str(ROOT / "backend"))
from app.seed import seed
from app.db import SessionLocal
from app.models import User
from app.services.understanding import Evidence
from app.services.personalization import home
from app.services.learning_routes import build_route

seed()
with SessionLocal() as db:
    users = db.query(User).all()
    for user in users:
        evidence = Evidence(db, user)
        assert len(evidence.map()["topics"]) == 24
        assert home(db, user, evidence)["name"] == user.name
        assert build_route(evidence, 6)["target_topic_id"] == 6
assert snapshot() == before, "V2 startup or reads modified existing V1 rows"
report = {
    "date": datetime.now(timezone.utc).isoformat(),
    "passed": True,
    "method": "SQLite read-only source backup; V2 seed and evidence/route/home on copy",
    "tables_preserved": len(before),
    "rows_preserved": sum(v[0] for v in before.values()),
    "users_checked": len(users),
    "source_modified": False,
    "new_tables": 0,
}
(ROOT / "docs/v2-compatibility-check.json").write_text(
    json.dumps(report, indent=2) + "\n", encoding="utf-8"
)
print(json.dumps(report, indent=2))
