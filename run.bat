@echo off
title AURA V4 - Hybrid Launch System
color 0B

echo =====================================================
echo    AURA V4: Launching Hybrid Architecture...
echo =====================================================

:: 1. Check Virtual Environment
if not exist "venv" (
    echo [Setup] Creating Python venv...
    python -m venv venv
)
call venv\Scripts\activate

:: 2. Check Dependencies
echo [Setup] Checking Engine Dependencies...
:: Corrected path: backend instead of engine
pip install -r backend/requirements.txt --quiet
if not exist "node_modules" call npm install

:: 3. [Background 1] Start Python Audio Engine
echo [1/3] Starting Audio Engine...
:: Corrected path: backend/server.py
start /B "AURA_Sound" python backend/server.py

:: 4. [Background 2] Start React Dev Server
echo [2/3] Starting React Dev Server...
start /B "AURA_UI_Server" npm run dev

:: 5. Wait for Servers (7s stable startup)
echo [Wait] Warming up engines (7s)...
timeout /t 7 /nobreak >nul

:: 6. [Foreground] Launch Electron Window
echo [3/3] Launching Electron Window...
call npm run start:electron

:: 7. Cleanup
taskkill /F /IM python.exe /T >nul 2>&1
taskkill /F /IM node.exe /T >nul 2>&1
echo [System] AURA Terminated.
pause
