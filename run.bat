@echo off
title AURA ENGINE CONSOLE (SERVER + AI) - DO NOT CLOSE
echo ===================================================
echo [1/2] Initializing AURA Cloud Engine...
echo [2/2] Launching Interface Window...
echo ===================================================
echo NOTE: This black window hosts the AI Brain.
echo If you close this, AURA will stop working.
echo ===================================================
:: Call cleanup explicitly
call npm run kill-zombies

:: Start Backend and Frontend in parallel but cleaner
call npm run dev

