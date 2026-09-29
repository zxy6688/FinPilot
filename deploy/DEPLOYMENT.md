# FinPilot V1 · 并行预览部署

本方案仅部署独立预览，不执行正式切换。旧版 `http://43.143.241.109:4173/` 保持运行；脚本不备份、覆盖或修改 `/www/wwwroot/finpilot.cn`，不修改旧站 Nginx 配置，不停止旧 Node/Vite 或其他服务。

| 项目 | 新版独立位置 |
|---|---|
| 源码、venv、环境配置 | `/www/finpilot-v1` |
| SQLite、运行数据 | `/www/finpilot-v1/data` |
| 后端日志 | `/www/finpilot-v1/logs` |
| 前端静态目录 | `/www/wwwroot/finpilot-v1` |
| systemd 服务及运行用户 | `finpilot-v1.service` / `finpilot-v1` |
| FastAPI | `127.0.0.1:8001` |
| 新增 Nginx 配置 | `/www/server/panel/vhost/nginx/finpilot-v1-preview.conf` |
| HTTP 预览 | `http://43.143.241.109:8088/` |

## 首次运行：宝塔 root 终端两条命令

```bash
curl -fL --retry 2 https://raw.githubusercontent.com/zxy6688/FinPilot/main/deploy/deploy-server.sh -o /tmp/finpilot-v1-preview.sh
bash /tmp/finpilot-v1-preview.sh
```

脚本要求既有 Git、Python 3.11+、Node 20+、npm、Nginx、systemd、curl 及常用系统工具；缺失时明确报错，不安装系统软件。首次 `.env` 创建后隐藏输入一个密码管理器生成的 48～256 位随机 JWT 密钥（字母、数字、下划线、连字符），不得使用旧版密钥或向聊天发送密钥。LLM Key 留空即可 Demo AI。已有新版 `.env` 不覆盖；输入中断时在服务器文件编辑器补全新目录的 `.env` 后重试。

## 运行与更新

更新只执行：

```bash
bash /www/finpilot-v1/deploy/update-server.sh
```

部署和更新均仅处理新版：检查路径与端口所有权 → 检查旧 4173 HTTP 可达 → 如有既存新版则备份其静态文件和独立配置 → clone/pull main（拒绝脏工作区、分叉、不强制 reset）→ 安装本项目 venv 依赖 → npm ci/build → 暂存新版静态文件 → 备份新版 SQLite → 幂等 seed → 启动/重启 `finpilot-v1.service` → 新增/更新独立 Nginx 配置 → nginx -t → 切换新版静态目录 → 配置变化时优雅 reload Nginx → 检查新版 API、首页、SPA 深层刷新及旧 4173 仍可达。

新配置只监听 8088，`/api/` 保留请求路径代理到 8001，`/` 使用 `try_files $uri $uri/ /index.html;`。不会监听 80、配置 HTTPS、修改 DNS 或执行正式切换。共享 Nginx 仅进行必要的配置检查与优雅 reload；不停止 Nginx，也不改写其他 server block。脚本检查宝塔已有通配 include；若不匹配则停止，不修改全局 Nginx 配置。

新版备份位于 `/www/backup/finpilot-v1-时间-PID/`，新版上一版静态目录保留为 `/www/wwwroot/finpilot-v1.previous-时间-PID`。第一次预览没有原目录时直接发布；失败时移走新目录/新配置，若之前存在新版则恢复它们。源码、依赖、数据库和 service 不作自动事务回滚；后端失败应查看新版日志。数据库不删除、不 Reset Demo、不重生成 JWT，也不会读取旧数据库。

## 访问和网络

运行后分别在浏览器打开：

- 旧版：`http://43.143.241.109:4173/`
- 新版：`http://43.143.241.109:8088/`

如果腾讯云安全组/轻量应用服务器防火墙尚未放行 **入站 TCP 8088**，需要你在控制台放行；服务器自身防火墙也需允许该端口。可按实际预览需求限制来源 IP。**不要放行 8001**，后端只监听回环。脚本不会修改任何安全组或主机防火墙。

本机 health 成功不能证明公网可达；脚本只据实报告本机状态，公网两版同时可访问需要你从浏览器验证。旧版前置检查失败即退出，不尝试修复或停止旧版。正式切换待新版确认后另行设计。

排障：`systemctl status finpilot-v1`、`journalctl -u finpilot-v1 -n 100 --no-pager`、`nginx -t`、`curl http://127.0.0.1:8001/api/health`。未实际远程执行，本地只进行了 Bash 语法与隔离边界检查。
