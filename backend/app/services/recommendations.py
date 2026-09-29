from collections import Counter
from datetime import datetime, timezone, timedelta
from ..models import (
    Article,
    Favorite,
    Lab,
    Lesson,
    Post,
    QuizQuestion,
    QuizRecord,
    Topic,
    TopicView,
    UserProgress,
)


def recommend(db, user):
    score = Counter()
    reason = {}
    if user:
        cutoff = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
        latest = {
            r.question_id: r
            for r in db.query(QuizRecord)
            .filter(QuizRecord.user_id == user.id, QuizRecord.created_at >= cutoff)
            .order_by(QuizRecord.id)
        }
        for r in latest.values():
            if not r.correct:
                t = db.get(QuizQuestion, r.question_id).topic_id
                score[t] += 3
                reason[t] = "巩固最近的错题知识"
        for v in db.query(TopicView).filter(
            TopicView.user_id == user.id, TopicView.created_at >= cutoff
        ):
            score[v.topic_id] += 2
            reason.setdefault(v.topic_id, "延伸你最近浏览的主题")
        for f in db.query(Favorite).filter_by(user_id=user.id):
            obj = db.get(
                {
                    "article": Article,
                    "lesson": Lesson,
                    "topic": Topic,
                    "post": Post,
                    "lab": Lab,
                }[f.kind],
                f.target_id,
            )
            if obj:
                t = obj.id if f.kind == "topic" else obj.topic_id
                score[t] += 2
                reason.setdefault(t, "与你收藏的内容相关")
    for v in db.query(TopicView):
        score[v.topic_id] += 1
    completed = (
        {p.lesson_id for p in db.query(UserProgress).filter_by(user_id=user.id)}
        if user
        else set()
    )
    rows = [l for l in db.query(Lesson) if l.id not in completed]
    rows.sort(key=lambda l: (-score[l.topic_id], l.id))
    return [
        {
            "id": l.id,
            "title": l.title,
            "topic_id": l.topic_id,
            "score": score[l.topic_id],
            "reason": reason.get(l.topic_id, "从基础概念开始建立认知"),
        }
        for l in rows[:3]
    ]
