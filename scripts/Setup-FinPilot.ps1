param([switch]$Offline)
. (Join-Path $PSScriptRoot 'Environment.ps1')
if(-not (Get-Command python -ErrorAction SilentlyContinue)){throw 'Python 3.10+ is required. Install Python, then run this script again.'}
if(-not (Get-Command node -ErrorAction SilentlyContinue) -or -not (Get-Command npm.cmd -ErrorAction SilentlyContinue)){throw 'Node.js 20+ and npm are required.'}
& python -c 'import sys; assert sys.version_info >= (3,10)'
if($LASTEXITCODE -ne 0){throw 'Unsupported Python version.'}
$nodeVersion = & node --version
if([int]($nodeVersion.TrimStart('v').Split('.')[0]) -lt 20){throw 'Node.js 20+ is required.'}
if(-not (Test-Path -LiteralPath '.venv/Scripts/python.exe')){
    & python -m venv .venv
    if($LASTEXITCODE -ne 0){throw 'Could not create the project virtual environment.'}
}
$pipArgs=@('install','-r','backend/requirements.lock.txt','--disable-pip-version-check')
if($Offline){$pipArgs+='--no-index'}
& ./.venv/Scripts/python.exe -m pip @pipArgs
if($LASTEXITCODE -ne 0){throw 'Python dependency installation failed. Check connectivity or retry without -Offline.'}
Push-Location frontend
try{
    $npmArgs=@('ci','--no-audit','--no-fund')
    if($Offline){$npmArgs+='--offline'}
    & npm.cmd @npmArgs
    if($LASTEXITCODE -ne 0){throw 'npm ci failed. Check connectivity or retry without -Offline.'}
}finally{Pop-Location}
& ./.venv/Scripts/python.exe -m app.seed
if($LASTEXITCODE -ne 0){throw 'Database initialization failed.'}
Write-Host 'Setup complete. Run scripts/Start-FinPilot.ps1. All dependencies and caches stay in this project.'
