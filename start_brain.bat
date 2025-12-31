@echo off
title AURA Brain (Python Engine)
echo Starting AURA AI Engine (src/python)...
cd src/python
:: Check for venv
if not exist "venv" (
    echo Venv not found in src/python. Creating new venv...
    python -m venv venv
    call venv\Scripts\activate
    pip install -r requirements.txt
) else (
    call venv\Scripts\activate
)

python server.py
pause
