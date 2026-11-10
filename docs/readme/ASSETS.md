# README 素材与拍摄记录

拍摄日期：2026-11-10。来源：实际 **https://finpilot.cn**，源码 `ab4a29c2e6902e2cbd8736d53d8005fbc313c4e5` / v3.0.0。服务端发布链接与构建记录已核对；不是旧 Gate B–K 截图。

12 张真实页面/交互截图使用 Chrome + Playwright，桌面 1440×1000，手机 390×844，deviceScaleFactor=1。全新访客会话，只用教学参数和示例笔记，没有注册、登录或读取个人账户。预算 A 为原始 2500 元、B 为 3100 元收入；ETF 笔记明确为教学示例。保存只在本会话浏览器内发生。

为突出五大空间，截图会话通过现有偏好隐藏悬浮宠物；独立 Fin 截图实际载入 Three.js/GLB，打开小窝并切换围巾。无 Mock API、伪造结果或后期替换文字。

## 素材清单

| 图片 | 处理后尺寸 | 字节 | 内容 |
| --- | --- | ---: | --- |
| [home-desktop.webp](assets/home-desktop.webp) | 1280×889 | 114,394 | 真实生产首页，访客初始状态 |
| [home-search.webp](assets/home-search.webp) | 1200×343 | 12,036 | 真实站内候选，提交后仍留在首页 |
| [discover-desktop.webp](assets/discover-desktop.webp) | 1280×889 | 93,694 | 五篇原创专题目录 |
| [money-lab-desktop.webp](assets/money-lab-desktop.webp) | 1280×889 | 87,064 | 五套财务工具目录 |
| [budget-comparison.webp](assets/budget-comparison.webp) | 1280×911 | 51,870 | 教学假设：2500 与 3100 收入的真实预算对比 |
| [concept-studio-desktop.webp](assets/concept-studio-desktop.webp) | 1280×889 | 79,350 | 知识索引：领域与精选概念 |
| [etf-matrix.webp](assets/etf-matrix.webp) | 1280×1114 | 80,962 | 交易形式与策略二维矩阵：已选主动 ETF |
| [my-world-desktop.webp](assets/my-world-desktop.webp) | 1280×889 | 44,364 | 真实访客笔记与预算小票，仅保存在本截图会话 |
| [my-world-receipt.webp](assets/my-world-receipt.webp) | 1280×701 | 29,766 | 预算小票实际预览，教学输入 |
| [fin-room.webp](assets/fin-room.webp) | 1280×889 | 45,216 | 实际 Three.js / GLB 小窝与围巾，不是原画 |
| [home-mobile.webp](assets/home-mobile.webp) | 390×844 | 40,790 | 390px 首页，已有本会话保存结果 |
| [my-world-mobile.webp](assets/my-world-mobile.webp) | 390×844 | 36,688 | 390px 访客发现手册 |

原始 PNG 与输出 WebP 的 SHA256、URL、选择器、视口、时间和处理方式在 [CAPTURE_MANIFEST.json](CAPTURE_MANIFEST.json)。原始 PNG 保留维护者忽略目录 `tmp/readme-capture`；不以重复大图增加仓库体积。预算图片裁到实际工作台区域，其余按比例调整与 WebP 压缩，没有改变 UI 内容。

## 原创封面

- [hero.svg](assets/hero.svg) / [hero-dark.svg](assets/hero-dark.svg)：1600×540；矢量文字、排版、细线与几何装饰原创制作。
- 右侧嵌入现有 `frontend/public/redesign/a1/exploration-studio.png`、本次真实预算与 ETF 局部。嵌入 JPEG data URI，自包含，无远程字体、脚本、外部样式或绝对本地路径。
- [closing.svg](assets/closing.svg)：1600×180 原创尾页。
- 封面是编辑式产品组合图，**不是实际网页截图**；Fin 房间图才是当前 GLB 的真实表现。
- 浅/深通过 GitHub 支持的 picture/source 选择；截图保持真实页面的奶白底，不篡改为虚构暗色产品。

15 个精选图片合计 **1,119,124 字节（1.07 MiB）**，包括两个封面版本；单张最大约 197 KiB。没有使用外部图库、假用户数或装饰性收益数据。

## 复拍

在仓库根目录安装 frontend 的锁定依赖，并确保 Chrome 位于脚本声明的 Windows 路径：

```powershell
node docs/readme/capture.mjs
node docs/readme/build-assets.mjs
```

脚本仅用于文档拍摄，不加入产品构建。若生产版本变化，先重新核对部署 SHA，再更新 capture.mjs 的来源字段；不能沿用旧 SHA 给新页面背书。当前脚本是 Windows 维护环境工具，不声称任意平台开箱即用。
