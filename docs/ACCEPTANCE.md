# V1 最终本地验收

当前版本的交付说明见 [LOCAL_RELEASE.md](LOCAL_RELEASE.md)。

- `scripts/Check.ps1`：29 项后端测试、Python 编译/导入、TypeScript、生产构建。
- `scripts/final-browser-check.mjs`：完整学习与互动闭环、注册、退出重登、键盘、离线和 HTML 边界；浏览器库沿用原有 Playwright。
- `scripts/check-local-runtime.ps1`：独立验收数据库上的 Start/Stop/Reset、PID 重用与端口占用保护。
- `docs/v1-*.json`：最终执行结果。
- `docs/screenshots/v1-final/index.html`：最终截图索引。

浏览器流程会写入体验账号数据，必须在独立测试库运行。正常使用只需根目录的 Setup/Start/Stop 入口。

第一轮的 `CONTENT_PRODUCT_PASS.md` 和 `content-*.json` 为上一轮历史记录；本轮以 `v1-*` 和最终截图为准。
