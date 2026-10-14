# Gate A1 图像资产

使用内置 image_gen，未调用 CLI/API 或用户密钥。资产保存在 frontend/public/redesign/a1/。原始 PNG 字节保存到 D 盘；默认 C 盘文件保存曾因空间不足失败。

## 探索桌场景原始提示词

Use case: stylized-concept. Production website HERO ART only, not a website screenshot or UI mockup. Create an original richly painted FinPilot financial exploration studio scene. Image 1 is the approved visual art direction; Image 2 is the exact NEW Fin character identity atlas to preserve. No lettering, no numbers, no text, no user progress, no interface, no logos. Wide panoramic 2:1 composition at high resolution. The LEFT 48 percent is luminous pale cyan/ivory window light and distant atmospheric soft green landscape, calm enough for real HTML headline and input overlay, with a subtle plant/books in far-left margins and a desk along bottom. The RIGHT 52 percent is a richly layered sunny studio by an open wooden window: Fin as a recognizable hero character about 35% of image height, centered at x=74%, y=59%, standing on an actual warm wood exploration desk, friendly curious expression, holding a small unlettered paper card. Fin has ivory face/body, layered teal leaf crown/head covering, short lake blue/teal leaf fins, expressive glossy deep teal eyes, coral blush, detailed GOLD COMPASS PENDANT; identity matches atlas. Around Fin: an open cream notebook in foreground, elegant teal-and-gold calculator, stacked aqua and ochre books, paper clippings and tabs, laptop with abstract unlabeled diagram (clearly illustration, no fake financial values), ceramic mug, lush small plants, warm wood and glass. Foreground tactile pages, middle-ground character/desk/objects, background soft trees/terraces/city silhouettes against airy blue sky with cream clouds. Premium painterly animation concept art, refined ambient occlusion, crisp object edges, watercolor/gouache subtle paper texture, sunny directional light with warm gold rim and soft shadows. Rich layered environmental illustration like approved reference, not plain flat vector, not glossy plastic 3D toy, no childish confetti, no giant featureless color blobs. Sophisticated friendly editorial atmosphere. Artwork fills edge-to-edge; no rounded frame or UI. Reserve only LEFT quiet area for HTML, do not make Fin small. No baked-in speech bubbles or text.

## 角色图集提示词要点

原创 Fin 品牌角色，参考用户已认可 02_APPROVED_RICH_DIRECTION.png。精细动画概念画质，暖白身体、青绿叶冠/头部、湖蓝叶鳍、深色有高光眼睛、金色罗盘、珊瑚腮红。要求透明背景、4×4 等分格、同一角色与比例、无文字网格线、不跨格。

从左到右逐行：正面、真正 3/4 右侧、背面、右侧面；陪伴、好奇、思考、明亮；休息、挥手、歪头、翻卡片；递小票、贴入手册、悬浮、阅读。动作是静态原画姿态，不冒充骨骼动画。

网页使用原始透明图集的 SVG 图像视窗，不以简单 SVG 几何图形替代生成原画。Hero 独立原画，不是把用户概念图当网页背景；所有输入、数值、按钮、图表仍为真实 HTML/API 组件。

## 图集排版修整

第二次内置 image_gen 编辑请求保持 16 个视角/姿态，仅增加格间透明留白。生成结果没有完全遵循等分格，因此网页用 `Fin.tsx` 中的实际区域坐标显示，不假设严格等分。原始版 `fin-atlas.png` 和当前使用版 `fin-atlas-spaced.png` 均保留，尺寸均为 1254×1254。未使用 Python 或 CLI 重绘图像。

编辑提示：Preserve ALL 16 identities and poses; only fix sprite spacing in an exact 4×4 layout, shrink each complete character and prop to at most 72% of cell size with 14% transparent margins. Same row order; no text, grid, checkerboard or opaque background. 实际尺寸与裁切以文件和源码为准，不把提示中的要求当作已达成事实。
