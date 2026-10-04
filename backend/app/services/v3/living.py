"""Small read models for the living interface, backed by existing learning evidence."""

from ...models import LearningPath
from ..understanding import Evidence
from ..personalization import home as previous_home
from ..learning_routes import edges
from ..relevance import brief


def companion(e):
    domains = [
        p.id
        for p in e.db.query(LearningPath).order_by(LearningPath.id)
        if any(l.path_id == p.id and l.id in e.done for l in e.lessons.values())
    ]
    return {
        "mood": "curious" if e.done else "calm" if e.recent else "resting",
        "domains_awakened": domains,
        "connections_unlocked": 0,
        "review_due_count": 0,
        "recent_event": None,
        "companion_form": "awakened" if e.done else "seed",
        "message": (
            "慢慢来，每一个理解都会留下痕迹。" if e.done else "从一个好奇的问题开始。"
        ),
    }


def constellation(e, compact=False):
    priority = sorted(e.rows.values(), key=lambda r: (-r["recent_at"], r["id"]))
    chosen = (
        list(
            dict.fromkeys(
                [r["id"] for r in priority if r["recent_at"]][:3]
                + [9, 2, 6, 10, 7, 21, 1]
            )
        )[:7]
        if compact
        else list(e.topics)
    )
    nodes = []
    for tid in chosen:
        t = e.topics[tid]
        r = e.rows[tid]
        nodes.append(
            {
                **r,
                "summary": t.summary,
                "english": t.english,
                "lab_id": next(
                    (l.id for l in e.labs.values() if l.topic_id == tid), None
                ),
                "signal_id": next(
                    (
                        a.id
                        for a in e.articles.values()
                        if a.content_type == "REAL_WORLD"
                        and tid in (a.topic_ids or [a.topic_id])
                    ),
                    None,
                ),
            }
        )
    relations = [
        {
            "id": r.id,
            "from_topic_id": r.from_topic_id,
            "to_topic_id": r.to_topic_id,
            "relation_label": r.relation_label,
            "unlocked": False,
        }
        for r in edges(e.db)
        if r.from_topic_id in chosen and r.to_topic_id in chosen
    ]
    return {
        "topics": nodes,
        "relations": relations,
        "companion": companion(e),
        "summary": {"explored": len(e.recent), "connections": 0, "review_due": 0},
    }


def workspace(db, user):
    e = Evidence(db, user)
    legacy = previous_home(db, user, e)
    lesson = legacy["continue_learning"]
    today = {
        "kind": "explore",
        "eyebrow": "A SMALL BEGINNING",
        "title": "钱的价值，为什么会变化？",
        "detail": "从购买力开始，给你熟悉的生活添一种解释。",
        "url": "/lessons/1",
        "duration": "6 min",
    }
    if e.recent and lesson:
        today = {
            "kind": "lesson",
            "eyebrow": "CONTINUE UNDERSTANDING",
            "title": lesson["title"],
            "detail": lesson["reason"],
            "url": "/lessons/" + str(lesson["id"]),
            "duration": str(lesson["minutes"]) + " min",
        }
    signals = legacy["relevant_real_world_items"]
    signal = (
        signals[0]
        if signals
        else next(
            (brief(a) for a in e.articles.values() if a.content_type == "REAL_WORLD"),
            None,
        )
    )
    return {
        "name": user.name if user else None,
        "has_evidence": bool(e.recent),
        "today": today,
        "continue": [],
        "signal": signal,
        "world": constellation(e, True),
    }
