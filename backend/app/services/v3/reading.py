from fastapi import HTTPException
from ...models import Article, Lesson, Topic, TopicView, now
from ...models_v3 import ReadingState
from ..understanding import Evidence
from ..relevance import brief
from .editorial import EXPLAINERS
from .moments import emit


def content(db, kind, cid):
    row = db.get(Article if kind == "article" else Lesson, cid)
    if not row:
        raise HTTPException(404, "阅读内容不存在")
    return row


def state(db, uid, kind, cid):
    content(db, kind, cid)
    row = (
        db.query(ReadingState)
        .filter_by(user_id=uid, content_type=kind, content_id=cid)
        .first()
    )
    return brief(row) if row else None


def save(db, user, kind, cid, data):
    material = content(db, kind, cid)
    row = (
        db.query(ReadingState)
        .filter_by(user_id=user.id, content_type=kind, content_id=cid)
        .first()
    )
    if not row:
        row = ReadingState(
            user_id=user.id,
            content_type=kind,
            content_id=cid,
            progress=0,
            completed=False,
        )
        db.add(row)
    row.progress = max(row.progress, data.progress)
    row.position, row.last_section, row.last_read_at = (
        data.position,
        data.last_section,
        now(),
    )
    just_finished = data.completed and not row.completed
    row.completed = row.completed or data.completed
    if just_finished and kind == "article":
        e = Evidence(db, user)
        if material.content_type == "REAL_WORLD" and any(
            e.rows[t]["state"] in ("building", "established")
            for t in (material.topic_ids or [material.topic_id])
            if t in e.rows
        ):
            emit(db, user.id, "REAL_WORLD_MATCH", cid)
        db.add(TopicView(user_id=user.id, topic_id=material.topic_id, article_id=cid))
    db.commit()
    return brief(row)


def article(db, user, cid):
    a = content(db, "article", cid)
    e = Evidence(db, user)
    tids = a.topic_ids or [a.topic_id]
    ideas = [
        e.rows[t] | {"summary": e.topics[t].summary} for t in tids if t in e.topics
    ]
    if a.content_type == "EXPLAINER":
        sections = [
            {"title": title, "body": body} for title, body in EXPLAINERS.get(cid, [])
        ]
    else:
        sections = [
            {"title": "这份资料讲了什么", "body": a.summary},
            {"title": "为什么值得理解", "body": a.why_it_matters},
            {
                "title": "从概念读懂材料",
                "body": "\n\n".join(e.topics[t].summary for t in tids if t in e.topics),
            },
            {
                "title": "继续核对原始语境",
                "body": "这里提供 FinPilot 的导读与概念连接，不转载来源全文。请打开原始资料，核对日期、适用地区、定义及假设。历史事件不代表当前政策，投教资料不代表具体产品建议。",
            },
        ]
    return {
        **brief(a),
        "sections": sections,
        "ideas": ideas,
        "known_count": sum(t["state"] in ("building", "established") for t in ideas),
        "lesson_id": next(
            (l.id for l in e.lessons.values() if l.topic_id == a.topic_id), None
        ),
        "reading_state": state(db, user.id, "article", cid) if user else None,
    }
