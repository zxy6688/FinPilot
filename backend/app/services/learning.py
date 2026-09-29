from datetime import datetime, timezone, timedelta
from collections import Counter
from ..models import (
    Article,
    Favorite,
    Lab,
    LabRecord,
    Lesson,
    Like,
    Post,
    QuizQuestion,
    QuizRecord,
    Topic,
    TopicView,
    UserBadge,
    UserProgress,
    now,
)


def streak(db, uid, now=None):
    local = timezone(timedelta(hours=8))

    def local_date(value):
        parsed = datetime.fromisoformat(value)
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed.astimezone(local).date().isoformat()

    dates = {
        local_date(x.created_at)
        for cls in [UserProgress, QuizRecord, LabRecord]
        for x in db.query(cls).filter_by(user_id=uid)
    }
    day = (now or datetime.now(timezone.utc)).astimezone(local).date()
    if day.isoformat() not in dates:
        day -= timedelta(days=1)
    n = 0
    while day.isoformat() in dates:
        n += 1
        day -= timedelta(days=1)
    return n


def profile(db, user):
    done = {p.lesson_id for p in db.query(UserProgress).filter_by(user_id=user.id)}
    records = (
        db.query(QuizRecord).filter_by(user_id=user.id).order_by(QuizRecord.id).all()
    )
    latest = {r.question_id: r for r in records}
    accuracy = (
        round(100 * sum(r.correct for r in latest.values()) / len(latest))
        if latest
        else 0
    )
    lessons = db.query(Lesson).all()
    questions = {q.id: q for q in db.query(QuizQuestion)}
    domains = []
    for domain in [
        "基础金融",
        "投资产品",
        "市场机制",
        "宏观经济",
        "行为金融",
        "个人金融",
    ]:
        tids = {t.id for t in db.query(Topic).filter_by(domain=domain)}
        ids = {l.id for l in lessons if l.topic_id in tids}
        rs = [r for r in latest.values() if questions[r.question_id].topic_id in tids]
        completion = sum(i in done for i in ids) / len(ids) if ids else 0
        correct = sum(r.correct for r in rs) / len(rs) if rs else 0
        domains.append(
            {"title": domain, "value": round(100 * (completion * 0.6 + correct * 0.4))}
        )
    counts = Counter(v.topic_id for v in db.query(TopicView).filter_by(user_id=user.id))
    models = {
        "article": Article,
        "lesson": Lesson,
        "post": Post,
        "topic": Topic,
        "lab": Lab,
    }
    for f in db.query(Favorite).filter_by(user_id=user.id):
        obj = db.get(models[f.kind], f.target_id)
        if obj:
            counts[obj.id if f.kind == "topic" else obj.topic_id] += 2
    wrong = Counter(
        questions[r.question_id].topic_id for r in latest.values() if not r.correct
    )
    activity = []
    for model, target, label in [
        (UserProgress, Lesson, "完成课程"),
        (LabRecord, Lab, "完成实验"),
        (Post, Post, "参与讨论"),
    ]:
        for record in (
            db.query(model)
            .filter_by(user_id=user.id)
            .order_by(model.created_at.desc())
            .limit(8)
        ):
            item = db.get(
                target,
                (
                    record.lesson_id
                    if model is UserProgress
                    else record.lab_id if model is LabRecord else record.id
                ),
            )
            if item:
                route = (
                    "/lessons/"
                    if model is UserProgress
                    else "/lab/" if model is LabRecord else "/fintalk/"
                )
                activity.append(
                    {
                        "id": f"{model.__tablename__}-{record.id}",
                        "kind": label,
                        "title": item.title,
                        "url": route + str(item.id),
                        "created_at": record.created_at,
                    }
                )
    activity.sort(key=lambda x: x["created_at"] or "", reverse=True)
    return {
        "recent_activity": activity[:10],
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "completed_lessons": len(done),
        "completed_ids": sorted(done),
        "quiz_accuracy": accuracy,
        "answered_questions": len(latest),
        "streak": streak(db, user.id),
        "favorites": db.query(Favorite).filter_by(user_id=user.id).count(),
        "discussions": db.query(Post).filter_by(user_id=user.id).count(),
        "domains": domains,
        "interests": [
            {"id": i, "title": db.get(Topic, i).title, "count": n}
            for i, n in counts.most_common(6)
        ],
        "review": [
            {
                "topic_id": i,
                "title": db.get(Topic, i).title,
                "count": n,
                "lesson_id": next((l.id for l in lessons if l.topic_id == i), None),
            }
            for i, n in wrong.most_common(5)
        ],
    }


def award_badges(db, user):
    done = {p.lesson_id for p in db.query(UserProgress).filter_by(user_id=user.id)}
    viewed = {
        v.article_id
        for v in db.query(TopicView).filter_by(user_id=user.id)
        if v.article_id
    }
    labs = {r.lab_id for r in db.query(LabRecord).filter_by(user_id=user.id)}
    likes = (
        db.query(Like)
        .join(Post, Like.post_id == Post.id)
        .filter(Post.user_id == user.id)
        .count()
    )
    conditions = [
        bool(done),
        7 in done,
        {l.id for l in db.query(Lesson).filter_by(path_id=3)} <= done,
        {l.id for l in db.query(Lesson).filter_by(path_id=4)} <= done,
        len(viewed) >= 16,
        len(labs) >= 5,
        streak(db, user.id) >= 7,
        likes >= 10,
    ]
    existing = {b.badge_id for b in db.query(UserBadge).filter_by(user_id=user.id)}
    for i, ok in enumerate(conditions, 1):
        if ok and i not in existing:
            db.add(UserBadge(user_id=user.id, badge_id=i))
    db.commit()
