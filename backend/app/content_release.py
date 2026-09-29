"""Small, versioned editorial and fictional-community update for local RC."""

import json
from datetime import datetime, timedelta, timezone
from .db import ROOT
from .models import ContentRevision, Post, Comment, Like, User, Lesson

VERSION = "local-rc-polish-2026-09-29"
EDITORIAL_IDS = (1, 7, 9, 14, 19, 25)


def apply_polish(db, lesson_root=ROOT):
    if db.get(ContentRevision, VERSION):
        return
    data = json.loads(
        (ROOT / "content/community-engagement.json").read_text(encoding="utf-8")
    )
    personas = [
        db.query(User).filter_by(email=f"learner-{i}@seed.finpilot.invalid").one()
        for i in range(1, 9)
    ]
    posts = {
        i: db.query(Post).filter_by(seed_key=f"content-post-{i:02d}").one()
        for i in range(1, 21)
    }
    anchor = datetime(2026, 9, 28, 10, tzinfo=timezone.utc)
    for i, post in posts.items():
        post.created_at = (
            anchor - timedelta(hours=(i * 31) % 480, minutes=i * 13)
        ).isoformat()
    for i, row in enumerate(data["replies"], 1):
        reply = db.query(Comment).filter_by(seed_key=f"content-reply-{i:02d}").one()
        post = posts[row["post"]]
        reply.post_id, reply.user_id, reply.body = (
            post.id,
            personas[row["persona"]].id,
            row["body"],
        )
        reply.created_at = (
            datetime.fromisoformat(post.created_at) + timedelta(hours=i + 1, minutes=17)
        ).isoformat()
    for i, count in enumerate(data["likes"], 1):
        candidates = [u for u in personas if u.id != posts[i].user_id]
        for user in candidates[:count]:
            if (
                not db.query(Like)
                .filter_by(user_id=user.id, post_id=posts[i].id)
                .first()
            ):
                db.add(Like(user_id=user.id, post_id=posts[i].id))
    for ident in EDITORIAL_IDS:
        lesson = db.get(Lesson, ident)
        if lesson:
            lesson.markdown = (
                lesson_root / "content/lessons" / f"{ident:02d}.md"
            ).read_text(encoding="utf-8")
    db.add(ContentRevision(version=VERSION))
