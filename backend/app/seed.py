"""Versioned, additive content import. Never reset user learning records."""

import json
import secrets
from sqlalchemy import inspect, text
from .db import Base, engine, SessionLocal, ROOT
from .models import (
    Article,
    Badge,
    Comment,
    ContentRevision,
    Lab,
    LearningPath,
    Lesson,
    Post,
    QuizQuestion,
    Topic,
    TopicRelation,
    User,
)
from .security import hash_password
from .content_release import apply_polish

CONTENT_ROOT = ROOT / "content"


def read(name):
    return json.loads((CONTENT_ROOT / name).read_text(encoding="utf-8"))


def ensure_schema():
    Base.metadata.create_all(engine)
    additions = {
        "users": {
            "is_seed_persona": "BOOLEAN DEFAULT 0",
            "learner_label": "VARCHAR DEFAULT ''",
        },
        "articles": {
            "content_type": "VARCHAR DEFAULT 'EXPLAINER'",
            "source_kind": "VARCHAR",
            "topic_ids": "JSON DEFAULT '[]'",
        },
        "lessons": {
            "topic_ids": "JSON DEFAULT '[]'",
            "ask_prompts": "JSON DEFAULT '[]'",
        },
        "labs": {"educational_notes": "JSON DEFAULT '{}'"},
        "posts": {"seed_key": "VARCHAR"},
        "comments": {"seed_key": "VARCHAR"},
    }
    with engine.begin() as conn:
        for table, columns in additions.items():
            existing = {c["name"] for c in inspect(conn).get_columns(table)}
            for name, definition in columns.items():
                if name not in existing:
                    conn.execute(
                        text(f'ALTER TABLE "{table}" ADD COLUMN "{name}" {definition}')
                    )
        for table in ("posts", "comments"):
            conn.execute(
                text(
                    f"CREATE UNIQUE INDEX IF NOT EXISTS ix_{table}_seed_key ON {table}(seed_key)"
                )
            )


def seed():
    ensure_schema()
    catalog = read("catalog.json")
    with SessionLocal() as db:
        if db.get(ContentRevision, catalog["version"]):
            apply_polish(db, lesson_root=ROOT)
            db.commit()
            return

        def upsert(model, data):
            row = db.get(model, data["id"])
            if row is None:
                row = model(id=data["id"])
                db.add(row)
            for key, value in data.items():
                setattr(row, key, value)
            return row

        for t in catalog["topics"]:
            related = sorted(
                {
                    (
                        r["to_topic_id"]
                        if r["from_topic_id"] == t["id"]
                        else r["from_topic_id"]
                    )
                    for r in catalog["relations"]
                    if t["id"] in (r["from_topic_id"], r["to_topic_id"])
                }
            )
            upsert(Topic, {**t, "related_ids": related})
        db.flush()
        for r in catalog["relations"]:
            if not db.query(TopicRelation).filter_by(**r).first():
                db.add(TopicRelation(**r))
        for p in catalog["paths"]:
            upsert(LearningPath, p)
        db.flush()
        for l in read("lessons.json"):
            markdown = (ROOT / "content" / "lessons" / f'{l["id"]:02d}.md').read_text(
                encoding="utf-8"
            )
            upsert(Lesson, {**l, "markdown": markdown})
        db.flush()
        for model, filename in [
            (QuizQuestion, "quizzes.json"),
            (Article, "articles.json"),
            (Lab, "labs.json"),
        ]:
            for data in read(filename):
                upsert(model, data)
            db.flush()
        user = db.query(User).filter_by(email="demo@finpilot.app").first()
        if not user:
            user = User(
                email="demo@finpilot.app",
                name="体验学习者",
                password_hash=hash_password("demo123456"),
            )
            db.add(user)
            db.flush()
        elif user.name == "欣源":
            user.name = "体验学习者"
        community = read("community.json")
        personas = []
        for i, data in enumerate(community["personas"], 1):
            email = f"learner-{i}@seed.finpilot.invalid"
            persona = db.query(User).filter_by(email=email).first()
            if persona is None:
                persona = User(
                    email=email,
                    password_hash=hash_password(secrets.token_urlsafe(40)),
                    is_seed_persona=True,
                    **data,
                )
                db.add(persona)
                db.flush()
            personas.append(persona)
        for i, data in enumerate(community["posts"], 1):
            key = f"content-post-{i:02d}"
            post = db.query(Post).filter_by(seed_key=key).first()
            legacy = db.get(Post, i) if i <= 12 else None
            if (
                post is None
                and legacy
                and legacy.is_demo
                and legacy.user_id == user.id
                and legacy.body.startswith("【社区演示内容】")
            ):
                post = legacy
            if post is None:
                post = Post()
                db.add(post)
            for attr in ("title", "body", "category", "topic_id"):
                setattr(post, attr, data[attr])
            post.seed_key, post.user_id, post.is_demo = (
                key,
                personas[data["persona"]].id,
                True,
            )
            db.flush()
            replykey = f"content-reply-{i:02d}"
            reply = db.query(Comment).filter_by(seed_key=replykey).first()
            if reply is None:
                reply = next(
                    (
                        c
                        for c in db.query(Comment).filter_by(
                            post_id=post.id, user_id=user.id
                        )
                        if c.body.startswith("【演示回复】")
                    ),
                    None,
                )
            if reply is None:
                reply = Comment(post_id=post.id)
                db.add(reply)
            reply.seed_key, reply.user_id, reply.body = (
                replykey,
                personas[data["reply_persona"]].id,
                data["reply"],
            )
        badges = [
            ("Financial Beginner", "完成第一节课程"),
            ("ETF Explorer", "完成ETF课程"),
            ("Macro Starter", "完成市场机制学习路径"),
            ("Bias Detective", "完成行为金融学习路径"),
            ("Market Observer", "浏览16个不同的Discover条目"),
            ("Lab Explorer", "完成5个不同实验"),
            ("7-Day Learner", "连续7天完成学习或实验（北京时间）"),
            ("FinTalk Contributor", "自己发布的帖子累计获得10个赞"),
        ]
        for i, (title, description) in enumerate(badges, 1):
            upsert(Badge, dict(id=i, title=title, description=description))
        db.add(ContentRevision(version=catalog["version"]))
        db.flush()
        apply_polish(db, lesson_root=ROOT)
        db.commit()


if __name__ == "__main__":
    seed()
    print(
        "Content ready: 24 topics, 32 relations, 5 paths, 28 lessons, 64 questions, 28 articles, 8 labs, 20 fictional discussions."
    )
