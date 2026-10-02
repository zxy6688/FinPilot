"""Deterministic BFS routes; directed edges are preferred, never invented."""

from collections import deque
from ..models import TopicRelation


def edges(db):
    return db.query(TopicRelation).order_by(TopicRelation.id).all()


def find_path(relations, start, target, undirected=False):
    graph = {}
    for e in relations:
        graph.setdefault(e.from_topic_id, []).append((e.to_topic_id, e, False))
        if undirected:
            graph.setdefault(e.to_topic_id, []).append((e.from_topic_id, e, True))
    queue = deque([(start, [start], [])])
    seen = {start}
    while queue:
        node, path, used = queue.popleft()
        if node == target:
            return path, used
        for nxt, edge, reverse in sorted(
            graph.get(node, []), key=lambda x: (x[0], x[1].id)
        ):
            if nxt not in seen:
                seen.add(nxt)
                queue.append((nxt, path + [nxt], used + [(edge, reverse)]))
    return None


def build_route(evidence, target):
    if target not in evidence.rows:
        raise KeyError(target)
    row = evidence.rows[target]
    rels = [
        r
        for r in edges(evidence.db)
        if r.from_topic_id in evidence.rows and r.to_topic_id in evidence.rows
    ]
    starts = sorted(
        (
            r
            for r in evidence.rows.values()
            if r["id"] != target and r["evidence"] >= 30
        ),
        key=lambda r: (-r["evidence"], -r["recent_at"], r["id"]),
    )
    if not starts:
        starts = sorted(
            (r for r in evidence.rows.values() if r["id"] != target and r["recent_at"]),
            key=lambda r: (-r["recent_at"], r["id"]),
        )
    personal = bool(starts)
    if not starts:
        foundation = [l.topic_id for l in evidence.lessons.values() if l.path_id == 1]
        starts = [
            evidence.rows[t]
            for t in dict.fromkeys(foundation)
            if t != target and t in evidence.rows
        ]
    found, kind = None, "directed"
    if row["state"] == "established":
        found, kind = ([target], []), "already_known"
    else:
        for fallback in [False, True]:
            for source in starts:
                found = find_path(rels, source["id"], target, fallback)
                if found:
                    kind = "connection" if fallback else "directed"
                    break
            if found:
                break
    if not found:
        found, kind = ([target], []), "no_path"
    path, used = found
    steps = []
    next_id = next(
        (t for t in path if evidence.rows[t]["state"] != "established"), None
    )
    for t in path:
        r = evidence.rows[t]
        steps.append(
            {
                **r,
                "is_target": t == target,
                "is_next": t == next_id,
                "lab_id": next(
                    (l.id for l in evidence.labs.values() if l.topic_id == t), None
                ),
            }
        )
    connections = [
        {
            "id": e.id,
            "from_topic_id": e.from_topic_id,
            "to_topic_id": e.to_topic_id,
            "from_title": evidence.topics[e.from_topic_id].title,
            "to_title": evidence.topics[e.to_topic_id].title,
            "relation_label": e.relation_label,
            "traversed_reverse": reverse,
        }
        for e, reverse in used
    ]
    return {
        "target_topic_id": target,
        "kind": kind,
        "personalized": personal,
        "steps": steps,
        "relations": connections,
        "reason": {
            "directed": "沿已有有向关系连接知识；关系不等于学习先修要求。",
            "connection": "没有可用有向路径，按无向连通关系探索；反向经过不表示反向因果。",
            "already_known": "这个主题已有较充分学习证据，可以复习或选择其他目标。",
            "no_path": "未找到连接路线，可直接从目标主题开始。",
        }[kind],
    }


def connections(evidence, topic_id):
    result = []
    for e in edges(evidence.db):
        if (
            topic_id not in (e.from_topic_id, e.to_topic_id)
            or e.from_topic_id not in evidence.topics
            or e.to_topic_id not in evidence.topics
        ):
            continue
        a, b = evidence.topics[e.from_topic_id], evidence.topics[e.to_topic_id]
        result.append(
            {
                "id": e.id,
                "from_topic_id": a.id,
                "to_topic_id": b.id,
                "from_title": a.title,
                "to_title": b.title,
                "relation_label": e.relation_label,
                "explanation": f"目录以“{e.relation_label}”连接{a.title}与{b.title}。{a.summary} {b.summary} 这是理解两者联系的线索，具体影响取决于条件，并非确定预测。",
                "lesson_id": evidence.rows[b.id]["lesson_id"],
            }
        )
    return result
