"""Saved route snapshots wrap the existing deterministic V2 graph traversal."""

from fastapi import HTTPException
from ...models import Article, Lesson, QuizQuestion, QuizRecord, now
from ...models_v3 import SavedRoute, ReadingState, ReviewItem, Reflection
from ..understanding import Evidence
from ..learning_routes import build_route
from ..relevance import brief
from .comparisons import COMPARISONS
from .review import quiz_event
from .moments import emit, sync


def create(db, user, target):
    old = (
        db.query(SavedRoute)
        .filter_by(user_id=user.id, target_topic_id=target, status="active")
        .order_by(SavedRoute.id.desc())
        .first()
    )
    if old:
        return old
    e = Evidence(db, user)
    if target not in e.topics:
        raise HTTPException(404, "目标主题不存在")
    base = build_route(e, target)
    topic = e.topics[target]
    source = base["steps"][0]["id"]
    first_q = (
        db.query(QuizQuestion)
        .filter_by(topic_id=source)
        .order_by(QuizQuestion.id)
        .first()
    )
    final_q = (
        db.query(QuizQuestion)
        .filter_by(topic_id=target)
        .order_by(QuizQuestion.id.desc())
        .first()
    )
    material = (
        db.query(Article).filter_by(topic_id=target, content_type="EXPLAINER").first()
    )
    lesson = db.query(Lesson).filter_by(topic_id=target).order_by(Lesson.id).first()
    steps = []
    if first_q:
        steps.append(
            {
                "kind": "Recall",
                "title": "回想一个出发点",
                "detail": first_q.question,
                "question_id": first_q.id,
                "options": first_q.options,
                "minutes": 1,
            }
        )
    if material or lesson:
        kind = "article" if material else "lesson"
        row = material or lesson
        steps.append(
            {
                "kind": "Read",
                "title": row.title,
                "detail": "读完内容并留下阅读记录，再回到路线。",
                "content_type": kind,
                "content_id": row.id,
                "url": f'/{"articles" if material else "lessons"}/{row.id}',
                "minutes": 3 if material else lesson.minutes,
            }
        )
    if base["relations"]:
        rel = base["relations"][-1]
        steps.append(
            {
                "kind": "Connect",
                "title": rel["from_title"] + " → " + rel["to_title"],
                "detail": "这条目录关系的含义是？反向经过不代表反向因果。",
                "relation_id": rel["id"],
                "options": [
                    rel["relation_label"],
                    "保证对方未来上涨",
                    "二者在所有条件下完全相同",
                ],
                "correct": 0,
                "minutes": 1,
            }
        )
    comp = next((c for c in COMPARISONS.values() if c["topic_id"] == target), None)
    if comp:
        steps.append(
            {
                "kind": "Compare",
                "title": comp["title"],
                "detail": "完成概念比较后的快速辨认。",
                "compare_id": comp["id"],
                "url": "/compare/" + comp["id"],
                "minutes": 2,
            }
        )
    lab = next((l for l in e.labs.values() if l.topic_id == target), None)
    if lab:
        steps.append(
            {
                "kind": "Experiment",
                "title": lab.title,
                "detail": "先预测，再实验，最后保存一次反思。",
                "lab_id": lab.id,
                "url": "/lab/" + str(lab.id),
                "minutes": 3,
            }
        )
    if final_q:
        steps.append(
            {
                "kind": "Check",
                "title": "带走自己的解释",
                "detail": final_q.question,
                "question_id": final_q.id,
                "options": final_q.options,
                "minutes": 1,
            }
        )
    row = SavedRoute(
        user_id=user.id,
        target_topic_id=target,
        route_snapshot={
            "title": topic.title,
            "reason": base["reason"],
            "source_title": e.topics[source].title,
            "source_evidence": e.rows[source]["evidence"],
            "graph": base,
            "steps": steps,
        },
        current_step=0,
        completed_steps=[],
    )
    db.add(row)
    db.commit()
    return row


def advance(db, user, row):
    steps = row.route_snapshot["steps"]
    while row.current_step < len(steps):
        s = steps[row.current_step]
        ok = False
        if s["kind"] == "Read":
            record = (
                db.query(ReadingState)
                .filter_by(
                    user_id=user.id,
                    content_type=s["content_type"],
                    content_id=s["content_id"],
                    completed=True,
                )
                .first()
            )
            ok = bool(record and record.last_read_at >= row.started_at)
        elif s["kind"] == "Compare":
            record = (
                db.query(ReviewItem)
                .filter_by(
                    user_id=user.id, item_key="c:" + s["compare_id"], last_correct=True
                )
                .first()
            )
            ok = bool(record and record.updated_at >= row.started_at)
        elif s["kind"] == "Experiment":
            record = (
                db.query(Reflection)
                .filter(
                    Reflection.user_id == user.id,
                    Reflection.lab_id == s["lab_id"],
                    Reflection.completed_at >= row.started_at,
                )
                .first()
            )
            ok = bool(record)
        if not ok:
            break
        mark(db, user, row)
    db.commit()
    return row


def mark(db, user, row):
    row.completed_steps = [
        *row.completed_steps,
        {"index": row.current_step, "completed_at": now()},
    ]
    row.current_step += 1
    row.last_active_at = now()
    if row.current_step == len(row.route_snapshot["steps"]):
        row.status = "completed"
        emit(db, user.id, "FIRST_ROUTE_COMPLETE")


def answer(db, user, row, index, selection):
    if index < row.current_step:
        return {
            "correct": True,
            "explanation": "这一步已经完成。",
            "route": public(row),
        }
    if index != row.current_step or index >= len(row.route_snapshot["steps"]):
        raise HTTPException(409, "路线已更新，请刷新")
    s = row.route_snapshot["steps"][index]
    if s["kind"] not in ("Recall", "Connect", "Check"):
        raise HTTPException(409, "请先完成此步骤对应的阅读、比较或实验")
    if selection < 0 or selection >= len(s["options"]):
        raise HTTPException(422, "选项无效")
    if s["kind"] == "Connect":
        correct = selection == s["correct"]
        explanation = (
            "目录中的实际关系是："
            + s["options"][s["correct"]]
            + "。关系说明不构成未来预测。"
        )
    else:
        q = db.get(QuizQuestion, s["question_id"])
        correct = selection == q.correct_answer
        explanation = q.explanation
        db.add(
            QuizRecord(
                user_id=user.id, question_id=q.id, answer=selection, correct=correct
            )
        )
        quiz_event(db, user.id, q, selection)
    if correct:
        mark(db, user, row)
    db.flush()
    sync(db, user)
    advance(db, user, row)
    db.commit()
    return {"correct": correct, "explanation": explanation, "route": public(row)}


def public(row):
    result = brief(row)
    result["route_snapshot"] = {
        **row.route_snapshot,
        "steps": [
            {k: v for k, v in s.items() if k != "correct"}
            for s in row.route_snapshot["steps"]
        ],
    }
    return result
