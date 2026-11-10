param(
  [ValidateSet('Package','Deploy','Rollback')][string]$Mode='Package',
  [ValidatePattern('^[a-zA-Z0-9.-]+$')][string]$Server='43.161.236.93',
  [ValidatePattern('^[a-z_][a-z0-9_-]*$')][string]$SshUser='ubuntu',
  [string]$ReleaseSha,
  [switch]$ApproveProduction
)
$ErrorActionPreference='Stop'
$releaseRoot=Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $releaseRoot
function Checked { param([scriptblock]$Command) & $Command; if($LASTEXITCODE -ne 0){throw "Command failed ($LASTEXITCODE)"} }
if($Mode -eq 'Rollback'){
  if(-not $ApproveProduction){throw 'Rollback requires explicit -ApproveProduction and a previously deployed SHA.'}
  if($ReleaseSha -notmatch '^[a-f0-9]{40}$'){throw 'Supply a full deployed release SHA.'}
  Checked {ssh "$SshUser@$Server" "sudo bash /opt/finpilot/current/deploy/production/activate.sh $ReleaseSha"}
  exit
}
if(git status --porcelain){throw 'Commit reviewed source changes before packaging. No production database is included.'}
$sha=git rev-parse HEAD
Checked { & (Join-Path $PSScriptRoot 'Check.ps1') }
$output=Join-Path $releaseRoot 'tmp/production'
New-Item -ItemType Directory -Force $output | Out-Null
$source=Join-Path $output "$sha-source.tar"
$package=Join-Path $output "$sha.tar.gz"
Checked {git archive --format=tar --output=$source HEAD}
$env:FINPILOT_RELEASE_SHA=$sha
try {Checked {& ./.venv/Scripts/python.exe scripts/package-production.py}} finally {Remove-Item Env:FINPILOT_RELEASE_SHA -ErrorAction SilentlyContinue}
Get-FileHash -Algorithm SHA256 -LiteralPath $package
if($Mode -eq 'Package'){Write-Host "Prepared $package. Nothing uploaded or deployed.";exit}
if(-not $ApproveProduction){throw 'Package is ready. Deploy requires explicit -ApproveProduction.'}
Checked {scp $package "$SshUser@${Server}:/tmp/finpilot-$sha.tar.gz"}
Checked {ssh "$SshUser@$Server" "sudo mkdir /opt/finpilot/releases/$sha && sudo tar -xzf /tmp/finpilot-$sha.tar.gz -C /opt/finpilot/releases/$sha && sudo bash /opt/finpilot/releases/$sha/deploy/production/activate.sh $sha"}
Write-Host "Deployed $sha. Verify https://finpilot.cn and backup health."
