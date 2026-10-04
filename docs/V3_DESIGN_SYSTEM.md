# V3 Design System — Soft Editorial Finance

目标：清新、柔和、克制，有生命感。交互更完整，但默认画面更简单。视觉质量是设计判断，不以未经开展的用户研究背书。

## Tokens

| Token | Value | 用途 |
| --- | --- | --- |
| Background | `#F7F8F5` | 温和底色 |
| Surface | `#FFFFFF` | 少量承载输入 / 决策的面板 |
| Ink | `#172126` | 标题与主文字 |
| Secondary | `#667177` | 支持文字 |
| Muted text | `#778388` | 比原始草案稍深，改善小字可读性 |
| Teal | `#356B73` | 主动作、关键关系 |
| Soft teal | `#82B3B2` | 轻线、节点光晕 |
| Sage | `#9ABBA5` | 柔和反馈 |
| Amber | `#D7A65B` | Fin 的局部细节 |
| Lavender | `#A39ABB` | 领域细节，非大面积背景 |

每屏以青绿与灰绿为主，领域颜色不铺成彩色卡片墙。`living/living.css` 在原样式后加载，渐进替换而不引入 UI 框架。

## Type and space

主容器最大 1248px；桌面 Reader 为 150 / 自适应至 750 / 190px 三栏。正文 17px、1.85 行高；H1 32–48px，Home 按视口扩展。中文使用系统字体，英文编辑栏目用 Georgia；不依赖外部字体网络请求。

以 8px 间距为基准，主段落间隔约 48–72px，主要面板圆角 18–22px。列表优先分隔线和留白。数字只在任务、实验模型值或主动打开的证据详情中出现，不做 KPI 墙。

## Page patterns

- Home：文字与 mini constellation 为双焦点；一主 CTA。Today 一个，Continue 两个上限，Signal 一个。
- Article / Lesson：正文优先，细目录与安静 Context rail。Glossary 是可关闭的轻面板；只有实际选中文字才弹出工具。
- Review：移除主导航，一次一个问题，短反馈，无总分。Recall 先回想再展开选项。
- Compare：两列概念、一个例子、一个快速检查。手机端自然叠放。
- Route：细时间线 + 当前一步。手机横向滚动的是步骤轨道，不是整个页面。
- Lab：先预测单页，再进入参数与结果；反思在结果之后。
- My World：先星图和一个下一步，后放记忆与路线。Notebook 以自己的文字为主体。
- Discover：编辑式 lead、两篇解释、分隔线文章目录；每次追加 6 篇。

## Constellation

Mini 使用七个真实 Topic 的稳定布局；优先放入最近接触的三个。Full 展示全部 24 个主题和真实 TopicRelation，位置稳定、轻微错落，减少刷新跳动。节点有文字状态、键盘入口和可见 focus；hover / focus 强调相关边。连接只有保存 UserConnection 后才实化。证据百分比藏在 details 中。手机版 full 图在自己的区域内横向查看，页面本身不横向溢出。

点击节点打开图内轻面板，可看定义、关联、课程、Lab、真实资料和 Ask Fin，再去完整主题。Escape 关闭。公共 Explore 与个人 Knowledge 共享组件但使用不同 read model。

## Fin and motion

SVG 原创构造，小体积、眼睛、不完整罗盘环；主要尺寸 54–70px，普通提示 28–36px。seed 保留安静轮廓；实际完成学习后出现完整表情与领域细节。没有 3D、粒子、重型动画资源。

交互约 180ms；moment 约 600ms 出现；ambient 约 9s、仅小幅浮动。major 提示停留约 2s，不抢焦点。`prefers-reduced-motion` 关闭 ambient 和出现动画。

## Responsive and accessibility

验收宽度 375、390、430、768px，桌面 1440px。移动 Home 将 CTA 放在 mini map 之后；Reader 单栏；输入不被浮层遮挡。使用真实 button/link、可见焦点、原生 dialog focus containment、Escape 关闭、表单 label、状态文本和 loading skeleton。色彩之外也提供状态文字。API 错误提供重试，不以空白页掩盖失败。

## Visual review

Gate A 与保留的 V1/V2 实际截图比较：取消首页多块等权卡片，主 CTA 更聚焦。Gate B 检查正文、比较、复习；Gate C 修正手机路线容器的最小宽度；Gate D 检查个人星图与 Fin；Gate E 修复来源日期 `null`、文字按钮背景与阅读状态带来的布局跳动。截图均来自实际页面，索引见 [V3_SCREENSHOTS](V3_SCREENSHOTS.md)。
