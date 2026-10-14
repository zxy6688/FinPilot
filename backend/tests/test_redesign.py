import math
import pytest
from pydantic import ValidationError
from app.services.savings import SavingsInput, savings

@pytest.mark.parametrize("timing", ["begin", "end"])
def test_zero_rate(timing):
    r=savings(SavingsInput(principal=2000,monthly=500,months=24,rate=0,timing=timing))
    assert r["balance"]==14000 and r["interest"]==0
    assert r["required_monthly"]==541.67

@pytest.mark.parametrize("rate,months,timing", [(2,24,"end"),(12,12,"begin"),(30,600,"end"),(0.001,1,"begin")])
def test_independent_closed_form(rate,months,timing):
    p=SavingsInput(rate=rate,months=months,timing=timing)
    r=rate/1200
    expected=2000*(1+r)**months+500*((1+r)**months-1)/r*(1+r if timing=="begin" else 1)
    assert savings(p)["balance"]==pytest.approx(expected,abs=.011)

def test_timing_difference_and_target():
    end=savings(SavingsInput(rate=12,months=1,target=2500))
    begin=savings(SavingsInput(rate=12,months=1,timing="begin"))
    assert end["balance"]==2520 and begin["balance"]==2525
    assert end["reached_month"]==1
    assert savings(SavingsInput(target=1000))["required_monthly"]==0
    assert savings(SavingsInput(principal=0,monthly=0))["reached_month"] is None
    p=SavingsInput(target=15000)
    r=savings(p)
    assert savings(p.model_copy(update={"monthly":r["required_monthly"]}))["gap"]==0

@pytest.mark.parametrize("data", [{"months":0},{"months":601},{"monthly":-1},{"rate":float("nan")},{"principal":float("inf")},{"rate":31},{"timing":"later"},{"months":1.5}])
def test_invalid_inputs(data):
    with pytest.raises(ValidationError): SavingsInput(**data)

def test_endpoint(client):
    r=client.post("/api/v3/tools/savings",json={"rate":0})
    assert r.status_code==200 and r.json()["balance"]==14000
    assert client.post("/api/v3/tools/savings",json={"months":0}).status_code==422
