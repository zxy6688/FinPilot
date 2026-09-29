. (Join-Path $PSScriptRoot 'Environment.ps1')
New-Item -ItemType Directory -Path (Join-Path $FinPilotRoot "tmp/pytest-runs") -Force | Out-Null
$FinPilotTestRun = [guid]::NewGuid().ToString("N")
& .\.venv\Scripts\python.exe -m pytest backend\tests -q -o cache_dir=.cache/pytest-content --basetemp="tmp/pytest-runs/$FinPilotTestRun"
if ($LASTEXITCODE -ne 0) { throw 'Backend tests failed' }
& .\.venv\Scripts\python.exe -m compileall -q backend
if ($LASTEXITCODE -ne 0) { throw 'Python syntax check failed' }
& .\.venv\Scripts\python.exe -c 'from app.main import app; print(app.title)'
if ($LASTEXITCODE -ne 0) { throw 'Python import check failed' }
Push-Location frontend
try {
    npm.cmd run typecheck
    if ($LASTEXITCODE -ne 0) { throw 'TypeScript check failed' }
    npm.cmd run build
    if ($LASTEXITCODE -ne 0) { throw 'Frontend build failed' }
} finally { Pop-Location }
