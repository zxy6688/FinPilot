# Internal helpers; all state stays in this project.
. (Join-Path $PSScriptRoot 'Environment.ps1')
$FinPilotStatePath = Join-Path $FinPilotRoot 'tmp/local-runtime.json'
function Test-FinPilotPort([int]$Port) {
    $client = [System.Net.Sockets.TcpClient]::new()
    try { $client.Connect('127.0.0.1', $Port); return $true } catch { return $false } finally { $client.Dispose() }
}
function Get-FinPilotProcessRecord([int]$ProcessId, [string]$Role) {
    $process = Get-Process -Id $ProcessId -ErrorAction Stop
    return [pscustomobject]@{ process_id=$process.Id; started=$process.StartTime.ToUniversalTime().ToFileTimeUtc().ToString(); role=$Role }
}
function Test-FinPilotProcess($Record) {
    try { $process = Get-Process -Id ([int]$Record.process_id) -ErrorAction Stop; return $process.StartTime.ToUniversalTime().ToFileTimeUtc().ToString() -eq [string]$Record.started } catch { return $false }
}
function Read-FinPilotState {
    if (-not (Test-Path -LiteralPath $FinPilotStatePath)) { return $null }
    $state = Get-Content -LiteralPath $FinPilotStatePath -Raw | ConvertFrom-Json
    if ([IO.Path]::GetFullPath([string]$state.root) -ne [IO.Path]::GetFullPath($FinPilotRoot)) { throw 'Runtime state belongs to a different project. No processes were stopped.' }
    return $state
}
function Save-FinPilotState($State) {
    $State | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $FinPilotStatePath -Encoding UTF8
}
function Wait-FinPilotHealth([string]$Url,[string]$RunId,[int]$Seconds=45) {
    $deadline=[DateTime]::UtcNow.AddSeconds($Seconds)
    do {
        try { $result=Invoke-RestMethod -Uri $Url -TimeoutSec 2; if($result.status -eq 'ok' -and $result.local_run_id -eq $RunId){return $result} } catch {}
        Start-Sleep -Milliseconds 350
    } while ([DateTime]::UtcNow -lt $deadline)
    throw "Service was not ready: $Url. Read the files in logs/."
}
