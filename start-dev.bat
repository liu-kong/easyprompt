@echo off
echo ========================================
echo   EasyPrompt Development Server Launcher
echo ========================================
echo.

REM Check if we're in the right directory
if not exist "easyprompt-backend" (
    echo Error: easyprompt-backend directory not found!
    echo Please run this script from the project root directory.
    pause
    exit /b 1
)

if not exist "easyprompt-frontend" (
    echo Error: easyprompt-frontend directory not found!
    echo Please run this script from the project root directory.
    pause
    exit /b 1
)

echo Starting backend server...
cd easyprompt-backend
start "EasyPrompt Backend" cmd /k "npm run dev"

echo Waiting for backend to start...
timeout /t 3 /nobreak >nul

echo Starting frontend server...
cd ..\easyprompt-frontend
start "EasyPrompt Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo   Servers are starting up...
echo ========================================
echo.
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173
echo API Docs: http://localhost:3000/api
echo.
echo Press any key to exit this launcher...
echo (The servers will continue running in their own windows)
pause >nul