@echo off
REM AI Interview Platform - Installation Script for Windows

echo.
echo 🚀 Installing AI Interview Platform
echo ====================================
echo.

REM Install root dependencies
echo 📦 Installing root dependencies...
call npm install

REM Install server dependencies
echo.
echo 📦 Installing server dependencies...
cd server
call npm install
cd ..

REM Install client dependencies
echo.
echo 📦 Installing client dependencies...
cd client
call npm install
cd ..

echo.
echo ✅ Installation complete!
echo.
echo 📋 Next steps:
echo 1. Update .env files:
echo    - server\.env ^(MongoDB URI, JWT Secret^)
echo    - client\.env ^(API URL^)
echo.
echo 2. Start MongoDB:
echo    mongod
echo.
echo 3. Run development servers:
echo    npm run dev
echo.
echo 📚 Documentation:
echo - Main: README.md
echo - Quick Start: QUICKSTART.md
echo - Server: server\README.md
echo - Client: client\README.md
echo.
pause
