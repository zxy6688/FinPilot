# FinPilot V3 产品方案

## 目标与边界

让用户的阅读、回想、概念辨认和实验反思形成可继续的学习过程。延用 V2 的真实知识关系、Evidence、BFS 与八个 Lab 模型，用更轻的界面呈现更完整的状态。V3 仅为本地产品与 GitHub 分支交付，NOT DEPLOYED。

## 一次完整的学习

1. 新用户在 Home 看到一个主动作和七个真实主题。五个初始方向通向实际学习路径。
2. 文章 / 课程保存阅读位置。术语点开释义；选中文字后才出现提问工具。课程仍需作答全部检查题才能记录完成。
3. 回答写入原有 QuizRecord，并同步 ReviewItem。读完文章仅产生接触证据，不直接算掌握。
4. 重复的、内容实际支持的错误模式出现 Compare 提示。一次错误只在内部记 suspected；不向用户展示“你有某种误解”的诊断。
5. Compare 答对后记 addressed。后续 Review 中正确辨认对应边界，才记 resolved。
6. 到期任务进入一次 2–4 题的专注复习；没有总分或排行榜。Daily Capsule 按北京时间一天一个，完成后不再要求打卡。
7. 学习两个相关主题后，只有两端都达到原 Evidence 的 established 状态，才保存真实关系的 UserConnection。
8. My World 展示自己的图、反思、收藏、路线和记忆。Fin 的细节随实际领域学习增长。

## Home 与 Today

首页保持 Today 一个、Continue 最多两个、Signal 一个。Hero 主按钮根据当前任务显示 Start / Continue / Resume route / Review。Today 优先最近的有效未完成阅读或路线，再看到期复习，之后沿用 V2 的下一课 / 基础探索。已完成课程不会因旧的阅读位置而继续占用任务位。My World 使用同一个 `/v3/home` 结果，避免入口互相矛盾。

## 阅读与现实材料

16 篇 EXPLAINER 在 V3 增加原创正文，围绕不同日常问题展开；12 份 REAL_WORLD 保留来源、日期（未注明则明确显示）和原文链接，只展示导读。Known / Missing concepts 由当前用户的 Evidence 判断，不伪造“你已经懂了”。Article Reader、Lesson 的进度与位置独立：进度单调增加，停留位置可以向前回看。

## 比较与记忆

四组 Compare：名义 / 实际回报、APR / APY、波动 / 风险、ETF / 指数基金。APR 在借贷披露中有费用口径，APY 在存款中包含复利影响；例子明确说明名义年率模型不是通用贷款 APR 换算。所有比较有例子、边界、快速辨认与原始参考链接。

只有课程 q3 的特定选项和 q34 的特定选项映射到相应边界；其他题不强行打标签。四组 Compare 的错误辨认也能产生对应复习与混淆状态。间隔为错误 1 天，连续正确依次 3 / 7 / 21 / 45 天；再次错误重置。

## 路线

SavedRoute 保存生成时的图与动作快照，不随另一日推荐变化而悄悄换步骤。路线有 3–7 步，按可用内容组合 Recall / Read / Connect / Compare / Experiment / Check。方向关系与无向回退继承 V2 说明，反向经过不被描述为反向因果。

Recall、Connect、Check 需要正确回答；Read 核查完成阅读；Compare 核查路线开始后的正确比较；Experiment 核查路线开始后的已保存反思。外出完成步骤后有返回路线链接，GET 路线 / Home 会检查真实记录推进。没有任意勾选完成的开关。

## 实验与 Notebook

预测与理由先写入 Reflection，未完成的预测可刷新恢复。调参数后点击运行，后端用原 `simulate()` 重新计算；对照使用明确的默认参数。金额实验比较模型终值方向，行为情景不作数值式对错评分。保存反思后才写入原有 LabRecord；重放保存不会新增第二条 LabRecord。Notebook 保留预测理由、输入、结果、对照、反思与日期。

## Fin 与 Moments

Fin 使用原创 SVG：圆润小体积、两只眼睛、不完整罗盘环。没有装扮商店、金币、积分或排行榜。calm / curious / thinking / bright / resting 反映是否有学习、是否到期复习及当前互动；完成第一节课由 seed 变为 awakened。

五领域的第一节已完成课程分别带来指南针、轨道、天线、棱镜、笔记本细节。数据库 CompanionState 保存领域与形态，显示层按实际 Evidence / 待复习状态计算心情。

十二类真实事件：FIRST_LESSON、FIRST_CONNECTION、FIRST_CORRECT_RECALL、MEMORY_RECOVERED、MISCONCEPTION_FOUND、MISCONCEPTION_RESOLVED、REAL_WORLD_MATCH、FIRST_PREDICTION、PREDICTION_MATCHED、FIRST_ROUTE_COMPLETE、DOMAIN_AWAKENED、TEN_CONNECTIONS_BUILT。`user + kind + event_key` 去重；一个登录 token 会话最多展示 1 个 major、2 个 medium。每次只展示一个，major 约 2 秒，所有记录都可在 Fin’s Corner 回看。旧学习记录首次在 V3 被识别时产生的记忆日期是识别日期，不伪造历史操作时刻。

## 内容与社区

Discover 使用一份主要 Signal、最多两篇相关解释、逐步展开的阅读目录和 Compare 入口。搜索覆盖文章、课程、主题、实验、讨论、Compare 与路线动作。FinTalk 延续真实发帖和评论；预置虚构讨论保留身份标记，没有新增伪造专家或 AI 观点。
