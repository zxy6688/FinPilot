@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\Release-Production.ps1 -Mode Package
if errorlevel 1 echo Release preparation FAILED. Read the error above.
echo Packaging never deploys automatically. See docs\deployment\PRODUCTION.md.
pause
