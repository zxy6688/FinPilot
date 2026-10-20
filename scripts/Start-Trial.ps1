$ErrorActionPreference = 'Stop'
$trialProject = Split-Path -Parent $PSScriptRoot
$env:PYTHONUTF8 = '1'
& (Join-Path $trialProject '.venv\Scripts\python.exe') (Join-Path $PSScriptRoot 'trial-release.py') start
if ($LASTEXITCODE -ne 0) { throw 'Trial start failed.' }
& (Join-Path $trialProject '.venv\Scripts\python.exe') (Join-Path $PSScriptRoot 'trial-release.py') tunnel
if ($LASTEXITCODE -ne 0) { throw 'Tunnel start failed.' }
Write-Host 'HTTPS URL: see D:\finpilot开发\trial-runtime\logs\tunnel.log (latest trycloudflare URL).'
