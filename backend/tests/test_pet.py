def test_pet_roundtrip_conflict_and_owner(client, auth):
    assert client.get('/api/v3/pet').status_code == 401
    assert client.get('/api/v3/pet',headers=auth).json()['revision']==0
    snapshot={'room':{'window':'garden'},'memories':[{'id':'one','text':'主动保存'}]}
    saved=client.post('/api/v3/pet',headers=auth,json={'revision':0,'snapshot':snapshot})
    assert saved.status_code==200
    assert client.get('/api/v3/pet',headers=auth).json()['snapshot']==snapshot
    assert client.post('/api/v3/pet',headers=auth,json={'revision':0,'snapshot':snapshot}).status_code==409
    other=client.post('/api/auth/register',json={'email':'pet-other@example.com','name':'其他用户','password':'test123456'}).json()
    headers={'Authorization':'Bearer '+other['token']}
    assert client.get('/api/v3/pet',headers=headers).json()=={'revision':0,'snapshot':{}}
    assert client.post('/api/v3/pet',headers=auth,json={'revision':1,'snapshot':{'unexpected':True}}).status_code==422
    assert client.post('/api/v3/pet',headers=auth,json={'revision':1,'snapshot':{'memories':[]}}).status_code==200
