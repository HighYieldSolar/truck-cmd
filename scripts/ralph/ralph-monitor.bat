@echo off
REM ============================================================================
REM Ralph Monitor - Windows Launcher
REM ============================================================================
REM This batch file launches the Ralph monitor using Git Bash on Windows.
REM Run this in a separate terminal to watch Ralph's progress.
REM ============================================================================

setlocal

set "SCRIPT_DIR=%~dp0"

where bash >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: bash not found. Please install Git for Windows.
    pause
    exit /b 1
)

echo Starting Ralph Monitor...
echo.
bash "%SCRIPT_DIR%ralph-monitor.sh"

endlocal
