"""Context adapter on the existing chat engine. Never trust client result numbers."""
import json
from fastapi import HTTPException
from pydantic import ValidationError
from ..services.redesign_catalog import STORIES
from ..services.finance import BudgetInput, budget, CompoundInput, compound, InflationInput, inflation, LoanInput, loan, BondInput, bond
from ..services.savings import SavingsInput, savings

TOOLS={101:("savings","储蓄目标规划",SavingsInput,savings),102:("compound","复利与时间",CompoundInput,compound),103:("inflation","通胀购买力",InflationInput,inflation),104:("loan","贷款实际成本",LoanInput,loan),105:("budget","个人预算",BudgetInput,budget),106:("bond","债券定价",BondInput,bond)}
async def redesign_answer(ctx,message,history,remote,system):
    result=None
    if ctx.source_id in TOOLS:
        slug,title,cls,calculate=TOOLS[ctx.source_id]
        url="/stories/bonds#experiment" if slug=="bond" else "/money-lab/"+slug
        try:result=calculate(cls(**(ctx.tool_inputs or {})))
        except (ValidationError,ValueError):raise HTTPException(422,"当前工具参数无效，请返回实验检查输入")
        summary={k:v for k,v in result.items() if k not in ("points","schedule","categories")}
        body=f"## 你正在看：{title}\n下面只解释已有模型的口径，不是对任意问题的智能解答。\n\n{result['assumptions']}\n\n请回到工具比较参数和图表；我不会重新猜测、承诺或用语言模型计算这些金额。"
        material={"verified_model":summary}
    elif ctx.source_id in STORIES:
        slug,title,url=STORIES[ctx.source_id]
        explanations={"budget":"先分开实际支出和计划储备；结余为收入减支出，储备目标缺口并不等于已经超支。", "purchasing-power":"名义金额与实际购买力不同；实际价值需要按物价变化折算。", "bonds":"政策利率、市场收益率与债券价格不能直接画等号；要固定现金流和其他条件再讨论反向关系。", "etf":"ETF 是交易形式，指数跟踪是投资策略；两者相交而非等同。", "loan":"净到账、逐期付款和费用时点共同决定有效成本；工具不是监管 APR 披露器。"}
        body=f"## 你正在读：{title}\n{explanations[slug]}\n\n当前 Demo 只能解释这条已有学习线索，无法核验你任意输入的新闻、个人建议或外部材料。若问题超出此范围，请回到专题核对来源或补充具体困惑。"
        material={"editorial_explanation":explanations[slug],"selected_text_unverified":ctx.selected_text}
    elif ctx.source_id==201:
        title,url="ETF 二维分类", "/concept-studio"
        body="ETF 回答交易形式，指数策略回答如何选择组合。主动 ETF 与场外指数基金分别是两个方向的反例。当前 Demo 提供固定概念说明，不能评价具体基金；一次答对也不等于完全掌握。"
        material={"explanation":body,"selected_text_unverified":ctx.selected_text}
    else:raise HTTPException(404,"学习上下文不存在")
    context={"source_type":"redesign","source_id":ctx.source_id,"title":title,"action":ctx.action,"selected_text":ctx.selected_text}
    if ctx.tool_inputs is not None:context["tool_inputs"]=ctx.tool_inputs
    # Same configured provider, sessions and fallback as all existing Copilot modes.
    live,status=await remote([{"role":"system","content":system+"\n仅解释以下已核验模型/站内材料。不要自行数学计算、伪造出处或声称查过实时数据："+json.dumps(material,ensure_ascii=False)}]+history[-10:]+[{"role":"user","content":message}])
    return {"content":(live or body)+"\n\n金融教育用途，不提供投资或借贷产品建议。", "provider":status,"actions":[{"label":"回到上下文","title":title,"url":url},{"label":"查看成果","title":"我的发现手册","url":"/profile"}],"context":context}
