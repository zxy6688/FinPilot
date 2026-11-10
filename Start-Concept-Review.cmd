@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\Start-Concept-Review.ps1" %*
set "review_exit=%ERRORLEVEL%"
if not "%review_exit%"=="0" echo FAILED: Review startup did not complete. See the error above.
echo.
echo This window can be closed. Services continue running after successful startup.
echo To stop V3 services, double-click Stop-Concept-Review.cmd.
pause
exit /b %review_exit%
