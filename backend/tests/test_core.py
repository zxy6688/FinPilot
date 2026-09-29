import pytest
from app.db import SessionLocal
from app.models import Topic, Lesson, QuizQuestion, Post
from app.seed import seed


def test_seed_idempotent(client):
    seed()
    with SessionLocal() as db:
        assert db.query(Topic).count() == 24
        assert db.query(Lesson).count() == 28
        assert db.query(QuizQuestion).count() == 64
        assert db.query(Post).count() == 20


def test_auth_and_logout(client, auth):
    assert client.get("/api/users/me").status_code == 401
    assert client.get("/api/users/me", headers=auth).json()["completed_lessons"] == 0
    assert (
        client.post(
            "/api/auth/register",
            json={
                "email": "learner@example.com",
                "name": "a",
                "password": "test123456",
            },
        ).status_code
        == 409
    )
    assert (
        client.post(
            "/api/auth/register",
            json={"email": "invalid", "name": "a", "password": "test123456"},
        ).status_code
        == 422
    )
    assert (
        client.post(
            "/api/auth/login",
            json={"email": "learner@example.com", "password": "wrongpassword"},
        ).status_code
        == 401
    )
    assert (
        client.post(
            "/api/auth/login",
            json={"email": "demo@finpilot.app", "password": "demo123456"},
        ).status_code
        == 200
    )
    assert client.post("/api/auth/logout", headers=auth).status_code == 200
    assert client.get("/api/users/me", headers=auth).status_code == 401


def test_articles_topics_search(client):
    articles = client.get("/api/articles").json()
    assert len(articles) == 28
    assert all(
        (
            a["source_url"].startswith("https://")
            if a["content_type"] == "REAL_WORLD"
            else a["source_url"] is None
        )
        for a in articles
    )
    assert all(
        a["category"] == "Macro"
        for a in client.get("/api/articles?category=Macro").json()
    )
    assert client.get("/api/articles?category=missing").json() == []
    topic = client.get("/api/topics/9").json()
    assert topic["articles"] and topic["lessons"] and topic["labs"] and topic["posts"]
    for group in ["topics", "articles", "lessons", "labs", "posts"]:
        assert client.get("/api/search", params={"q": "利率"}).json()[group]
    assert all(
        not v
        for v in client.get("/api/search", params={"q": "%'; DROP TABLE users; --"})
        .json()
        .values()
    )
    assert client.get("/api/topics/999").status_code == 404


def test_learning_progress_persists(client, auth):
    lesson = client.get("/api/lessons/1").json()
    assert all("correct_answer" not in q for q in lesson["questions"])
    assert client.post("/api/progress/1", headers=auth).status_code == 409
    q = lesson["questions"][0]
    response = client.post(
        f"/api/quizzes/{q['id']}/answer", headers=auth, json={"answer": 0}
    )
    assert response.json()["correct"] and response.json()["explanation"]
    q2 = lesson["questions"][1]
    assert client.post(
        f"/api/quizzes/{q2['id']}/answer", headers=auth, json={"answer": 1}
    ).json()["correct"]
    assert client.post("/api/progress/1", headers=auth).status_code == 200
    assert client.post("/api/progress/1", headers=auth).status_code == 200
    profile = client.get("/api/users/me", headers=auth).json()
    assert (
        profile["completed_lessons"] == 1
        and profile["quiz_accuracy"] == 100
        and profile["streak"] == 1
    )
    assert client.get("/api/learning-paths/1", headers=auth).json()["progress"] == 20
    assert client.get("/api/lessons/1", headers=auth).json()["questions"][0]["record"][
        "correct"
    ]
    assert client.get("/api/badges", headers=auth).json()[0]["earned"]
    client.post(f"/api/quizzes/{q['id']}/answer", headers=auth, json={"answer": 1})
    assert client.get("/api/users/me", headers=auth).json()["quiz_accuracy"] == 50
    assert (
        client.get("/api/users/me", headers=auth).json()["review"][0]["topic_id"] == 1
    )


def test_posts_comments_likes_favorites(client, auth):
    data = {
        "title": "关于ETF分散风险的疑问",
        "body": "我想了解不同ETF的持仓重合是否会影响分散化效果。",
        "category": "Beginner Help",
        "topic_id": 7,
    }
    assert client.post("/api/posts", json=data).status_code == 401
    r = client.post("/api/posts", headers=auth, json=data)
    assert r.status_code == 201
    id = r.json()["id"]
    assert (
        client.post(
            f"/api/posts/{id}/comments",
            headers=auth,
            json={"body": "需要核查持仓重合与共同风险来源。"},
        ).status_code
        == 201
    )
    assert client.post(f"/api/posts/{id}/like", headers=auth).json()["likes"] == 1
    assert client.post(f"/api/posts/{id}/like", headers=auth).json()["likes"] == 0
    assert client.get(f"/api/posts/{id}").json()["comments"] == 1
    assert client.post(f"/api/favorites/post/{id}", headers=auth).json()["saved"]
    assert (
        client.get("/api/favorites", headers=auth).json()[0]["item"]["title"]
        == data["title"]
    )
    assert not client.post(f"/api/favorites/post/{id}", headers=auth).json()["saved"]
    assert client.post("/api/favorites/invalid/1", headers=auth).status_code == 422
    assert (
        client.post(
            "/api/posts", headers=auth, json={**data, "topic_id": 999}
        ).status_code
        == 404
    )
    summary = client.post(f"/api/posts/{id}/summary").json()
    assert summary["provider"] == "demo" and data["title"] in summary["content"]
    assert (
        client.post(
            f"/api/posts/{id}/report", headers=auth, json={"reason": "内容可能存在误导"}
        ).status_code
        == 200
    )


def test_recommendations_and_views(client, auth):
    client.post("/api/topics/9/view", headers=auth)
    client.post("/api/articles/9/view", headers=auth)
    client.post("/api/favorites/topic/9", headers=auth)
    assert client.get("/api/recommendations", headers=auth).json()[0]["topic_id"] == 9
    assert client.get("/api/users/me", headers=auth).json()["interests"][0]["id"] == 9


@pytest.mark.parametrize("mode", ["tutor", "explain", "guide", "coach"])
def test_ai_modes_and_ownership(client, auth, mode):
    r = client.post(
        "/api/chat",
        headers=auth,
        json={"mode": mode, "message": "解释利率，不要给买卖建议"},
    )
    assert r.status_code == 200, r.text
    out = r.json()
    assert out["provider"] == "demo" and len(out["actions"]) == 3
    assert "不构成投资建议" in out["content"]
    sid = out["session_id"]
    assert (
        len(client.get(f"/api/chat/sessions/{sid}", headers=auth).json()["messages"])
        == 2
    )
    other = client.post(
        "/api/auth/login", json={"email": "demo@finpilot.app", "password": "demo123456"}
    ).json()["token"]
    assert (
        client.get(
            f"/api/chat/sessions/{sid}", headers={"Authorization": "Bearer " + other}
        ).status_code
        == 404
    )
    assert (
        client.post(
            "/api/chat",
            headers={"Authorization": "Bearer " + other},
            json={"mode": mode, "message": "你好", "session_id": sid},
        ).status_code
        == 404
    )


@pytest.mark.parametrize("id", range(1, 9))
def test_all_labs(client, auth, id):
    out = client.post(f"/api/labs/{id}/simulate", json={})
    assert out.status_code == 200 and out.json()["explanation"]
    assert (
        client.post(f"/api/labs/{id}/records", headers=auth, json={}).status_code == 200
    )


def test_formula_boundaries(client):
    v = client.post(
        "/api/labs/1/simulate",
        json={"principal": 1000, "monthly": 100, "rate": 0, "years": 1},
    ).json()
    assert v["value"] == 2200
    v = client.post("/api/labs/5/simulate", json={"rate": 5}).json()
    assert v["value"] == 1000
    assert (
        client.post(
            "/api/labs/4/simulate", json={"stocks": 80, "bonds": 30}
        ).status_code
        == 422
    )
    assert client.post("/api/labs/1/simulate", json={"years": 0}).status_code == 422
    assert (
        client.post("/api/labs/2/simulate", json={"rate": 0, "principal": 1000}).json()[
            "value"
        ]
        == 1000
    )


def test_remote_adapter_live_and_fallback(client, auth, monkeypatch):
    from app.ai import provider

    monkeypatch.setenv("LLM_API_KEY", "unit-test-key")
    monkeypatch.setenv("LLM_MODEL", "unit-test-model")
    captured = []

    class Response:
        def raise_for_status(self):
            pass

        def json(self):
            return {
                "choices": [
                    {
                        "message": {
                            "content": "利率是资金的价格。判断影响时需要检查期限与风险。"
                        }
                    }
                ]
            }

    class FakeClient:
        def __init__(self, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            pass

        async def post(self, url, **kwargs):
            captured.append((url, kwargs))
            return Response()

    monkeypatch.setattr(provider.httpx, "AsyncClient", FakeClient)
    result = client.post(
        "/api/chat", headers=auth, json={"mode": "tutor", "message": "利率是什么"}
    ).json()
    assert result["provider"] == "live"
    assert captured[0][0].endswith("/chat/completions")
    assert captured[0][1]["json"]["messages"][0]["role"] == "system"
    assert captured[0][1]["headers"]["Authorization"] == "Bearer unit-test-key"

    class FailingClient(FakeClient):
        async def post(self, url, **kwargs):
            raise provider.httpx.ConnectError("offline")

    monkeypatch.setattr(provider.httpx, "AsyncClient", FailingClient)
    result = client.post(
        "/api/chat", headers=auth, json={"mode": "explain", "message": "利率变化"}
    ).json()
    assert result["provider"] == "demo-fallback"
    assert len(result["actions"]) == 3


def test_seed_preserves_markdown_files(client, monkeypatch, tmp_path):
    import importlib

    module = importlib.import_module("app.seed")
    from app.db import Base, engine

    content = tmp_path / "content" / "lessons"
    import shutil

    shutil.copytree(module.ROOT / "content" / "lessons", content)
    edited = "# 我维护的课程\n\n自定义正文应保留。"
    (content / "01.md").write_text(edited, encoding="utf-8")
    monkeypatch.setattr(module, "ROOT", tmp_path)
    Base.metadata.drop_all(engine)
    module.seed()
    assert (content / "01.md").read_text(encoding="utf-8") == edited
    with SessionLocal() as db:
        assert db.get(Lesson, 1).markdown == edited


def test_ai_accepts_edited_markdown(client, auth):
    with SessionLocal() as db:
        db.get(Lesson, 9).markdown = "# 修改后的利率课程\n\n没有标准小标题也可以阅读。"
        db.commit()
    r = client.post(
        "/api/chat", headers=auth, json={"mode": "tutor", "message": "利率"}
    )
    assert r.status_code == 200 and r.json()["actions"]
