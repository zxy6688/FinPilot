"""Optional demo activity; refuses to overwrite existing learner activity."""

import sys
from pathlib import Path
from datetime import datetime, timedelta, timezone

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))
from app.db import SessionLocal, engine
from app.seed import seed
from app.models import (
    User,
    UserProgress,
    QuizRecord,
    QuizQuestion,
    TopicView,
    LabRecord,
    Favorite,
)
from app.schemas import LabInput
from app.services.labs import simulate


def prepare():
    path = Path(engine.url.database).resolve()
    if engine.url.get_backend_name() != "sqlite" or not path.is_relative_to(ROOT):
        raise RuntimeError("Demo activity is only allowed in this V2 workspace.")
    seed()
    with SessionLocal() as db:
        u = db.query(User).filter_by(email="demo@finpilot.app").one()
        if any(
            db.query(cls).filter_by(user_id=u.id).first()
            for cls in [UserProgress, QuizRecord, TopicView, LabRecord, Favorite]
        ):
            print("Demo already has activity; no records changed.")
            return
        now = datetime.now(timezone.utc)
        for lid, days in [(1, 3), (9, 2), (21, 1)]:
            at = (now - timedelta(days=days)).isoformat()
            for q in db.query(QuizQuestion).filter_by(lesson_id=lid):
                db.add(
                    QuizRecord(
                        user_id=u.id,
                        question_id=q.id,
                        answer=q.correct_answer,
                        correct=True,
                        created_at=at,
                    )
                )
            db.add(UserProgress(user_id=u.id, lesson_id=lid, created_at=at))
        q = db.query(QuizQuestion).filter_by(lesson_id=6).first()
        for hours in [20, 18]:
            db.add(
                QuizRecord(
                    user_id=u.id,
                    question_id=q.id,
                    answer=(q.correct_answer + 1) % len(q.options),
                    correct=False,
                    created_at=(now - timedelta(hours=hours)).isoformat(),
                )
            )
        for tid, hours in [(1, 72), (6, 20), (9, 1)]:
            db.add(
                TopicView(
                    user_id=u.id,
                    topic_id=tid,
                    created_at=(now - timedelta(hours=hours)).isoformat(),
                )
            )
        inp = LabInput(rate=4)
        db.add(
            LabRecord(
                user_id=u.id,
                lab_id=5,
                inputs=inp.model_dump(),
                result=simulate("interest", inp),
                created_at=(now - timedelta(hours=12)).isoformat(),
            )
        )
        db.add(
            Favorite(
                user_id=u.id,
                kind="topic",
                target_id=6,
                created_at=(now - timedelta(hours=2)).isoformat(),
            )
        )
        db.commit()
        print(
            "Added explicitly optional demo learning activity. Other users unchanged."
        )


if __name__ == "__main__":
    prepare()
