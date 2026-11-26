@echo off
rem Right-click this file and choose "Run as administrator".
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Setup.ps1" %*
echo.
pause
