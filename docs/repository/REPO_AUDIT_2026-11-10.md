# 仓库审计 · 2026-11-10

只读基线：`ab4a29c2e6902e2cbd8736d53d8005fbc313c4e5`，515 个受管理文件。开始时工作树干净，本地分支 v3 与 origin/main 相同。本轮仅编辑 README、文档和展示素材，并增加对应的 .gitignore 例外；不删除文件、不改业务、数据库、模型或部署配置。

[完整文件清单](TRACKED_PATHS_2026-11-10.txt) · [四层路径树](TRACKED_TREE_2026-11-10.md) · [版本沿革](VERSION_HISTORY.md)

## 路径职责

| 路径 | 当前责任与处理 |
| --- | --- |
| `frontend/src/redesign/` | Home、Catalog、KnowledgeCenter、概念/专题/工具；正式入口，保留 |
| `frontend/src/redesign/MyWorldV2.tsx` | 当前成果管理；复用真实账户与保存记录，不改历史数据 |
| `frontend/src/living/` | 阅读器、复习、路线、对比、实验和旧历史页仍由 main.tsx 引用，保留 |
| `frontend/src/pages/Learning.tsx` | PathPage / LessonPage 仍为课程路由；不能删整个旧页面目录 |
| `frontend/src/fin-pet/` | Three.js 场景、导演状态、120 脚本、交互和保存，保留 |
| `frontend/public/` | 当前品牌插画、字体、运行 GLB；不能按资源年份清理 |
| `backend/app/` | API、鉴权、确定性计算、ORM、兼容性初始化，保留 |
| `backend/tests/` | 数学边界、所有权、保存恢复、内容审计等，保留 |
| `content/` | 真实课程、题目与种子内容，不是用户数据库 |
| `deploy/production/` | 当前 Caddy/systemd/激活/备份工具，保留 |
| `deploy/` 其他方案 | 原并行预览与试用环境记录，标注历史后再考虑归档；本轮不动 |
| `scripts/` | 启动、检查、构建、迁移兼容、浏览器回归、美术生成和发布；需要按调用关系区分 |
| `docs/` | 产品依据和历史阶段记录；当前入口统一到 INDEX.md |
| `.github/workflows/ci.yml` | main/v3 推送及 PR 执行测试构建，没有部署任务 |

## 内容覆盖

以下为实际 JSON 条目与前端路由审计，不是用户人数或完成率。

| 资源 | 数量 | 来源 |
| --- | ---: | --- |
| 知识领域 / 概念 | 6 / 36 | `content/knowledge.json` |
| 原有 Topic / 学习路线 | 24 / 5 | `content/catalog.json` |
| 课程 | 28 | `content/lessons.json` |
| 原题 | 64 | `content/quizzes.json` |
| 教学实验 | 8 | `content/labs.json` |
| 新精品专题 / 主工具 | 5 / 5 | `frontend/src/main.tsx` 与 redesign 路由、专题和工具目录 |
| Fin 脚本 | 120 | `frontend/src/fin-pet/` 脚本数据及 `scripts/test-fin-scripts.mjs` |

36 个概念中的 27 道即时检查关联原题 ID，另 9 道不是正式复习题。旧 `/learn`、`/topics`、`/knowledge`、`/lab` 兼容进入新系统；`/profile/history` 保留旧历史；`/concept-studio/etf-matrix` 保留兼容。页面跳转不是删除原内容或迁移私人数据。

## 数据结构与兼容性

`backend/app/models.py` 定义 23 张表，`models_v3.py` 定义 11 张表。包括账户、内容、课程/答题/进度、实验、收藏、FinTalk、聊天、阅读状态、学习成果、复习、路线、反思、纪念品及宠物偏好。内容初始化维护版本修订，兼容性建表/补列逻辑不等于重置生产库。

- `models.py`：`users`, `content_revisions`, `topic_relations`, `topics`, `articles`, `learning_paths`, `lessons`, `quiz_questions`, `quiz_records`, `user_progress`, `labs`, `lab_records`, `posts`, `comments`, `likes`, `favorites`, `badges`, `user_badges`, `chat_sessions`, `chat_messages`, `topic_views`, `revoked_tokens`, `reports`。
- `models_v3.py`：`learning_artifacts`, `reading_states`, `review_items`, `misconception_states`, `review_sessions`, `saved_routes`, `reflections`, `user_connections`, `moment_records`, `companion_states`, `fin_pet_profiles`。

## 清理候选与风险（本轮没有执行删除）

| 候选 | 证据 / 风险 | 后续建议 |
| --- | --- | --- |
| `frontend/src/pages/Home.tsx` | main.tsx 使用 redesign/Home；当前 frontend/src 搜索未发现导入 pages/Home。仍须全仓引用、构建和历史兼容确认 | 可作为单文件清理候选，不能据此清空 pages/ |
| main.tsx 的旧 TopicHub / Learn / Labs lazy 声明 | 仍有 import 声明，但现有列表入口已重定向；PathPage / LessonPage 实际被路由使用 | 后续独立源码清理，先验证路由；本轮只报告 |
| `scripts/redesign-gate-*.mjs`、旧审查打包脚本 | 固定历史页面选择器、资产路径或 Gate 前提，不能都当当前自动验收 | 分类为历史回放与有效回归，确认后归档，不直接删 |
| 旧部署脚本与试用工具 | 现生产走 deploy/production，旧 preview/trial 曾服务独立环境 | 保留兼容与恢复用途，另批检查调用方 |
| `node_modules`、`.venv`、`dist`、`tmp`、日志、缓存 | 忽略的安装/构建/运行产物，不属于源码清单 | 可重建；清理前检查运行进程和未归档报告，本轮不动 |
| 历史截图/录屏、Blender 工程 | 一部分已由此前发布整理排除 Git，仍在本机/Release | 大型可编辑资产继续版本化 Release 保存，不能丢工程 |
| 旧 GLB p0/p05 | 正式运行引用 fin-full.glb；旧候选留本地/历史包 | 不上传重复模型，不删除用户保留版本 |
| `docs` 中早期 Gate 的“未部署”等结论 | 是当时事实，不能视为今天的生产状态 | 保留时间线，当前文档入口给出明确边界 |

## 本轮已执行的文档修正

根 README 改为五大空间产品画册；新增真实访客截图、原生 SVG 封面、资产来源和版本审计。同步英文入口、文档导航、生产状态、维护步骤和发布验证，移除当前入口中错误的 SSH/DNS 未就绪说法。维护者仓库外包装器与 clone 内工具明确区分。

## 安全边界

`.env`、SQLite、虚拟环境、依赖、日志、缓存和大型原始审查包仍被忽略；仅放行 `docs/readme/assets/` 精选公开素材。截图使用隔离访客的教学预算与 ETF 笔记，没有生产用户记录；没有公开账号口令、私钥、JWT、API Key 或数据库。

当前未发现项目级 LICENSE，不自行授予许可。历史发布有独立文本凭据扫描记录；本轮增量检查不能代替所有历史二进制或第三方依赖的完整安全审计。生产备份按用户选择仅留服务器。
