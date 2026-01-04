@echo off
taskkill /F /IM node.exe /T 2>NUL
taskkill /F /IM python.exe /T 2>NUL
taskkill /F /IM electron.exe /T 2>NUL
taskkill /F /IM "AURA Cloud Studio.exe" /T 2>NUL
echo All AURA processes terminated.
pause
