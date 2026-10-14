# Gate B 产品图（B0 实施前契约）

2026-10-14。主任务书为用户新版执行包 01_GATE_B_MASTER_INSTRUCTION.md。A1/P0 checkpoint `26b9da5c739bd92372cff140acd91c41aaae0f2b`；78 后端测试、构建、24 分流案例与五尺寸浏览器检查通过。密钥模式与运行 Secret 扫描 441 文件无命中。旧页面保留，以下B0契约已按B1–B5实现；实际验证与限制见GATE_B_ACCEPTANCE.md。

```text
首页 /：问题查找（准确标题直达；其余建议）／三任务／精选／MiniLab／概念／真实继续
├─ 发现 /discover：杂志目录、分类、真实来源资料
│  ├─ /stories/budget → 预算专题 → 嵌入预算 → /money-lab/budget
│  ├─ /decoder/purchasing-power → 购买力专题 → /money-lab/inflation
│  ├─ /stories/bonds → 降息债券专题 → 内嵌债券模型（不是第六套顶层工具）
│  ├─ /stories/etf → ETF 专题 → /concept-studio
│  └─ /stories/loan → 贷款专题 → /money-lab/loan
├─ 财务工具 /money-lab：五套目录
│  └─ /money-lab/{savings,compound,inflation,loan,budget} → A/B → 保存 → /profile
├─ 学概念 /concept-studio：ETF 二维矩阵／案例／反馈／保存／复习
└─ 我的世界 /profile：真实手册／恢复／原有课程路线复习 /profile/history
右侧搜索 /search：专题、工具、概念、旧资料；问 Fin → 上下文 → /copilot 原会话
```

Decoder 与 Copilot 是详情与辅助空间，保持五项一级导航。移动四项：首页/发现/工具/我的。FinTalk 为相关讨论次级入口。

## 页面落点与数据责任

| 入口 | 落点与实际操作 | 数据源 | 成果及下一步 |
|---|---|---|---|
| 看懂一件事 | Discover 选专题；阅读、切换章节、动手、答题 | 原创内容、明确假设、官方来源 | 保存带来源、实验输入、章节的发现 → 手册恢复 |
| 算清一个问题 | 五工具目录；默认可算、修改、固定 A、比较 B、恢复 A | 后端确定性函数；前端只画结果 | 保存模型版本/参数/结果/A/B/笔记 → 恢复 |
| 弄懂一个概念 | ETF 矩阵与案例；错误解释与再次判断 | 已有 comparison/review 服务 | 概念发现及真实练习 → 手册/复习 |
| 首页 Mini Lab | 同一储蓄函数；带参数进入储蓄工作台 | 现有 savings 服务 | 保存实验；不是空介绍 |
| 搜索 / 自由问题 | 明确区分专题、工具、资料；保留原问题 | 站内真实目录 + 旧搜索 | 精确匹配直达；模糊/多主题由用户选择 |
| 问 Fin | 带专题或模型上下文；进入原 Copilot 会话 | 原 /chat 与 ChatSession | Demo 明示边界，不计算财务数值或虚构核验 |
| 我的世界 | 查看真实记录；按类型筛选；重新打开 | 新增可版本化成果记录 + 原课程/路线/反思 | 登录账户持久化，访客仅本浏览器 |

## 复用与兼容性

复用现有 savings Decimal、认证、ChatSession、ReadingState、ReviewItem/ReviewSession、SavedRoute、Reflection、LabRecord。旧实验 Reflection 依赖 Lab 外键，不适合保存原创专题/概念的任意版本化成果；新增一张账户成果表，唯一键 user_id + 客户端稳定记录键，实现幂等保存，绝不挪用/清空旧表。旧阅读状态不接受专题 slug，专题的阅读快照随其成果保存，旧 article/lesson 继续使用 ReadingState。

各批合入前验证对应核心旅程和真实截图；新增图解服务于具体内容，不替换 Hero/Fin。Home 下层入口可整合，主视觉、导航层级及字体配色冻结。
