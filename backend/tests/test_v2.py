from app.db import SessionLocal
from app.models import User, Topic, TopicRelation, UserProgress, QuizRecord, QuizQuestion, TopicView, Lab, LabRecord
from app.services.understanding import Evidence
from app.services.learning_routes import build_route


def uid(db):
    return db.query(User).filter_by(email='learner@example.com').one().id


def test_home_deterministic_and_empty(client, auth):
    first = client.get('/api/v2/home', headers=auth).json()
    assert first == client.get('/api/v2/home', headers=auth).json()
    assert not first['has_evidence']
    assert first['continue_learning']['path_id'] == 1
    assert first['needs_review'] == first['relevant_real_world_items'] == []
    assert not first['recommended_lab']['personalized']
    assert client.get('/api/v2/understanding-map').status_code == 401


def test_wrong_answer_resolved_and_user_isolation(client, auth):
    with SessionLocal() as db:
        u = uid(db); q = db.query(QuizQuestion).first()
        qid, tid = q.id, q.topic_id
        db.add_all([QuizRecord(user_id=u,question_id=qid,answer=0,correct=False), QuizRecord(user_id=u,question_id=qid,answer=0,correct=False)])
        db.commit()
    home = client.get('/api/v2/home',headers=auth).json()
    row = next(r for r in home['needs_review'] if r['id']==tid)
    assert row['wrong_questions']==1 and row['repeated_errors']==2
    assert not client.get('/api/v2/home').json()['has_evidence']
    with SessionLocal() as db:
        db.add(QuizRecord(user_id=uid(db),question_id=qid,answer=0,correct=True)); db.commit()
    rows = client.get('/api/v2/understanding-map',headers=auth).json()['topics']
    assert next(r for r in rows if r['id']==tid)['wrong_questions']==0


def test_related_material_and_lab(client, auth):
    with SessionLocal() as db:
        db.add(TopicView(user_id=uid(db),topic_id=9)); db.commit()
    h = client.get('/api/v2/home',headers=auth).json()
    assert h['recent_topics'][0]['id']==9
    assert h['next_related_topics'] and all(r['relation_label'] for r in h['next_related_topics'])
    assert h['relevant_real_world_items'] and all(a['content_type']=='REAL_WORLD' and a['reason'] for a in h['relevant_real_world_items'])
    assert h['recommended_lab']['personalized']
    assert client.get('/api/v2/topics/9/connections',headers=auth).json()[0]['explanation']
    assert client.get('/api/v2/topics/999/connections').status_code==404


def test_evidence_normalization_and_domains(client, auth):
    with SessionLocal() as db:
        user=db.get(User,uid(db)); lab_topics={l.topic_id for l in db.query(Lab)}
        e=Evidence(db,user)
        t=next(t for t in e.rows if t not in lab_topics and e.rows[t]['question_count'])
        for l in e.lessons.values():
            if t in (l.topic_ids or [l.topic_id]): db.add(UserProgress(user_id=user.id,lesson_id=l.id))
        for q in e.questions.values():
            if q.topic_id==t: db.add(QuizRecord(user_id=user.id,question_id=q.id,answer=q.correct_answer,correct=True))
        db.add(TopicView(user_id=user.id,topic_id=t)); db.commit()
        e=Evidence(db,user); r=e.rows[t]
        assert r['weights']['lab']==0 and r['evidence']==100 and r['state']=='established'
        assert build_route(e,t)['kind']=='already_known'
        assert len(e.map()['domains'])==5


def test_graph_connected_reverse_and_disconnected(client, auth):
    with SessionLocal() as db:
        user=db.get(User,uid(db))
        db.query(TopicRelation).delete()
        db.add_all([TopicRelation(from_topic_id=1,to_topic_id=2,relation_label='联系 A'),TopicRelation(from_topic_id=2,to_topic_id=3,relation_label='联系 B')])
        db.add(TopicView(user_id=user.id,topic_id=1)); db.commit()
        r=build_route(Evidence(db,user),3)
        assert r['kind']=='directed' and [s['id'] for s in r['steps']]==[1,2,3]
        assert [x['relation_label'] for x in r['relations']]==['联系 A','联系 B']
        db.query(TopicView).delete(); db.add(TopicView(user_id=user.id,topic_id=3)); db.commit()
        r=build_route(Evidence(db,user),1)
        assert r['kind']=='connection' and all(x['traversed_reverse'] for x in r['relations'])
        assert build_route(Evidence(db,user),24)['kind']=='no_path'
    assert client.get('/api/v2/learning-routes/999').status_code==404


def test_lab_evidence_and_no_connected_lab(client, auth):
    with SessionLocal() as db:
        user=db.get(User,uid(db)); lab=db.query(Lab).first()
        db.add(LabRecord(user_id=user.id,lab_id=lab.id,inputs={},result={})); db.commit()
        assert Evidence(db,user).rows[lab.topic_id]['lab_participation']==1
        db.query(LabRecord).delete(); db.query(TopicRelation).delete()
        lab_topics={x.topic_id for x in db.query(Lab)}
        t=next(t.id for t in db.query(Topic) if t.id not in lab_topics)
        db.add(TopicView(user_id=user.id,topic_id=t)); db.commit()
    assert client.get('/api/v2/labs/recommended',headers=auth).json() is None


def test_existing_api_still_available(client, auth):
    for path in ['/topics','/learning-paths','/lessons/1','/articles','/labs','/posts','/users/me']:
        assert client.get('/api'+path,headers=auth).status_code==200
    m=client.get('/api/v2/understanding-map',headers=auth).json()
    assert not m['has_evidence'] and all(r['state']=='unexplored' for r in m['topics'])
