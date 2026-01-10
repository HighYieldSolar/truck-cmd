@echo off
REM ============================================================================
REM Ralph Wiggum - Windows Launcher
REM ============================================================================
REM This batch file launches Ralph using Git Bash on Windows.
REM Make sure Git Bash is installed (comes with Git for Windows).
REM
REM Usage: ralph.bat [OPTIONS]
REM   Options are passed directly to ralph.sh
REM ============================================================================

setlocal

REM Get the directory of this script
set "SCRIPT_DIR=%~dp0"

REM Check if Git Bash exists
where bash >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: bash not found. Please install Git for Windows.
    echo Download from: https://git-scm.com/download/win
    pause
    exit /b 1
)

REM Launch Ralph using bash
echo Starting Ralph Wiggum...
echo.
bash "%SCRIPT_DIR%ralph.sh" %*

endlocal
