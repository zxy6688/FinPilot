"""Deterministic spaced review; persisted sessions make reload/replay safe."""

import uuid
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException
from ...models import QuizQuestion, QuizRecord, Topic, now
from ...models_v3 import ReviewItem, ReviewSession
from .comparisons import COMPARISONS, OPTION_TAGS
from .misconceptions import observe
from .moments import emit, sync

INTERVALS = (3, 7, 21, 45)


def schedule(db, uid, key, topic_id, correct, at=None):
    at = at or datetime.now(timezone.utc)
    row = db.query(ReviewItem).filter_by(user_id=uid, item_key=key).first()
    if not row:
        row = ReviewItem(
            user_id=uid, item_key=key, topic_id=topic_id, streak=0, attempts=0
        )
        db.add(row)
    row.streak = min(row.streak + 1, 4) if correct else 0
    days = INTERVALS[row.streak - 1] if correct else 1
    row.attempts += 1
    row.last_correct = correct
    row.updated_at = at.isoformat()
    row.due_at = (at + timedelta(days=days)).isoformat()
    db.flush()
    return row


def quiz_event(db, uid, question, answer):
    correct = answer == question.correct_answer
    schedule(db, uid, f"q:{question.id}", question.topic_id, correct)
    tag = OPTION_TAGS.get((question.id, answer))
    if tag and not correct:
        observe(db, uid, tag)


def item_for(db, key, index=0):
    kind, value = key.split(":", 1)
    if kind == "q":
        q = db.get(QuizQuestion, int(value))
        if not q:
            raise HTTPException(404, "练习不存在")
        # Recall first hides options; user reveals them after silently retrieving the idea.
        return {
            "key": key,
            "type": (
                "Recall"
                if index == 0
                else "Recognition" if q.kind == "boolean" else "Apply"
            ),
            "title": q.question,
            "options": q.options,
            "correct": q.correct_answer,
            "explanation": q.explanation,
            "topic_id": q.topic_id,
            "lesson_id": q.lesson_id,
        }
    c = COMPARISONS.get(value)
    if kind != "c" or not c:
        raise HTTPException(404, "比较不存在")
    return {
        "key": key,
        "type": "Compare",
        "title": c["question"],
        "options": c["options"],
        "correct": c["correct"],
        "explanation": c["explanation"],
        "topic_id": c["topic_id"],
        "compare_id": value,
    }


def start(db, user, kind="review", at=None):
    at = at or datetime.now(timezone.utc)
    day = at.astimezone(timezone(timedelta(hours=8))).date().isoformat()
    if kind == "capsule":
        key = "capsule:" + day
        old = (
            db.query(ReviewSession).filter_by(user_id=user.id, session_key=key).first()
        )
    else:
        key = "review:" + uuid.uuid4().hex
        old = (
            db.query(ReviewSession)
            .filter_by(user_id=user.id, kind="review", completed_at=None)
            .order_by(ReviewSession.id.desc())
            .first()
        )
    if old:
        return old
    due = (
        db.query(ReviewItem)
        .filter(ReviewItem.user_id == user.id, ReviewItem.due_at <= at.isoformat())
        .order_by(ReviewItem.due_at, ReviewItem.id)
        .limit(4)
        .all()
    )
    keys = [r.item_key for r in due]
    # Voluntary practice fills a short session using actual answered questions, then foundations.
    answered = [
        f"q:{r.question_id}"
        for r in db.query(QuizRecord)
        .filter_by(user_id=user.id)
        .order_by(QuizRecord.id.desc())
    ]
    for candidate in answered + ["q:1", "q:3", "c:nominal-real"]:
        if len(keys) >= (3 if kind == "capsule" else max(2, len(due))):
            break
        if candidate not in keys:
            keys.append(candidate)
    items = [item_for(db, item_key, i) for i, item_key in enumerate(keys)]
    row = ReviewSession(
        user_id=user.id,
        session_key=key if kind == "capsule" else "review:" + uuid.uuid4().hex,
        kind=kind,
        items=items,
        responses=[],
        cursor=0,
        created_at=at.isoformat(),
    )
    db.add(row)
    db.commit()
    return row


def public_session(row):
    return {
        "id": row.id,
        "kind": row.kind,
        "cursor": row.cursor,
        "total": len(row.items),
        "completed_at": row.completed_at,
        "responses": row.responses,
        "item": (
            {
                k: v
                for k, v in row.items[row.cursor].items()
                if k not in ("correct", "explanation")
            }
            if row.cursor < len(row.items)
            else None
        ),
    }


def answer(db, user, row, cursor, selection, at=None):
    if cursor < row.cursor:
        return {"feedback": row.responses[cursor], "session": public_session(row)}
    if cursor != row.cursor or cursor >= len(row.items):
        raise HTTPException(409, "复习已更新，请刷新当前题目")
    item = row.items[cursor]
    if selection < 0 or selection >= len(item["options"]):
        raise HTTPException(422, "选项无效")
    at = at or datetime.now(timezone.utc)
    old = db.query(ReviewItem).filter_by(user_id=user.id, item_key=item["key"]).first()
    was_wrong = bool(old and not old.last_correct)
    correct = selection == item["correct"]
    schedule(db, user.id, item["key"], item["topic_id"], correct, at)
    tag = item.get("compare_id")
    if item["key"].startswith("q:"):
        qid = int(item["key"][2:])
        db.add(
            QuizRecord(
                user_id=user.id,
                question_id=qid,
                answer=selection,
                correct=correct,
                created_at=at.isoformat(),
            )
        )
        tag = (
            OPTION_TAGS.get((qid, selection))
            if not correct
            else next((t for (q, _), t in OPTION_TAGS.items() if q == qid), None)
        )
    if tag:
        observe(db, user.id, tag, correct=correct, recalled=True, at=at.isoformat())
    if correct:
        emit(db, user.id, "FIRST_CORRECT_RECALL")
        if was_wrong:
            emit(db, user.id, "MEMORY_RECOVERED", item["key"])
    feedback = {
        "correct": correct,
        "answer": selection,
        "correct_answer": item["correct"],
        "explanation": item["explanation"],
        "key": item["key"],
    }
    row.responses = [*row.responses, feedback]
    row.cursor += 1
    if row.cursor == len(row.items):
        row.completed_at = at.isoformat()
    db.flush()
    sync(db, user)
    db.commit()
    return {"feedback": feedback, "session": public_session(row)}
