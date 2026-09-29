"""Import edited content/lessons/*.md into the local database without resetting progress."""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))
from app.db import SessionLocal
from app.models import Lesson

with SessionLocal() as db:
    count = 0
    for lesson in db.query(Lesson):
        source = ROOT / "content" / "lessons" / f"{lesson.id:02}.md"
        if source.exists():
            content = source.read_text(encoding="utf-8").strip()
            if not content:
                raise ValueError(f"Empty lesson: {source.name}")
            lesson.markdown = content
            count += 1
    db.commit()
print(f"Updated {count} lessons. Learning records preserved.")
