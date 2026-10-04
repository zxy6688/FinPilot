from datetime import datetime, timedelta, timezone
from app.db import SessionLocal
from app.models_v3 import ReviewItem, MisconceptionState, MomentRecord
from app.services.v3.review import schedule
from app.services.v3.misconceptions import observe


def test_reading_is_private_and_round_trips(client, auth):
    r = client.post('/api/v3/reading/article/1', headers=auth, json={'progress': .6, 'position': .45, 'last_section': '1'})
    assert r.status_code == 200
    assert client.get('/api/v3/reading/article/1', headers=auth).json()['position'] == .45
    client.post('/api/v3/reading/article/1', headers=auth, json={'progress': .2, 'position': .1})
    assert client.get('/api/v3/reading/article/1', headers=auth).json()['progress'] == .6
    assert client.get('/api/v3/reading/article/1').status_code == 401
    assert client.post('/api/v3/reading/article/9999', headers=auth, json={'progress':0,'position':0}).status_code == 404
    assert client.post('/api/v3/reading/article/1', headers=auth, json={'progress':1.1,'position':0}).status_code == 422
    other = client.post('/api/auth/register', json={'email':'other@sample.com','name':'Other','password':'password123'}).json()
    h = {'Authorization': 'Bearer '+other['token']}
    assert client.get('/api/v3/reading/article/1',headers=h).json() is None


def test_all_original_articles_have_reader_content(client):
    articles = client.get('/api/articles').json()
    for a in articles:
        r=client.get(f"/api/v3/articles/{a['id']}")
        assert r.status_code == 200
        body = r.json()
        assert len(body['sections']) >= 3
        assert body['known_count'] == 0
        if a['content_type']=='EXPLAINER':
            assert len({s['body'] for s in body['sections'] if s['body'].strip()}) == len(body['sections'])
        else:
            assert body['source_url'] == a['source_url']


def test_schedule_exact_intervals_and_reset(client, auth):
    uid=client.get('/api/users/me',headers=auth).json()['id']
    at=datetime(2026,1,1,tzinfo=timezone.utc)
    with SessionLocal() as db:
        for correct,days in [(False,1),(True,3),(True,7),(True,21),(True,45),(True,45),(False,1)]:
            row=schedule(db,uid,'q:1',1,correct,at)
            assert row.due_at==(at+timedelta(days=days)).isoformat()
            at+=timedelta(days=1)
        db.commit()


def test_quiz_schedules_only_supported_misconceptions(client, auth):
    client.post('/api/quizzes/3/answer',headers=auth,json={'answer':0})
    m=client.get('/api/v3/memory',headers=auth).json()
    assert m['reviews'][0]['streak']==0
    assert m['misconceptions'][0]['status']=='suspected'
    client.post('/api/quizzes/3/answer',headers=auth,json={'answer':0})
    assert client.get('/api/v3/memory',headers=auth).json()['misconceptions'][0]['status']=='observed'
    client.post('/api/v3/compare/nominal-real/check',headers=auth,json={'answer':1})
    assert client.get('/api/v3/memory',headers=auth).json()['misconceptions'][0]['status']=='addressed'
    # A later ordinary quiz is not silently promoted to a recalled comparison.
    client.post('/api/quizzes/3/answer',headers=auth,json={'answer':1})
    assert client.get('/api/v3/memory',headers=auth).json()['misconceptions'][0]['status']=='addressed'


def test_misconception_requires_later_recall(client,auth):
    uid=client.get('/api/users/me',headers=auth).json()['id']
    with SessionLocal() as db:
        observe(db,uid,'etf-index-fund',at='2026-01-01T00:00:00+00:00')
        row=observe(db,uid,'etf-index-fund',at='2026-01-02T00:00:00+00:00')
        assert row.status=='observed'
        observe(db,uid,'etf-index-fund',correct=True,compared=True,at='2026-01-03T00:00:00+00:00')
        observe(db,uid,'etf-index-fund',correct=True,recalled=True,at='2026-01-03T00:00:00+00:00')
        assert row.status=='addressed'
        observe(db,uid,'etf-index-fund',correct=True,recalled=True,at='2026-01-04T00:00:00+00:00')
        assert row.status=='resolved'


def test_review_replay_resume_and_capsule_once(client,auth):
    s=client.post('/api/v3/review/start',headers=auth,json={'kind':'capsule'}).json()
    assert 2<=s['total']<=4 and 'correct' not in s['item']
    repeated=client.post('/api/v3/review/start',headers=auth,json={'kind':'capsule'}).json()
    assert repeated['id']==s['id']
    url=f"/api/v3/review/{s['id']}/answer"
    a=client.post(url,headers=auth,json={'cursor':0,'answer':0})
    assert a.status_code==200
    replay=client.post(url,headers=auth,json={'cursor':0,'answer':1})
    assert replay.json()==a.json()
    while not (s:=client.get(f"/api/v3/review/{s['id']}",headers=auth).json())['completed_at']:
        assert client.post(url,headers=auth,json={'cursor':s['cursor'],'answer':0}).status_code==200
    assert client.post('/api/v3/review/start',headers=auth,json={'kind':'capsule'}).json()['completed_at']
    other=client.post('/api/auth/register',json={'email':'private@sample.com','name':'Private','password':'password123'}).json()
    assert client.get(f"/api/v3/review/{s['id']}",headers={'Authorization':'Bearer '+other['token']}).status_code==404
