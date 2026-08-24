@echo off
echo ====================================================
echo Deploying Fantasy Football Dashboard to Raspberry Pi
echo ====================================================
powershell -ExecutionPolicy Bypass -File "%~dp0deploy_to_pi.ps1"
pause
