from collections import Counter
from pathlib import Path
from sqlalchemy import text
from app.db import SessionLocal
from app.models import *
from app.reset_demo import reset_demo


def test_release_input_boundaries(client, auth):
    for mode, value in [
        ("tutor", " "),
        ("tutor", "利" * 2001),
        ("explain", "率" * 6001),
    ]:
        assert (
            client.post(
                "/api/chat", headers=auth, json={"mode": mode, "message": value}
            ).status_code
            == 422
        )
    assert (
        client.post(
            "/api/chat",
            headers=auth,
            json={"mode": "explain", "message": "长文" * 1100},
        ).status_code
        == 200
    )
    assert (
        client.post(
            "/api/posts",
            headers=auth,
            json={
                "title": "    ",
                "body": " " * 20,
                "topic_id": 1,
                "category": "Learning Notes",
            },
        ).status_code
        == 422
    )
    assert (
        client.post(
            "/api/posts/1/comments", headers=auth, json={"body": "  "}
        ).status_code
        == 422
    )
    assert (
        client.post(
            "/api/posts/1/comments", headers=auth, json={"body": "文" * 3001}
        ).status_code
        == 422
    )


def test_community_distribution_and_lesson_metadata(client):
    posts = client.get("/api/posts").json()
    assert {0, 1, 2, 3, 4} <= {p["comments"] for p in posts}
    assert len({p["likes"] for p in posts}) >= 4
    assert all(p["is_seed_persona"] and p["topic_title"] for p in posts)
    paths = client.get("/api/learning-paths").json()
    assert sum(l["question_count"] for p in paths for l in p["lessons"]) == 64
    assert all(l["topics"] for p in paths for l in p["lessons"])


def test_demo_reset_preserves_other_users_and_shared_discussion(client, auth):
    other = client.get("/api/users/me", headers=auth).json()["id"]
    with SessionLocal() as db:
        demo = db.query(User).filter_by(email="demo@finpilot.app").one()
        db.add_all(
            [
                UserProgress(user_id=demo.id, lesson_id=1),
                UserProgress(user_id=other, lesson_id=2),
            ]
        )
        shared = Post(
            user_id=demo.id,
            topic_id=1,
            title="有人回复的体验讨论",
            body="保留互动上下文",
            category="Learning Notes",
        )
        disposable = Post(
            user_id=demo.id,
            topic_id=1,
            title="体验者个人笔记",
            body="仅自己的活动",
            category="Learning Notes",
        )
        db.add_all([shared, disposable])
        db.flush()
        db.add(
            Comment(user_id=other, post_id=shared.id, body="其他用户的回复不能被清除")
        )
        db.add(LabRecord(user_id=demo.id, lab_id=1, inputs={}, result={}))
        db.commit()
        demo_id, shared_id, disposable_id = demo.id, shared.id, disposable.id
    result = reset_demo()
    assert Path(result["backup"]).exists()
    assert shared_id in result["retained_shared_posts"]
    with SessionLocal() as db:
        assert db.query(UserProgress).filter_by(user_id=demo_id).count() == 0
        assert db.query(UserProgress).filter_by(user_id=other).count() == 1
        assert db.query(LabRecord).filter_by(user_id=demo_id).count() == 0
        assert db.get(Post, shared_id) and db.get(Post, disposable_id) is None
        assert db.query(Comment).filter_by(user_id=other).count() == 1
        assert not db.execute(text("PRAGMA foreign_key_check")).fetchall()
        assert db.query(Post).filter(Post.seed_key.is_not(None)).count() == 20


def test_recent_activity_is_user_scoped(client, auth):
    client.post("/api/labs/1/records", headers=auth, json={})
    data = client.get("/api/users/me", headers=auth).json()
    assert len(data["recent_activity"]) == 1
    assert data["recent_activity"][0]["url"] == "/lab/1"
    assert data["recent_activity"][0]["kind"] == "完成实验"
