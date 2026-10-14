# FinPilot V3 Redesign · Gate B 人工验收入口

**GATE B READY FOR HUMAN REVIEW**。这是本地实现与检查完成状态，不代表用户已认可新增页面视觉，也不代表整个V3最终完成。

本地首页：http://127.0.0.1:5176/

后端健康：http://127.0.0.1:8004/api/health

公开Demo：`demo@finpilot.app` / `demo123456`。AI当前Demo。网站进程独立后台运行，日志和PID在本地logs/tmp，不放入源码ZIP；关机后需重新启动。

## 简洁验收表

| 范围 | 实现状态 | 从哪里进 / 能做什么 | 保存后去哪里 | 证据 |
|---|---|---|---|---|
| Home与导航 | 已实现 | `/`问题查找、三任务、Mini Lab、精选、继续；五一级导航 | `/profile`发现手册 | routing/checks.json、b5、手机闭环 |
| 预算 | 已实现 | `/stories/budget`分类/维修/比较；`/money-lab/budget`自定义项目、结余与缺口 | 专题发现/实验小票→恢复 | b1、final、mobile-journey |
| 购买力 | 已实现 | `/decoder/purchasing-power`六节专题、误区、可调实验；`/money-lab/inflation`名义/实际曲线 | 笔记/模型快照→重算 | b2、final、mobile-journey |
| 贷款 | 已实现 | `/stories/loan`现金流解读；`/money-lab/loan`还款方式、费用、期限、A/B | 全部模型参数/还款快照→恢复 | b3、final、mobile-journey |
| 债券 | 已实现 | `/stories/bonds`政策/市场/预期、价格曲线、久期、判断题 | 专题输入/答题/笔记→恢复 | b4、final |
| ETF与概念 | 已实现 | `/stories/etf`机制/费用/风险；`/concept-studio`二维矩阵、三案例、反馈 | 专题发现/概念卡→同案例 | b4、final |
| 储蓄 | 已实现 | `/money-lab/savings`目标反推、月初/月末、名义/有效、A/B | Money Receipt→恢复 | 原模型测试、final |
| 复利 | 已实现 | `/money-lab/compound`年名义/有效、频次、时间曲线与A/B | 小票→恢复 | b2、final |
| Discover | 已实现 | `/discover`五专题杂志目录、分类/搜索/空态/来源 | 进入真实专题与后续工具 | b5 |
| My World | 已实现 | `/profile`真实记录、笔记、类型筛选、重新打开；`/profile/history`旧学习数据 | 保留记录所有权与原输入 | 账户新浏览器恢复、归属测试 |
| Fin / AI Copilot | Demo已实现，外部模型本轮未实测 | 问Fin带页面与实验输入，后端核算；`/copilot`接同一会话 | 原ChatSession | b5、final、上下文API测试 |
| 旧课程/路线/复习/FinTalk | 保留并可达 | 原路由、原数据服务，无删除 | 原保存与阅读机制 | 14条旧路由浏览器回归 |

本表“已实现”指功能行为与本轮自动/实际浏览器验证，不替代人工视觉批准。

## 测试结果与实际证据

- 后端全量113 passed；新Gate B数学/持久化/上下文35项，原78项一起通过。警告仅为Starlette TestClient/httpx弃用提示。
- TypeScript和production build通过。Vite提示主JS包超过500kB：功能不阻塞，但公开发布前应继续评估拆包与加载性能；未隐藏警告。
- 原24问题分流：实际浏览器路径、混合/未知/空输入、原问题保留、无自动聊天提交；五尺寸布局通过。
- B1–B5真实浏览器检查均有JSON；五工具新浏览器账户恢复、三专题答题恢复、贷款/购买力手机恢复、390px完整预算学习链已独立补验。
- 保存失败不显示成功，重试保留输入；同ID不同用户404，重复同快照幂等，修改内容同键409。
- 截图索引、分辨率、文件哈希及测试时间以 `gate-b/validation.json` / `SCREENSHOTS.md` 为准。

## 保存机制与明确限制

登录记录保存在当前V3后端SQLite，使用user_id隔离。另一浏览器登录同一后端账户可恢复，已用全新浏览器上下文实测。当前服务器没有部署，不能将localhost称为已上线云端服务；从另一台设备访问需要另行授权网络配置。

访客记录只在本浏览器localStorage；同一标签页临时参数使用sessionStorage，不是跨设备存储。登录不会自动上传访客草稿。A1既有账户对应的本机记录继续可读，并标记“仅此浏览器”。保存快照不可变；改参数保存生成新内容ID。不存在的记录显示提醒，不冒充恢复成功。

专题记录保存来源、章节、笔记与实验输入/答题；工具小票保存原结果、比较情景、模型版本并在打开时重算。阅读位置复用ReadingState；没有将滚动行为宣称为掌握程度。未保存临时输入不是账户私密笔记，公共设备使用后应退出并关闭标签页。

## 部分实现 / 未在本轮完成

- AI Demo可以解释既有内容和模型；外部LLM适配保留，但本轮未配置真实Key，不宣称验证在线模型质量或实时新闻核验。
- 已验证Chromium桌面和响应式视口；物理手机软键盘、Safari/Firefox和辅助技术专项未实测。
- 债券模型为年付固定票息教学模型；贷款为规则月供教学模型，不是所有金融合同的精算器；具体边界见公式文档。
- 没有新增公开部署、DNS/HTTPS、安全组、生产数据库迁移发布、自动备份服务；均不属于本轮授权。

## P0/P1与Gate C

本轮检查未留下已知阻断核心流程的P0。待人工确认项：新专题密度、插画协调、图表易读性、移动操作体验。发布前P1：主包性能与更多浏览器/真机验收。

Gate C仅在用户明确授权后讨论：消化Gate B人工反馈、生产级运行/监控/备份及访问策略、外部AI配置与质量评估（若需要）、进一步兼容性与可访问性验证。不能以Gate C名义隐藏本轮未通过问题。

代码与表结构：[GATE_B_CHANGES.md](GATE_B_CHANGES.md)。内容/来源：[GATE_B_CONTENT_MANIFEST.md](GATE_B_CONTENT_MANIFEST.md)。公式：[GATE_B_TOOL_FORMULAS.md](GATE_B_TOOL_FORMULAS.md)。视觉对照：[GATE_B_VISUAL_REGRESSION.md](GATE_B_VISUAL_REGRESSION.md)。具体旅程：[GATE_B_USER_JOURNEYS.md](GATE_B_USER_JOURNEYS.md)。

**交付后暂停：不自动push、不部署、不进入Gate C。main/v2保持原提交与干净工作区。**
