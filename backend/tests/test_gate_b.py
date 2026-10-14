import pytest
from pydantic import ValidationError
from app.services.finance import BudgetInput, budget
from app.services.finance import CompoundInput, compound, InflationInput, inflation
from app.services.savings import SavingsInput, savings
from app.services.finance import LoanInput, loan
from app.services.finance import BondInput, bond


def inputs(**kw):
    return BudgetInput(income=kw.pop("income",2500),reserve=kw.pop("reserve",300),expenses=kw.pop("expenses",[{"name":"生活","amount":1750,"kind":"fixed"}]),**kw)


def test_budget_cash_and_reserve_are_distinct():
    r=budget(inputs())
    assert (r["spent"],r["remaining"],r["available"],r["gap"])==(1750,750,450,0)
    p=inputs(expenses=[{"name":"生活","amount":1750,"kind":"fixed"},{"name":"维修","amount":600,"kind":"once"}])
    r=budget(p)
    assert (r["remaining"],r["gap"],r["overspend"])==(150,150,0)


def test_zero_income_and_overspending():
    r=budget(inputs(income=0))
    assert r["ratio"] is None and r["remaining"]==-1750 and r["gap"]==2050
    assert budget(inputs(income=0,reserve=0,expenses=[]))["gap"]==0


@pytest.mark.parametrize("value",[-1,float("nan"),float("inf"),10000001])
def test_budget_bad_income(value):
    with pytest.raises(ValidationError): inputs(income=value)


def test_budget_duplicate_and_decimal():
    with pytest.raises(ValidationError): inputs(expenses=[{"name":"餐饮","kind":"fixed","amount":1},{"name":" 餐饮 ","kind":"flexible","amount":2}])
    assert budget(inputs(income=.3,reserve=0,expenses=[{"name":"a","amount":.1,"kind":"fixed"},{"name":"b","amount":.2,"kind":"once"}]))["remaining"]==0


def test_artifact_idempotence_and_ownership(client,auth):
    data={"id":"budget-snapshot-1","kind":"receipt","title":"预算","url":"/money-lab/budget?receipt=budget-snapshot-1","detail":"test","payload":{"inputs":{"income":2500}},"version":"gate-b-v1"}
    assert client.post("/api/v3/artifacts",json=data).status_code==401
    first=client.post("/api/v3/artifacts",json=data,headers=auth)
    assert first.status_code==200,first.text
    assert client.post("/api/v3/artifacts",json=data,headers=auth).json()==first.json()
    assert len(client.get("/api/v3/artifacts",headers=auth).json())==1
    changed={**data,"detail":"changed"}
    assert client.post("/api/v3/artifacts",json=changed,headers=auth).status_code==409
    second=client.post("/api/auth/register",json={"email":"other@example.com","name":"other","password":"test123456"}).json()
    other={"Authorization":"Bearer "+second["token"]}
    assert client.get("/api/v3/artifacts/budget-snapshot-1",headers=other).status_code==404
    assert client.get("/api/v3/artifacts",headers=other).json()==[]
    assert client.get("/api/v3/artifacts/budget-snapshot-1",headers=auth).json()["payload"]==data["payload"]
    assert client.post("/api/v3/artifacts",json={**data,"id":"bad","url":"//evil.example"},headers=auth).status_code==422


def test_compound_rate_basis_and_savings_agree():
    for basis in ["nominal","effective"]:
        c=compound(CompoundInput(principal=10000,rate=12,years=2,frequency=12,basis=basis))
        s=savings(SavingsInput(principal=10000,monthly=0,rate=12,months=24,basis=basis))
        assert c["balance"]==s["balance"]
    assert compound(CompoundInput(principal=100,rate=10,years=2,basis="effective"))["balance"]==121
    assert compound(CompoundInput(principal=100,rate=12,years=1,basis="nominal",frequency=12))["balance"]==112.68


@pytest.mark.parametrize("years",[0,1,60])
def test_compound_zero_rate(years):
    assert compound(CompoundInput(principal=10,rate=0,years=years))["balance"]==10


def test_inflation_real_rate_and_deflation():
    r=inflation(InflationInput(principal=10000,inflation=3,growth=0,years=3))
    assert r["balance"]==9151.42
    r=inflation(InflationInput(principal=10000,inflation=5,growth=2,years=1))
    assert r["real_rate"]==pytest.approx((1.02/1.05-1)*100)
    assert r["nominal"]==10200 and r["balance"]==9714.29
    assert inflation(InflationInput(inflation=-2))["balance"]>10000
    assert inflation(InflationInput(years=0))["balance"]==10000


@pytest.mark.parametrize("cls,kwargs",[(InflationInput,{"inflation":-100}),(InflationInput,{"growth":float('inf')}),(CompoundInput,{"years":1.5}),(CompoundInput,{"frequency":0}),(CompoundInput,{"rate":31})])
def test_model_bounds(cls,kwargs):
    with pytest.raises(ValidationError):cls(**kwargs)


@pytest.mark.parametrize("method",["annuity","principal"])
def test_loan_zero_and_fees(method):
    r=loan(LoanInput(principal=12000,rate=0,months=12,upfront=0,method=method))
    assert r["total_cost"]==0 and r["first_payment"]==1000 and r["effective_annual_cost"]==0
    r=loan(LoanInput(principal=12000,rate=0,months=12,upfront=120,monthly_fee=10,method=method))
    assert r["net_received"]==11880 and r["total_fees"]==240 and r["total_cost"]==240
    assert r["effective_annual_cost"]>0


def test_loan_known_annuity_and_principal():
    r=loan(LoanInput(principal=12000,rate=12,months=12,upfront=0))
    assert r["first_payment"]==1066.19
    assert r["total_interest"]==794.23
    assert r["effective_annual_cost"]==pytest.approx((1.01**12-1)*100)
    p=loan(LoanInput(principal=12000,rate=12,months=12,upfront=0,method="principal"))
    assert p["first_payment"]==1120 and p["last_payment"]==1010 and p["total_interest"]==780
    assert p["schedule"][-1]["balance"]==0


def test_loan_discounted_cashflows():
    r=loan(LoanInput(principal=20000,rate=6,months=24,upfront=500,monthly_fee=10))
    pv=sum(x["payment"]/(1+r["monthly_irr"])**x["month"] for x in r["schedule"])
    assert abs(pv-r["net_received"])<.15 # Display-only cent rounding.
    longer=loan(LoanInput(principal=20000,rate=6,months=48,upfront=500,monthly_fee=10))
    assert longer["first_payment"]<r["first_payment"] and longer["total_cost"]>r["total_cost"]


@pytest.mark.parametrize("kw",[{"principal":0},{"months":0},{"months":1.5},{"upfront":20000},{"monthly_fee":-1},{"rate":float('nan')}])
def test_loan_invalid(kw):
    with pytest.raises(ValidationError):LoanInput(**kw)


def test_bond_price_and_duration():
    assert bond(BondInput(coupon=3,yield_rate=3))["price"]==1000
    assert bond(BondInput(coupon=0,yield_rate=0))["price"]==1000
    assert bond(BondInput(coupon=0,yield_rate=10,years=2))["price"]==826.45
    assert bond(BondInput(yield_rate=2))["price"]>bond(BondInput(yield_rate=4))["price"]
    assert bond(BondInput(years=10))["modified_duration"]>bond(BondInput(years=2))["modified_duration"]
    assert bond(BondInput(coupon=0,yield_rate=0,years=5))["modified_duration"]==5


@pytest.mark.parametrize("kw",[{"years":0},{"yield_rate":-100},{"coupon":-1},{"face":float('nan')}])
def test_bond_bounds(kw):
    with pytest.raises(ValidationError):BondInput(**kw)


def test_story_progress_uses_existing_state_without_other_user_leak(client,auth):
    data={"progress":.4,"position":.35,"last_section":"experiment","completed":False}
    assert client.post('/api/v3/reading/story/1',json=data,headers=auth).status_code==200
    assert client.get('/api/v3/reading/story/1',headers=auth).json()['last_section']=='experiment'
    assert client.post('/api/v3/reading/story/1',json={**data,'progress':.2},headers=auth).json()['progress']==.4
    assert client.get('/api/v3/reading/story/999',headers=auth).status_code==404
    home=client.get('/api/v3/home',headers=auth).json()
    assert any(x['url']=='/stories/budget#experiment' for x in home['continue'])
    other=client.post('/api/auth/register',json={'email':'reader2@example.com','name':'reader2','password':'test123456'}).json()
    assert client.get('/api/v3/reading/story/1',headers={'Authorization':'Bearer '+other['token']}).json() is None


def test_contextual_fin_reuses_session_and_validates_model(client,auth):
    ctx={'source_type':'redesign','source_id':104,'tool_inputs':{'principal':12000,'rate':0,'months':12,'upfront':120,'monthly_fee':10},'action':'explain'}
    r=client.post('/api/chat',headers=auth,json={'message':'费用是什么？','context':ctx}).json()
    assert r['provider'].startswith('demo')
    assert '不是监管 APR' in r['content']
    follow=client.post('/api/chat',headers=auth,json={'message':'我还有个问题','context':ctx,'session_id':r['session_id']}).json()
    assert follow['session_id']==r['session_id']
    assert client.post('/api/chat',headers=auth,json={'message':'test','context':{**ctx,'tool_inputs':{'principal':0}}}).status_code==422
    unknown=client.post('/api/chat',headers=auth,json={'message':'明天外星飞船在哪里降落'}).json()
    assert '还不能确定' in unknown['content']
