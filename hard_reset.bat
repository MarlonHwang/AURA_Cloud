@echo off
echo [Operation: Total Eclipse] Initiated...

echo 1. Killing Zombies...
taskkill /F /IM node.exe /T 2>NUL
taskkill /F /IM python.exe /T 2>NUL
taskkill /F /IM electron.exe /T 2>NUL
taskkill /F /IM "AURA Cloud Studio.exe" /T 2>NUL

echo 2. Nuking Caches...
rd /s /q "node_modules\.vite" 2>NUL
rd /s /q "dist" 2>NUL
rd /s /q ".cache" 2>NUL
rd /s /q "src\renderer\.vite" 2>NUL

echo [Operation: Total Eclipse] Complete. Environment is clean.
