# 香港生产维护

正式网站：https://finpilot.cn 。[当前已验证状态](PRODUCTION_STATUS.md)。以下为操作说明，本次 README 整理没有执行部署。

## 更新原则

本地修改 → 测试 → 审查并正常推送 GitHub main → CI 通过 → **人工批准** → 生产更新。

GitHub Actions 只运行测试和构建，没有生产部署任务。`main` 文档更新不会自动改变 `v3.0.0` 或正在运行的版本。发布脚本要求干净工作区；同一 SHA 的已有服务器目录不会被覆盖。

## Windows 维护者入口

已有本机维护环境使用：

```powershell
# 仅测试和打包
powershell -NoProfile -ExecutionPolicy Bypass -File "D:\finpilot开发\Publish-FinPilot.ps1" -Mode Package
# 取得本次发布授权后
powershell -NoProfile -ExecutionPolicy Bypass -File "D:\finpilot开发\Publish-FinPilot.ps1" -Mode Deploy -ApproveProduction
```

也可双击本机 `D:\finpilot开发\Package-FinPilot.cmd`，它只打包。以上两个文件位于仓库外，不随 clone 提供；包装脚本设置 `VITE_TRIAL_MODE=true`，使用已经配置的 SSH，并调用仓库内发布工具。不要向他人发送私钥。

## 其他已授权维护机器

先按 README 安装依赖，配置并验证自己的 SSH 公钥与主机指纹；使用干净、已测试且已推送的提交。仓库提供 `scripts/Release-Production.ps1`，其默认 SSH 用户为 ubuntu，实际香港实例当前使用 root，因此必须显式指定：

```powershell
# 在仓库根目录，生产前端隐藏共享 Demo 入口
$env:VITE_TRIAL_MODE='true'
try {
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts/Release-Production.ps1 -Mode Package
} finally {
  Remove-Item Env:VITE_TRIAL_MODE -ErrorAction SilentlyContinue
}
```

正式授权后，将 `-Mode Package` 改为 `-Mode Deploy -SshUser root -Server 43.161.236.93 -ApproveProduction`。后端仍独立禁用共享 Demo；前端开关不能替代后端校验。不要把本地 `.env`、SQLite 数据或 GitHub 凭据上传到服务器。

本地构建可避免 2GB 服务器承担 Node 编译。新代码位于 `/opt/finpilot/releases/<SHA>`；`activate.sh` 校验健康并切换 `current`，失败则恢复旧程序链接，数据库仍在 `/var/lib/finpilot`。

## 程序回滚

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/Release-Production.ps1 -Mode Rollback -ReleaseSha <已部署的完整40位SHA> -SshUser root -ApproveProduction
```

只切换程序，不替换数据库。已演练 `ab4a29c` → `7e7c008` → `ab4a29c`，期间保存记录可读。破坏性迁移不适用这个通用方案，必须先另行设计数据恢复。

## 备份、日志与健康

```bash
systemctl status finpilot caddy finpilot-backup.timer
journalctl -u finpilot -n 100 --no-pager
sudo python3 /opt/finpilot/current/deploy/production/backup.py
sudo python3 /opt/finpilot/current/deploy/production/verify-backup.py /var/backups/finpilot/某个备份.db
systemctl list-timers finpilot-backup.timer
curl --fail https://finpilot.cn/api/health
```

在线备份保持 WAL 一致性，恢复验证在临时目录进行，不改生产数据库。每日 03:15 生成服务器内备份；用户未授权异地复制，**服务器彻底损毁时，同机备份不能承担灾备**。当前保留所有备份，定期检查磁盘；删除或异地转存须另定方案。

实际灾难恢复需要停本项目服务、保存现有库与 WAL，再恢复经过验证的备份；不能直接把本段当作无损的一键恢复承诺。

## 首次安装与网络边界

首次安装已完成，无需重复执行 bootstrap、改 DNS 或申请证书。未来新主机须先核对 OS、磁盘、现有站点和权限；`deploy/production/bootstrap.sh` 不覆盖未知 Caddy/Nginx 站点。生产密钥存放 `/etc/finpilot/production.env`，权限 0600；应用低权限运行。Caddy 自动 HTTPS；TCP 22/80/443 开放，FastAPI 8004 回环。不得关闭 SSH 安全防护来解决登录问题。

每次发布后至少实际验证注册登录、五大页面、计算与保存恢复、账户隔离、Fin、HTTPS 与备份；仅 HTTP 200 不代表全部业务通过。
