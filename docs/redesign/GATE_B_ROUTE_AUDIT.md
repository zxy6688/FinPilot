# Gate B 路由兼容审计

| 原落点 | Gate B 处理 |
|---|---|
| /、/discover、/profile | 原路径保留，扩展内容/账户手册 |
| /money-lab | 五工具目录；旧带 receipt/monthly 查询链接兼容送至 savings |
| /decoder/purchasing-power | 保留长专题，深化模型与保存 |
| /stories/budget、bonds、loan | 替换旧导读为完整专题，不改路径 |
| /concept-studio | 保留 A1 矩阵，增强并恢复案例与答题 |
| /stories/etf | 新增深读；与矩阵互相进入 |
| /discover/library、/articles/:id、/topics/:id | 原资料服务与页面保留 |
| /learn、/learn/:id、/lessons/:id、/learn/routes/:id | 原课程和路线保留 |
| /lab、/lab/:id | 原实验/反思保留；新五工具不覆盖 LabRecord |
| /review、/compare、/compare/:slug、/knowledge | 原复习/对照/知识关系保留 |
| /fintalk、/fintalk/:id | 原讨论数据与次级入口保留 |
| /profile/history | 原账户学习世界保留；手册链接可进入 |
| /copilot、/search、/login、/methods、/fin-design | 保留服务、账户与方法说明；上下文/索引增补 |

未匹配 URL 保持真实 404，不悄悄转首页。每条新工具地址带明确工具 ID，不依靠页面猜测用户意图。查询参数仅为输入提示，必须后端验证后才显示计算结果。
