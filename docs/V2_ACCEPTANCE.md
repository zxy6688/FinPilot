# FinPilot V2 · Acceptance

验收日期：2026-10-02。环境：Windows、Python 3.13、本地 Chrome；项目为独立 `v2` worktree。前端 `http://127.0.0.1:5174`，后端 `127.0.0.1:8002`。所有结果只适用于本地验证，不代表公网部署或真实 LLM 供应商可用。

## 结果

| 范围                            | 结果 / 依据                                                                                                       |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Backend regression              | **42 passed**：原 V1 29 项、V2 13 项                                                                              |
| Python compile / import         | 通过，`scripts/Check.ps1`                                                                                         |
| TypeScript                      | `npm run typecheck` 通过                                                                                          |
| Production build                | `npm run build` 通过，未增加依赖                                                                                  |
| API smoke                       | **29 请求通过**：[v2-api-check.json](v2-api-check.json)                                                           |
| Browser                         | **12 组通过**：[v2-browser-check.json](v2-browser-check.json)，pageerror 为零                                     |
| Responsive                      | 1440 桌面；375 / 390 / 430 / 768px，核心页面无横向溢出                                                            |
| V1 database                     | [v2-compatibility-check.json](v2-compatibility-check.json)：23 表、289 行、9 用户；初始化及读取副本后逐表内容保持 |
| Content / formulas / deployment | V1 内容、ORM、seed、原实验公式、依赖锁定文件、deploy 目录保持                                                     |
| Screenshots                     | 11 张真实 V2 截图及 [图集](screenshots/v2/index.html)                                                             |

原 Starlette/httpx 测试依赖产生 1 条弃用提示，不影响测试结果，未擅自升级依赖。项目没有单独 lint 命令；新增代码已按仓库 Black / Prettier 格式整理。

## 后端覆盖

1. 同一用户、同一数据的 Home 确定性；无数据 fallback。
2. 最新错题与历史重复错误；改对后解除；用户隔离。
3. 真正相关的资料、实验、关系与缺失来源。
4. 缺少 Lab 的权重归一化、五领域、已知目标。
5. 真实有向边、逆向连通、断连及未知目标。
6. 实验参与证据、无关联 Lab 的 null fallback。
7. 原 API 可用，新用户全部未探索。
8. 上下文类型、长度、来源和参数作用域校验。
9. Lesson / Topic / Article / Relation / Route / Lab 的 Demo 与保存会话。
10. 服务端重算 Lab、最小外部材料、模拟失败回退。
11. V1 普通聊天、输入边界、Search 路线结果。
12. 保存实验参数后的追问，以及模拟 live Provider。
13. 多主题课程采用主主题解释，不因排序误选次主题。

## 浏览器覆盖

- Home 的继续课程、错题、真实关系理由、资料与实验。
- 理解地图五领域、24 主题、展开证据、领域筛选。
- Topic → 路线，Known / Next / Target 与真实边标签。
- Lesson 段落上下文、片段、追问、自测、Esc 与焦点恢复。
- 图关系键盘选择、解释与上下文 AI。
- Discover 个性化原因、12 条真实来源筛选与 AI。
- 全部八个 Lab 的情景和反思，利率改变后 AI 的实际参数解释。
- 历史上下文会话在 Copilot 中继续保留实验输入。
- 全局 Search 路线、搜索弹窗键盘操作、FinTalk Topic 回链。
- 全新用户注册 → 空状态 → 错题 → Home 复习 → 改对完课 → 地图更新；无体验数据串入。
- 四个移动宽度下 Home / Route / Profile / Discover / Topic / Lesson / Lab 无横向溢出；关系按钮与 AI 弹窗可用。
- 390px 最终 Home、Route、Map、AI 截图。

## 截图清单

| Desktop                       | Mobile                       |
| ----------------------------- | ---------------------------- |
| desktop-home-v2.png           | mobile-home-v2.png           |
| desktop-understanding-map.png | mobile-understanding-map.png |
| desktop-learning-route.png    | mobile-learning-route-v2.png |
| desktop-contextual-ai.png     | mobile-ai-v2.png             |
| desktop-topic-v2.png          |                              |
| desktop-discover-v2.png       |                              |
| desktop-scenario-lab.png      |                              |

全部位于 `docs/screenshots/v2/`。AI 截图采用实际视口，其他为完整页面。使用带示例学习活动的体验账户；没有用浏览器直接伪造响应或页面文字。

## 复现

先按 README 安装依赖。在 **V2 根目录** PowerShell 执行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Check.ps1
. .\scripts\Environment.ps1
.\.venv\Scripts\python.exe -X utf8 scripts\v2-api-check.py
```

pytest 使用独立 `tmp/test-finpilot.db`；API smoke 使用唯一 tmp 数据库，不污染正常体验账户。数据库兼容检查需要明确指定 V1 数据库路径，仅作只读备份后在 V2 tmp 副本运行：

```powershell
.\.venv\Scripts\python.exe -X utf8 scripts\v2-compatibility-check.py 'D:\finpilot开发\v1\data\finpilot.db'
```

浏览器脚本面向本地体验数据库，要求体验账户有指定演示活动；不要对个人真实学习数据库或远程站点运行：

```powershell
.\.venv\Scripts\python.exe -X utf8 scripts\prepare-v2-demo.py
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Start-FinPilot.ps1 -NoBrowser
node scripts/v2-browser-check.mjs
```

默认使用 Windows 已安装 Chrome；可用 `CHROME_PATH` 指定本机浏览器。脚本会新增浏览、聊天和独立测试账号；演示初始化脚本遇到已有学习记录会跳过，已有不同状态的个人数据库不保证符合截图断言。

## 已知边界

- 现有图关系不是教学先修图；路线是确定性知识连接，不是经验证的最优课程。
- 无对应 Lab、资料映射或连接时显示缺失；不补造内容。
- 现有模型没有 lesson-start；Continue 根据真实作答、收藏、路径与主题推断。
- 路线通过 Topic 收藏恢复目标，每次重新计算，不保存用户编辑的路线。
- Demo 为内容模板，不能自由回答任意追问；真实 External Key 未联机测试，成功和失败路径使用模拟适配器测试。
- 理解证据只是站内行为覆盖，阈值不是经过教育测量验证的能力刻度。
- 新能力使用当前小型内容目录内存计算，没有大规模用户负载测试。

## 发布边界

V1 基线为 `97908aacc74adaf8e8c1eb291d255a2feff1b289`，保留 `main`。V2 仅提交 `v2` 分支，不合并或强推 main。

**NOT DEPLOYED**。未登录服务器、未运行部署脚本、未动旧站 4173 或 V1 预览服务、未改 Nginx、DNS、HTTPS、安全组或 ICP。

本地产品与测试结论：**READY FOR HUMAN V2 REVIEW**。
