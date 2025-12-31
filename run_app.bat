@echo off
title AURA Studio Launcher
echo ==================================================
echo   Starting AURA Cloud Studio (Hybrid V3)
echo ==================================================

echo 1. Launching AURA Brain (Python Engine)...
start cmd /k "start_brain.bat"

echo.
echo 2. Launching Web Server (Vite)...
echo    (Please wait for 'Local: http://127.0.0.1:5173')
start cmd /k "npm run dev"

echo.
echo 3. Launching Electron App...
echo    (Waiting for Web Server...)
call npm run start:electron

echo.
echo App closed.
pause
