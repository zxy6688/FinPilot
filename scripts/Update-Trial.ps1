$ErrorActionPreference = 'Stop'
$trialProject = Split-Path -Parent $PSScriptRoot
$env:PYTHONUTF8 = '1'
& (Join-Path $trialProject '.venv\Scripts\python.exe') (Join-Path $PSScriptRoot 'trial-release.py') update
if ($LASTEXITCODE -ne 0) { throw 'Trial update failed; review trial-runtime logs.' }
