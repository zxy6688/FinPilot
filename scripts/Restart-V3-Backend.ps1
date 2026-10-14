# Restart only this worktree's PID/creation-time-verified backend. Frontend stays up.
. (Join-Path $PSScriptRoot 'Local-Runtime.ps1')
if ((git -C $FinPilotRoot branch --show-current) -ne 'v3') { throw 'This helper is restricted to the v3 worktree.' }
$runtimeB=Read-FinPilotState
if (-not $runtimeB) { throw 'No tracked runtime. Use Start-FinPilot.ps1.' }
foreach($recordB in @($runtimeB.processes | Where-Object {$_.role -like 'backend*'})) {
    if(Test-FinPilotProcess $recordB){Stop-Process -Id ([int]$recordB.process_id)}
}
$runtimeB.processes=@($runtimeB.processes | Where-Object {$_.role -notlike 'backend*'})
$env:FINPILOT_RUN_ID=$runtimeB.run_id
try {
    $launchB=Start-Process -FilePath (Join-Path $FinPilotRoot '.venv/Scripts/python.exe') -ArgumentList @('-m','uvicorn','app.main:app','--host','127.0.0.1','--port','8004') -WorkingDirectory $FinPilotRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $FinPilotRoot 'logs/local-backend.out.log') -RedirectStandardError (Join-Path $FinPilotRoot 'logs/local-backend.err.log')
    $runtimeB.processes+=Get-FinPilotProcessRecord $launchB.Id 'backend-launcher'
    Save-FinPilotState $runtimeB
    $healthB=Wait-FinPilotHealth 'http://127.0.0.1:8004/api/health' $runtimeB.run_id
    if([int]$healthB.process_id -ne $launchB.Id){$runtimeB.processes+=Get-FinPilotProcessRecord ([int]$healthB.process_id) 'backend'}
    Save-FinPilotState $runtimeB
    Write-Host 'V3 backend ready: http://127.0.0.1:8004/api/health'
} finally { Remove-Item Env:FINPILOT_RUN_ID -ErrorAction SilentlyContinue }
