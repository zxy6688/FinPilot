# 版本沿革与分支关系

核查：2026-11-10；本次文档编辑开始时本地 v3、origin/main 都是 `ab4a29c2e6902e2cbd8736d53d8005fbc313c4e5`。后续本轮文档提交可使 main 前移，**标签和生产源码保持不动**。

| 阶段 | Git 证据 | 含义 |
| --- | --- | --- |
| V1 | `240914e`（2026-09-29） | 首次 V1 发布提交；后续部署和 README 到 `97908aa` |
| 旧 main | `97908aacc74adaf8e8c1eb291d255a2feff1b289` | `backup/main-before-v3-20261110` 保留；不是当前正式 main |
| V2 | `a3fa070a55a4d4efd0fa47e8e835e0da6e0581c2`（2026-10-02） | 远端 v2 保留，未改写 |
| 早期 V3 | `b90ffe0` → `aebfa7bc0ca53d6eaba046551cad0a8edc1ef1df` | 远端 v3 仍停在早期候选；不是当前上线版 |
| Gate A1 / B / B-PX / B-K | `26b9da5` / `361615c` / `50c2f58` / `23ac0dd` | 可恢复的开发 checkpoint，不冒充版本标签 |
| 受控试用 | `a603db2` | 试用发布与生命周期工具 |
| 完整 V3 整理 | `7e7c00899f40cbf5174a15cac91a8a335b01271a` | 五大页面、Fin Pet 与生产工具 |
| 正式 V3 | `ab4a29c2e6902e2cbd8736d53d8005fbc313c4e5` | 修复跨平台审计后发布，GitHub main 原始上线提交 |
| v3.0.0 | 注释标签对象 `fde65f8123064d77d9595c27bf3dc443f8a6c65c`，peeled 为上行 SHA | 唯一实际发布版本标签；美术附件另存 Release |

本机 `D:\finpilot开发\v1` 工作树仍检出旧本地 main；本轮不操作它。当前工作树在本地 v3 分支维护，通过普通快进将文档提交推送到远端 main，不强推、不更新远端 v2/v3，不创建 v3.0.1。

`V1`、`V2`、`Gate` 名称是实际产品阶段，但仓库没有可据以声称的 V1/V2 正式标签。历史记录保留，旧课程和数据库兼容代码继续使用。

核验命令：`git log --all --oneline --decorate`、`git ls-remote origin refs/heads/main refs/heads/v2 refs/heads/v3 refs/heads/backup/main-before-v3-20261110 refs/tags/v3.0.0 refs/tags/v3.0.0^{}`。发布标签、文档 HEAD 和生产部署版本是三个不同概念。
