# Gate 0 · 审计与保护

基线：v3 / aebfa7bc0ca53d6eaba046551cad0a8edc1ef1df。初始 working tree clean。main 97908aa，v2 a3fa070；三工作树独立。未修改旧站、部署、分支历史或用户数据库。

## 复用
- backend/app/services/labs.py：8 个旧实验公式，保留原实现。
- backend/app/services/v3/：reading / review / misconceptions / route_progress / reflections / moments / transactions；已存在私有归属检查和并发保护。
- backend/app/services/understanding.py、learning_routes.py（路线实际入口见 api/v2.py）：原 Evidence / BFS 不替换。
- backend/app/ai/ 与 frontend/src/components/ContextAI.tsx：原统一 AI 与会话连续性保留。
- content/：24 主题、既有课程/资料/题库，seed.py 加法初始化保留。
- frontend/src/services/auth.tsx / api.ts 与 Modal.tsx：复用登录、统一请求和焦点管理。
- 原路由保留，首页与新工作空间进入 redesign/；旧课程、路线、复习和实验仍可触达。

## 基线验证
2026-10-13：现有 62 项测试首次 61 通过，1 项 copytree 因 C 盘零剩余空间失败。使用 D 盘 tmp 重跑该项通过。不是业务失败。后续测试、Chrome 临时资料与构建缓存使用 D 盘。

## Gate A 边界与风险
- 一个完整 Decoder 专题（购买力），一个后端确定性储蓄规划器，一个 ETF 概念互动；其他四专题保持内容入口和范围声明，不冒称 Gate B 完成。
- Receipt / 发现 / 原型进度仅存此浏览器，按访客或已登录 user.id 分区；明确标注原型，不替代服务器持久化。旧服务器记录不删除。
- 新增储蓄计算 API 无写库；数学测试涵盖零利率、月初/月末、边界、达标月与反推月存。
- 不实现贷款费率内核，因此不宣称已通过贷款测算验收。完整五工具、跨设备保存属于后续 Gate。
- Fin 采用统一可维护 SVG 角色资产；角色与视觉由用户验收，不以自动测试代替。
- 不进入 Gate B/C/D。无部署。本阶段不推送，保留可审查工作区改动。
