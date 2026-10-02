from app.db import SessionLocal
from app.models import (
    User,
    Topic,
    TopicRelation,
    UserProgress,
    QuizRecord,
    QuizQuestion,
    TopicView,
    Lab,
    LabRecord,
)
from app.services.understanding import Evidence
from app.services.learning_routes import build_route


def uid(db):
    return db.query(User).filter_by(email="learner@example.com").one().id


def test_home_deterministic_and_empty(client, auth):
    first = client.get("/api/v2/home", headers=auth).json()
    assert first == client.get("/api/v2/home", headers=auth).json()
    assert not first["has_evidence"]
    assert first["continue_learning"]["path_id"] == 1
    assert first["needs_review"] == first["relevant_real_world_items"] == []
    assert not first["recommended_lab"]["personalized"]
    assert client.get("/api/v2/understanding-map").status_code == 401


def test_wrong_answer_resolved_and_user_isolation(client, auth):
    with SessionLocal() as db:
        u = uid(db)
        q = db.query(QuizQuestion).first()
        qid, tid = q.id, q.topic_id
        db.add_all(
            [
                QuizRecord(user_id=u, question_id=qid, answer=0, correct=False),
                QuizRecord(user_id=u, question_id=qid, answer=0, correct=False),
            ]
        )
        db.commit()
    home = client.get("/api/v2/home", headers=auth).json()
    row = next(r for r in home["needs_review"] if r["id"] == tid)
    assert row["wrong_questions"] == 1 and row["repeated_errors"] == 2
    assert not client.get("/api/v2/home").json()["has_evidence"]
    with SessionLocal() as db:
        db.add(QuizRecord(user_id=uid(db), question_id=qid, answer=0, correct=True))
        db.commit()
    rows = client.get("/api/v2/understanding-map", headers=auth).json()["topics"]
    assert next(r for r in rows if r["id"] == tid)["wrong_questions"] == 0


def test_related_material_and_lab(client, auth):
    with SessionLocal() as db:
        db.add(TopicView(user_id=uid(db), topic_id=9))
        db.commit()
    h = client.get("/api/v2/home", headers=auth).json()
    assert h["recent_topics"][0]["id"] == 9
    assert h["next_related_topics"] and all(
        r["relation_label"] for r in h["next_related_topics"]
    )
    assert h["relevant_real_world_items"] and all(
        a["content_type"] == "REAL_WORLD" and a["reason"]
        for a in h["relevant_real_world_items"]
    )
    assert h["recommended_lab"]["personalized"]
    assert client.get("/api/v2/topics/9/connections", headers=auth).json()[0][
        "explanation"
    ]
    assert client.get("/api/v2/topics/999/connections").status_code == 404


def test_evidence_normalization_and_domains(client, auth):
    with SessionLocal() as db:
        user = db.get(User, uid(db))
        lab_topics = {l.topic_id for l in db.query(Lab)}
        e = Evidence(db, user)
        t = next(
            t for t in e.rows if t not in lab_topics and e.rows[t]["question_count"]
        )
        for l in e.lessons.values():
            if t in (l.topic_ids or [l.topic_id]):
                db.add(UserProgress(user_id=user.id, lesson_id=l.id))
        for q in e.questions.values():
            if q.topic_id == t:
                db.add(
                    QuizRecord(
                        user_id=user.id,
                        question_id=q.id,
                        answer=q.correct_answer,
                        correct=True,
                    )
                )
        db.add(TopicView(user_id=user.id, topic_id=t))
        db.commit()
        e = Evidence(db, user)
        r = e.rows[t]
        assert (
            r["weights"]["lab"] == 0
            and r["evidence"] == 100
            and r["state"] == "established"
        )
        assert build_route(e, t)["kind"] == "already_known"
        assert len(e.map()["domains"]) == 5


def test_graph_connected_reverse_and_disconnected(client, auth):
    with SessionLocal() as db:
        user = db.get(User, uid(db))
        db.query(TopicRelation).delete()
        db.add_all(
            [
                TopicRelation(from_topic_id=1, to_topic_id=2, relation_label="联系 A"),
                TopicRelation(from_topic_id=2, to_topic_id=3, relation_label="联系 B"),
            ]
        )
        db.add(TopicView(user_id=user.id, topic_id=1))
        db.commit()
        r = build_route(Evidence(db, user), 3)
        assert r["kind"] == "directed" and [s["id"] for s in r["steps"]] == [1, 2, 3]
        assert [x["relation_label"] for x in r["relations"]] == ["联系 A", "联系 B"]
        db.query(TopicView).delete()
        db.add(TopicView(user_id=user.id, topic_id=3))
        db.commit()
        r = build_route(Evidence(db, user), 1)
        assert r["kind"] == "connection" and all(
            x["traversed_reverse"] for x in r["relations"]
        )
        assert build_route(Evidence(db, user), 24)["kind"] == "no_path"
    assert client.get("/api/v2/learning-routes/999").status_code == 404


def test_lab_evidence_and_no_connected_lab(client, auth):
    with SessionLocal() as db:
        user = db.get(User, uid(db))
        lab = db.query(Lab).first()
        db.add(LabRecord(user_id=user.id, lab_id=lab.id, inputs={}, result={}))
        db.commit()
        assert Evidence(db, user).rows[lab.topic_id]["lab_participation"] == 1
        db.query(LabRecord).delete()
        db.query(TopicRelation).delete()
        lab_topics = {x.topic_id for x in db.query(Lab)}
        t = next(t.id for t in db.query(Topic) if t.id not in lab_topics)
        db.add(TopicView(user_id=user.id, topic_id=t))
        db.commit()
    assert client.get("/api/v2/labs/recommended", headers=auth).json() is None


def test_existing_api_still_available(client, auth):
    for path in [
        "/topics",
        "/learning-paths",
        "/lessons/1",
        "/articles",
        "/labs",
        "/posts",
        "/users/me",
    ]:
        assert client.get("/api" + path, headers=auth).status_code == 200
    m = client.get("/api/v2/understanding-map", headers=auth).json()
    assert not m["has_evidence"] and all(
        r["state"] == "unexplored" for r in m["topics"]
    )


def test_context_validation_and_missing_source(client, auth):
    payload = {
        "message": "解释当前内容",
        "context": {"source_type": "lesson", "source_id": 1, "action": "explain"},
    }
    assert (
        client.post(
            "/api/chat",
            headers=auth,
            json={
                **payload,
                "context": {**payload["context"], "selected_text": "x" * 1201},
            },
        ).status_code
        == 422
    )
    assert (
        client.post(
            "/api/chat",
            headers=auth,
            json={**payload, "context": {**payload["context"], "source_id": 999}},
        ).status_code
        == 404
    )
    assert (
        client.post(
            "/api/chat",
            headers=auth,
            json={
                **payload,
                "context": {**payload["context"], "source_type": "unknown"},
            },
        ).status_code
        == 422
    )
    assert (
        client.post(
            "/api/chat",
            headers=auth,
            json={**payload, "context": {**payload["context"], "inputs": {"rate": 5}}},
        ).status_code
        == 422
    )
    from app.schemas import AIContext

    assert (
        AIContext(
            source_type="lesson", source_id=1, selected_text="<img>条件\x00"
        ).selected_text
        == "条件"
    )


def test_context_demo_all_sources_and_saved_history(client, auth):
    for kind, ident, action, expected in [
        ("lesson", 1, "example", "例子"),
        ("topic", 9, "connect", "学习证据"),
        ("article", 101, "explain", "资料"),
        ("relation", 1, "why", "相连"),
        ("route", 6, "explain", "路线"),
        ("lab", 5, "result", "实验结果"),
        ("lesson", 1, "quiz", "检查一下理解"),
    ]:
        r = client.post(
            "/api/chat",
            headers=auth,
            json={
                "message": "请解释",
                "context": {"source_type": kind, "source_id": ident, "action": action},
            },
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["provider"] == "demo" and expected in data["content"]
        assert data["context"]["source_id"] == ident
        h = client.get(
            "/api/chat/sessions/" + str(data["session_id"]), headers=auth
        ).json()
        assert h["messages"][-1]["metadata_json"]["context"]["source_type"] == kind


def test_context_lab_recomputed_and_external_minimal(client, auth, monkeypatch):
    from app.ai import provider

    captured = []

    async def remote(messages):
        captured.extend(messages)
        return None, "demo-fallback"

    monkeypatch.setattr(provider, "remote", remote)
    r = client.post(
        "/api/chat",
        headers=auth,
        json={
            "message": "解释结果",
            "context": {
                "source_type": "lab",
                "source_id": 5,
                "action": "changed",
                "inputs": {"rate": 7},
            },
        },
    ).json()
    assert r["provider"] == "demo-fallback" and "rate：5 → 7" in r["content"]
    import json

    material = json.loads(captured[-1]["content"].split("\n用户问题：")[0])
    assert material["experiment"]["inputs"]["rate"] == 7
    assert "password_hash" not in str(captured) and "email" not in str(captured)
    assert material["experiment"]["result"]["value"] is not None


def test_context_request_boundaries_and_v1_chat(client, auth):
    assert (
        client.post(
            "/api/chat", headers=auth, json={"message": "利率是什么"}
        ).status_code
        == 200
    )
    assert (
        client.post(
            "/api/chat",
            headers=auth,
            json={
                "message": "解释",
                "context": {
                    "source_type": "lab",
                    "source_id": 5,
                    "inputs": {"rate": 900},
                },
            },
        ).status_code
        == 422
    )
    assert client.get("/api/search?q=bonds").json()["routes"]


def test_saved_lab_context_survives_followup_and_live_adapter(
    client, auth, monkeypatch
):
    first = client.post(
        "/api/chat",
        headers=auth,
        json={
            "message": "解释实验",
            "context": {
                "source_type": "lab",
                "source_id": 5,
                "action": "changed",
                "inputs": {"rate": 7},
            },
        },
    ).json()
    history = client.get(
        "/api/chat/sessions/" + str(first["session_id"]), headers=auth
    ).json()
    context = history["messages"][-1]["metadata_json"]["context"]
    assert context["inputs"]["rate"] == 7
    followup = client.post(
        "/api/chat",
        headers=auth,
        json={
            "message": "继续解释条件",
            "session_id": first["session_id"],
            "context": context,
        },
    ).json()
    assert "rate：5 → 7" in followup["content"]
    from app.ai import provider

    async def remote(messages):
        assert len(messages) >= 4
        return "外部适配器测试回答", "live"

    monkeypatch.setattr(provider, "remote", remote)
    live = client.post(
        "/api/chat",
        headers=auth,
        json={
            "message": "再解释一次",
            "session_id": first["session_id"],
            "context": context,
        },
    ).json()
    assert live["provider"] == "live" and "外部适配器测试回答" in live["content"]
    assert live["context"]["inputs"]["rate"] == 7


def test_lesson_context_uses_primary_topic_not_sorted_secondary_topic(client, auth):
    response = client.post(
        "/api/chat",
        headers=auth,
        json={
            "message": "解释当前课程",
            "context": {"source_type": "lesson", "source_id": 9, "action": "explain"},
        },
    ).json()
    with SessionLocal() as db:
        primary = db.get(Topic, 9).summary
        secondary = db.get(Topic, 6).summary
    assert primary in response["content"]
    assert secondary not in response["content"]
