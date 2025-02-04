@echo off

:: Download and install Node.js 18 (if not installed)
where node >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo Installing Node.js 18...
    powershell -Command "[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; Invoke-WebRequest -Uri https://nodejs.org/dist/v18.17.1/node-v18.17.1-x64.msi -OutFile nodejs.msi"
    msiexec /i nodejs.msi /quiet /norestart
    del nodejs.msi
)

:: Ensure Node.js is in PATH
set PATH=%PATH%;C:\Program Files\nodejs\

:: Navigate to the project folder
cd maico

:: Install project dependencies
call npm install .

:: Start the development server
call npm run dev

