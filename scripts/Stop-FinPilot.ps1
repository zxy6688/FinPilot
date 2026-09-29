# Stop only recorded PIDs whose process creation time still matches.
. (Join-Path $PSScriptRoot 'Local-Runtime.ps1')
$state=Read-FinPilotState
if(-not $state){Write-Host 'No FinPilot-managed processes to stop.';return}
$records=@($state.processes)
[array]::Reverse($records)
foreach($record in $records){
    if(Test-FinPilotProcess $record){
        Stop-Process -Id ([int]$record.process_id) -ErrorAction Stop
        Write-Host ("Stopped FinPilot " + $record.role)
    }
}
Remove-Item -LiteralPath $FinPilotStatePath -ErrorAction Stop
Write-Host 'FinPilot stopped. Database and learning records were preserved.'
