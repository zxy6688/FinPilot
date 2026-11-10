# 生产状态

核查日期：2026-11-10。

- 目标服务器：43.161.236.93，香港 Lighthouse。
- SSH 22 可连通，但已有本机密钥登录 ubuntu/root 被拒绝；Ubuntu 版本尚未核实。
- DNS：finpilot.cn 与 www 当前均指向旧地址 43.143.241.109，尚未切换。
- 香港站点、Caddy HTTPS、防火墙规则、线上注册保存、生产重启持久性与生产恢复演练：尚未执行，不宣称成功。
- GitHub 旧 main 已备份到 backup/main-before-v3-20261110；完整 V3 已正常快进到 main，未改写历史。正式标签与独立验证结果见 GitHub Release。

不应把当前域名返回的旧站当成新 V3 的上线结果。
