# FinPilot V1 — Content & Product Pass

完成日期：2026-09-29。项目位置：`D:\finpilot开发\v1`。保留 React + FastAPI + SQLite、全部已有路由与 8 个实验；本轮没有新增依赖，CSS 与实验计算实现经备份比对保持不变。

## 最终内容

| 项目 | 数量 |
|---|---:|
| Topic | 24 |
| 有方向与说明的 Topic Relation | 32 |
| Discover REAL_WORLD | 12 |
| Discover EXPLAINER | 16 |
| Learning Path | 5 |
| Markdown Lesson | 28 |
| Quiz | 64（每课 2–3 题） |
| 虚构 Community Persona | 8 |
| 示例 Community Post / Comment | 20 / 20 |
| Lab | 8 |

28 节课程正文为 700–775 个中文字，另有自测入口、两个 AI 问题、相关主题与下一步链接。课程覆盖定义、机制、生活例子、相似概念比较、学习意义、边界和至少两个误区。64 题有正确答案和解释；原有 32 题的 ID、题目与答案定义保留。

## 路径与课程顺序

- **Money Basics / 第一次理解钱与金融**（5 节）：钱与购买力：余额之外的价值 → 通胀：从一篮子商品理解物价 → 复利：时间、投入与费用怎样累积 → 风险与收益：潜在回报不是承诺 → 机会成本：每个选择都放弃了什么。
- **Personal Finance / 管理好自己的钱**（5 节）：预算：给必要支出和目标留位置 → 应急资金：让突发支出有缓冲 → 储蓄与投资：先区分用途和不确定性 → 债务与利息：借来的钱要看总成本 → 财务目标与期限：把愿望变成可检查的安排。
- **Investment Basics / 投资到底是什么**（8 节）：股票：价格背后是一部分所有权 → 债券：现金流、价格与收益率 → 基金：买到的不是经理的承诺 → 指数：读懂规则，才能读懂涨跌 → ETF：交易形式之外，还要看持仓 → 分散化：数量之外，要看共同风险 → 资产配置：比例必须放回目标中理解 → 费用：小比例为什么会留下长期差异。
- **Understand Markets / 理解市场如何运行**（5 节）：央行与货币政策：读懂传导而非猜涨跌 → 利率：资金价格怎样连接今天与未来 → 汇率：跨境价格怎样传到生活里 → 经济周期：看变化，也看统计口径 → 估值与市场预期：数字为什么不是答案。
- **Behavioral Finance / 为什么我们会做出非理性决策**（5 节）：从众效应：人数不能代替证据 → FOMO：把错过焦虑变成可检查的问题 → 损失厌恶：回本愿望不能替代新证据 → 锚定效应：先看到的数字有多大影响 → 确认偏差：给反对证据留一个位置。

## 模块和维护位置

- `content/catalog.json`：主题、32 条有向关系和五条路径；保留旧 ID，个人金融路径新增为 ID 5。
- `content/lessons.json`、`content/lessons/01.md` 至 `28.md`、`content/quizzes.json`：课程元数据、正文与题库。
- `content/articles.json`、`content/source-audit.json`：28 条内容与逐条官方来源核验记录。原创解释不附假来源、假发布日期。
- `content/topic-aliases.json`：24 个主题的中文口语、缩写与英文别名。
- `content/labs.json`：八个实验的探索目标、观察提示、解释和模型边界；风险实验连接新课 17，配置实验连接新课 25。
- `content/community.json`：八种学习背景、20 篇独立讨论及对应回复。虚构身份显示在作者元数据中；随机密码的虚构账户不作为体验登录账户。
- `backend/app/models.py`、`seed.py`：轻量字段和版本化导入；`api/routes.py`：类型筛选、多主题聚合、有向关系、作者身份及关联主题搜索。
- `backend/app/ai/provider.py`：别名匹配、未知问题澄清、新课程正文提取与三种下一步入口；`services/learning.py`：北京时间 streak 和按当前路径计算徽章。
- `frontend/src/types.ts`、`components/ui.tsx`、`pages/Learning.tsx`、`Lab.tsx`、`Community.tsx`、`Account.tsx`：内容标签、来源空日期、主题关系、实验边界、虚构作者与学习足迹说明。布局骨架与 CSS 保留。
- `backend/tests/test_core.py`：更新数量与路径进度预期；`test_content.py`：三个集中测试覆盖新增内容、别名/未知问题、北京时间与重复 Seed 保留数据。
- `scripts/Check.ps1`：测试临时目录使用本次运行编号，避开旧目录权限/占用；`browser-check.mjs` 同步页面文案；`content-browser-check.mjs` 验收本轮内容。

## AI Demo 匹配规则

四种模式仍为 tutor / explain / guide / coach。中文按词组匹配，英文不区分大小写且检查单词边界；最长命中词组优先，再考虑命中数量，减少“指数基金”被“基金”或“指数”截走的问题。这是可检查的规则匹配，不是语义模型。

- 宽基、指数基金、ETF → ETF；降息、加息 → 利率；到期收益率 → 债券。
- 别人都在买、涨了很多想追、怕错过 → FOMO。
- 不想认亏、害怕亏钱、跌了想卖 → 损失厌恶；大家都买 → 从众。
- 未命中时明确要求补充概念或情景，提供浏览、学习、实验的通用入口，不再默认解释钱与购买力。
- 命中后连接实际 Topic、课程和关联实验；没有直接实验的主题使用明确的教学关联。每次仍显示“继续理解 / 加入学习 / 去实践”三个动作。
- 无 Key 使用课程内容生成的 Demo 回答；远程适配器的成功与失败回退经过 mock 测试，没有宣称调用了真实付费模型。

## 数据库兼容

新增 `topic_relations` 和 `content_revisions` 表。新增字段：Article 的 `content_type/source_kind/topic_ids`；Lesson 的 `topic_ids/ask_prompts`；Lab 的 `educational_notes`；User 的 `is_seed_persona/learner_label`；Post、Comment 的可空唯一 `seed_key`。使用 SQLite 的加列与建表，不引入迁移框架。

`seed()` 读取内容版本 `content-product-2026-09-29`：本版本只导入一次，提交后再次运行跳过内容更新。核心内容按稳定 ID 更新；只替换能够识别的旧示例帖子和示例回复，用户自己的内容保留。新的示例帖子用 seed_key 标记，不抢占用户已经使用的 ID。版本导入在一次事务内完成；加列可重复执行。

正式库 `data/finpilot.db` 已完成更新，外键检查无错误。更新前备份保存在 `tmp/content-pass-backup/finpilot-before.db` 和 `source-before.zip`。迁移副本中额外插入用户、课程进度、答题、收藏、帖子（故意使用 ID 13）、真实回复、实验记录与历史对话，更新两次后逐项比对均保留；旧 32 题完整保留。

课程后续修改仍用 `scripts/sync-content.py` 导入 Markdown；修改 JSON 后需有意识地创建下一内容版本并先在副本验证。当前自动加列流程面向 SQLite，未测试 PostgreSQL 迁移。

Profile 的六领域数值仍由课程完成与最近自测结果计算，文案明确是站内学习足迹，不评估投资能力或风险承受能力。连续学习日按北京时间 UTC+8 计算，保留当天未学习时延续昨日的原有规则。

## 来源与取舍

以下页面在本轮打开并核对对应主题与正文；日期只记录能确认的页面发布日期，空值在界面显示“页面未标注发布日期”。REAL_WORLD 包含历史事件、统计解读和官方教育资料，不将历史政策写成最新消息。仅保存 URL、原创摘要与学习意义，不缓存原文或图片。

| 内容 | 来源类型 | 页面日期 | 官方原文 |
|---|---|---|---|
| 美联储2025年9月决议：理解政策动作与风险判断 | 官方决议 | 2025-09-17 | [Federal Reserve](https://www.federalreserve.gov/newsevents/pressreleases/monetary20250917a.htm) |
| 欧洲央行2025年6月决议：政策判断还看哪些条件？ | 官方决议 | 2025-06-05 | [European Central Bank](https://www.ecb.europa.eu/press/pr/date/2025/html/ecb.mp250605~3b5f67d007.en.html) |
| 日本银行2025年1月决议：货币市场操作目标是什么？ | 官方决议 | 2025-01-24 | [Bank of Japan](https://www.boj.or.jp/en/mopo/mpmdeci/state_2025/k250124a.htm) |
| 国家统计局解读2025年统计公报：总量、结构与人均指标 | 统计解读 | 2026-02-28 | [国家统计局](https://www.stats.gov.cn/sj/sjjd/202602/t20260228_1962663.html) |
| 世界银行Global Findex 2025：金融服务与储蓄行为 | 研究发布 | 2025-07-16 | [World Bank](https://www.worldbank.org/en/news/press-release/2025/07/16/mobile-phone-technology-powers-saving-surge-in-developing-economies) |
| 上交所ETF知识：从交易、指数和基金三个角度理解 | 官方投教 | 2022-06-23 | [上海证券交易所](https://etf.sse.com.cn/fund/learning/knowledge/c/5704301.shtml) |
| Investor.gov ETF指南：交易价格、净值与风险 | 官方投教 | 未标明 | [SEC / Investor.gov](https://www.investor.gov/introduction-investing/investing-basics/investment-products/mutual-funds-and-exchange-traded-2) |
| Investor.gov资产配置指南：分散不只是增加数量 | 官方投教 | 未标明 | [SEC / Investor.gov](https://www.investor.gov/introduction-investing/getting-started/asset-allocation) |
| SEC费用说明：长期成本如何影响剩余金额 | 官方投教 | 2025-07-23 | [SEC / Investor.gov](https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins/updated) |
| 欧洲央行解释通胀：为什么要看消费篮子？ | 官方投教 | 未标明 | [European Central Bank](https://www.ecb.europa.eu/ecb-and-you/explainers/tell-me-more/html/what_is_inflation.en.html) |
| SEC指数基金公告：跟踪目标为何不等于相同结果？ | 官方投教 | 2018-08-06 | [SEC / Investor.gov](https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-26) |
| Investor.gov债券问答：风险不止违约一种 | 官方投教 | 未标明 | [SEC / Investor.gov](https://www.investor.gov/introduction-investing/investing-basics/investment-products/bonds-or-fixed-income-products/bonds) |

没有加入的候选内容：

- 中国人民银行2025年5月政策新闻：本轮未取得可可靠打开并核对的具体官方页面，未添加数值或编造URL。
- 2025年统计公报正文页面：正文直连工具返回错误，改收录可以打开的国家统计局官方评读，并明确标为统计解读。
- 上交所2019年ETF修炼手册：该候选页直接打开失败，改用已成功核验的2022年具体知识页。
- IMF基础知识档案页：档案页打开失败，且不是需要的具体内容页，未收录。

## 验收结果

- `scripts/Check.ps1`：25 项后端测试通过；Python 编译与应用导入通过；TypeScript typecheck 和 production build 通过。
- 测试有一条现有 Starlette/httpx 弃用提示，不影响通过；本轮未为消除提示更换依赖。
- 独立空库 Seed、正式旧库更新、迁移副本重复导入均通过。
- `docs/content-migration-check.json`：两次更新、九类用户记录保留、32 道旧题保留、用户帖子 ID 冲突保留、外键无错误。
- `docs/content-api-smoke.json`：12 个只读 API 请求通过、正式库内容计数、外键检查、占位符扫描及实验公式与备份一致。
- `docs/browser-check.json`：11 项原有端到端场景通过，包括注册、自测、学习完成、AI、八个实验保存、发帖互动、搜索和移动端。
- `docs/content-browser-check.json`：6 项本轮内容场景通过，包括 12/16 分类和对应来源、五路径和新课、有向关系、虚构帖子与回复身份、实验边界及手机端溢出检查。
- 截图保存在 `docs/screenshots/`；本轮检查了手机首页与桌面主题关系的渲染结果。

浏览器测试使用独立 `tmp/content-pass/browser.db`，测试用户与测试讨论没有写入正式库。本轮未进行服务器部署或第二轮视觉精修。
