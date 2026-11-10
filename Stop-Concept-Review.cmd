@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; try { & '%~dp0scripts\Stop-FinPilot.ps1' } catch { Write-Host ('STOP FAILED: ' + $_.Exception.Message) -ForegroundColor Red; exit 1 }"
set "review_exit=%ERRORLEVEL%"
pause
exit /b %review_exit%
