"""Explainable material and lab relevance using existing content only."""
from .understanding import ids
from .learning_routes import edges


def brief(row):
    return {c.name: getattr(row, c.name) for c in row.__table__.columns}


def topic_priority(e):
    recent = sorted(e.recent, key=lambda t: (-e.recent[t], t))[:6]
    return list(dict.fromkeys(recent + [r['id'] for r in e.review()]))


def relevant_articles(e):
    priority = topic_priority(e)
    ranked = []
    for a in e.articles.values():
        if a.content_type != 'REAL_WORLD':
            continue
        tids = [t for t in ids(a) if t in e.rows]
        matched = [t for t in priority if t in tids]
        related = []
        if not matched:
            for r in edges(e.db):
                if r.from_topic_id in priority and r.to_topic_id in tids:
                    related.append((r.from_topic_id, r.to_topic_id, r.relation_label))
        if not matched and not related:
            continue
        source = matched[0] if matched else min(related, key=lambda x: (priority.index(x[0]), x[1]))[0]
        relation = None if matched else min(related, key=lambda x: (priority.index(x[0]), x[1]))
        ranked.append({**brief(a), 'topics': [{'id': t, 'title': e.topics[t].title} for t in tids],
                       'known_topics': [e.rows[t] for t in tids if e.rows[t]['state'] in ('building', 'established')],
                       'to_explore': [e.rows[t] for t in tids if e.rows[t]['state'] in ('unexplored', 'exploring')],
                       'reason': f"你最近接触了「{e.topics[source].title}」，这份资料也涉及它。" if matched else f"你最近接触的「{e.topics[source].title}」通过“{relation[2]}”连接资料中的「{e.topics[relation[1]].title}」。",
                       '_rank': (priority.index(source), 0 if matched else 1, a.id)})
    ranked.sort(key=lambda x: x['_rank'])
    for a in ranked:
        a.pop('_rank')
    return ranked


def recommended_lab(e):
    priority = topic_priority(e)
    for tid in priority:
        direct = [l for l in e.labs.values() if l.topic_id == tid]
        if direct:
            l = direct[0]
            return {**brief(l), 'personalized': True, 'reason': f'与你最近接触的「{e.topics[tid].title}」直接关联。'}
        for r in edges(e.db):
            if r.from_topic_id != tid:
                continue
            lab = next((l for l in e.labs.values() if l.topic_id == r.to_topic_id), None)
            if lab:
                return {**brief(lab), 'personalized': True, 'reason': f'{e.topics[tid].title} → {r.relation_label} → {e.topics[r.to_topic_id].title}'}
    if not priority and e.labs:
        l = min(e.labs.values(), key=lambda x: x.id)
        return {**brief(l), 'personalized': False, 'reason': '新手体验入口：先改变一个参数，观察假设的影响。'}
    return None
