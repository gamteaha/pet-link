@echo off
cd /d "%~dp0"
echo Starting Dedenne Desktop Pet...
venv\Scripts\python.exe main.py
if %errorlevel% neq 0 (
    echo.
    echo Error: Failed to start the pet. Make sure the virtual environment is set up.
    echo Running dependency check...
    python -m venv venv
    venv\Scripts\pip install PyQt6 pywin32
    venv\Scripts\python main.py
)
pause
