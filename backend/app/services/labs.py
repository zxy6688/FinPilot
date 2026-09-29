from fastapi import HTTPException


def simulate(slug, p):
    points = []
    detail = ""
    if slug == "compound":
        balance = p.principal
        r = p.rate / 1200
        points = [{"year": 0, "value": round(balance, 2), "invested": p.principal}]
        for month in range(1, p.years * 12 + 1):
            balance = balance * (1 + r) + p.monthly
            if month % 12 == 0:
                points.append(
                    {
                        "year": month // 12,
                        "value": round(balance, 2),
                        "invested": p.principal + p.monthly * month,
                    }
                )
        detail = "每月末投入，按年名义收益率除以12逐月计息，不含费用与税；收益率固定仅用于教学，实际收益可能为负。"
    elif slug == "inflation":
        points = [
            {"year": y, "value": round(p.principal / (1 + p.rate / 100) ** y, 2)}
            for y in range(p.years + 1)
        ]
        detail = "实际购买力=名义金额÷(1+固定通胀率)^年数；不含任何投资收益，负通胀代表通缩情景。"
    elif slug == "interest":
        r = p.rate / 100

        def price(y):
            return sum(50 / (1 + y) ** t for t in range(1, 6)) + 1000 / (1 + y) ** 5

        points = [{"year": y, "value": round(price(y / 100), 2)} for y in range(-2, 13)]
        return {
            "points": points,
            "value": round(price(r), 2),
            "explanation": "假设面值1000元、年息票50元、剩余5年，每年付息，到期还本；按输入收益率折现全部现金流。不考虑违约、税费和流动性。图横轴为收益率%。",
        }
    elif slug == "allocation":
        if p.stocks + p.bonds > 100:
            raise HTTPException(422, "股票与债券比例之和不能超过100%")
        cash = 100 - p.stocks - p.bonds
        for label, stock, bond in [
            ("温和增长", 8, 3),
            ("利率冲击", -12, -5),
            ("市场下跌", -25, 2),
        ]:
            ret = (p.stocks * stock + p.bonds * bond + cash * 1) / 100
            points.append(
                {"year": label, "value": round(p.principal * (1 + ret / 100), 2)}
            )
        detail = f"现金比例{cash}%。固定教学情景中股票/债券收益分别为8%/3%、-12%/-5%、-25%/2%，现金均为1%。这些是假设，不是预期收益或配置建议。"
    elif slug == "risk":
        returns = [[1, 1, 1, 1, 1], [3, -4, 6, -2, 4], [12, -20, 18, -15, 9]][p.choice]
        value = p.principal
        points = [{"year": 0, "value": value}]
        for i, r in enumerate(returns, 1):
            value *= 1 + r / 100
            points.append({"year": i, "value": round(value, 2)})
        detail = "这是固定的五期假设路径，不代表真实资产或概率分布。更剧烈的波动并不保证更高的最终收益。"
    elif slug == "crash":
        points = [
            {"year": "起点", "value": p.principal},
            {"year": "下跌20%", "value": p.principal * 0.8},
            {"year": "再涨20%", "value": p.principal * 0.96},
        ]
        detail = [
            "立即行动可能受情绪驱动。先核查资金用途、流动性与新信息。",
            "记录目标、风险承受范围与变化的信息，有助于形成自己的判断。",
            "为了回本加杠杆会扩大损失风险，应先理解杠杆机制。",
        ][p.choice] + " 下跌20%后需上涨25%才能回到起点；再涨20%仍低于起点4%。"
    else:
        detail = (
            {
                "fomo": [
                    "看到别人的收益就马上跟随，可能忽略选择性展示和自己的约束。",
                    "暂停并核查信息来源、风险和资金用途，有助于独立判断。",
                    "只收集盈利截图可能同时涉及从众与确认偏差。",
                ],
                "loss": [
                    "只围绕回本思考可能受到损失厌恶和锚定影响。",
                    "重新检查证据与风险约束，有助于区分情绪和事实。",
                    "为了追回损失扩大风险，可能使结果更不稳定。",
                ],
            }[slug]
        )[p.choice] + " 本实验仅用于自我反思，一次选择不能诊断稳定心理特征，也不构成买卖建议。"
        return {"points": [], "value": None, "explanation": detail}
    return {"points": points, "value": points[-1]["value"], "explanation": detail}
