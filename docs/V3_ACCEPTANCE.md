# FinPilot V3 Acceptance

本地验收完成日期：2026-10-05（Asia/Shanghai）。本轮交付不包含服务器部署：**NOT DEPLOYED**。

基线：`origin/v2` / `a3fa070a55a4d4efd0fa47e8e835e0da6e0581c2`。独立 `v3` 分支与 `D:\finpilot开发\v3` 工作区。

## Executed checks

| 检查 | 结果 | 证据 |
| --- | --- | --- |
| pytest | 62 passed；原 V1/V2 42 + V3 20 | `python -m pytest backend/tests -q`；[质量记录](v3-quality-check.json) |
| API smoke | 42 checks passed | [v3-api-check.json](v3-api-check.json) |
| TypeScript | passed | `npm run typecheck --prefix frontend`，build 也包含 tsc |
| Production build | passed | `npm run build --prefix frontend`；未提交 dist |
| Gate A | passed | [v3-gate-a-check.json](v3-gate-a-check.json) |
| Gate B | passed | [v3-gate-b-check.json](v3-gate-b-check.json) |
| Gate C | passed | [v3-gate-c-check.json](v3-gate-c-check.json) |
| 完整学习闭环 | 9 类检查 passed | [v3-journey-check.json](v3-journey-check.json) |
| 手机实际操作 | 8 类检查 passed | [v3-mobile-check.json](v3-mobile-check.json) |
| 键盘 / 选区 / 错误恢复 | 6 类检查 passed | [v3-interaction-check.json](v3-interaction-check.json) |
| V1 数据副本兼容 | 23 张旧表、289 行不变；新增 9 表 | [v3-compatibility-v1.json](v3-compatibility-v1.json) |
| V2 数据副本兼容 | 23 张旧表、497 行不变；新增 9 表 | [v3-compatibility-v2.json](v3-compatibility-v2.json) |
| 发布文件检查 | 未发现 .env / DB / 依赖 / 私钥进入发布文件；常见 credential pattern 无命中 | [v3-quality-check.json](v3-quality-check.json) |

pytest 有一条非失败警告：现有 Starlette TestClient 对 httpx 的弃用提示。当前测试全部通过；本轮不为消除提示升级基础依赖。文件路径 / pattern 检查不是正式安全审计。

## Browser journey actually exercised

新注册账户完成第一课的检查题并记录完成 → Home 真实节点点亮与 Fin awakened → Article 阅读滚动并刷新回到相同位置 → Glossary 打开 / Escape 关闭 → 读完记录 → 同一题重复混淆 → Compare 提示与正确辨认 → 短 Review → misconception resolved → 创建路线并刷新 → 逐步完成 Recall、Read、Connect、Compare、Experiment、Check → Route completed → 两个主题的真实课程与测验记录解锁关系 → My World / Notebook / Fin’s Corner → 已学 / 未学概念连接真实资料。

连接验收通过产品 API 完成相关课程与测验，不直接往数据库写入分数。UI 截图没有 mock API、替换数据或合成界面。示例账户不是实际学习者。

手机 390px 实际完成了文章、Compare、Daily Capsule、路线恢复、行为 Lab 预测与反思、Notebook、Context AI → 同一 Copilot session。375 / 390 / 430 / 768px 检查了关键页面不产生页面级横向溢出。完整星图与路线步骤条在自己的容器内允许横向浏览。

交互检查真实选中文字后打开 AI，连续 Tab 保持弹窗焦点，Escape 关闭；Ctrl-K 搜索；reduced motion 关闭 Fin ambient；模拟一次网络失败，点击重试成功恢复。

## Fixes found during verification

- 手机路线 flex 列表的最小宽度撑大外层 grid：设置容器 min-width 与内部滚动边界。
- 阅读位置错误地使用“剩余可滚动高度”归一化，靠近底部提前变为 1：改为正文高度比例，进度与位置分开；固定状态提示高度，防止锚点跳动。
- 选区 AI 的 Tab 操作引起 selection change，意外卸载弹窗：打开 dialog 时冻结选区上下文，补充明确的 Tab 焦点循环。
- 多标签页重复回答 / 领取记忆：V3 写接口读状态之前获取 SQLite 写锁；并发重放只有一次 attempt，major / medium 限额仍成立。
- 未注明来源日期不再显示 `null`；文本按钮不再继承实心背景。

## Visual acceptance

Home 改为文字 + 轻星图、一个 Today；与保留的 V1/V2 实际截图作过自行对比。阅读、复习、路线、实验和 My World 使用同一套柔和青绿 / 灰绿体系。证据数字放在主动展开的详情中；没有彩色 KPI 墙、积分或排行榜。

Gate A–E 各阶段均已实际查看代表性页面截图，并按发现的问题迭代。视觉是否符合个人偏好仍由人工评审判断，不声称做过用户偏好实验。全部 48 张截图和尺寸 / SHA-256 见 [完整截图索引](V3_SCREENSHOTS.md)。

## Regression and data safety

原 42 项测试保留并通过。原八个 Lab 公式文件未改动；V3 调用原 simulate 计算，再记录预测 / 反思。原 Evidence、BFS、课程内容和既有接口保留。兼容性检查只读备份 V1/V2 SQLite，所有检查在 V3 临时副本上执行；未修改源数据库。V3 运行数据库和测试数据库均未提交 Git。

## Known limitations

- External AI 没有配置真实 key，未进行真实外部服务调用验收；Demo 与既有 mock/fallback 回归已验证。效果取决于外部模型和网络。
- Recall 是先自行回想、再选项核对；不做自由文本语义评分。Misconception 是有限的编辑规则，只覆盖真实支持的选项和四组 Compare，不声称识别所有误解。
- Review 为固定间隔，不是认知能力评估。用户确认读完不是理解程度的客观测量；文章读完只增加接触证据。
- 真实资料是固定来源目录，部分为历史政策材料；不是实时行情 / 新闻产品。
- 星图是稳定 SVG 布局，不是可拖拽的专业图分析器；手机 full view 可在图内横向查看。
- 浏览器验证使用本地 Chrome 及手机视口模拟，没有声称完成 iOS Safari / Android 真机或完整 WCAG 审计。
- 验证了关键重复写入的并发边界，没有完成高并发压力测试。SQLite 本地产品交付不等于生产运维验收。

## Deployment boundary

本轮没有 SSH、宝塔、服务器进程、Nginx、DNS、HTTPS、ICP 或安全组操作。没有正式切换步骤。部署状态始终是 **NOT DEPLOYED**；GitHub 分支是否推送成功及最终 commit 以最终交付记录为准。
