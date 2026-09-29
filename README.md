# FinPilot V1 — Local Release Candidate

**看懂金融，形成自己的判断。**

面向金融初学者的本地学习产品：从官方资料进入知识主题，再通过微课程、AI 解释、交互实验和讨论形成自己的理解。

## 第一次打开

建议解压到 `D:\finpilot开发\v1`，或 D 盘的其他目录。脚本根据自身位置定位项目，无需修改系统配置。

1. 准备 Python 3.10+（本机验收为 3.13）和 Node.js 20+（本机验收为 24）。
2. 双击 **`Setup-FinPilot.cmd`**，安装锁定依赖并初始化内容。首次安装需要网络。
3. 双击 **`Start-FinPilot.cmd`**。服务就绪后自动打开 `http://127.0.0.1:5173`。
4. 登录页点击“填入体验账户”，再点击“登录”。账户：`demo@finpilot.app`，密码：`demo123456`。
5. 使用完毕双击 **`Stop-FinPilot.cmd`**。

以后只需 Start；重启电脑后也一样。ZIP 不包含机器相关的 `.venv` 和 `node_modules`。移动已安装的项目时，应在新位置重新执行 Setup。

PowerShell 等效命令：

```powershell
Set-Location 'D:\finpilot开发\v1'
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Setup-FinPilot.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Start-FinPilot.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Stop-FinPilot.ps1
```

这里的 ExecutionPolicy 只对本次脚本进程生效，不永久修改系统设置。

## 本地操作

| 入口 | 作用 |
|---|---|
| `Setup-FinPilot.cmd` | 创建项目内 `.venv`、安装 Python 锁定依赖、执行 `npm ci`、增量初始化 SQLite |
| `Start-FinPilot.cmd` | 检查依赖、启动后台服务、等待就绪、打开浏览器；重复运行复用已启动实例 |
| `Stop-FinPilot.cmd` | 根据项目 PID 记录及进程创建时间停止服务，不按 Python/Node 名称批量结束进程 |
| `Reset-Demo.cmd` | 先备份 SQLite，再清理体验账户的学习与互动；需要输入 RESET 确认 |

Start 使用端口 8000 和 5173。若其他程序占用端口，会提示处理，不会主动结束未知进程。`scripts/Start-FinPilot.ps1 -NoBrowser` 可关闭自动打开浏览器。日志在 `logs/local-*.log`，进程记录在 `tmp/local-runtime.json`。

Reset 不删除项目目录，不清理其他账户，不抹掉他人回复。若其他账户曾对体验者的帖子产生互动，该帖子会保留，并在输出中列出。备份在 `data/backups/`。运行 Reset 前先 Stop。

本地数据库为 `data/finpilot.db`。本项目的依赖、缓存、临时文件、日志和数据库均保存在项目下；不设置全局 npm 缓存、不安装全局服务。

## 产品与内容

| 内容 | 数量 |
|---|---:|
| 知识主题 / 有向关系 | 24 / 32 |
| 官方来源资料 / 原创解释 | 12 / 16 |
| 学习路径 / 微课程 / 自测题 | 5 / 28 / 64 |
| 交互实验 | 8 |
| 虚构社区身份 / 示例帖子 / 回复 | 8 / 20 / 20 |

- **Home**：原创知识罗盘、信息精选、继续学习、问题和实验、推荐、讨论。
- **Discover**：区分官方指南、数据研究、历史政策资料与原创解释；对应原文外链，不伪装实时新闻。
- **Topic Hub**：SVG 有向知识关系图，可点节点、用键盘选择关系；手机有可读的连接视图。
- **Learn / Lesson**：五条学习旅程、章节目录、结构化阅读、嵌入自测、下一课与相关知识。
- **AI Copilot**：Tutor / Explain / Guide / Behavior Coach 四种模式、会话历史、相关主题/课程/实验入口。
- **Lab**：八个原有教学模型，统一说明、输入、图表、观察与边界；计算公式未改。
- **FinTalk**：发帖、回复、点赞、收藏、讨论摘要、举报；虚构身份和示例互动有明确说明。
- **Profile**：实际站内学习足迹、六领域雷达图、继续学习、错题、兴趣、徽章、近期活动和收藏。
- **Search**：全局搜索弹窗，支持 Ctrl/Cmd K、↑↓、Enter、Esc；保留完整搜索页。

所有成长数值来自站内记录，不是投资能力测评。连续学习日使用北京时间。体验账户初始没有伪造学习成绩。

## 可选模型配置

没有 API Key 时所有页面和 Demo AI 都能运行。Demo 解释来自课程内容，不宣称调用了真实模型。

需要接外部服务时，将 `.env.example` 复制为 `.env` 并在本地填写 `LLM_API_KEY`、`LLM_MODEL`、`LLM_BASE_URL`。不要把 `.env` 放入分享包。使用兼容 Chat Completions 协议的单一适配器；失败时明确回退 Demo。运行中的服务需 Stop 后重新 Start 才读取修改。

JWT 密钥默认首次使用时生成在 `data/.jwt-secret`。发布包不包含开发环境的密钥或真实用户数据库。外部模型真连接未作为此次本地验收结论，适配器已通过 mock 成功/失败测试。

## 内容维护

- `content/catalog.json`：主题、关系、路径。
- `content/articles.json` 与 `source-audit.json`：资料、原创摘要与来源核验记录。
- `content/lessons/*.md`、`lessons.json`、`quizzes.json`：正文、元数据与题库。
- `content/topic-aliases.json`：AI Demo 别名。
- `content/labs.json`：实验教学说明。
- `content/community.json`、`community-engagement.json`：虚构身份、示例讨论和互动分布。

正文编辑后运行：

```powershell
. .\scripts\Environment.ps1
.\.venv\Scripts\python.exe scripts\sync-content.py
```

Seed 按内容版本增量导入，重复运行不重置用户数据。第二轮只增加编辑版本记录，未增加数据库表或字段。修改 JSON 要先在副本验证，再有意识地增加导入版本。当前轻量迁移针对 SQLite。

## 验收和截图

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Check.ps1
```

执行后端测试、Python 编译/导入、TypeScript 检查和生产构建。测试使用专用临时数据库。

完整浏览器脚本为 `scripts/final-browser-check.mjs`，使用本机 Chrome（可通过 `CHROME_PATH` 指定）。执行浏览器测试前，先 Stop，在当前 PowerShell 设置 `$env:DATABASE_URL='sqlite:///tmp/polish/acceptance.db'` 并确保该父目录存在，再 Start。不要在个人使用的正式库上跑写操作验收。

- [最终发布说明](docs/LOCAL_RELEASE.md)
- [验收清单](docs/ACCEPTANCE.md)
- [截图索引](docs/screenshots/v1-final/index.html)：桌面 1440px 与手机 390px。
- [浏览器结果](docs/v1-final-browser-check.json)
- [启动脚本结果](docs/v1-local-runtime-check.json)

## 分享包

`v1.zip` 包含源码、锁定依赖清单、内容、启动脚本、验收资料和一份干净的 Seed 数据库。不含依赖目录、缓存、日志、临时文件、开发密钥或个人记录。可运行 `scripts/build-release.py` 重新构建；该脚本拒绝覆盖已有同名 ZIP。

本轮未进行 Git 初始化、GitHub 发布、服务器、域名、Nginx 或 HTTPS 配置。

FinPilot 提供金融教育与信息辅助，不构成投资建议。投资决策应由用户基于自身情况独立作出。

## GitHub 与服务器发布准备

最终小修与服务器部署文件见 [Final Patch 报告](docs/FINAL_RELEASE.md) 和 [部署说明](deploy/DEPLOYMENT.md)。GitHub 源码仓库为 [zxy6688/FinPilot](https://github.com/zxy6688/FinPilot)。本地成品包的既有验收记录属于上一阶段；本次仅修复日志初始化、清理导入并准备发布，不修改 UI、内容或业务。

当前服务器方案为独立并行预览：`http://43.143.241.109:8088/`，源码 `/www/finpilot-v1`。旧版 4173 和原站点目录保持不变，执行命令以 [并行预览说明](deploy/DEPLOYMENT.md) 为准。
