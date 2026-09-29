$ErrorActionPreference = 'Stop'
$FinPilotRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $FinPilotRoot
foreach ($folder in @('tmp','logs','data','.cache\pip','.cache\npm')) {
    New-Item -ItemType Directory -Path (Join-Path $FinPilotRoot $folder) -Force | Out-Null
}
$env:TEMP = Join-Path $FinPilotRoot 'tmp'
$env:TMP = $env:TEMP
$env:PIP_CACHE_DIR = Join-Path $FinPilotRoot '.cache\pip'
$env:NPM_CONFIG_CACHE = Join-Path $FinPilotRoot '.cache\npm'
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path $FinPilotRoot '.cache\playwright'
$env:PYTHONPATH = Join-Path $FinPilotRoot 'backend'
$env:PYTHONIOENCODING = 'utf-8'

$env:BLACK_CACHE_DIR = Join-Path $FinPilotRoot '.cache\black'
