"""Deduplicated, evidence-backed moments. No synthetic activity or score rewards."""
from ...models import now, UserProgress, LearningPath, TopicRelation
from ...models_v3 import MomentRecord, UserConnection, CompanionState
from ..understanding import Evidence

CATALOG = {
    'FIRST_LESSON': ('第一束光', '你完成了第一节课。Fin 的地图从这里开始。', 'major'),
    'FIRST_CONNECTION': ('两点之间，有了理解', '两个已有充分证据的概念，连成了第一条线。', 'major'),
    'FIRST_CORRECT_RECALL': ('想起来了', '你在复习中正确回答了一次。', 'micro'),
    'MEMORY_RECOVERED': ('记忆回来了', '上次没想清的问题，这次找到了答案。', 'medium'),
    'MISCONCEPTION_FOUND': ('找到一个值得分清的地方', '同一概念边界出现了重复混淆，可以用一次比较厘清。', 'medium'),
    'MISCONCEPTION_RESOLVED': ('这一次，分清了', '比较之后，你在后续复习中重新辨认出了这条边界。', 'medium'),
    'REAL_WORLD_MATCH': ('知识走进现实', '你读完了一份与已学概念相关的真实资料。', 'micro'),
    'FIRST_PREDICTION': ('先留下自己的想法', '你在实验之前，记录了预测和理由。', 'micro'),
    'PREDICTION_MATCHED': ('观察与预测相遇', '这次模型中的变化方向与你的预测一致；现实仍有更多条件。', 'micro'),
    'FIRST_ROUTE_COMPLETE': ('走通一条理解路线', '这条路线的阅读、练习与连接均留下了记录。', 'major'),
    'DOMAIN_AWAKENED': ('一个领域亮起来了', '你完成了这个领域的第一节课。Fin 也留下了一个小记号。', 'medium'),
    'TEN_CONNECTIONS_BUILT': ('地图开始连成一片', '十条真实知识关系两端都有了充分学习证据。', 'major'),
}


def emit(db, uid, kind, key='first', detail=None):
    old = db.query(MomentRecord).filter_by(user_id=uid, kind=kind, event_key=str(key)).first()
    if old:
        return old
    title, description, severity = CATALOG[kind]
    item = MomentRecord(user_id=uid, kind=kind, event_key=str(key), title=title,
                        detail=detail or description, severity=severity)
    db.add(item)
    db.flush()
    return item


def sync(db, user):
    if not user:
        return
    e = Evidence(db, user)
    domains = sorted({l.path_id for l in e.lessons.values() if l.id in e.done})
    state = db.get(CompanionState, user.id)
    if not state:
        state = CompanionState(user_id=user.id, domains_awakened=[])
        db.add(state)
    if e.done:
        emit(db, user.id, 'FIRST_LESSON')
    for pid in domains:
        p = db.get(LearningPath, pid)
        emit(db, user.id, 'DOMAIN_AWAKENED', pid, f'你在「{p.title}」完成了第一节课。')
    unlocked = {r.relation_id for r in db.query(UserConnection).filter_by(user_id=user.id)}
    for edge in db.query(TopicRelation):
        if edge.id not in unlocked and all(e.rows.get(t, {}).get('state') == 'established' for t in (edge.from_topic_id, edge.to_topic_id)):
            db.add(UserConnection(user_id=user.id, relation_id=edge.id))
            unlocked.add(edge.id)
    if unlocked:
        emit(db, user.id, 'FIRST_CONNECTION')
    if len(unlocked) >= 10:
        emit(db, user.id, 'TEN_CONNECTIONS_BUILT')
    state.domains_awakened = domains
    state.companion_form = 'awakened' if domains else 'seed'
    last = db.query(MomentRecord).filter_by(user_id=user.id).order_by(MomentRecord.id.desc()).first()
    state.recent_event = last.kind if last else None
    state.updated_at = now()
    db.flush()


def claim(db, uid, session):
    """At most one major and two medium displays per authenticated token session."""
    counts = {severity: db.query(MomentRecord).filter_by(user_id=uid, display_session=session, severity=severity).count()
              for severity in ('major', 'medium')}
    for m in db.query(MomentRecord).filter_by(user_id=uid, seen_at=None).order_by(MomentRecord.id):
        if m.severity == 'major' and counts['major'] >= 1:
            continue
        if m.severity == 'medium' and counts['medium'] >= 2:
            continue
        m.seen_at, m.display_session = now(), session
        db.commit()
        return m
    return None
