"""Reset only the shared demo account, with a SQLite backup and no directory deletion."""

import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from sqlalchemy import or_
from .db import ROOT, engine, SessionLocal
from .models import (
    ChatMessage,
    ChatSession,
    Comment,
    Favorite,
    LabRecord,
    Like,
    Post,
    QuizRecord,
    Report,
    TopicView,
    User,
    UserBadge,
    UserProgress,
)
from .seed import seed


def reset_demo():
    path = Path(engine.url.database).resolve()
    if engine.url.get_backend_name() != "sqlite" or not any(
        path.is_relative_to((ROOT / directory).resolve())
        for directory in ("data", "tmp")
    ):
        raise RuntimeError(
            "Reset only supports SQLite files inside this project's data/ or tmp/ directory."
        )
    seed()
    backup_dir = ROOT / "data/backups"
    backup_dir.mkdir(parents=True, exist_ok=True)
    backup = backup_dir / (
        "before-demo-reset-"
        + datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
        + ".db"
    )
    with sqlite3.connect(path) as source, sqlite3.connect(backup) as destination:
        source.backup(destination)
    retained = []
    with SessionLocal() as db:
        user = db.query(User).filter_by(email="demo@finpilot.app").one()
        uid = user.id
        session_ids = [s.id for s in db.query(ChatSession).filter_by(user_id=uid)]
        db.query(ChatMessage).filter(ChatMessage.session_id.in_(session_ids)).delete(
            synchronize_session=False
        )
        db.query(ChatSession).filter_by(user_id=uid).delete()
        for model in (
            UserProgress,
            QuizRecord,
            LabRecord,
            Favorite,
            UserBadge,
            TopicView,
            Like,
            Report,
            Comment,
        ):
            db.query(model).filter_by(user_id=uid).delete(synchronize_session=False)
        # Preserve demo-authored posts when someone else's interaction refers to them.
        for post in db.query(Post).filter_by(user_id=uid).all():
            referenced = (
                any(
                    db.query(model).filter_by(post_id=post.id).first()
                    for model in (Comment, Like, Report)
                )
                or db.query(Favorite).filter_by(kind="post", target_id=post.id).first()
            )
            if referenced:
                retained.append(post.id)
            else:
                db.delete(post)
        db.commit()
    return {
        "reset_account": "demo@finpilot.app",
        "backup": str(backup),
        "retained_shared_posts": retained,
    }


if __name__ == "__main__":
    import json

    print(json.dumps(reset_demo(), ensure_ascii=False, indent=2))
