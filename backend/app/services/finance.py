"""Deterministic educational models. All rates are percentages; money is CNY.

Only output is rounded. Models contain no AI, market forecasts or product rates.
"""
from decimal import Decimal, ROUND_HALF_UP
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, model_validator


class Input(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False, extra="forbid")


def D(x):
    return Decimal(str(x))


def cents(x):
    return float(D(x).quantize(Decimal(".01"), rounding=ROUND_HALF_UP))


class Expense(Input):
    name: str = Field(min_length=1, max_length=40)
    amount: float = Field(ge=0, le=10000000)
    kind: Literal["fixed", "flexible", "once"]


class BudgetInput(Input):
    income: float = Field(default=2500, ge=0, le=10000000)
    reserve: float = Field(default=300, ge=0, le=10000000)
    expenses: list[Expense] = Field(max_length=30)

    @model_validator(mode="after")
    def distinct(self):
        names = [e.name.strip().casefold() for e in self.expenses]
        if any(not n for n in names) or len(names) != len(set(names)):
            raise ValueError("支出名称不能为空或重复；同类支出请合并金额")
        return self


def budget(p: BudgetInput):
    totals = {k: sum((D(e.amount) for e in p.expenses if e.kind == k), D(0)) for k in ("fixed", "flexible", "once")}
    spent = sum(totals.values(), D(0))
    remaining = D(p.income) - spent
    available = remaining - D(p.reserve)
    return {"model_version": "budget-v1", "inputs": p.model_dump(),
            "spent": cents(spent), "remaining": cents(remaining), "available": cents(available),
            "gap": cents(max(D(0), -available)), "overspend": cents(max(D(0), -remaining)),
            "ratio": float(spent / D(p.income)) if p.income else None,
            "categories": [{"name": k, "value": cents(v)} for k, v in totals.items()],
            "assumptions": "单月现金预算；储备是计划留下的钱，不计入已消费支出。一次性支出只发生在本月。未建模收入到账时点或信用借款；不代表推荐的支出比例。"}


class CompoundInput(Input):
    principal: float = Field(default=10000, ge=0, le=10000000)
    rate: float = Field(default=4, ge=-50, le=30)
    years: int = Field(default=10, ge=0, le=60)
    frequency: Literal[1, 2, 4, 12] = 12
    basis: Literal["nominal", "effective"] = "effective"


def compound(p: CompoundInput):
    annual = (1 + p.rate / 100 / p.frequency) ** p.frequency if p.basis == "nominal" else 1 + p.rate / 100
    points = [{"x": y, "value": cents(p.principal * annual ** y), "reference": cents(p.principal)} for y in range(p.years + 1)]
    return {"model_version": "compound-v1", "inputs": p.model_dump(), "balance": points[-1]["value"],
            "interest": cents(p.principal * (annual ** p.years - 1)), "effective_rate": (annual - 1) * 100,
            "points": points, "assumptions": "一次性投入；不含追加存款、费用和税。年有效收益率口径已包含年内复利，频次不再改变全年收益；年名义利率按所选频次分期复利。固定利率是教学假设，负值表示假设损失。"}


class InflationInput(Input):
    principal: float = Field(default=10000, ge=0, le=10000000)
    inflation: float = Field(default=3, ge=-20, le=30)
    growth: float = Field(default=0, ge=-50, le=30)
    years: int = Field(default=3, ge=0, le=60)


def inflation(p: InflationInput):
    real_factor = (1 + p.growth / 100) / (1 + p.inflation / 100)
    points = [{"x": y, "value": cents(p.principal * real_factor ** y), "reference": cents(p.principal * (1 + p.growth / 100) ** y)} for y in range(p.years + 1)]
    return {"model_version": "inflation-v1", "inputs": p.model_dump(), "balance": points[-1]["value"],
            "nominal": points[-1]["reference"], "real_rate": (real_factor - 1) * 100,
            "points": points, "assumptions": "金额按年有效名义收益率增长，再按固定年通胀率折算为今天的购买力。无追加存入，不计税费；个人消费篮子可能不同于总体物价。本模型不是通胀或回报预测。"}


class LoanInput(Input):
    principal: float = Field(default=20000, ge=100, le=10000000)
    rate: float = Field(default=6, ge=0, le=60)
    months: int = Field(default=24, ge=1, le=600)
    method: Literal["annuity", "principal"] = "annuity"
    upfront: float = Field(default=200, ge=0, le=10000000)
    monthly_fee: float = Field(default=0, ge=0, le=100000)

    @model_validator(mode="after")
    def net_positive(self):
        if D(self.principal)-D(self.upfront)<D('.01'):
            raise ValueError("期初费用扣除后净到账必须至少为 0.01 元")
        return self


def cashflow_rate(net, payments):
    """Unique monthly IRR: positive t0, strictly positive monthly outflows.

    Payment PV decreases monotonically for r>=0. Explicitly detect bracket failure.
    No regulatory APR convention is implied.
    """
    if abs(sum(payments)-net)<1e-9:
        return 0.0
    def pv(r):
        factor=1/(1+r)
        discount=factor
        result=0.0
        for amount in payments:
            result+=amount*discount
            discount*=factor
        return result
    low,high=0.0,1.0
    while pv(high)>net and high<1e12:
        high*=2
    if pv(high)>net:
        raise ValueError("有效成本超出可解范围，请检查费用与净到账")
    for _ in range(160):
        mid=(low+high)/2
        if pv(mid)>net:low=mid
        else:high=mid
    return (low+high)/2


def loan(p: LoanInput):
    principal,r=D(p.principal),D(p.rate)/1200
    payment=principal/D(p.months) if not r else principal*r/(1-(1+r)**(-p.months))
    balance=principal
    schedule=[];flows=[];total_interest=D(0)
    for m in range(1,p.months+1):
        interest=balance*r
        repaid=(principal/D(p.months) if p.method=="principal" else payment-interest)
        if m==p.months:repaid=balance
        balance-=repaid
        out=repaid+interest+D(p.monthly_fee)
        flows.append(float(out));total_interest+=interest
        schedule.append({"month":m,"principal":cents(repaid),"interest":cents(interest),"fee":cents(p.monthly_fee),"payment":cents(out),"balance":cents(balance)})
    fees=D(p.upfront)+D(p.monthly_fee)*p.months
    net=principal-D(p.upfront)
    irr=cashflow_rate(float(net),flows)
    return {"model_version":"loan-monthly-v1","inputs":p.model_dump(),"net_received":cents(net),
            "total_interest":cents(total_interest),"total_fees":cents(fees),
            "total_cost":cents(total_interest+fees),"repayment_total":cents(principal+total_interest+D(p.monthly_fee)*p.months),
            "upfront_deducted":cents(D(p.upfront)),"total_paid":cents(principal+total_interest+fees),
            "monthly_irr":irr,"effective_annual_cost":((1+irr)**12-1)*100,
            "first_payment":schedule[0]["payment"],"last_payment":schedule[-1]["payment"],"schedule":schedule,
            "assumptions":"期初放款并扣除一次性费用；首期在一个月后，随后等间隔月末还款。年名义利率除以 12；每月费用另付。有效年成本由净到账与还款现金流 IRR 复合年化，不是监管 APR。未模拟提前还款、罚息、浮动利率、日计息、保险或非等间隔还款。内部不逐期舍入，展示到分，银行逐期舍入账单可能存在分位差异。"}


class BondInput(Input):
    face: float = Field(default=1000, ge=100, le=10000000)
    coupon: float = Field(default=3, ge=0, le=20)
    years: int = Field(default=5, ge=1, le=30)
    yield_rate: float = Field(default=3, ge=-5, le=30)


def bond(p: BondInput):
    cashflows=[p.face*p.coupon/100+(p.face if t==p.years else 0) for t in range(1,p.years+1)]
    def price(y):return sum(cf/(1+y/100)**t for t,cf in enumerate(cashflows,1))
    value=price(p.yield_rate)
    duration=sum(t*cf/(1+p.yield_rate/100)**t for t,cf in enumerate(cashflows,1))/value/(1+p.yield_rate/100)
    return {"model_version":"bond-annual-v1","inputs":p.model_dump(),"price":cents(value),"modified_duration":duration,
            "points":[{"yield":y,"price":cents(price(y))} for y in range(-5,31)],
            "scenarios":[{"yield":y,"price":cents(price(y))} for y in [p.yield_rate-0.5,p.yield_rate,p.yield_rate+0.5]],
            "assumptions":"年付固定票息、整年到期、到期归还面值，所有现金流按同一市场年有效收益率折现；不含信用违约、税费、赎回条款及应计利息。久期是小幅收益率变化下的局部敏感性，不是精确预测。政策利率不是定价输入。"}
