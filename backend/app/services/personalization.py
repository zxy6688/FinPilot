"""Aggregated V2 workspace. Ordering is based on evidence, never randomness."""
from ..models import LearningPath
from .understanding import Evidence, ids
from .learning_routes import edges
from .relevance import brief, relevant_articles, recommended_lab


def home(db, user, evidence=None):
    e = evidence or Evidence(db, user)
    recent = sorted(e.recent, key=lambda t: (-e.recent[t], t))
    active = [e.lessons[lid] for lid in sorted(e.activity_lessons, key=lambda lid: (-e.activity_lessons[lid], lid)) if lid in e.lessons and lid not in e.done]
    reason = '继续最近作答或收藏、尚未完成的课程。'
    if not active:
        last = next((e.lessons[lid] for lid in sorted(e.activity_lessons, key=lambda lid: (-e.activity_lessons[lid], lid)) if lid in e.lessons), None)
        same_path = [l for l in e.lessons.values() if last and l.path_id == last.path_id and l.id not in e.done]
        by_topic = [l for tid in recent for l in e.lessons.values() if tid in ids(l) and l.id not in e.done]
        active = same_path[:1] or by_topic[:1]
        reason = '接着最近学习的路径继续。' if same_path else '根据最近接触的主题，推选一节尚未完成的课程。'
    if not active:
        active = [l for l in e.lessons.values() if l.path_id == 1 and l.id not in e.done][:1]
        reason = '新手入口：从 Money Basics 开始。' if not e.recent else '可以换一个基础概念继续理解。'
    next_topics, seen = [], set()
    for tid in recent:
        for r in edges(db):
            if r.from_topic_id == tid and r.to_topic_id in e.rows and r.to_topic_id not in seen and e.rows[r.to_topic_id]['state'] != 'established':
                next_topics.append({**e.rows[r.to_topic_id], 'from_title': e.topics[tid].title,
                                    'relation_label': r.relation_label, 'relation_id': r.id,
                                    'reason': f'你已接触「{e.topics[tid].title}」：{e.topics[tid].title} → {r.relation_label} → {e.topics[r.to_topic_id].title}'})
                seen.add(r.to_topic_id)
    continuation = None
    if active:
        l = active[0]; path = db.get(LearningPath, l.path_id)
        ls = [x for x in e.lessons.values() if x.path_id == l.path_id]
        continuation = {**brief(l), 'reason': reason, 'path_title': path.title,
                        'progress': round(100 * sum(x.id in e.done for x in ls) / len(ls)) if ls else 0}
    saved_target = next((f.target_id for f in reversed(e.favorites) if f.kind == 'topic' and f.target_id in e.rows), None)
    target = saved_target or (next_topics[0]['id'] if next_topics else (recent[0] if recent else 1))
    return {'name': user.name if user else None, 'has_evidence': bool(e.recent), 'continue_learning': continuation,
            'recent_topics': [e.rows[t] for t in recent[:6]], 'active_lessons': [brief(l) for l in active[:3]],
            'needs_review': e.review()[:4], 'next_related_topics': next_topics[:3],
            'relevant_real_world_items': relevant_articles(e)[:3], 'recommended_lab': recommended_lab(e),
            'route_target': target, 'route_reason': '最近收藏的主题目标' if saved_target else '根据当前学习证据建议的路线目标'}
