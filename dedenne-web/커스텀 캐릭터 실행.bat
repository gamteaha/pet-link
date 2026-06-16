@echo off
cd /d "%~dp0"
echo ===================================================
echo   Starting Custom 3D Character Desktop Pet Player
echo ===================================================
echo.

:: Check for node_modules
if not exist "node_modules\" (
    echo [Info] node_modules not found. Installing dependencies...
    echo This may take a minute or two...
    call npm install
)

echo.
echo [Info] Launching Desktop Companion...
call npm run electron:dev
pause
