# Gate B 代码与数据变更

## 基线

A1/P0 独立提交 `26b9da5c739bd92372cff140acd91c41aaae0f2b`。其前身为 `aebfa7bc0ca53d6eaba046551cad0a8edc1ef1df`。仅在v3本地实施，未推送或部署。

## 前端

- Catalog：五工具目录、杂志专题页、真实搜索目录；Home维持冻结构图并连接真实记录。
- Stories/Loan/Bonds/Etf：原创长专题、插画、图解、练习与发现保存。
- Experiments/TimeTools/MoneyLab：后端计算、实时图形、固定A/当前B、校验、保存与恢复。
- state：账户成果API与访客localStorage明确分开；保留旧A1本机记录并标明存储范围；不会将访客记录偷偷上传。
- ReadingMemory：复用已有ReadingState，记录专题位置，不把阅读自动宣称掌握。
- FinChat/Copilot：原会话接续、带页面/选文/模型输入上下文；切换新会话清除无关上下文。
- RestoreNotice：不存在或不可读的记录明确报错，不把默认参数显示成恢复成功。
- 新增 gate-b.css；未替换a1.css、首页主插画、Fin图谱与既有导航架构。

## 后端

- services/finance.py：预算、复利、通胀、贷款、债券纯模型。
- savings.py：扩展利率口径，旧默认与月初/月末行为保留。
- api/v3.py：新增模型端点；ReadingState扩展story类型。
- services/redesign_catalog.py 与 reading/today：五专题位置、继续阅读链接。
- ai/redesign.py 与 contextual/schemas：受限上下文输入，后端重新核算模型，复用现有聊天认证与会话。
- api/artifacts.py + models_v3.LearningArtifact：新增版本化学习成果，未删除或更改旧表字段。

## SQLite 兼容性

新增 `LearningArtifact` 表使用现有SQLAlchemy建表启动路径，`create_all` 只补缺失表，不drop旧库。列为 id、user_id、client_key、snapshot、created_at；(user_id,client_key) 唯一。接口依账户过滤；同键同内容返回原记录、同键不同内容409，异主访问404；事务沿用现有write_db锁与SQLite写事务。

运行仅使用v3自己的目录和数据库。pytest强制使用 `tmp/test-finpilot.db`；其drop/reseed仅针对测试库。实际运行数据库不归档，seed及content足以重建Demo。

## 测试与素材

新增 backend/tests/test_gate_b.py、scripts/redesign-gate-b*.mjs、真实截图与检查JSON。四张专题栅格图来源说明见 GATE_B_ASSETS.md。截图里的数字与记录来自公开Demo测试操作，不含实际用户财务记录。

完整修改文件以审查ZIP的 REVIEW_MANIFEST.json 和本地git diff/checkpoint为准。历史A/A1证据保留，不能把旧阶段报告当本轮状态。
