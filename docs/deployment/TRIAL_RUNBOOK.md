# FinPilot V3 · 队友 HTTPS 体验环境

这是 Gate B-K 的隔离试用发布，不是 Gate C，也不是固定域名正式上线。
生产 React build、FastAPI、SQLite 通过同一个 HTTPS 入口工作。

## 进入方式

当前临时地址：https://west-removal-entrance-yearly.trycloudflare.com/

邀请口令保存在仓库外 `D:\finpilot开发\trial-runtime\INVITATION.txt`。
只私下转发给队友，不放入 Git、截图或公开页面。
先输入口令，再在“我的世界”注册自己的账户。共享 Demo 已禁用。
访客可探索，但登录才会保存到试用数据库。不要填入真实金融资料或复用常用密码。
顶部“测试版本 · AI Demo”标识和反馈链接在所有页面显示。
反馈页说明如何向邀请人报告 URL、步骤和截图，不把个人内容发给外部服务。

## 运行与数据

- 开发预览仍为 `http://127.0.0.1:5176/`，不暴露到公网。
- 试用服务只监听 `127.0.0.1:8186`，由 cloudflared 提供临时 HTTPS。
- `trial-runtime/releases/<时间>-<commit>/`：独立代码和生产构建快照、逐文件 SHA256。
- `trial-runtime/data/trial.db`：全新试用库，未拷贝开发库或旧站库。
- `trial-runtime/private.json`：独立 JWT 和门禁签名密钥，仅本地保存。
- `trial-runtime/backups/`：每次启动、更新、回退前的 SQLite 一致性备份。
- `trial-runtime/logs/`：私有服务、隧道与应用日志。
- `trial-runtime/state.json`：版本、PID、进程创建时间；停止前核验身份。
- Windows ACL 限制为当前用户与 SYSTEM；不会写入项目源码包。

关机、休眠、断网或停止隧道会中断访问。没有启用开机自启动。
隧道重启通常生成新的地址，不能把此地址当作长期固定域名。
更新仅重启独立试用后端，保持隧道运行，所以通常保持原链接。

## 更新、回退、停止

在 `D:\finpilot开发\v3` 执行：

```powershell
.\scripts\Update-Trial.ps1
.\scripts\Rollback-Trial.ps1
.\scripts\Stop-Trial.ps1
.\scripts\Start-Trial.ps1
```

分别是：构建并发布当前 v3、切回上一代码构建、仅停止试用环境、恢复试用并启动隧道。
`Start-Trial.ps1` 后在 `trial-runtime/logs/tunnel.log` 查看最新 HTTPS 地址。
无需重装依赖、重新配置 DNS 或改动旧服务器。
用户也可以直接要求“把最新 FinPilot 更新到体验站”，由 Codex 检查 v3、测试并执行更新。

每次发布记录基础 commit、工作区状态和源码文件哈希，未提交改动不会静默遗漏。
更新失败且存在上一版本时，会尝试恢复旧代码服务；失败会报错并保留文件。
回退脚本**仅回退代码，不回退数据库**。数据库备份不是自动覆盖恢复操作。
以后若发生不兼容数据库迁移，必须另行设计恢复步骤；不能用旧代码强行读新结构。
初次启动必须先完成一次 `Update-Trial.ps1`。已有依赖复用当前 Python 虚拟环境；
未来依赖升级应先验证兼容性，此环境没有声称做到跨依赖版本的一键回退。

## 安全边界

邀请门禁：口令哈希校验，24 小时签名 Cookie，Secure / HttpOnly / SameSite=Strict。
应用账户：独立登录，保存记录按用户归属校验，重复保存幂等。
无门禁不能请求 API 或静态应用；公开健康端点只返回状态、版本和试用标记。
屏蔽 API 文档、隐藏路径、数据库与日志文件；限制请求体 256 KiB。
邀请与认证端点每个来源每分钟最多 12 次，普通请求每分钟 600 次。
这些是单进程试用保护，不是面向高并发或恶意攻击的生产级 WAF。
AI 仍为 Demo，不传入外部大模型密钥。口令可转发，因此只应邀请可信队友。

## 旧站、域名与费用

旧 `http://43.143.241.109:4173/` 只读检查返回 200，未修改或停止其进程。
没有修改 `/www/wwwroot/finpilot.cn`、Nginx、DNS、安全组或 ICP。
DNS 实查：`finpilot.cn` 仍指向 43.143.241.109，`preview.finpilot.cn` 不存在 A 记录。
未找到可直接使用的境外主机或 Cloudflare 账户配置；没有声称完成云账户资源审计。
本轮没有购买资源或订阅。临时隧道免费；本机运行仍消耗电力与现有网络。
固定域名、独立境外主机与不依赖个人电脑的长期运行尚未完成。

## 验证证据及范围

- `security-checks.json`：真实试用服务门禁、隔离、限流、请求限制、五工具 API。
- `browser-checks.json`：本机 Chrome 经公网 HTTPS 完成真实注册、页面、保存恢复、刷新、手机视口。
- `screenshots/`：实际生产构建截图，不是概念图。
- `external-health.json`：美国 Buffalo、新加坡独立 Globalping 探针 HTTP 200。
  这证明独立外网 HTTPS 连通性；不等于两地探针完成了登录后的全部 UI 操作。
- 大陆手机蜂窝网络尚未实测，不能保证所有地区网络均可访问。
- `external-gate.json`：独立新加坡探针确认未邀请的访问返回 401 门禁页面。
- `lifecycle-checks.json`：实际重启、回退、切回最新构建；保存记录摘要不变，
  SQLite 完整性检查通过，备份存在，隧道 PID 保持不变。
- 全量后端回归：163 passed（69.25 秒）。两项非阻塞警告：
  Starlette/httpx 弃用提示、pytest 缓存目录写权限；测试本身均通过。
- TypeScript 与生产构建通过；仍有主 JS chunk 大于 500 KiB 的构建体积提醒。
- 最终生产截图 24 张，覆盖桌面、四种手机/平板宽度、五专题、五工具和 Fin Demo。

Cloudflare 官方说明：Quick Tunnel 是临时测试用途，没有作为固定生产站点的承诺。
参考：https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/
