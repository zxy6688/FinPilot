# FinPilot V3 Redesign · Gate A 人工验收包

> 历史记录：本轮 Gate A 后经人工视觉审查未通过。当前返工状态及证据以 [Gate A1 审查](GATE_A1_REVIEW.md) 为准；下文保留原轮次记录，不表示已获批准。

**AWAITING HUMAN GATE A REVIEW**。只完成 Gate 0 → Gate A；没有进入 Gate B/C/D，没有宣布完整产品 READY，没有部署。

## Git 与保护
- 本地和远端 v3 存在；基线及 HEAD 为 `aebfa7bc0ca53d6eaba046551cad0a8edc1ef1df`。
- 起始 working tree clean；本阶段改动留在 v3 工作区，未 commit / push。
- main `97908aacc74adaf8e8c1eb291d255a2feff1b289`；v2 `a3fa070a55a4d4efd0fa47e8e835e0da6e0581c2`。结束时两工作区 clean，远程哈希未变。
- 原数据库和旧前端/业务代码没有删除。只重启 V3 自己 PID 文件记录的进程；没有 V1/V2 进程操作。
- Gate 0 的复用清单和基线测试见 [GATE_0.md](GATE_0.md)。

## 可打开的本地网站
- 前端：http://127.0.0.1:5176/
- FastAPI health：http://127.0.0.1:8004/api/health
- Demo：demo@finpilot.app / demo123456。登录页 /login；未登录也能体验四个核心页面。
- 后台进程由现有 Start-FinPilot.ps1 启动，PID 保存在 tmp/local-runtime.json；日志位于 logs/local-backend.*.log 和 logs/local-frontend.*.log。
- SQLite 为 V3 自己的数据；AI health 显示 demo。现有 AI Copilot 入口保留，但本轮没有实现新工作区 AI 上下文扩展。

## 四条操作路线

| 页面 | 你可以实际做什么 | 数据性质 |
|---|---|---|
| [首页](http://127.0.0.1:5176/) | 改 Mini Lab 月存滑块 → 看到结果变化 → 进入完整工具；切换概念案例并作小判断；点击探索桌里的 Fin | Mini Lab 是真实 FastAPI 数学结果；插画图表为品牌示意；提问框只是明确规则分流，未知问题提供目标选择，不冒充 AI |
| [Decoder](http://127.0.0.1:5176/decoder/purchasing-power) | 切换概念事实/解释/未知 → 阅读时间线 → 把通胀从 3% 改为 0% → 做判断 → 写一句发现并保存 | 原创长专题；ECB 官方机制来源；所有金额、通胀假设均教学示例；实际计算复用已有通胀 API |
| [Money Lab](http://127.0.0.1:5176/money-lab) | 0% / 2% / 月初月末 → 固定方案 B → 改月存或期限 → 保存小票 → 我的世界 → 恢复参数并刷新 | 确定性后端计算；小票包含实际参数、结果、公式版本和保存时间；保存仅本浏览器 |
| [Concept Studio](http://127.0.0.1:5176/concept-studio) | 切换主动 ETF / 场外指数基金 → 比较两轴 → 先错选再正确选择 → 保存概念卡 | 原创教学案例；柱形仅示意，不是产品权重；登录时调用已有对照/复习后端；访客只显示反馈 |

[My World](http://127.0.0.1:5176/profile) 能查看真实保存的三类记录。清空浏览器数据会丢失原型记录。按 user.id / guest 分区；这不是服务器级私有存储或跨设备同步，勿用于敏感资料。旧账户记录仍可通过 /profile/history 访问。

## 已实现与阶段边界

已实现：
- 新编辑式首页，1440×900 首屏能看见三任务；390px 独立排版与四入口底栏；五专题入口、Mini Lab、概念练习、真实回访记录、发现手册。
- 一篇完整购买力专题：六节实质正文、来源/解释/不确定性分层、时间线、通胀实验、反馈与发现保存。
- 一个新储蓄工具：月初/月末、目标反推、达标月、零利率、高精度计算、双情景图表/表格、逐月明细、Receipt 恢复。
- 一套 ETF 形式 × 指数策略的操作图解，三种案例、针对性错误解释、已登录练习复用旧复习接口。
- Discover / Decoder / Money Lab / Concept Studio / AI Copilot / My World 六空间可触达；FinTalk 退为次级入口，数据未删。
- Fin 新统一 SVG 角色；三视、五表情、五动作关键姿态、32/64/192px、浅/彩背景、首页实际组合。Fin 可点击/Enter 打开抽屉，Tab 不逃逸，Esc 关闭，可安静。

尚未实现，必须等待批准：
- 五个专题全量深化；当前购买力为完整新专题，ETF 为完整概念互动，预算/债券/贷款为明确标记的实质导读和旧功能入口。没有假装五篇全部达到最终要求。
- 新预算、贷款等五工具整套计算内核/费用模型与全量测试；目前完整新工具只有储蓄，通胀/复利/债券复用旧能力。
- 新 Receipt / 发现的服务器持久化、跨设备同步、完整编辑/迁移；新 AI 上下文与全部记忆/Fin 事件系统整合。
- 全站旧深层页面的视觉统一、真机无障碍审计、性能和发布验收。

## 计算、来源与测试
- 模型：backend/app/services/savings.py，`POST /api/v3/tools/savings`。
- r = 年名义收益率 / 1200；n = 月数。月末 FV = P(1+r)^n + M((1+r)^n−1)/r；月初存入时月存项乘 (1+r)。r=0 时为 P+Mn。反推月存向上取到分；高精度 Decimal 保留过程，输出四舍五入到分。
- 不含税费、动态利率和负收益；不是贷款 APR 模型。输入：本金 0–1000 万、月存 0–10 万、期限 1–600 月、年名义率 0–30%、目标 1–1 亿。拒绝 NaN/Infinity/小数月数与额外字段。
- 独立数值：2000 + 500×24 = 14000（0%）；年名义率 12%、一期月末 2520、月初 2525；名义 10000、通胀 3%、三年实际购买力 9151.42。
- 78 pytest 全过：原 62 + 新 16。包含独立闭式公式、0%、时点差异、目标反推、期限与输入边界、API 验证。使用 D 盘临时目录解决 C 盘无剩余空间问题，未改测试来绕过。
- TypeScript + production build 通过。无新依赖安装。
- 浏览器报告：[browser-check.json](browser-check.json)；11 类检查，无 pageerror / console error / HTTP 失败。
- 手机独立实际操作报告：[mobile-check.json](mobile-check.json)；5 类完整流程通过。
- 375/390/430/768px 四核心页及 Notebook 无页面横向溢出；表格、专题横向列在各自容器滚动。
- 内容来源核对： [ECB 通胀机制](https://www.ecb.europa.eu/ecb-and-you/explainers/tell-me-more/html/what_is_inflation.en.html)、[Investor.gov 复利参数](https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator)、[Investor.gov ETF](https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-24)。原创示例不引用虚假当期数据，不转载全文。

## 真实截图与旧版对比

[全部截图索引](SCREENSHOTS.md)。四核心页均有桌面/390px 全页截图；首页额外含新用户、真实保存后的回访、桌面/手机首屏；还有 Notebook 和 Fin 角色设定图。截图由正常浏览器操作产生，不伪造记录。

相对旧 V3：去掉首页的大幅英文字体与淡线星图，换为明确中文任务、品牌探索桌和内容图解；从“浏览卡片”变为首页直接计算与判断；解读内容不止三个短段落；真实参数和 Receipt 相连；Fin 从水滴改为统一有轮廓的角色。

## 已知视觉与交互待审项

1. Fin 五动作目前是可切换静态关键姿态和轻量 hover 反馈，不是完整骨骼动画；3/4 侧面透视、体积与亲和程度请人工判断。
2. 新旧深层页面仍存在版式差异：旧课程、AI、旧实验详情本轮保留原布局；后续统一需另获阶段批准。
3. 390px 长专题与计算器需要纵向滚动，尚未实现正文阅读位置自动恢复；保存的发现跳到对应章节。真实手机键盘、Safari 尚未验收。
4. 关键错误提示和键盘抽屉已验证，但没有声称完成全站 WCAG 审计或所有极端数值的视觉测试。
5. 专题预算/贷款/债券的图片为教学示意；不冒充真实行情或历史事件图表。

## 请人工回答后再决定下一阶段

- 首页是否比旧版漂亮、饱满、清晰？
- 第一屏是否看得出看懂信息 / 动手计算 / 理解概念三个任务？
- Decoder 的内容、来源、图解与互动是否足够丰富？
- Money Lab 的计算、即时反馈与比较是否清楚有用？
- Concept Studio 是否真正帮助区分概念并解释错误？
- Fin 的统一造型、动作与主动交互是否满意？
- 手机体验是否完整，而非桌面的简单压缩？

**STOP：AWAITING HUMAN GATE A REVIEW。未经用户明确批准，不进入 Gate B。**
