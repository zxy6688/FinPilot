"""One Today selector shared by Home and My World."""

from datetime import datetime, timezone, timedelta
from ...models import Article, Lesson, UserProgress
from ...models_v3 import ReadingState, SavedRoute, ReviewItem, ReviewSession


def tasks(db, user):
    if not user:
        return [], None
    pending = []
    completed_lessons = {
        p.lesson_id for p in db.query(UserProgress).filter_by(user_id=user.id)
    }
    for r in (
        db.query(ReadingState)
        .filter(
            ReadingState.user_id == user.id,
            ReadingState.completed.is_(False),
            ReadingState.progress >= 0.05,
        )
        .order_by(ReadingState.last_read_at.desc())
        .limit(6)
    ):
        if r.content_type == "lesson" and r.content_id in completed_lessons:
            continue
        material = db.get(
            Article if r.content_type == "article" else Lesson, r.content_id
        )
        if not material:
            continue
        pending.append(
            {
                "kind": r.content_type,
                "eyebrow": "PICK UP WHERE YOU LEFT OFF",
                "title": material.title,
                "detail": f"已读约 {round(r.progress*100)}% · 回到上次停留的位置",
                "url": f'/{"articles" if r.content_type=="article" else "lessons"}/{r.content_id}',
                "duration": "继续阅读",
                "_at": r.last_read_at,
            }
        )
    for r in (
        db.query(SavedRoute)
        .filter_by(user_id=user.id, status="active")
        .order_by(SavedRoute.last_active_at.desc())
        .limit(3)
    ):
        pending.append(
            {
                "kind": "route",
                "eyebrow": "RESUME YOUR ROUTE",
                "title": r.route_snapshot["title"],
                "detail": f'从第 {r.current_step+1} 步继续 · 共 {len(r.route_snapshot["steps"])} 步',
                "url": f"/learn/routes/{r.target_topic_id}?saved={r.id}",
                "duration": "继续路线",
                "_at": r.last_active_at,
            }
        )
    pending.sort(key=lambda r: r["_at"], reverse=True)
    for r in pending:
        r.pop("_at")
    at = datetime.now(timezone.utc)
    due = (
        db.query(ReviewItem)
        .filter(ReviewItem.user_id == user.id, ReviewItem.due_at <= at.isoformat())
        .count()
    )
    review = (
        {
            "kind": "review",
            "eyebrow": "A LITTLE RECALL",
            "title": "花两分钟，让理解更牢固。",
            "detail": f"{due} 个到了复习时间的概念，选一小组慢慢想。",
            "url": "/review",
            "duration": "2–3 min",
        }
        if due
        else None
    )
    return pending[:2], review


def capsule(db, user):
    if not user:
        return None
    day = datetime.now(timezone(timedelta(hours=8))).date().isoformat()
    row = (
        db.query(ReviewSession)
        .filter_by(user_id=user.id, session_key="capsule:" + day)
        .first()
    )
    return {
        "completed": bool(row and row.completed_at),
        "url": "/review?kind=capsule" + ("&id=" + str(row.id) if row else ""),
    }
