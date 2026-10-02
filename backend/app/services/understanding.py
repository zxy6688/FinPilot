"""Read-only, user-scoped evidence. No stored score, clock, randomness or migration."""

from datetime import datetime, timezone
from ..models import (
    Topic,
    Lesson,
    QuizQuestion,
    QuizRecord,
    UserProgress,
    Lab,
    LabRecord,
    TopicView,
    Favorite,
    Article,
    Post,
    LearningPath,
)

NOTICE = "这是基于 FinPilot 内学习行为的学习证据，不是对金融能力或投资能力的测量。"


def ids(row):
    return sorted(set(getattr(row, "topic_ids", None) or [row.topic_id]))


def timestamp(value):
    if not value:
        return 0
    d = datetime.fromisoformat(value)
    return (d if d.tzinfo else d.replace(tzinfo=timezone.utc)).timestamp()


class Evidence:
    def __init__(self, db, user):
        self.db, self.user = db, user
        self.topics = {x.id: x for x in db.query(Topic).order_by(Topic.id)}
        self.lessons = {
            x.id: x for x in db.query(Lesson).order_by(Lesson.position, Lesson.id)
        }
        self.questions = {
            x.id: x for x in db.query(QuizQuestion).order_by(QuizQuestion.id)
        }
        self.labs = {x.id: x for x in db.query(Lab).order_by(Lab.id)}
        self.articles = {x.id: x for x in db.query(Article).order_by(Article.id)}

        def mine(cls):
            return (
                db.query(cls).filter_by(user_id=user.id).order_by(cls.id).all()
                if user
                else []
            )

        self.progress, self.quizzes, self.runs = (
            mine(UserProgress),
            mine(QuizRecord),
            mine(LabRecord),
        )
        self.views, self.favorites = mine(TopicView), mine(Favorite)
        self.done = {x.lesson_id for x in self.progress}
        self.latest = {x.question_id: x for x in self.quizzes}
        self.recent, self.engaged, self.activity_lessons = {}, set(), {}

        def touch(tids, at):
            for tid in tids:
                if tid in self.topics:
                    self.recent[tid] = max(self.recent.get(tid, 0), timestamp(at))

        for p in self.progress:
            if p.lesson_id in self.lessons:
                touch(ids(self.lessons[p.lesson_id]), p.created_at)
                self.activity_lessons[p.lesson_id] = timestamp(p.created_at)
        for q in self.quizzes:
            item = self.questions.get(q.question_id)
            if item:
                touch([item.topic_id], q.created_at)
                self.activity_lessons[item.lesson_id] = max(
                    self.activity_lessons.get(item.lesson_id, 0),
                    timestamp(q.created_at),
                )
        for run in self.runs:
            if run.lab_id in self.labs:
                touch([self.labs[run.lab_id].topic_id], run.created_at)
        for v in self.views:
            tids = (
                ids(self.articles[v.article_id])
                if v.article_id in self.articles
                else [v.topic_id]
            )
            self.engaged.update(tids)
            touch(tids, v.created_at)
        posts = (
            {p.id: p for p in db.query(Post)}
            if any(f.kind == "post" for f in self.favorites)
            else {}
        )
        catalog = {
            "topic": self.topics,
            "article": self.articles,
            "lesson": self.lessons,
            "lab": self.labs,
            "post": posts,
        }
        for f in self.favorites:
            item = catalog.get(f.kind, {}).get(f.target_id)
            if item:
                tids = [item.id] if f.kind == "topic" else ids(item)
                touch(tids, f.created_at)
                self.engaged.update(tids)
                if f.kind == "lesson":
                    self.activity_lessons[item.id] = max(
                        self.activity_lessons.get(item.id, 0), timestamp(f.created_at)
                    )
        self.rows = {tid: self.calculate(tid) for tid in self.topics}

    def calculate(self, tid):
        lessons = [l for l in self.lessons.values() if tid in ids(l)]
        questions = [q for q in self.questions.values() if q.topic_id == tid]
        labs = [l for l in self.labs.values() if l.topic_id == tid]
        completed = sum(l.id in self.done for l in lessons)
        attempted = [self.latest[q.id] for q in questions if q.id in self.latest]
        correct = sum(bool(r.correct) for r in attempted)
        wrong = sum(not r.correct for r in attempted)
        participated = len(
            {r.lab_id for r in self.runs if r.lab_id in {l.id for l in labs}}
        )
        components = {
            "lesson": (40, completed, len(lessons)),
            "quiz": (35, correct, len(questions)),
            "lab": (15, participated, len(labs)),
            "engagement": (10, int(tid in self.engaged), 1),
        }
        available = sum(w for w, _, total in components.values() if total)
        value = round(
            100
            * sum(w * n / total for w, n, total in components.values() if total)
            / available
        )
        state = (
            "established"
            if value >= 70 and not wrong
            else (
                "building"
                if value >= 30
                else "exploring" if tid in self.recent else "unexplored"
            )
        )
        return {
            "id": tid,
            "title": self.topics[tid].title,
            "domain": self.topics[tid].domain,
            "state": state,
            "evidence": value,
            "recent_at": self.recent.get(tid, 0),
            "completed_lessons": completed,
            "lesson_count": len(lessons),
            "answered_questions": len(attempted),
            "correct_questions": correct,
            "question_count": len(questions),
            "wrong_questions": wrong,
            "repeated_errors": sum(
                not r.correct
                for r in self.quizzes
                if r.question_id in {q.id for q in questions}
                and r.question_id in self.latest
                and not self.latest[r.question_id].correct
            ),
            "lab_count": len(labs),
            "lab_participation": participated,
            "engaged": tid in self.engaged,
            "weights": {
                k: round(w / available * 100, 1) if total else 0
                for k, (w, _, total) in components.items()
            },
            "lesson_id": next(
                (l.id for l in lessons if l.id not in self.done),
                lessons[0].id if lessons else None,
            ),
        }

    def review(self):
        candidates = [
            r
            for r in self.rows.values()
            if r["wrong_questions"] or (r["recent_at"] and r["evidence"] < 60)
        ]
        return [
            {
                **r,
                "reason": (
                    f"最近作答仍有 {r['wrong_questions']} 道错题"
                    if r["wrong_questions"]
                    else "已接触，课程或自测证据仍较少"
                ),
            }
            for r in sorted(
                candidates,
                key=lambda r: (
                    -bool(r["wrong_questions"]),
                    -r["recent_at"],
                    -r["wrong_questions"],
                    r["id"],
                ),
            )
        ]

    def map(self):
        domains = []
        for p in self.db.query(LearningPath).order_by(LearningPath.id):
            ls = [l for l in self.lessons.values() if l.path_id == p.id]
            tids = sorted({tid for l in ls for tid in ids(l) if tid in self.rows})
            rows = [self.rows[t] for t in tids]
            domains.append(
                {
                    "id": p.id,
                    "title": p.title,
                    "english": p.english,
                    "topic_ids": tids,
                    "covered": sum(r["state"] != "unexplored" for r in rows),
                    "total": len(rows),
                    "completed_lessons": sum(l.id in self.done for l in ls),
                    "lesson_count": len(ls),
                    "needs_review": sum(
                        r["id"] in {v["id"] for v in self.review()} for r in rows
                    ),
                }
            )
        return {
            "notice": NOTICE,
            "has_evidence": bool(self.recent),
            "topics": list(self.rows.values()),
            "domains": domains,
            "needs_review": self.review(),
            "recent_topics": sorted(
                (r for r in self.rows.values() if r["recent_at"]),
                key=lambda r: (-r["recent_at"], r["id"]),
            )[:6],
        }
