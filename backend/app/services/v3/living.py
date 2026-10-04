"""Small read models for the living interface, backed by existing learning evidence."""

from ...models import LearningPath, now
from ...models_v3 import ReviewItem, UserConnection, CompanionState, MomentRecord
from .today import tasks, capsule
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
    due = (
        e.db.query(ReviewItem)
        .filter(ReviewItem.user_id == e.user.id, ReviewItem.due_at <= now())
        .count()
        if e.user
        else 0
    )
    links = (
        e.db.query(UserConnection).filter_by(user_id=e.user.id).count() if e.user else 0
    )
    last = (
        e.db.query(MomentRecord)
        .filter_by(user_id=e.user.id)
        .order_by(MomentRecord.id.desc())
        .first()
        if e.user
        else None
    )
    return {
        "mood": (
            "thinking"
            if due
            else "curious" if e.done else "calm" if e.recent else "resting"
        ),
        "domains_awakened": domains,
        "connections_unlocked": links,
        "review_due_count": due,
        "recent_event": last.kind if last else None,
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
    unlocked = (
        {r.relation_id for r in e.db.query(UserConnection).filter_by(user_id=e.user.id)}
        if e.user
        else set()
    )
    relations = [
        {
            "id": r.id,
            "from_topic_id": r.from_topic_id,
            "to_topic_id": r.to_topic_id,
            "relation_label": r.relation_label,
            "unlocked": r.id in unlocked,
        }
        for r in edges(e.db)
        if r.from_topic_id in chosen and r.to_topic_id in chosen
    ]
    fin = companion(e)
    return {
        "topics": nodes,
        "relations": relations,
        "companion": fin,
        "summary": {
            "explored": len(e.recent),
            "connections": fin["connections_unlocked"],
            "review_due": fin["review_due_count"],
        },
    }


def workspace(db, user):
    if user:
        from .moments import sync
        from .route_progress import advance
        from ...models_v3 import SavedRoute

        sync(db, user)
        for route in (
            db.query(SavedRoute).filter_by(user_id=user.id, status="active").all()
        ):
            advance(db, user, route)
        db.commit()
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
    pending, review_task = tasks(db, user)
    if pending:
        today = pending[0]
    elif review_task:
        today = review_task
    return {
        "capsule": capsule(db, user),
        "name": user.name if user else None,
        "has_evidence": bool(e.recent or pending),
        "today": today,
        "continue": pending,
        "signal": signal,
        "world": constellation(e, True),
    }
