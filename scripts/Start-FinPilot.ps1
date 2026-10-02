param([switch]$NoBrowser)
. (Join-Path $PSScriptRoot 'Local-Runtime.ps1')
$python=Join-Path $FinPilotRoot '.venv/Scripts/python.exe'
$vite=Join-Path $FinPilotRoot 'frontend/node_modules/vite/bin/vite.js'
if(-not (Test-Path -LiteralPath $python) -or -not (Test-Path -LiteralPath $vite)) { throw 'Dependencies are missing. Run scripts/Setup-FinPilot.ps1 first.' }
$node=(Get-Command node -ErrorAction SilentlyContinue).Source
if(-not $node){throw 'Node.js is missing. Install Node.js 20+ and run scripts/Setup-FinPilot.ps1.'}
$state=Read-FinPilotState
if($state){
    $alive=@($state.processes | Where-Object {Test-FinPilotProcess $_})
    if($alive.Count -gt 0){
        try { $null=Wait-FinPilotHealth 'http://127.0.0.1:8002/api/health' $state.run_id 3; $null=Wait-FinPilotHealth 'http://127.0.0.1:5174/__finpilot/health' $state.run_id 3; Write-Host 'FinPilot is already running: http://127.0.0.1:5174'; if(-not $NoBrowser){Start-Process 'http://127.0.0.1:5174'}; return } catch {throw 'A tracked service is incomplete. Run Stop-FinPilot.ps1, then start again.'}
    }
}
if((Test-FinPilotPort 8002) -or (Test-FinPilotPort 5174)){throw 'Port 8002 or 5174 is in use by an untracked process. Close that service first. FinPilot will not stop it.'}
$runId=[guid]::NewGuid().ToString('N')
$env:FINPILOT_RUN_ID=$runId
$state=[pscustomobject]@{root=$FinPilotRoot;run_id=$runId;processes=@()}
try {
    $backend=Start-Process -FilePath $python -ArgumentList @('-m','uvicorn','app.main:app','--host','127.0.0.1','--port','8002') -WorkingDirectory $FinPilotRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $FinPilotRoot 'logs/local-backend.out.log') -RedirectStandardError (Join-Path $FinPilotRoot 'logs/local-backend.err.log')
    $state.processes+=Get-FinPilotProcessRecord $backend.Id 'backend-launcher'; Save-FinPilotState $state
    $health=Wait-FinPilotHealth 'http://127.0.0.1:8002/api/health' $runId
    if([int]$health.process_id -ne $backend.Id){$state.processes+=Get-FinPilotProcessRecord ([int]$health.process_id) 'backend'}
    Save-FinPilotState $state
    $frontend=Start-Process -FilePath $node -ArgumentList @(('"'+$vite+'"'),'--host','127.0.0.1','--port','5174','--strictPort') -WorkingDirectory (Join-Path $FinPilotRoot 'frontend') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $FinPilotRoot 'logs/local-frontend.out.log') -RedirectStandardError (Join-Path $FinPilotRoot 'logs/local-frontend.err.log')
    $state.processes+=Get-FinPilotProcessRecord $frontend.Id 'frontend'; Save-FinPilotState $state
    $null=Wait-FinPilotHealth 'http://127.0.0.1:5174/__finpilot/health' $runId
    Write-Host 'FinPilot is ready: http://127.0.0.1:5174'
    if(-not $NoBrowser){Start-Process 'http://127.0.0.1:5174'}
} catch {
    $failure=$_
    & (Join-Path $PSScriptRoot 'Stop-FinPilot.ps1')
    throw $failure
} finally { Remove-Item Env:FINPILOT_RUN_ID -ErrorAction SilentlyContinue }
