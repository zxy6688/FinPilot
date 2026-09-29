# FinPilot V1 — Product Polish & Local Release Candidate

日期：2026-09-29。直接在现有 `D:\finpilot开发\v1` 完成；没有新建 V2。

## 这次改变了什么

统一深墨绿、暖白、金融蓝与少量暖金，补了原创 SVG 标记、favicon 和页面元信息。首页改为知识罗盘和有主次的学习概览。中文承担主要信息，字号、留白、按钮、焦点和反馈状态统一。

Discover 用不同卡片表现官方资料与原创解释，历史政策明确标注为历史资料，没有将旧日期包装为 CURRENT。Topic Hub 使用已有 32 条关系生成有方向、关系说明和可点击节点的 SVG；手机使用可读的关联视图。Learn 展示完成/当前/待学的路线，Lesson 提供章节导航、结构化正文、误解与辨析、自测和下一课。

AI 页为模式、对话、相关知识三栏，手机单栏并支持折叠知识栏。仅保留原有四种模式；Demo 标记明确但不遮挡内容。Lab 保留原有八套公式，统一目标、操作、观察、解释、边界和图表风格。

FinTalk 增加身份、主题、日期、摘要和互动元信息；20 条示例回复分布到不同帖子，点赞由虚构身份的真实 Like 记录产生，不硬编码计数。Profile 使用 Recharts 雷达图和真实近期活动，不赋予“投资能力”含义。登录页有品牌体验，体验按钮仅填入凭据，不自动登录。全局搜索有键盘导航、焦点返回与移动端弹窗。

Footer 的关于、隐私和金融教育说明使用轻量 Modal；Skeleton、空态、离线提示、404 和 reduced-motion 支持已统一。Markdown 关闭原始 HTML，未引入 dangerouslySetInnerHTML。一般 AI 问题最多 2000 字符，Explain 最多 6000；帖子标题/正文为 160/10000，评论 3000，空白提交拒绝。

## 布局改动范围

Home、Discover、Topic、Learn/Path、Lesson、AI、Lab、FinTalk、Profile、Search、Login、Header/Footer 都有本轮表现层调整。路由与现有核心业务保留。

主要文件：`frontend/src/components/Brand.tsx`、`KnowledgeMap.tsx`、`ReadingBlocks.tsx`、`SearchOverlay.tsx`、`Modal.tsx`、`Layout.tsx`、`ui.tsx`，各现有 `pages/*.tsx`，`styles.css` 和 `polish.css`。后端仅为课程元数据、近期活动、输入边界、内容编辑版本、本地运行识别和体验账户重置做轻量修改。

**没有新增依赖。** React/FastAPI/SQLite、Lucide、Recharts、react-markdown 和两份锁定清单保持原有版本。SVG 与交互均用现有能力完成。本轮没有新增表或字段。

## 内容编辑与兼容

仍是 24 Topic、32 关系、12 官方来源、16 原创解释、5 路径、28 课程、64 题、8 实验、8 虚构身份、20 示例帖子和 20 回复。抽查正文的机制、重复句式与边界，轻改购买力和 ETF 的开头/解释，并为 6 节课写了针对性的自测引导。没有为了字数重写全部课程。

`content_release.py` 使用单独的内容版本记录，重复启动不会覆盖用户活动。原有 Quiz ID 与定义、实验计算均保留。Reset 只重置体验账户，保留其他账户和他人对体验帖的互动上下文，先以 SQLite backup API 备份。

## 本地运行

新增 Start / Stop / Setup / Reset 的 `.ps1` 与双击 `.cmd` 入口。Setup 用锁定依赖安装，不修改系统配置。Start 检查依赖、端口、实例身份和健康状态；后台进程隐藏启动，服务就绪后自动打开浏览器。Stop 核对 PID 和创建时间，避免 PID 重用误杀。若端口被未知服务占用，明确停止启动，不结束该服务。

已测试 PowerShell 7 与 Windows PowerShell 的实际启动；验证冷启动、重复启动、停止释放端口、旧 PID 跳过、未知端口保护以及 Reset 备份。Setup 在现有 Python 环境及本地 npm 缓存上完整执行离线安装，重新安装了锁定的前端依赖。未将“在一台无 Python/Node 的新机器上从互联网安装”描述成已测试。

## 验收证据

- 29 项后端测试通过；Python 编译/应用导入通过。
- TypeScript typecheck 与前端 production build 通过。
- 完整浏览器检查：体验登录、来源筛选、知识图键盘操作、课程与测验、AI 三个入口、八个实验、发帖/回复/点赞/收藏、退出重登、搜索键盘与焦点、404/空态、离线重试、原始 HTML 不执行、注册验证。
- 375、390、430、768 像素实际检查页面、导航、搜索与滑块。桌面为 1440 像素。
- 截图：`docs/screenshots/v1-final/`。18 张，覆盖全部指定页面，另含学习路径和完整搜索页。
- `v1-final-browser-check.json`、`v1-local-runtime-check.json` 和 `v1-api-smoke.json` 记录最终执行结果。

浏览器截图使用独立数据库中的正常体验流程，没有在正式库写测试帖子。分享包另外生成干净 Seed 数据库，不包含实际账户的私人记录、开发 JWT 密钥或 `.env`。

## 已知边界

在本轮覆盖的场景中未发现阻塞使用的问题。本地版固定使用 8000/5173；端口占用会提示，不自动切换端口。来源资料为已核验的固定目录，不是实时更新流。Windows Chrome 是这次浏览器验收环境，其他浏览器/操作系统没有作为已验证结论。

现有 Recharts 2 分支和 Starlette/httpx 适配出现弃用提示；测试与构建通过，本轮没有为了消除提示升级依赖。外部模型真实服务仅保留可选配置，测试使用 Demo 与 mock 适配器。

GitHub、云服务器、域名、HTTPS、反向代理和公网部署均未执行，留待单独的发布阶段。
