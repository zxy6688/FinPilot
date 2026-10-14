"""Gate A deterministic savings model. Nominal annual rate / 12, no fees or tax."""
from decimal import Decimal, ROUND_HALF_UP, localcontext
from typing import Literal
from pydantic import BaseModel, Field, ConfigDict

class SavingsInput(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False, extra="forbid")
    principal: float = Field(default=2000, ge=0, le=10000000)
    monthly: float = Field(default=500, ge=0, le=100000)
    months: int = Field(default=24, ge=1, le=600)
    rate: float = Field(default=2, ge=0, le=30)
    target: float = Field(default=15000, ge=1, le=100000000)
    timing: Literal["end", "begin"] = "end"
    basis: Literal["nominal", "effective"] = "nominal"

def savings(p: SavingsInput):
    with localcontext() as ctx:
        ctx.prec = 40
        d = lambda v: Decimal(str(v))
        money = lambda v: float(v.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))
        balance, monthly, r = d(p.principal), d(p.monthly), d(p.rate) / 1200
        if p.basis == "effective":
            r = (1+d(p.rate)/100) ** (Decimal(1)/12) - 1
        points = [{"month": 0, "balance": money(balance), "contributions": money(balance)}]
        reached = 0 if balance >= d(p.target) else None
        for m in range(1, p.months + 1):
            balance = (balance + monthly) * (1+r) if p.timing == "begin" else balance * (1+r) + monthly
            points.append({"month": m, "balance": money(balance), "contributions": money(d(p.principal) + monthly*m)})
            if reached is None and balance >= d(p.target): reached = m
        factor = (1+r)**p.months
        annuity = ((factor-1)/r if r else d(p.months)) * ((1+r) if p.timing == "begin" else 1)
        required = max(Decimal(0), (d(p.target)-d(p.principal)*factor)/annuity)
        # Round upward to cents so the suggested monthly amount actually meets the target.
        from decimal import ROUND_CEILING
        contributions = d(p.principal)+monthly*p.months
        return {"model_version":"savings-monthly-v1", "inputs":p.model_dump(), "balance":money(balance),
                "contributions":money(contributions), "interest":money(balance-contributions),
                "required_monthly":float(required.quantize(Decimal("0.01"), rounding=ROUND_CEILING)),
                "gap":money(max(Decimal(0),d(p.target)-balance)), "reached_month":reached, "points":points,
                "assumptions":("固定年有效收益率换算为等效月利率" if p.basis == "effective" else "固定年名义收益率除以 12 逐月计息") + "；按选择的月初或月末存入；不计税费、不考虑利率变化。教学情景不代表产品报价或收益承诺。"}
