# Gate A1 · 两项 P0 收尾审查

**AWAITING HUMAN GATE A1 REVIEW — 等待用户最终确认。** 用户已确认整体视觉基本达标，本轮没有整体重设计、替换 Fin 或进入 Gate B。视觉基线尚未正式冻结。

## 实际页面

- [首页](http://127.0.0.1:5176/)；[后端健康](http://127.0.0.1:8004/api/health)。现有后台进程保持运行。
- 改动保留在 `v3` 未提交工作区，HEAD 仍为 `aebfa7bc0ca53d6eaba046551cad0a8edc1ef1df`。

## P0-1：手机文字与 Fin 分开

保留原 Hero 图片、Fin 素材、字体、色彩与三任务入口。仅调整移动端图片显示比例/位置、文字占位和左侧背景遮罩，不通过隐藏 Fin 或缩小主标题解决问题。桌面主视觉保持原图与构图。

| 视口 | 主标题字号 | 标题末端至 Fin 点击区间距 | 页面横向溢出 | 截图 |
|---|---:|---:|---|---|
| 375×844 | 29px | 12.25px | 无 | [375](screenshots/home-375.png) |
| 390×844 | 29px | 22px | 无 | [390](screenshots/home-390.png) |
| 430×844 | 29px | 48px | 无 | [430](screenshots/home-430.png) |
| 768×1024 | 36px | 137.34px | 无 | [768](screenshots/home-768.png) |
| 1440×900 | 43px | 345.11px | 无 | [桌面](screenshots/home-1440.png) |

几何检测只是辅助；上述截图已实际打开查看。三个手机宽度下任务入口底部为 764px，底栏从 779px 开始，有 15px 间隔。各宽度实际点击 Fin 可打开弹层，Esc 可关闭。

[手机修复前后对照](mobile-comparison.png) · [认可图/A1/P0 桌面对照](desktop-comparison.png)。对照图等比排版；原图独立保留，没有改画截图。

## P0-2：寻找已有内容，不冒充任意问题解答

- 输入前即可看到“寻找相关探索内容”和“这是内容导航，不会直接生成问题答案”。提交按钮改为“找内容”。
- 只有完整匹配白名单中的五个已有专题标题时直接导航；只忽略大小写、全半角、空白及少量标点，不模糊匹配、不提取计算参数。
- 普通关键词只用于排列相关入口，不能触发自动跳转。单主题提示“相关，但不一定能回答具体问题”；多主题提示自行选择；未匹配明确标记通用入口；空输入给出输入提示。
- 每个建议说明实际能力边界。数字提问不会默认当成已被计算，贷款建议明确标明当前只有导读。
- 原始问题保存在当前标签页 sessionStorage；返回首页、刷新可恢复，清空输入即可清除草稿。存储不可用时保留当前组件内的输入，不声称跨设备同步。
- “带着原问题去问 Fin”复用已有 Copilot 的 `q` 参数预填，完整保留空白和标点；**不自动发送**，并明确当前本地为 Demo 演示。没有新增意图识别系统、模型调用或后端服务。

### 交互证据

| 情况 | 验证的行为 | 截图 |
|---|---|---|
| 精确专题 | “存钱为什么不等于购买力不变？”进入对应长文，返回仍保留问题 | [匹配后](screenshots/question-exact-match.png) |
| 数字问题 | “每月存1000元三年后有多少”留在首页，显示工具能力说明，用户自行选择 | [相关内容](screenshots/question-related.png) |
| 混合主题 | “每月存钱还是买ETF？”列出两种内容，不代用户选方向 | [混合主题](screenshots/question-mixed.png) |
| 无匹配 | 明确没有对应专题，下面是通用入口 | [未匹配](screenshots/question-unmatched.png) |
| 空输入 | 显示输入提示，不跳转、不自动提问 | [空输入](screenshots/question-empty.png) |
| 易误跳转 | “每月还款1000元”仅建议贷款导读，不进入储蓄计算器 | [错误跳转回归](screenshots/question-loan-not-savings.png) |
| 继续提问 | 原文预填至 Copilot；请求计数确认没有自动 POST /api/chat | [保留原问题](screenshots/question-preserved-in-copilot.png) |

## 本轮测试

- `npm run typecheck`：通过。
- `npm run build`：通过，2418 modules transformed。
- `node scripts/redesign-a1-p0-check.mjs`：24 条分流分类断言与同样 24 条真实浏览器提交行为全部通过；含精确标题、大小写/全半角、空输入、未匹配、混合、否定变体、具体产品问题、还款误跳转等。
- 额外覆盖选择建议、浏览器返回、刷新恢复、清空草稿、Copilot 原文预填、不自动发送、五种宽度及 Fin 点击。
- 控制台错误 0，失败 HTTP 请求 0。详细结果：[checks.json](checks.json)。
- 后端代码本轮未改动，未声称重跑旧 16/78 项后端测试。上轮 A/A1 截图与测试报告保留为历史；原关键词自动跳转相关旧断言已被本轮行为和测试取代，不把旧报告当作新验证。

## 实际修改文件

产品代码仅三个文件：

| 文件 | 修改 |
|---|---|
| `frontend/src/redesign/a1.css` | 手机图文安全空间、内容导航与建议区样式 |
| `frontend/src/redesign/Home.tsx` | 明示能力、建议选择、原文保留与 Copilot 预填链接 |
| `frontend/src/redesign/questionRouting.ts` | 精确专题白名单与只建议不跳转的分类 |

新增/更新测试、说明与规则：

- `scripts/redesign-a1-p0-check.mjs`：本轮自动化检查与截图。
- `AGENTS.md`：后续工作入口约束，引用长期视觉标准。
- `docs/redesign/VISUAL_ACCEPTANCE_STANDARD.md`：纳入用户的六项视觉不退化要求，注明尚未正式冻结。
- `README.md`、`docs/redesign/GATE_A1_REVIEW.md`：链接当前收尾结果，保留历史记录。
- `docs/redesign/a1-p0/`：本报告、12 张真实截图、桌面/手机对照 PNG 与 HTML、测试结果、截图哈希及源码保护核验。

完整文件变更核验见 [source-integrity.json](source-integrity.json)。原画与角色素材均未改动，main/v2 未改动，没有清理 A/A1 未提交源码，没有部署、提交或推送。

## 长期视觉约束

[长期视觉验收标准](../VISUAL_ACCEPTANCE_STANDARD.md) 已写入项目，并由根目录 AGENTS.md 引导后续开发遵守。`02_APPROVED_RICH_DIRECTION.png` 仍是最终视觉目标，Gate A1 是已有实现基础；重大视觉调整须先获用户同意。后续重要页面必须同时完成内容、插画/图形、交互、响应式及真实桌面/手机视觉验收。

**等待用户最终确认后再正式冻结基线；本轮没有启动 Gate B。**
