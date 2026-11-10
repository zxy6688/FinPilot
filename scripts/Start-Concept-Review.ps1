param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
try {
    Set-Location -LiteralPath $projectRoot
    Write-Host "项目：$projectRoot"
    foreach ($relative in @('.venv/Scripts/python.exe', 'frontend/node_modules/vite/bin/vite.js', 'frontend/src/redesign/ConceptDirectory.tsx', 'frontend/src/redesign/EtfConcept.tsx')) {
        if (-not (Test-Path -LiteralPath (Join-Path $projectRoot $relative))) {
            throw "缺少文件或依赖：$relative。请检查项目完整性；依赖安装入口为 scripts/Setup-FinPilot.ps1。本脚本不会自动修改环境配置。"
        }
    }
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw '未找到 Node.js。请安装 Node.js 20 或更新版本后重试。' }
    & (Join-Path $PSScriptRoot 'Start-FinPilot.ps1') -NoBrowser
    . (Join-Path $PSScriptRoot 'Local-Runtime.ps1')
    $state = Read-FinPilotState
    if (-not $state) { throw '没有找到当前项目的运行记录，不能确认服务归属。' }
    $null = Wait-FinPilotHealth 'http://127.0.0.1:8004/api/health' $state.run_id 10
    $null = Wait-FinPilotHealth 'http://127.0.0.1:5176/__finpilot/health' $state.run_id 10
    $proxy = Invoke-RestMethod 'http://127.0.0.1:5176/api/health' -TimeoutSec 10
    if ($proxy.status -ne 'ok' -or $proxy.local_run_id -ne $state.run_id) { throw '前端 API 代理没有连接到当前 V3 后端。' }
    $urls = @('http://127.0.0.1:5176/concept-studio', 'http://127.0.0.1:5176/concept-studio?mode=courses', 'http://127.0.0.1:5176/concept-studio/7')
    foreach ($url in $urls) {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -ne 200 -or $response.Content -notmatch 'id="root"') { throw "页面入口检查失败：$url" }
        Write-Host "页面入口正常：$url" -ForegroundColor Green
    }
    Write-Host '前后端与 API 代理已就绪。浏览器中可实际查看页面；启动检查不代替页面功能验收。' -ForegroundColor Green
    Write-Host "日志：$(Join-Path $projectRoot 'logs')"
    Write-Host '关闭这个窗口不会关闭网站。停止服务请双击项目根目录的 Stop-Concept-Review.cmd。'
    if (-not $NoBrowser) {
        Start-Process $urls[0]
        Start-Process $urls[2]
    }
} catch {
    Write-Host "验收启动失败：$($_.Exception.Message)" -ForegroundColor Red
    Write-Host "项目：$projectRoot"
    Write-Host "请查看 $(Join-Path $projectRoot 'logs') 下的 local-frontend.err.log 与 local-backend.err.log。"
    Write-Host '端口冲突时本脚本不会关闭未知进程。若提示本项目服务不完整，可双击 Stop-Concept-Review.cmd 后重试启动。'
    exit 1
}
