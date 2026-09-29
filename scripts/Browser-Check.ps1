. (Join-Path $PSScriptRoot 'Environment.ps1')
Write-Host 'Requires backend at http://127.0.0.1:8000 and frontend at http://127.0.0.1:5173.'
Write-Host 'Use DATABASE_URL=sqlite:///tmp/browser-finpilot.db for an isolated browser test database.'
node scripts/browser-check.mjs
if ($LASTEXITCODE -ne 0) { throw 'Browser checks failed' }
