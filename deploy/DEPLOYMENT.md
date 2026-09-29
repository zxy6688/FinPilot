# FinPilot V1 · 服务器部署

本目录面向已确认的 OpenCloudOS 9.4 x86_64、Python 3.11.6、Nginx 1.26.3、宝塔环境。服务器 IP 为 `43.143.241.109`，现有站点 `finpilot.cn`，现有旧预览端口为 4173。本轮仅准备文件，没有登录或改动服务器。

源码位于 `/www/finpilot`；网站目录 `/www/wwwroot/finpilot.cn` 仅放 React 静态构建。FastAPI 由 systemd 以专用 `finpilot` 系统用户运行，监听 `127.0.0.1:8000`；Nginx `/api/` 保留路径转发，SQLite 持久存放于源码目录下的 `data/`。

## 第一次部署：宝塔 root 终端两条命令

确认 GitHub main 已包含本目录后执行：

```bash
curl -fL --retry 2 https://raw.githubusercontent.com/zxy6688/FinPilot/main/deploy/deploy-server.sh -o /tmp/finpilot-deploy.sh
bash /tmp/finpilot-deploy.sh
```

首次创建 `.env` 时，脚本会要求粘贴由密码管理器生成的随机 JWT 密钥，输入不显示。使用 48～256 位字母、数字、下划线或连字符；不要使用口令或重复字符串，也不要发送给他人。按照发布指令，脚本不自动生成生产密钥。LLM Key 留空即可使用 Demo AI。

若已有 `.env`，脚本保留并验证，不覆盖其密钥。首次输入中断或格式错误时会保留空模板：只需在宝塔文件编辑器中本机填写 `/www/finpilot/.env`，再运行第二条命令；不要把 `.env` 上传到仓库。数据库地址必须为 `sqlite:///data/finpilot.db` 或对应绝对路径。

前提是已有 Git、Python 3.11+、Node 20+、npm、Nginx、curl、systemd 与系统常用工具。缺少时脚本会报具体名称，不自动安装系统软件。Node/npm 是否已装尚未远程确认。首次安装锁定依赖需要服务器能访问 GitHub、Python 包源和 npm 源。

## 脚本实际执行的顺序

1. 校验工具、固定目录、既有宝塔配置和部署互斥锁；不接受目录符号链接。
2. 第一项站点操作是备份整个旧站到 `/www/backup/finpilot-old-日期时间-PID.tar.gz`，校验压缩包，并备份 Nginx 和原有 service。备份权限仅 root 可读。
3. clone main；已有源码时检查 origin、分支和工作区，fetch / pull --ff-only。拒绝脏工作区、分叉及本地独有提交，不做强制 reset。
4. 创建本项目 venv、安装已有锁定依赖、配置环境，执行 npm ci / build。构建成功前不替换旧站。
5. 准备独立静态暂存目录与专用服务用户；短暂停止本项目后端，使用 SQLite backup API 备份原数据库，再运行已有幂等 seed。**不删除数据库，不 Reset Demo。**
6. 安装 systemd，检查后端 health；备份并更新宝塔 `finpilot.cn.conf`，执行 nginx -t，同时拒绝重复 server_name 警告。随后保留原静态目录并切换新目录；配置确实改变时才 reload。
7. 校验本机首页内容确实等于本次构建、API 直连及代理、SPA `/learn/1` 刷新、systemd 活跃状态。最后输出状态、公网验收地址和旧端口监听信息。

没有 default_server 强行抢占其他站点：显式为 `43.143.241.109` 与 `127.0.0.1` 配置 server_name，以便 IP 和回环测试命中当前站点。正式域名也在同一 HTTP 模板中；本阶段人工技术验收使用 IP。当前尚未完成 ICP 备案，HTTPS、证书、跳转、HSTS 和备案页脚均留待正式域名阶段。

## 更新：一条命令

```bash
bash /www/finpilot/deploy/update-server.sh
```

复用完整备份与发布流程，先拉取 main；仅当 requirements.lock 内容改变或 venv 不存在时更新 Python 依赖；前端始终 npm ci / build，重启本项目后端。保留 `.env`、JWT、SQLite 和全部用户数据。每次备份及上版静态目录均保留，脚本不自动清理它们。

## 出错与恢复边界

依赖安装、构建或 `.env` 检查失败时旧静态站未切换。Nginx 校验失败时不会重载坏配置。进入切换阶段后失败，脚本尝试恢复此前静态目录和 Nginx 配置，并输出备份目录；如果已重载过，再验证恢复配置后重载。

**这不是完整事务回滚：**源码 pull、venv 依赖、service 和 seed 可能已经更新；脚本不擅自回滚数据库、强制 reset Git 或覆盖用户新数据。若后端启动失败，检查下列日志；旧静态页面回退并不代表后端恢复。备份目录保存旧 source commit、配置、service（若有）、SQLite 快照（若原本有库），用于有针对性的人工恢复。首次启动未完成也不要直接删除 data 或重新生成 JWT。

宝塔防篡改、不可改写的目录、SELinux 策略、端口 80 入站规则可能导致失败；脚本不会关闭这些保护或修改云安全组。应根据实际报错调整所需权限，而不是禁用全局安全控制。当前 Nginx 主配置必须确实 include `/www/server/panel/vhost/nginx/finpilot.cn.conf`；否则会安全停止，不猜测其他配置路径。

## 验收与日志

公网打开 **http://43.143.241.109/**，检查首页、登录、Discover、Topic Hub、Learn/Quiz、AI Demo、8 个 Lab、FinTalk、Profile、Search、`/api/health`，并刷新一个深层 SPA 地址。本机 curl 通过不能证明云端入站访问已放通。

排障时使用：

```bash
systemctl status finpilot
journalctl -u finpilot -n 100 --no-pager
nginx -t
curl http://127.0.0.1:8000/api/health
```

另有 `/www/finpilot/logs/backend.log`、`/www/wwwlogs/finpilot.error.log`。不要将包含私人请求或账户内容的日志提交到 Git。

## 旧版 4173

脚本只报告监听 PID，不会停止它。必须先完成上述公网功能验收，再在服务器用 `ss -ltnp 'sport = :4173'` 查 PID，并通过 `ps -p 实际PID -o pid,lstart,args` 与 `/proc/实际PID/cwd` 确认它确实属于旧 FinPilot Vite preview。确认不是监督程序重启的进程后，才对**该实际 PID**执行 TERM，再确认端口不监听。本轮没有远程识别，因此不提供猜测 PID 或宽泛的杀进程命令。

## 验证范围与模板依据

已在本地做 Bash 语法检查、路径与操作顺序检查、Nginx 路径转发与 SPA 模板审查、systemd 权限及命令审查。未运行远程部署、Linux systemd-analyze 或真实服务器 nginx -t；后两项不能以本地文本审查替代，部署脚本会执行实际 Nginx 检查。

模板依据：[Nginx proxy_pass](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_pass)、[systemd.exec](https://www.freedesktop.org/software/systemd/man/latest/systemd.exec.html)。不新增 Docker、PM2 或其他运行架构。
