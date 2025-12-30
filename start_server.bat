@echo off
echo [AURA] Starting Audio Engine...
cd engine
call venv\Scripts\activate
if %errorlevel% neq 0 (
    echo [ERROR] Virtual environment not found!
    pause
    exit /b
)
echo [AURA] Venv activated. Running server...
python server.py
pause
