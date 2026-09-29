# FinPilot V1 · Final Patch / GitHub / Server Preparation

> 本文记录上一轮发布准备。服务器方案已被 [并行预览部署](../deploy/DEPLOYMENT.md) 替代；当前仅部署 8088 / 8001 与 finpilot-v1 独立目录，旧站不得改动。

## Final Patch

`backend/app/main.py` 在构造 FileHandler 前自行创建 logs 目录。main、AI provider、security 的逗号合并 import 已拆成独立行；seed、routes、learning、recommendations、reset_demo 的 models/schema 星号导入改为实际使用的显式名称。未改动函数业务、UI、课程、Seed、API 定义或依赖清单。

29 项后端测试、Python compile/import、TypeScript typecheck、前端生产构建、14 路 API smoke 均通过。独立副本在不存在 logs 的情况下直接导入 app 成功，并自行创建 backend.log。现有 Starlette/httpx 弃用提示保留，没有因此升级依赖。

## 发布与安全

初次提交 `240914e` 已推送到 Public 仓库 https://github.com/zxy6688/FinPilot 的 main。后续部署准备使用独立提交。未创建其他仓库、设置 License 或创建额外 GitHub Release 标签。

本机旧 Git helper 名称与安装版本不匹配，沙箱中还出现 HTTPS 进程访问冲突；使用已安装 manager 和正常凭据环境后完成推送，未索要密码/PAT，未修改全局 Git 配置。提交作者使用 GitHub noreply 邮箱。GitHub CLI 不存在，因此 description/topics 未通过 CLI 设置。

`.gitignore` 排除环境文件、数据文件、JWT 文件、依赖、日志、缓存、构建和 IDE 临时文件；保留 `.env.example`、源代码、锁定依赖、测试与最终截图。对实际 staging 做禁止路径检查、凭据模式和邮箱检查，未发现真实 Secret 或私人邮箱。Seed 和测试中的虚构账户、体验密码属于有意保留的测试资料。

## 部署交付

`deploy/` 包含 deploy-server.sh、update-server.sh、finpilot.service、nginx-finpilot.conf、DEPLOYMENT.md。固定为 Nginx 静态文件/API 代理、单进程 systemd FastAPI、SQLite。旧站先备份，构建完成后切换，配置先检查再重载；数据库、JWT 与 4173 均保留。生产 Secret 只在服务器端由用户隐藏输入，不在本地生成。

本地已验证 Bash 语法与发布顺序、模板路径/权限。未连接服务器、操作 SSH/宝塔/DNS/防火墙、申请 SSL 或停止旧版。实际 Linux 部署与公网访问仍由用户执行和验收，不报告为已经上线。

首次部署只需部署说明中的两条命令；更新只需一条。当前未发现本地发布阻塞；服务器 Node/npm 是否齐全、下载连通性和入站访问尚未远程验证，脚本会前置检查。ICP 不阻塞当前 IP 技术验收目标，正式域名 HTTPS 留待备案阶段。
