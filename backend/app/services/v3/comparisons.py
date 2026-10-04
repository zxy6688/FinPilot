"""Editorial comparisons: strategy vs wrapper; borrowing APR vs deposit APY."""
COMPARISONS = {
    'nominal-real': {
        'id': 'nominal-real', 'title': '名义回报与实际回报', 'english': 'Nominal / Real', 'topic_id': 2,
        'left': {'title': '名义回报', 'definition': '账户金额增长的比例，还没有扣除同期物价上涨。', 'question': '钱的数字变大了多少？'},
        'right': {'title': '实际回报', 'definition': '用购买力衡量的回报，需要考虑同一时期的通胀。', 'question': '这些钱能多买多少东西？'},
        'example': '一年名义回报 5%，同期通胀 3%，实际回报为 1.05 ÷ 1.03 − 1 ≈ 1.94%。直接相减得 2% 是低利率下的近似；这里只考虑通胀，没有计入税费。',
        'boundary': '通胀使用哪一种价格指数、计算哪个时期，会影响结果。个人的支出篮子也可能不同于总体指数。',
        'question': '存款金额增长 3%，同期价格上涨 5%。购买力怎样变化？', 'options': ['增加 3%', '减少约 1.90%', '没有变化'], 'correct': 1,
        'explanation': '1.03 ÷ 1.05 − 1 ≈ −1.90%。余额增加与购买力减少可以同时发生。',
        'source': 'ECB · What is inflation?', 'url': 'https://www.ecb.europa.eu/ecb-and-you/explainers/tell-me-more/html/what_is_inflation.en.html',
    },
    'apr-apy': {
        'id': 'apr-apy', 'title': 'APR 与 APY', 'english': 'Cost / Compounding', 'topic_id': 3,
        'left': {'title': 'APR', 'definition': '在借贷披露中表示年化借款成本，通常包含利息及规定应计入的部分费用；定义依司法辖区与产品而异。', 'question': '借款一年承担怎样的年化成本？'},
        'right': {'title': 'APY', 'definition': '存款披露中的年收益率，将规定期间的复利效果纳入年化收益。', 'question': '利息再计息后，一年的收益率是多少？'},
        'example': '仅讨论没有费用、每月按名义年利率 12% ÷ 12 计息的存款：APY = (1 + 0.12 ÷ 12)¹² − 1 ≈ 12.68%。这不是将任意贷款 APR 换算为存款 APY 的通用公式。',
        'boundary': '比较前先确认是借贷还是存款，再核对计息频率、费用与披露口径。不能因为两个数字都写“年化”就直接排序。',
        'question': '看到贷款 APR 12% 与存款 APY 12%，应先做什么？', 'options': ['认定收益抵消成本', '比较产品、费用与计息口径', '认定 APR 必然更划算'], 'correct': 1,
        'explanation': '两者衡量的对象和披露口径不同。还需核对现金流、费用和计息条件，不能只看 12%。',
        'source': 'CFPB · APR / Truth in Savings APY', 'url': 'https://www.consumerfinance.gov/ask-cfpb/what-is-the-difference-between-a-mortgage-interest-rate-and-an-apr-en-135/',
        'extra_source': 'https://www.consumerfinance.gov/rules-policy/regulations/1030/a/',
    },
    'volatility-risk': {
        'id': 'volatility-risk', 'title': '波动与风险', 'english': 'Movement / Consequences', 'topic_id': 21,
        'left': {'title': '波动', 'definition': '价格或收益在一段时间内变动的程度，是风险分析中的一个维度。', 'question': '价格变化有多大？'},
        'right': {'title': '风险', 'definition': '实际结果偏离目标的可能性与后果，还包括信用、流动性、购买力以及资金期限不匹配等。', 'question': '什么情况会妨碍我的目标？'},
        'example': '半年后要交的学费，即使某资产长期平均收益较高，也可能在缴费时下跌或难以卖出。另一资产报价很少变化，也不意味着发行人没有违约风险。',
        'boundary': '波动高低不能替代资金用途、期限和损失承受能力的判断。这里是概念比较，不提供资产推荐。',
        'question': '一项资产很少更新报价，能否据此断定风险低？', 'options': ['能，价格不变就是安全', '不能，还要看信用与流动性', '能，只要历史收益稳定'], 'correct': 1,
        'explanation': '观察不到价格变化，不代表能随时卖出或一定收回本金。',
        'source': 'Investor.gov · Risk', 'url': 'https://www.investor.gov/introduction-investing/investing-basics/what-risk',
    },
    'etf-index-fund': {
        'id': 'etf-index-fund', 'title': 'ETF 与指数基金', 'english': 'Wrapper / Strategy', 'topic_id': 7,
        'left': {'title': 'ETF', 'definition': '一种可在交易所盘中买卖的基金形式。它可以跟踪指数，也可以采用主动管理策略。', 'question': '基金以什么形式交易？'},
        'right': {'title': '指数基金', 'definition': '以跟踪某个指数为目标的基金策略。可以采用 ETF，也可以采用其他基金形式。', 'question': '基金以什么策略投资？'},
        'example': '跟踪宽基指数的 ETF 同时属于两类；主动管理的 ETF 不必是指数基金；不在交易所盘中交易的指数共同基金也不是 ETF。两类是交叉关系。',
        'boundary': 'ETF 交易价格可能偏离净值，指数基金也有费用与跟踪误差。“指数”不等于保本，“可交易”不等于任何时候都有充足流动性。',
        'question': '下面哪一句正确？', 'options': ['所有 ETF 都跟踪指数', '指数基金必须是 ETF', 'ETF 是形式，指数跟踪是策略'], 'correct': 2,
        'explanation': '交易形式与投资策略是两个维度，二者有交集但不等同。',
        'source': 'Investor.gov · ETFs / Index funds', 'url': 'https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-24',
    },
}
# Only options whose wording actually supports the interpretation are tagged.
OPTION_TAGS = {(3, 0): 'nominal-real', (34, 0): 'volatility-risk'}


def public_compare(c):
    return {k: v for k, v in c.items() if k not in ('correct', 'explanation')}
