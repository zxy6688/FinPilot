# FinPilot V3 · Gate A1 定向返工审查

> 后续状态：用户独立审查确认整体视觉基本达标。本页保留返工轮次记录；最新两项 P0 修复、分流语义与测试以 [P0 收尾报告](a1-p0/REVIEW.md) 为准。仍等待最终确认，尚未冻结基线或进入 Gate B。

**AWAITING HUMAN GATE A1 REVIEW**。Gate A 人工视觉验收未通过；本包是定向返工候选，不表示视觉批准，也不进入 Gate B。

## 打开实际页面

- 前端：http://127.0.0.1:5176/
- 后端：http://127.0.0.1:8004/api/health
- Demo：`demo@finpilot.app` / `demo123456`；AI Demo Mode。
- [Decoder](http://127.0.0.1:5176/decoder/purchasing-power)、[Money Lab](http://127.0.0.1:5176/money-lab)、[Concept Studio](http://127.0.0.1:5176/concept-studio)、[Fin 角色设定](http://127.0.0.1:5176/fin-design)。
- 本地后台进程继续保留，PID 在 `tmp/local-runtime.json`，日志在 `logs/`。这些运行数据不会打入 ZIP。

## 先看视觉证据

主视觉目标明确为 [02_APPROVED_RICH_DIRECTION.png](visual_refs/02_APPROVED_RICH_DIRECTION.png)，次级参考为 [01_approved_initial_visual.png](visual_refs/01_approved_initial_visual.png)。两张均已实际打开并对照。此前“没有找到已认可参考图”的说法不再适用。

[三方并排对照](a1/comparison.png) · [可放大的对照 HTML](a1/comparison.html) · [本轮截图索引](a1/SCREENSHOTS.md) · [一页视觉差距表](a1/VISUAL_GAP.md)。原 Gate A 截图作为历史证据保留，未覆盖。

## 本轮改变

1. 首页改为原创绘制的明亮探索桌场景：窗景、植物、书页、计算器和 Fin 有前中后层次。真实标题、表单和按钮仍为 HTML；没有使用整张参考设计图当网页背景。画中的无标注图表仅是插画，不是金融数据。
2. 三任务加入差异化预览：购买力专题摘要与来源类型；实际 savings API 的金额和逐月曲线；ETF 形式 × 指数策略的二维预览。没有复制概念图的日期、进度和收益数字。
3. Fin 改为同一角色的高质量透明原画图集，呈现三视、五表情、五静态动作。网页通过 SVG 视窗显示原始 PNG 的对应区域；SVG 只是裁切容器，不是旧版几何角色。点击/Enter 打开 Fin 时显示挥手，工具保存成功后显示递票，概念卡保存后显示收进手册；静态姿态不冒充连续角色动画。支持键盘与减少动态效果。
4. 手机首页改为紧凑 Hero + 三条含内容预览的入口，390×844 下入口在底部导航上方完整出现；Logo 改用罗盘，首页不再重复放置页头小 Fin。
5. Money Lab 加入实际目标覆盖比例和分色的 A/B 结果卡；保存恢复、原计算模型、现金流图和期限对比保留。Concept Studio 改为可点击二维矩阵，三个案例高亮真实分类交点，第四格仅解释分类位置，不伪称已增加第四个完整案例。Decoder 保留六节正文与通胀实验，补充来源、推演、验证的证据入口。
6. 问题分流改为具体主题优先：购买力不会被泛化的“存钱”抢先匹配；ETF 与储蓄/通胀混合提问、空输入和未知输入显示明确入口选择。这是导航规则，不是 AI 意图理解。

## 建议人工走一遍

1. 首页输入“存钱为什么不等于购买力不变？”→ 应进入购买力长文；输入“每月存钱还是买ETF”→ 应出现入口选择。
2. 首页 Mini Lab 把月存 500 改到 1,000 → 金额和曲线随真实 API 更新 → 进入完整工具核对参数。
3. Money Lab 把利率设 0、固定方案 B，再把月存设 700 → 当前 18,800、原方案 14,000、差额 4,800 → 保存小票 → 手册恢复 → 刷新后参数仍是 700。
4. Concept Studio 点击三个交点 → 两维分类与解释同步；先选错误答案，再选正确答案 → 保存概念卡。
5. Decoder 将通胀从 3% 改为 0% → 三年购买力从 9,151.42 变为 10,000 → 保存一句发现。
6. 手机点击场景中的 Fin、试试键盘 Enter/Tab/Escape，并查看角色设定页。请以实际页面判断美术、密度、可读性及角色品质。

## 本轮验证范围

- TypeScript 检查与 production build 实跑通过。
- 本轮重新运行 `backend/tests/test_redesign.py`：16 passed。存在依赖弃用提示及 pytest 缓存目录权限提示，不影响测试结果；测试使用 V3 `tmp/test-finpilot.db`，没有重置运行数据库。
- 12 条提问分流用例通过，见 [routing-check.json](a1/routing-check.json)。
- 核心桌面流程、390 手机触控、375/390/430/768 无页面横向溢出、Demo 登录、原能力入口、保存恢复、Fin 键盘流程通过，见 [browser-check.json](a1/browser-check.json) 与 [mobile-check.json](a1/mobile-check.json)。浏览器检查没有记录页面错误或失败 HTTP 请求。
- **未宣称重新运行全部 78 项后端测试。** 本轮结果不替代人工视觉验收。

## 产品边界与 Git

[功能清单](a1/FEATURE_MATRIX.md) 区分已实现、部分实现、未实现。新发现手册和 Receipt 仅保存于当前浏览器、按访客/账户分区，仍不跨设备同步。旧账户 API 能力保留。

分支 `v3`，HEAD `aebfa7bc0ca53d6eaba046551cad0a8edc1ef1df`。Gate A 与 A1 都是未提交工作区改动，ZIP 从实际工作目录获取，不使用 git archive。没有提交、推送、服务器操作、V4 或 Gate B 开发。main 与 v2 保持原提交及干净工作区。

美术原画使用内置 image_gen，资产与提示词说明见 [IMAGE_PROMPTS.md](a1/IMAGE_PROMPTS.md)。图集是静态姿态，暂无连续表情/骨骼动画；这项限制已明确。视觉品质是否达标由人工审查决定。
