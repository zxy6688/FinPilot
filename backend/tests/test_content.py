import re
from collections import Counter
from datetime import datetime, timezone
from app.db import SessionLocal, ROOT
from app.models import *
from app.seed import seed
from app.ai.provider import context
from app.services.learning import streak


def test_content_integrity_and_navigation(client):
    with SessionLocal() as db:
        assert db.query(TopicRelation).count() == 32
        assert db.query(LearningPath).count() == 5
        assert db.query(User).filter_by(is_seed_persona=True).count() == 8
        assert db.query(Post).count() == 20
        assert db.query(Comment).count() == 20
        assert len({p.body for p in db.query(Post)}) == 20
        assert len({p.user_id for p in db.query(Post)}) == 8
        assert all(
            db.get(Topic, r.from_topic_id)
            and db.get(Topic, r.to_topic_id)
            and r.relation_label
            for r in db.query(TopicRelation)
        )
        counts = Counter(q.lesson_id for q in db.query(QuizQuestion))
        for lesson in db.query(Lesson):
            assert 2 <= counts[lesson.id] <= 4
            assert len(lesson.ask_prompts) == 2
            body = lesson.markdown.split("## Check Yourself")[0]
            assert 600 <= len(re.findall(r"[\u4e00-\u9fff]", body)) <= 1200
            assert all(db.get(Topic, i) for i in lesson.topic_ids)
            for route, ident in re.findall(
                r"\]\(/(lessons|topics|learn)/(\d+)\)", lesson.markdown
            ):
                assert db.get(
                    {"lessons": Lesson, "topics": Topic, "learn": LearningPath}[route],
                    int(ident),
                )
        for question in db.query(QuizQuestion):
            assert 0 <= question.correct_answer < len(question.options)
            assert question.explanation
        for lab in db.query(Lab):
            assert set(lab.educational_notes) == {
                "exploring",
                "observe",
                "why",
                "not_means",
            }
            assert db.get(Lesson, lab.lesson_id)
    real = client.get("/api/articles?content_type=REAL_WORLD").json()
    original = client.get("/api/articles?content_type=EXPLAINER").json()
    assert len(real) == 12 and len(original) == 16
    assert len({a["source_url"] for a in real}) == 12
    assert all(a["source_url"].startswith("https://") and a["topics"] for a in real)
    assert all(a["source_url"] is None and a["published_at"] is None for a in original)
    assert [p["id"] for p in client.get("/api/learning-paths").json()] == [
        1,
        5,
        2,
        3,
        4,
    ]
    post = client.get("/api/posts/1").json()
    assert post["is_seed_persona"] and post["replies"][0]["is_seed_persona"]


def test_alias_routes_and_unknown(client, auth):
    cases = {
        "宽基": 7,
        "指数基金": 7,
        "ETF": 7,
        "降息": 9,
        "加息": 9,
        "到期收益率": 6,
        "别人都在买": 13,
        "涨了很多想追": 13,
        "怕错过": 13,
        "不想认亏": 14,
        "害怕亏钱": 14,
        "跌了想卖": 14,
        "预算怎么做": 17,
        "大家都买": 24,
    }
    with SessionLocal() as db:
        for phrase, tid in cases.items():
            topic, lesson, lab = context(db, phrase)
            assert topic.id == tid, phrase
            assert lesson is not None
            assert lab is not None
        assert context(db, "怎么种向日葵") == (None, None, None)
    for mode in ["tutor", "explain", "guide", "coach"]:
        result = client.post(
            "/api/chat", headers=auth, json={"mode": mode, "message": "宽基是什么"}
        ).json()
        assert len(result["actions"]) == 3
        assert result["actions"][0]["url"] == "/topics/7"
    result = client.post(
        "/api/chat", headers=auth, json={"mode": "tutor", "message": "怎么种向日葵"}
    ).json()
    assert "不能确定" in result["content"]
    assert all(a["url"] != "/topics/1" for a in result["actions"])


def test_beijing_streak_and_repeat_seed_preserves_records(client, auth):
    uid = client.get("/api/users/me", headers=auth).json()["id"]
    with SessionLocal() as db:
        db.add(
            UserProgress(
                user_id=uid, lesson_id=1, created_at="2026-09-28T16:30:00+00:00"
            )
        )
        db.add(
            LabRecord(
                user_id=uid,
                lab_id=1,
                inputs={},
                result={},
                created_at="2026-09-27T23:00:00+08:00",
            )
        )
        db.add(
            Post(
                user_id=uid,
                topic_id=1,
                title="我的真实笔记",
                body="重复seed应保留",
                is_demo=False,
            )
        )
        db.commit()
        # Sep29 in Beijing: Sep28 missing, so Sep27 must not bridge the gap.
        assert streak(db, uid, datetime(2026, 9, 28, 17, tzinfo=timezone.utc)) == 1
        db.add(
            QuizRecord(
                user_id=uid,
                question_id=1,
                answer=0,
                correct=True,
                created_at="2026-09-28T00:30:00+08:00",
            )
        )
        db.commit()
        assert streak(db, uid, datetime(2026, 9, 28, 17, tzinfo=timezone.utc)) == 3
    seed()
    with SessionLocal() as db:
        assert db.query(UserProgress).filter_by(user_id=uid).count() == 1
        assert db.query(QuizRecord).filter_by(user_id=uid).count() == 1
        assert db.query(Post).filter_by(user_id=uid, body="重复seed应保留").count() == 1
