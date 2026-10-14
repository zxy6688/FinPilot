# Gate B 插画来源与创作要求

本轮使用 imagegen skill 的内置 image_gen 生成四张新的专题场景图，均已复制到真实项目目录；没有调用付费API CLI，没有替换首页或Fin。以下是创作要求整理稿，不冒充原始逐字调用日志。实际输出文件可按哈希核验。

共同要求：明亮的自然光、柔和青绿与暖金、精细有层次的编辑插画；前景物件/中景学习场景/背景环境；不是简单扁平图标或普通卡片底图。无文字标题、无品牌标识、不画新的Fin，不把场景当成真实新闻照片。保持已认可的日光工作室气质，图中数字不用于计算或事实证明。

| 真实项目素材 | 内容要求 | 内置工具原始输出名 |
|---|---|---|
| frontend/public/redesign/gate-b/budget-studio.png | 校园窗边桌面、预算手册、生活消费与维修、储蓄容器，表现生活费安排与意外支出 | exec-0a1fe809-2df2-4bdd-8005-22f4b5d54282.png |
| frontend/public/redesign/gate-b/loan-studio.png | 分期日历、账单与钱币、明确费用物件，表现贷款与每期支付时间 | exec-af0086da-fd9c-4197-a14c-86ef3ad1a8d7.png |
| frontend/public/redesign/gate-b/bonds-studio.png | 政策建筑模型、市场层次、桥、利率柱、空白债券凭证，表现政策通过市场影响定价 | exec-0989ba44-d528-490e-9792-e65b138c4ad1.png |
| frontend/public/redesign/gate-b/etf-studio.png | 透明青绿篮子、微缩资产建筑、连接桥与天平，表现基金份额与一篮子资产的关系 | exec-4d5e41ec-3f8a-49de-a7e9-56087e588916.png |

四图均1536×1024、PNG、不透明背景。项目引用相对public的路径，运行不依赖Codex生成目录。

Fin三视/五表情/五动作继续使用A1原图谱与FinArt裁切规则，完整源图在 `frontend/public/redesign/a1/`。冻结资产与A1/P0截图哈希见 `gate-b/baseline.json`，最终核验见 `gate-b/validation.json`。
