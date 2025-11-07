@echo off
echo Starting EasyPrompt Backend Development Server...

REM Check if node_modules exists, if not install dependencies
if not exist "node_modules" (
    echo Installing backend dependencies...
    npm install
    if errorlevel 1 (
        echo Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Check if .env file exists, if not copy from example
if not exist ".env" (
    echo Creating .env file from example...
    copy .env.example .env
    echo Please edit .env file to configure your database settings
)

REM Start the development server
echo Starting backend server on port 3000...
npm run dev

pause