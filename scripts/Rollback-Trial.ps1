$ErrorActionPreference = 'Stop'
$trialProject = Split-Path -Parent $PSScriptRoot
$env:PYTHONUTF8 = '1'
& (Join-Path $trialProject '.venv\Scripts\python.exe') (Join-Path $PSScriptRoot 'trial-release.py') rollback
if ($LASTEXITCODE -ne 0) { throw 'Trial rollback failed. Database was not rolled back.' }
