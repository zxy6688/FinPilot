# 香港生产操作

## 首次部署

先以已有授权 SSH 登录 `43.161.236.93`，检查 `/etc/os-release`、`id`、`df -h`、`free -m`、`ss -lntup`、`ufw status verbose` 和现有服务。不要停止不属于本项目的服务。

当前 SSH 密钥尚未获准，不能从本地推断服务器 Ubuntu 版本或已安装软件。腾讯云入口：Lighthouse 实例 → SSH 密钥/绑定密钥；只绑定本机公钥，不传输私钥。DNSPod 凭据也不进入仓库。

1. 在干净、已测试的 main 检出中执行 `scripts/Release-Production.ps1 -Mode Package`。构建在本地完成。
2. 上传 `tmp/production/<SHA>.tar.gz` 到服务器临时目录，解压到新的 `/opt/finpilot/releases/<SHA>`，不覆盖已有版本目录。
3. root 执行该目录下的 `deploy/production/bootstrap.sh`。脚本遇到已有 Nginx/Apache 或不同 Caddy 配置会停止，不覆盖未知站点。
4. 检查 `/etc/finpilot/production.env` 权限 0600；随机 JWT 密钥由服务器生成，生产禁用共享 Demo。确认 Python 版本符合锁定依赖要求。
5. 执行 `sudo bash /opt/finpilot/releases/<SHA>/deploy/production/activate.sh <SHA>`。健康失败时恢复旧程序软链接，保留数据库。
6. 确认香港服务正常后，在 DNSPod 检查并备份现有记录，再将 `@` 与 `www` 的 A 记录改为 `43.161.236.93`。检查是否有旧 AAAA/CNAME 冲突。不要盲目删除其他业务记录。
7. Lighthouse 防火墙及主机防火墙允许 TCP 80/443；SSH 22 尽量仅允许管理来源。FastAPI 8004 只监听回环，不公开。修改 UFW 前保留当前 SSH 规则，避免锁出。
8. DNS 生效后让 Caddy 申请证书，验证 HTTPS 和 www 到根域的跳转。Caddy 使用官方的[自动 HTTPS](https://caddyserver.com/docs/automatic-https)与[反向代理](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy)。

## 常规更新（推送不会发布）

本地修改 → 完整测试 → 人工审查并更新 GitHub main → 新检出验证 → 人工批准部署。

Windows：

```powershell
# 只测试打包，不访问服务器
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/Release-Production.ps1 -Mode Package
# 人工批准后，使用实际 SSH 用户
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/Release-Production.ps1 -Mode Deploy -SshUser ubuntu -ApproveProduction
```

`Release-Production.cmd` 双击仅打包。GitHub Actions 只有构建和测试，没有服务器凭据，也没有部署任务。

## 回滚

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/Release-Production.ps1 -Mode Rollback -ReleaseSha <完整旧SHA> -SshUser ubuntu -ApproveProduction
```

只回滚程序版本，不恢复旧数据库。发布前必须保证迁移对旧程序兼容；破坏性迁移需要单独方案。新版本失败后查看 `journalctl -u finpilot`，不要重置数据库。

## 备份与恢复演练

每日 systemd timer 在线备份数据库，保持 WAL 一致性。手工运行：

```bash
sudo python3 /opt/finpilot/current/deploy/production/backup.py
sudo python3 /opt/finpilot/current/deploy/production/verify-backup.py /var/backups/finpilot/某个备份.db
systemctl list-timers finpilot-backup.timer
```

演练只在临时目录恢复副本并检查完整性，不改生产库。真实灾难恢复须先停止本项目服务、额外保存当前损坏库与 WAL，再按已验证备份恢复；不能把程序回滚误当数据恢复。当前不自动删除历史备份，须监控 40GB 磁盘，并定期安全转存到异地后制定保留策略。

## 必须实测的生产清单

注册/登录；A/B 用户不可互读、改名或删除记录；五大页面与 Fin；五套计算与保存恢复；正式复习和历史入口；服务重启后记录仍在；备份恢复副本；指定旧 SHA 的程序回滚与再次发布；HTTP→HTTPS、www→根域、证书链；公共网络不可直连 8004。

尚未实际执行的项目只能记录为待验证。当前状态见 [PRODUCTION_STATUS.md](PRODUCTION_STATUS.md)。
