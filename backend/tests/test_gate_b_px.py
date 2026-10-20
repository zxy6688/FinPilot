import pytest
from app.services.finance import LoanInput, loan, BondInput, bond


@pytest.mark.parametrize("method", ["annuity", "principal"])
@pytest.mark.parametrize("rate,upfront,fee", [(0,200,0),(0,200,10),(6,0,0),(6,200,10)])
def test_loan_received_payments_and_cost_distinct(method, rate, upfront, fee):
    r=loan(LoanInput(principal=20000,months=24,rate=rate,upfront=upfront,monthly_fee=fee,method=method))
    assert r["net_received"] == 20000-upfront
    assert r["repayment_total"]-r["net_received"] == pytest.approx(r["total_cost"],abs=.011)
    assert r["total_paid"] == pytest.approx(r["repayment_total"]+upfront,abs=.011)
    assert sum(p["payment"] for p in r["schedule"]) == pytest.approx(r["repayment_total"],abs=.13)


def test_bond_chart_covers_highest_accepted_yield():
    r=bond(BondInput(yield_rate=30))
    assert r["points"][-1]["yield"] == 30
    assert r["price"] == r["points"][-1]["price"]


def test_artifact_rename_delete_owner_and_retry(client, auth):
    data={"id":"px-owner-record","kind":"receipt","title":"预算方案","url":"/money-lab/budget","detail":"教学数据","payload":{"income":2500}}
    assert client.post('/api/v3/artifacts',json=data,headers=auth).status_code==200
    other=client.post('/api/auth/register',json={"email":"px-other@example.test","name":"另一位体验者","password":"test123456"}).json()
    other_auth={"Authorization":"Bearer "+other['token']}
    for method,body in [('patch',{"title":"恶意改名"}),('delete',None)]:
        kwargs={"headers":other_auth}
        if body:kwargs['json']=body
        assert getattr(client,method)('/api/v3/artifacts/px-owner-record',**kwargs).status_code==404
    assert client.patch('/api/v3/artifacts/px-owner-record',json={"title":"   "},headers=auth).status_code==422
    r=client.patch('/api/v3/artifacts/px-owner-record',json={"title":"加维修的预算"},headers=auth)
    assert r.json()['title']=='加维修的预算'
    assert client.post('/api/v3/artifacts',json=data,headers=auth).status_code==200
    assert client.get('/api/v3/artifacts/px-owner-record',headers=auth).json()['title']=='加维修的预算'
    assert client.delete('/api/v3/artifacts/px-owner-record',headers=auth).json()['deleted']
    assert client.get('/api/v3/artifacts/px-owner-record',headers=auth).status_code==404
    assert client.get('/api/v3/artifacts',headers=auth).json()==[]


def test_shared_demo_denied_without_explicit_local_opt_in(client, monkeypatch):
    login=client.post('/api/auth/login',json={"email":"demo@finpilot.app","password":"demo123456"})
    assert login.status_code==200
    token=login.json()['token']
    monkeypatch.delenv('FINPILOT_ALLOW_SHARED_DEMO',raising=False)
    assert client.post('/api/auth/login',json={"email":"demo@finpilot.app","password":"demo123456"}).status_code==403
    assert client.get('/api/users/me',headers={"Authorization":"Bearer "+token}).status_code==403
    r=client.post('/api/auth/register',json={"email":"private-px@example.test","name":"独立账户","password":"test123456"})
    assert r.status_code==201
    assert client.get('/api/users/me',headers={"Authorization":"Bearer "+r.json()['token']}).status_code==200
