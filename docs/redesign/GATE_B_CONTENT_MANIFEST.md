# Gate B：五专题与关联内容清单

更新：2026-10-14。中文正文、案例、练习反馈均为原创教育内容；不转载外部文章。不含实时行情或虚构近期政策新闻。以下官方页面是机制与概念依据，案例金额、利率与场景另行标明为假设。

| 专题 / 入口 | 内容、图解和实际操作 | 成果与关联 | 插画 |
|---|---|---|---|
| 大学生的第一份预算 `/stories/budget` | 2500元生活费案例；固定/弹性/一次性分类；储备与消费区别；自定义项目、600元维修、支出环图、A/B、两道即时反馈题、来源与反思 | 专题发现含章节/答题/实验输入；完整预算工具保存结果 → 手册 | gate-b/budget-studio.png |
| 存钱为什么不等于购买力不变 `/decoder/purchasing-power` | 保留六节原专题与篮子图解；名义/实际区分、基期、误区、可调通胀/名义增长/年限、双曲线与实际收益解释 | 保存笔记和实验结果；带参数进入通胀工具、回到实验；延伸储蓄 | 原有 PurchasingArt、A1读者布局 |
| 从一次降息读懂债券 `/stories/bonds` | 明确假设的25bp政策与50bp预期情景；政策→市场→价格图；票息、价格、市场收益率、预期、久期；价格曲线与三情景；即时反馈题 | 保存来源、输入、笔记、答题；关联购买力/概念 | gate-b/bonds-studio.png |
| ETF 究竟是什么 `/stories/etf` | 原二维矩阵与三案例；一级申赎/二级交易切换；折溢价；费用/跟踪差异/跟踪误差；风险判断题；基金策略和交易形式交叉 | 专题发现；Concept Studio保存同一案例和答题；原有复习继续可用 | gate-b/etf-studio.png，保留原矩阵 |
| 一笔贷款到底要还多少钱 `/stories/loan` | 面额/净到账/利息/费用；等额本息与本金；期限取舍；现金流与还款图表、完整表格；零名义有费用误区；限制与反馈 | 保存专题发现；完整贷款工具保存A/B及现金流 → 手册 | gate-b/loan-studio.png |

素材路径均相对 `frontend/public/redesign/`。不是金融事件照片。Fin、首页主场景与角色图谱未替换。

## 可核验来源

- 预算：[CFPB Your Money, Your Goals](https://www.consumerfinance.gov/consumer-tools/educator-tools/your-money-your-goals/toolkit/)、[CFPB cash flow budget 2021 PDF](https://www.consumerfinance.gov/documents/10038/cfpb_creating-cash-flow-budget_tool_2021-08.pdf)。引用教育方法，不把美国案例当成国内开销统计。
- 购买力：[ECB What is inflation?](https://www.ecb.europa.eu/ecb-and-you/explainers/tell-me-more/html/what_is_inflation.en.html)。解释物价机制，不提供当期通胀率。
- 债券：[ECB monetary transmission](https://www.ecb.europa.eu/mopo/intro/transmission/html/index.en.html)、[Investor.gov Bonds](https://www.investor.gov/introduction-investing/investing-basics/investment-products/bonds-or-fixed-income-products/bonds)。不把政策利率与债券收益率混同。
- ETF：[Investor.gov ETF bulletin](https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-24)、[Investor.gov Index Funds](https://www.investor.gov/introduction-investing/investing-basics/investment-products/mutual-funds-and-exchange-traded-4)。结构/策略/风险，不推荐产品。
- 贷款：[CFPB interest rate vs APR](https://www.consumerfinance.gov/ask-cfpb/what-is-the-difference-between-a-mortgage-interest-rate-and-an-apr-en-135/)。用于说明利率与费用不同；本站 IRR 复合年化不宣称等于某司法辖区的监管APR。

Gate B 工作中核对上述官方资料；最终核对日期2026-10-14。原购买力页保留原编辑日期，不将日期包装成最新新闻。

## 内容与数据类型

1. 官方概念依据：有具体来源链接。
2. 教育解释：本站原创推理与图解。
3. 教学假设：生活费、贷款、收益、债券政策情景均明确标记。
4. 模型输出：由用户输入计算，注明版本/口径/范围。
5. AI：当前 Demo 仅基于站内已支持材料；联网核验任意新闻、实时行情不属于实现能力。

## 复用源码

正文：Stories.tsx、Decoder.tsx、Bonds.tsx、Etf.tsx、Loan.tsx；可复用工具：MoneyLab.tsx、TimeTools.tsx、Experiments.tsx、Loan.tsx；矩阵：ConceptStudio.tsx。Discover/Catalog 与全站搜索仅链接实际路由。旧课程、路线、知识网络、复习、FinTalk 保留，不复制为新空页面。
