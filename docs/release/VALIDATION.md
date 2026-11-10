# V3 发布验证

2026-11-10，Windows，Node 24.18.0、Python 3.13.2。

- 后端：165 项通过；存在 Starlette 弃用提示与本地 pytest 缓存权限提示，不影响断言结果。
- TypeScript 与 Vite 生产构建通过。全新目录 release-verification-20261110 从 GitHub main 克隆，独立 npm ci / venv 安装后，TypeScript、构建及 165 项后端测试通过。
- Linux CI 首次发现历史资源审计使用 Windows 反斜杠路径；已修复测试跨平台路径处理，并仅允许 Git 的 CRLF/LF 检出差异，保留内容哈希断言。
- 宠物行为：18 项断言通过；120 条脚本 ID 唯一、30 类触发可选、输入抑制、频率限制与防重复测试通过。修复测试加载器对单双引号的依赖。
- npm audit 与 pip-audit：修复已报告的 Vite、source-map-js、Black、certifi 问题后，均无已知漏洞报告；这不代表不存在未披露漏洞。
- SQLite 在线备份完整性检查与临时副本恢复通过。修复 Windows 上连接未关闭导致临时副本无法清理的问题。此项是本地演练，不是生产恢复证明。
- Git 历史文本扫描：577 个唯一历史文本对象及当前候选文件未发现匹配的真实凭据。扫描范围与局限见 SECURITY_SCAN.json。
- 香港 SSH 尚未授权，DNS 仍指向旧服务器；线上账户隔离、持久性、Caddy HTTPS、服务器回滚与备份恢复尚未验证。

截图来自真实 V3 本地浏览器审查记录，不作为香港已上线的证据。Fin 仍是程序化美术候选，手机性能测试不能替代真机温度与耗电评估。
