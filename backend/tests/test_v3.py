from datetime import datetime, timedelta, timezone
from app.db import SessionLocal
from app.models_v3 import ReviewItem, MisconceptionState, MomentRecord
from app.services.v3.review import schedule
from app.services.v3.misconceptions import observe


def test_reading_is_private_and_round_trips(client, auth):
    r = client.post(
        "/api/v3/reading/article/1",
        headers=auth,
        json={"progress": 0.6, "position": 0.45, "last_section": "1"},
    )
    assert r.status_code == 200
    assert (
        client.get("/api/v3/reading/article/1", headers=auth).json()["position"] == 0.45
    )
    client.post(
        "/api/v3/reading/article/1",
        headers=auth,
        json={"progress": 0.2, "position": 0.1},
    )
    assert (
        client.get("/api/v3/reading/article/1", headers=auth).json()["progress"] == 0.6
    )
    assert client.get("/api/v3/reading/article/1").status_code == 401
    assert (
        client.post(
            "/api/v3/reading/article/9999",
            headers=auth,
            json={"progress": 0, "position": 0},
        ).status_code
        == 404
    )
    assert (
        client.post(
            "/api/v3/reading/article/1",
            headers=auth,
            json={"progress": 1.1, "position": 0},
        ).status_code
        == 422
    )
    other = client.post(
        "/api/auth/register",
        json={"email": "other@sample.com", "name": "Other", "password": "password123"},
    ).json()
    h = {"Authorization": "Bearer " + other["token"]}
    assert client.get("/api/v3/reading/article/1", headers=h).json() is None


def test_all_original_articles_have_reader_content(client):
    articles = client.get("/api/articles").json()
    for a in articles:
        r = client.get(f"/api/v3/articles/{a['id']}")
        assert r.status_code == 200
        body = r.json()
        assert len(body["sections"]) >= 3
        assert body["known_count"] == 0
        if a["content_type"] == "EXPLAINER":
            assert len(
                {s["body"] for s in body["sections"] if s["body"].strip()}
            ) == len(body["sections"])
        else:
            assert body["source_url"] == a["source_url"]


def test_schedule_exact_intervals_and_reset(client, auth):
    uid = client.get("/api/users/me", headers=auth).json()["id"]
    at = datetime(2026, 1, 1, tzinfo=timezone.utc)
    with SessionLocal() as db:
        for correct, days in [
            (False, 1),
            (True, 3),
            (True, 7),
            (True, 21),
            (True, 45),
            (True, 45),
            (False, 1),
        ]:
            row = schedule(db, uid, "q:1", 1, correct, at)
            assert row.due_at == (at + timedelta(days=days)).isoformat()
            at += timedelta(days=1)
        db.commit()


def test_quiz_schedules_only_supported_misconceptions(client, auth):
    client.post("/api/quizzes/3/answer", headers=auth, json={"answer": 0})
    m = client.get("/api/v3/memory", headers=auth).json()
    assert m["reviews"][0]["streak"] == 0
    assert m["misconceptions"][0]["status"] == "suspected"
    client.post("/api/quizzes/3/answer", headers=auth, json={"answer": 0})
    assert (
        client.get("/api/v3/memory", headers=auth).json()["misconceptions"][0]["status"]
        == "observed"
    )
    client.post("/api/v3/compare/nominal-real/check", headers=auth, json={"answer": 1})
    assert (
        client.get("/api/v3/memory", headers=auth).json()["misconceptions"][0]["status"]
        == "addressed"
    )
    # A later ordinary quiz is not silently promoted to a recalled comparison.
    client.post("/api/quizzes/3/answer", headers=auth, json={"answer": 1})
    assert (
        client.get("/api/v3/memory", headers=auth).json()["misconceptions"][0]["status"]
        == "addressed"
    )


def test_misconception_requires_later_recall(client, auth):
    uid = client.get("/api/users/me", headers=auth).json()["id"]
    with SessionLocal() as db:
        observe(db, uid, "etf-index-fund", at="2026-01-01T00:00:00+00:00")
        row = observe(db, uid, "etf-index-fund", at="2026-01-02T00:00:00+00:00")
        assert row.status == "observed"
        observe(
            db,
            uid,
            "etf-index-fund",
            correct=True,
            compared=True,
            at="2026-01-03T00:00:00+00:00",
        )
        observe(
            db,
            uid,
            "etf-index-fund",
            correct=True,
            recalled=True,
            at="2026-01-03T00:00:00+00:00",
        )
        assert row.status == "addressed"
        observe(
            db,
            uid,
            "etf-index-fund",
            correct=True,
            recalled=True,
            at="2026-01-04T00:00:00+00:00",
        )
        assert row.status == "resolved"


def test_review_replay_resume_and_capsule_once(client, auth):
    s = client.post(
        "/api/v3/review/start", headers=auth, json={"kind": "capsule"}
    ).json()
    assert 2 <= s["total"] <= 4 and "correct" not in s["item"]
    repeated = client.post(
        "/api/v3/review/start", headers=auth, json={"kind": "capsule"}
    ).json()
    assert repeated["id"] == s["id"]
    url = f"/api/v3/review/{s['id']}/answer"
    a = client.post(url, headers=auth, json={"cursor": 0, "answer": 0})
    assert a.status_code == 200
    replay = client.post(url, headers=auth, json={"cursor": 0, "answer": 1})
    assert replay.json() == a.json()
    while not (s := client.get(f"/api/v3/review/{s['id']}", headers=auth).json())[
        "completed_at"
    ]:
        assert (
            client.post(
                url, headers=auth, json={"cursor": s["cursor"], "answer": 0}
            ).status_code
            == 200
        )
    assert client.post(
        "/api/v3/review/start", headers=auth, json={"kind": "capsule"}
    ).json()["completed_at"]
    other = client.post(
        "/api/auth/register",
        json={
            "email": "private@sample.com",
            "name": "Private",
            "password": "password123",
        },
    ).json()
    assert (
        client.get(
            f"/api/v3/review/{s['id']}",
            headers={"Authorization": "Bearer " + other["token"]},
        ).status_code
        == 404
    )


def test_saved_routes_use_true_edges_and_verify_steps(client, auth):
    route = client.post(
        "/api/v3/routes", headers=auth, json={"target_topic_id": 2}
    ).json()
    assert 3 <= len(route["route_snapshot"]["steps"]) <= 7
    assert (
        client.post("/api/v3/routes", headers=auth, json={"target_topic_id": 2}).json()[
            "id"
        ]
        == route["id"]
    )
    rid = route["id"]
    assert (
        client.post(
            f"/api/v3/routes/{rid}/answer", headers=auth, json={"index": 1, "answer": 0}
        ).status_code
        == 409
    )
    with SessionLocal() as db:
        from app.models import QuizQuestion, TopicRelation
        from app.models_v3 import SavedRoute

        row = db.get(SavedRoute, rid)
        qid = row.route_snapshot["steps"][0]["question_id"]
        correct = db.get(QuizQuestion, qid).correct_answer
        relation_ids = {x.id for x in db.query(TopicRelation)}
        assert all(
            r["id"] in relation_ids for r in row.route_snapshot["graph"]["relations"]
        )
    r = client.post(
        f"/api/v3/routes/{rid}/answer",
        headers=auth,
        json={"index": 0, "answer": correct},
    ).json()["route"]
    assert r["current_step"] == 1
    assert (
        client.post(
            f"/api/v3/routes/{rid}/answer", headers=auth, json={"index": 1, "answer": 0}
        ).status_code
        == 409
    )
    s = r["route_snapshot"]["steps"][1]
    client.post(
        f"/api/v3/reading/{s['content_type']}/{s['content_id']}",
        headers=auth,
        json={"position": 1, "progress": 1, "completed": True},
    )
    assert client.get(f"/api/v3/routes/{rid}", headers=auth).json()["current_step"] == 2


def test_prediction_recomputes_and_reflection_is_idempotent(client, auth):
    from app.models import LabRecord

    p = client.post(
        "/api/v3/labs/1/prediction",
        headers=auth,
        json={"prediction": "higher", "reason": "提高利率后，复利终值可能增加。"},
    ).json()
    assert p["result"] is None
    assert (
        client.post(
            f"/api/v3/reflections/{p['id']}/complete",
            headers=auth,
            json={"reflection": "我观察到利率变化影响了终值。"},
        ).status_code
        == 409
    )
    inputs = {
        "principal": 10000,
        "monthly": 500,
        "rate": 8,
        "years": 10,
        "stocks": 50,
        "bonds": 30,
        "choice": 1,
    }
    exp = client.post(
        f"/api/v3/reflections/{p['id']}/experiment", headers=auth, json=inputs
    ).json()
    assert exp["result"] == client.post("/api/labs/1/simulate", json=inputs).json()
    assert exp["comparison"]["matched"] is True
    for _ in range(2):
        assert (
            client.post(
                f"/api/v3/reflections/{p['id']}/complete",
                headers=auth,
                json={"reflection": "我观察到利率变化影响了终值。"},
            ).status_code
            == 200
        )
    assert len(client.get("/api/v3/notebook", headers=auth).json()) == 1
    with SessionLocal() as db:
        assert db.query(LabRecord).count() == 1
    assert (
        client.post(
            f"/api/v3/reflections/{p['id']}/experiment", headers=auth, json=inputs
        ).status_code
        == 409
    )


def test_behavioral_labs_do_not_grade_numeric_prediction(client, auth):
    for lid in (6, 7, 8):
        p = client.post(
            f"/api/v3/labs/{lid}/prediction",
            headers=auth,
            json={"prediction": "higher", "reason": "我想先核查资料来源。"},
        ).json()
        r = client.post(
            f"/api/v3/reflections/{p['id']}/experiment",
            headers=auth,
            json={"choice": 1},
        )
        assert r.status_code == 200, r.text
        assert r.json()["comparison"]["matched"] is None


def test_moments_deduplicate_and_obey_session_quota(client, auth):
    from app.services.v3.moments import emit

    uid = client.get("/api/users/me", headers=auth).json()["id"]
    with SessionLocal() as db:
        for kind in (
            "FIRST_LESSON",
            "FIRST_CONNECTION",
            "FIRST_ROUTE_COMPLETE",
            "DOMAIN_AWAKENED",
            "MISCONCEPTION_FOUND",
            "MISCONCEPTION_RESOLVED",
        ):
            emit(db, uid, kind)
            emit(db, uid, kind)
        db.commit()
    seen = []
    for _ in range(8):
        r = client.post("/api/v3/moments/claim", headers=auth).json()
        if r:
            seen.append(r)
    assert len(seen) == 3
    assert sum(r["severity"] == "major" for r in seen) == 1
    assert sum(r["severity"] == "medium" for r in seen) == 2
    assert len({r["id"] for r in seen}) == 3
    assert len(client.get("/api/v3/moments", headers=auth).json()) == 6


def test_home_today_and_resume_share_real_reading(client, auth):
    client.post(
        "/api/v3/reading/article/1",
        headers=auth,
        json={"progress": 0.4, "position": 0.3},
    )
    r = client.get("/api/v3/home", headers=auth).json()
    assert r["today"] == r["continue"][0]
    assert r["today"]["url"] == "/articles/1"
    client.post(
        "/api/v3/reading/article/1",
        headers=auth,
        json={"progress": 1, "position": 1, "completed": True},
    )
    assert not client.get("/api/v3/home", headers=auth).json()["continue"]


def test_compare_and_private_review_ai_context(client, auth):
    r = client.post(
        "/api/chat",
        headers=auth,
        json={
            "message": "解释这组概念",
            "mode": "explain",
            "context": {"source_type": "compare", "source_id": 4, "brief": True},
        },
    )
    assert r.status_code == 200, r.text
    assert (
        "ETF" in r.json()["content"] and r.json()["context"]["source_type"] == "compare"
    )
    session = client.post("/api/v3/review/start", headers=auth, json={}).json()
    r = client.post(
        "/api/chat",
        headers=auth,
        json={
            "message": "再解释一下",
            "context": {"source_type": "review", "source_id": session["id"]},
        },
    )
    assert r.status_code == 200
    other = client.post(
        "/api/auth/register",
        json={
            "email": "ai-private@sample.com",
            "name": "Private",
            "password": "password123",
        },
    ).json()
    r = client.post(
        "/api/chat",
        headers={"Authorization": "Bearer " + other["token"]},
        json={
            "message": "解释",
            "context": {"source_type": "review", "source_id": session["id"]},
        },
    )
    assert r.status_code == 404


def test_connection_needs_both_endpoints_and_companion_real_growth(client, auth):
    from app.models import (
        User,
        UserProgress,
        QuizQuestion,
        QuizRecord,
        TopicView,
        TopicRelation,
    )
    from app.services.understanding import Evidence
    from app.services.v3.moments import sync
    from app.models_v3 import UserConnection, CompanionState

    uid = client.get("/api/users/me", headers=auth).json()["id"]
    for tid in (1, 2):
        client.post(f"/api/topics/{tid}/view", headers=auth)
    client.get("/api/v3/home", headers=auth)
    with SessionLocal() as db:
        user = db.get(User, uid)
        edge = db.query(TopicRelation).first()
        assert db.query(UserConnection).filter_by(user_id=uid).count() == 0
        for index, tid in enumerate((edge.from_topic_id, edge.to_topic_id)):
            e = Evidence(db, user)
            existing = {
                r.lesson_id for r in db.query(UserProgress).filter_by(user_id=uid)
            }
            for l in e.lessons.values():
                if tid in (l.topic_ids or [l.topic_id]) and l.id not in existing:
                    db.add(UserProgress(user_id=uid, lesson_id=l.id))
            for q in e.questions.values():
                if q.topic_id == tid:
                    db.add(
                        QuizRecord(
                            user_id=uid,
                            question_id=q.id,
                            answer=q.correct_answer,
                            correct=True,
                        )
                    )
            db.flush()
            sync(db, user)
            db.commit()
            if index == 0:
                assert (
                    not db.query(UserConnection)
                    .filter_by(user_id=uid, relation_id=edge.id)
                    .first()
                )
        assert (
            db.query(UserConnection).filter_by(user_id=uid, relation_id=edge.id).count()
            == 1
        )
        assert db.get(CompanionState, uid).companion_form == "awakened"
        sync(db, user)
        db.commit()
        assert (
            db.query(UserConnection).filter_by(user_id=uid, relation_id=edge.id).count()
            == 1
        )
        assert (
            db.query(MomentRecord)
            .filter_by(user_id=uid, kind="FIRST_CONNECTION")
            .count()
            == 1
        )
    world = client.get("/api/v3/world", headers=auth).json()
    assert world["summary"]["connections"] >= 1
    assert (
        client.get("/api/v3/world?mode=explore", headers=auth).json()["summary"][
            "connections"
        ]
        == 0
    )


def test_cold_start_and_completed_reading_not_mastery(client, auth):
    h = client.get("/api/v3/home", headers=auth).json()
    assert not h["has_evidence"] and not h["continue"]
    assert len(h["world"]["topics"]) == 7 and h["world"]["summary"]["connections"] == 0
    assert h["world"]["companion"]["companion_form"] == "seed"
    client.post(
        "/api/v3/reading/article/1",
        headers=auth,
        json={"progress": 1, "position": 1, "completed": True},
    )
    w = client.get("/api/v3/world", headers=auth).json()
    assert not any(t["state"] == "established" for t in w["topics"])
    assert not w["summary"]["connections"]


def test_reflection_and_route_ownership_and_bounds(client, auth):
    p = client.post(
        "/api/v3/labs/1/prediction",
        headers=auth,
        json={"prediction": "same", "reason": "默认假设保持不变。"},
    ).json()
    route = client.post(
        "/api/v3/routes", headers=auth, json={"target_topic_id": 7}
    ).json()
    other = client.post(
        "/api/auth/register",
        json={
            "email": "bounds@sample.com",
            "name": "Private",
            "password": "password123",
        },
    ).json()
    h = {"Authorization": "Bearer " + other["token"]}
    assert client.get(f"/api/v3/routes/{route['id']}", headers=h).status_code == 404
    assert (
        client.post(
            f"/api/v3/reflections/{p['id']}/experiment", headers=h, json={}
        ).status_code
        == 404
    )
    assert (
        client.post(
            f"/api/v3/reflections/{p['id']}/complete",
            headers=h,
            json={"reflection": "试图访问其他账户的实验反思。"},
        ).status_code
        == 404
    )
    assert (
        client.post(
            "/api/v3/labs/1/prediction",
            headers=auth,
            json={"prediction": "higher", "reason": " " * 8},
        ).status_code
        == 422
    )
    assert (
        client.post(
            f"/api/v3/reflections/{p['id']}/complete",
            headers=auth,
            json={"reflection": "x" * 3001},
        ).status_code
        == 422
    )
    assert (
        client.post(
            "/api/chat",
            headers=auth,
            json={
                "message": "explain",
                "context": {
                    "source_type": "article",
                    "source_id": 1,
                    "selected_text": "x" * 1201,
                },
            },
        ).status_code
        == 422
    )


def test_context_ai_session_keeps_identity(client, auth):
    first = client.post(
        "/api/chat",
        headers=auth,
        json={
            "message": "解释购买力",
            "mode": "explain",
            "context": {"source_type": "article", "source_id": 1, "brief": True},
        },
    ).json()
    second = client.post(
        "/api/chat",
        headers=auth,
        json={
            "message": "再给一个例子",
            "mode": "explain",
            "session_id": first["session_id"],
            "context": {
                "source_type": "article",
                "source_id": 1,
                "action": "example",
                "brief": True,
            },
        },
    ).json()
    assert second["session_id"] == first["session_id"]
    history = client.get(
        f"/api/chat/sessions/{first['session_id']}", headers=auth
    ).json()
    assert len(history["messages"]) == 4
    assert history["messages"][-1]["metadata_json"]["context"]["source_id"] == 1


def test_every_target_has_bounded_saved_route(client, auth):
    for tid in range(1, 25):
        r = client.post("/api/v3/routes", headers=auth, json={"target_topic_id": tid})
        assert r.status_code == 200, r.text
        steps = r.json()["route_snapshot"]["steps"]
        assert 3 <= len(steps) <= 7
        assert steps[0]["kind"] == "Recall" and steps[-1]["kind"] == "Check"


def test_due_review_prioritized_after_real_unfinished_work(client, auth):
    from app.models import User

    uid = client.get("/api/users/me", headers=auth).json()["id"]
    client.post("/api/quizzes/3/answer", headers=auth, json={"answer": 0})
    with SessionLocal() as db:
        db.query(ReviewItem).filter_by(user_id=uid).update(
            {"due_at": "2020-01-01T00:00:00+00:00"}
        )
        db.commit()
    assert client.get("/api/v3/home", headers=auth).json()["today"]["kind"] == "review"
    client.post(
        "/api/v3/reading/article/2",
        headers=auth,
        json={"progress": 0.3, "position": 0.3},
    )
    assert client.get("/api/v3/home", headers=auth).json()["today"]["kind"] == "article"


def test_parallel_moment_claims_keep_display_quota(client, auth):
    from concurrent.futures import ThreadPoolExecutor
    from app.services.v3.moments import emit

    uid = client.get("/api/users/me", headers=auth).json()["id"]
    with SessionLocal() as db:
        for kind in (
            "FIRST_LESSON",
            "FIRST_CONNECTION",
            "FIRST_ROUTE_COMPLETE",
            "DOMAIN_AWAKENED",
            "MISCONCEPTION_FOUND",
            "MISCONCEPTION_RESOLVED",
        ):
            emit(db, uid, kind)
        db.commit()

    def claim(_):
        r = client.post("/api/v3/moments/claim", headers=auth)
        assert r.status_code == 200, r.text
        return r.json()

    with ThreadPoolExecutor(max_workers=4) as pool:
        rows = [r for r in pool.map(claim, range(8)) if r]
    assert len(rows) == 3
    assert sum(r["severity"] == "major" for r in rows) == 1
    assert len({r["id"] for r in rows}) == 3


def test_parallel_review_answer_is_one_attempt(client, auth):
    from concurrent.futures import ThreadPoolExecutor

    session = client.post("/api/v3/review/start", headers=auth, json={}).json()

    def submit(_):
        r = client.post(
            f"/api/v3/review/{session['id']}/answer",
            headers=auth,
            json={"cursor": 0, "answer": 0},
        )
        assert r.status_code == 200, r.text
        return r.json()

    with ThreadPoolExecutor(max_workers=2) as pool:
        rows = list(pool.map(submit, range(2)))
    assert rows[0] == rows[1]
    memory = client.get("/api/v3/memory", headers=auth).json()
    assert memory["reviews"][0]["attempts"] == 1
