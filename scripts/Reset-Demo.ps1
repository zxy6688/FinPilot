param([switch]$ConfirmReset)
. (Join-Path $PSScriptRoot 'Local-Runtime.ps1')
if(-not (Test-Path -LiteralPath '.venv/Scripts/python.exe')){throw 'Run Setup-FinPilot.ps1 first.'}
$state=Read-FinPilotState
if($state -and @($state.processes | Where-Object {Test-FinPilotProcess $_}).Count -gt 0){throw 'Stop FinPilot before resetting the demo account.'}
if(-not $ConfirmReset){
    Write-Host 'This resets only demo@finpilot.app learning/activity. Other accounts are preserved. A database backup is created first.'
    $answer=Read-Host 'Type RESET to continue'
    if($answer -cne 'RESET'){Write-Host 'Cancelled.';return}
}
& ./.venv/Scripts/python.exe -m app.reset_demo
if($LASTEXITCODE -ne 0){throw 'Reset failed. Read the message above; no project folders are deleted.'}
