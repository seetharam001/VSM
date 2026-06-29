@echo off
echo.
echo ============================================
echo  VSM - Vehicle Service Management System
echo ============================================
echo.

:: Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found in PATH.
    echo.
    echo Please install Node.js from https://nodejs.org
    echo Then run this script again.
    echo.
    pause
    exit /b 1
)

echo [1/3] Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Backend npm install failed.
    pause
    exit /b 1
)

echo.
echo [2/3] Seeding database with sample data...
call npm run seed
if %errorlevel% neq 0 (
    echo [ERROR] Database seeding failed.
    pause
    exit /b 1
)

cd ..

echo.
echo [3/3] Installing frontend dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Frontend npm install failed.
    pause
    exit /b 1
)
cd ..

echo.
echo ============================================
echo  Setup Complete!
echo ============================================
echo.
echo  Login Credentials:
echo  Admin:    admin@vsm.com    / Admin@123
echo  Customer: john@example.com / Customer@123
echo  Mechanic: ravi@vsm.com     / Mechanic@123
echo.
echo  Now run:
echo    start-backend.bat   (in one terminal)
echo    start-frontend.bat  (in another terminal)
echo.
pause
