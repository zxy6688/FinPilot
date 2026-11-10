# V3 资产保存

源码仓库保留运行所需全部静态资源，包括 `frontend/public/fin-3d/fin-full.glb`。不使用需要额外配额或安装的 Git LFS。

Blender 可编辑工程、完整录屏与生成证据放入独立版本资产包，随 v3.0.0 GitHub Release 保存（上传状态以实际 Release 为准）。本地原件和 `D:\finpilot开发\Fin-P0-P4-review.zip` 也保留。未把这些材料删掉或用旧代码覆盖当前工作区。

本轮正式源工程：`assets/fin-3d-full/full-candidate-01/fin-p05-source.blend`；对应导出文件 `fin-full.glb`，SHA256 见原工程旁 `export-report.json`。工程内部保留形变和骨骼。配饰、小窝属于 React/Three.js 源码。

`scripts/build-fin-full.py` 是候选生成工具，不是人工美术终稿。它拒绝覆盖已有候选。专业修型另存 `artist-master.blend`，使用 `scripts/export-fin-p05.py` 导出，并记录两个文件哈希。

旧技术模型 `fin-p0.glb`、`fin-p05.glb` 不再被当前前端引用，保留于本地/历史审查包，不进入正式发布树。历史截图从当前 Git 索引清理，但本地和旧提交仍在；精选当前截图在 `docs/product/screenshots`。详见 `CLEANUP.json`。
