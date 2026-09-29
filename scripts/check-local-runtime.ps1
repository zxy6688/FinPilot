$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'Local-Runtime.ps1')
$checks=[System.Collections.Generic.List[string]]::new()
& (Join-Path $PSScriptRoot 'Stop-FinPilot.ps1')
if((Test-FinPilotPort 8000) -or (Test-FinPilotPort 5173)){throw 'Managed stop did not release both ports.'}
$checks.Add('managed stop releases 8000 and 5173')
$node=(Get-Command node).Source
$guardPath=Join-Path $FinPilotRoot 'tmp/polish/guard.cjs'
"setInterval(()=>{},1000)" | Set-Content -LiteralPath $guardPath -Encoding UTF8
$guard=Start-Process -FilePath $node -ArgumentList ('"'+$guardPath+'"') -WindowStyle Hidden -PassThru
$guardRecord=Get-FinPilotProcessRecord $guard.Id 'guard'
try {
    $stale=[pscustomobject]@{root=$FinPilotRoot;run_id='stale-test';processes=@([pscustomobject]@{process_id=$guard.Id;started='0';role='stale'})}
    Save-FinPilotState $stale
    & (Join-Path $PSScriptRoot 'Stop-FinPilot.ps1')
    if(-not (Test-FinPilotProcess $guardRecord)){throw 'An unrelated process was stopped.'}
    $checks.Add('stale PID file does not stop unrelated process')
} finally {if(Test-FinPilotProcess $guardRecord){Stop-Process -Id $guard.Id}}
$serverPath=Join-Path $FinPilotRoot 'tmp/polish/occupied.cjs'
"require('node:http').createServer((q,r)=>r.end('unrelated')).listen(5173,'127.0.0.1')" | Set-Content -LiteralPath $serverPath -Encoding UTF8
$server=Start-Process -FilePath $node -ArgumentList ('"'+$serverPath+'"') -WindowStyle Hidden -PassThru
$serverRecord=Get-FinPilotProcessRecord $server.Id 'guard-server'
try {
    Start-Sleep -Milliseconds 700
    $blocked=$false
    try{& (Join-Path $PSScriptRoot 'Start-FinPilot.ps1') -NoBrowser}catch{$blocked=$_.Exception.Message -like '*untracked*'}
    if(-not $blocked -or -not (Test-FinPilotProcess $serverRecord)){throw 'Occupied-port protection failed.'}
    $checks.Add('occupied port fails clearly and leaves unrelated server alive')
} finally {if(Test-FinPilotProcess $serverRecord){Stop-Process -Id $server.Id}}
$env:DATABASE_URL='sqlite:///tmp/polish/acceptance.db'
# Exercise the same Windows PowerShell entry point used by the .cmd launcher.
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'Reset-Demo.ps1') -ConfirmReset
if($LASTEXITCODE -ne 0){throw 'Windows PowerShell reset failed.'}
$checks.Add('Windows PowerShell demo reset with SQLite backup')
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'Start-FinPilot.ps1') -NoBrowser
if($LASTEXITCODE -ne 0){throw 'Windows PowerShell start failed.'}
$before=Read-FinPilotState
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'Start-FinPilot.ps1') -NoBrowser
if($LASTEXITCODE -ne 0){throw 'Windows PowerShell repeat start failed.'}
$after=Read-FinPilotState
if($before.run_id -ne $after.run_id){throw 'Repeat start created a second instance.'}
$checks.Add('Windows PowerShell cold start and idempotent repeat start')
@{status='passed';checks=@($checks);date=[DateTime]::UtcNow.ToString('o')} | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $FinPilotRoot 'docs/v1-local-runtime-check.json') -Encoding UTF8
Write-Host 'Local runtime checks passed; the isolated acceptance database is running.'
