@echo off
echo ========================================
echo InfraFinance Frontend - Quick Start
echo ========================================
echo.

if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

echo Starting development server...
echo.
echo The application will open at http://localhost:3000
echo Press Ctrl+C to stop the server
echo.

call npm run dev
