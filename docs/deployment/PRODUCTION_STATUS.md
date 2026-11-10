# 生产状态

核查日期：2026-11-10；当前 **https://finpilot.cn 已上线 V3**。此前本文件的 SSH 未授权、DNS 指向旧地址、尚未部署描述已过期。

| 项目 | 已核验状态 |
| --- | --- |
| 服务器 | 腾讯云香港 Lighthouse，43.161.236.93；Ubuntu 24.04.4 LTS，Python 3.12.3 |
| 发布源码 | v3.0.0，`ab4a29c2e6902e2cbd8736d53d8005fbc313c4e5` |
| 前端 | 本地 Vite production build；`VITE_TRIAL_MODE=true` 隐藏共享 Demo 登录入口 |
| HTTPS | Caddy；HTTP 转 HTTPS、www 转根域；证书由 Caddy 自动续期 |
| DNS | 根域和 www 指向香港实例；未修改其他业务记录 |
| 网络 | TCP 22/80/443；API 8004 只监听回环；恢复演练用 8005 已关闭 |
| SSH / 服务身份 | 已验证公钥 root 登录；未放宽 SSH 安全策略；应用以 finpilot 用户运行 |
| 程序 | `/opt/finpilot/releases/<SHA>`，`/opt/finpilot/current` 软链接 |
| 数据 | `/var/lib/finpilot/finpilot.db`；生产密钥 `/etc/finpilot/production.env`，不进入 Git |
| 备份 | `/var/backups/finpilot`；每日服务器时间 03:15，root 限制访问 |

## 实际验收

注册、登录、账户隔离、五大页面、五套计算器、36 个概念、28 节课程入口、八个教学实验、ETF 笔记与实验快照跨登录恢复、My World 预览/重命名/删除及 Fin 偏好保存已完成线上验证。桌面 1440px、手机 390px 实际浏览器截图；另有 375/430/768px 回归。

数据库记录在服务重启后仍存在。服务器备份在临时目录恢复，并以隔离实例实际验证登录、记录隔离、计算与学习；未替换生产库。程序从正式版本回滚到兼容 V3 `7e7c00899f40cbf5174a15cac91a8a335b01271a`，确认记录后再切回正式版本。

首次上线的原始操作报告保留在维护者本机 `D:\finpilot开发\production-review-20261110`；不将包含测试账户上下文的原始日志公开。公开 README 截图另用隔离访客重新拍摄，见 [来源清单](../readme/ASSETS.md)。本轮 README 更新不重新部署，也不更改上述发布 SHA。

## 局限

- 用户明确选择仅保留服务器备份，没有下载生产数据库到本机；**没有异地灾备**。
- 目前不自动清理旧备份，须监控 40GB 磁盘空间。
- 程序回滚依赖兼容性迁移，不是数据库回滚。
- Fin 为程序化美术候选，AI 为 Demo；手机模拟不能证明实体设备温度或续航。
- 这是一份日期固定的验收记录，不是持续可用性保证。

[更新和回滚操作](PRODUCTION.md) · [源码验证](../release/VALIDATION.md)
