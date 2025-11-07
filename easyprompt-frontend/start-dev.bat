@echo off
echo Starting EasyPrompt Frontend Development Server...

REM Check if node_modules exists, if not install dependencies
if not exist "node_modules" (
    echo Installing frontend dependencies...
    npm install
    if errorlevel 1 (
        echo Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Create .env.local file if it doesn't exist
if not exist ".env.local" (
    echo Creating .env.local file...
    echo VITE_API_BASE_URL=http://localhost:3000/api > .env.local
    echo Environment configuration created
)

REM Start the development server
echo Starting frontend server on port 5173...
npm run dev

pause