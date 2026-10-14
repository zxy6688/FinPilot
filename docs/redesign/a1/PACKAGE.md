# 完整工作区审查包

ZIP 从 v3 真实工作目录读取，含 Gate A 和 A1 未提交源码、前后端、内容与初始化逻辑、依赖锁文件、测试、设计与验收文档、历史截图、两张认可参考图和原始角色/场景素材。不是 git archive。

排除 .git、.env（保留无密钥 .env.example）、.venv、node_modules、dist、tmp、logs、cache、数据库、运行数据目录、密钥与构建产物。测试专用固定字符串及公开 Demo 账号是测试资料，不是运行凭据。运行数据库不打包，backend/app/seed.py 与 content/ 支持重建 Demo。

全部归档文件解压后逐字节 SHA256 校验。源码另与工作区逐文件校验。文件列表与哈希在根目录 REVIEW_MANIFEST.json。ZIP 自身大小/SHA256 放在 ZIP 外的校验文件，避免自引用。

网站未关闭；main/v2 保持原提交、干净工作区。阶段状态：AWAITING HUMAN GATE A1 REVIEW。
