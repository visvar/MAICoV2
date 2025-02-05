@echo off
setlocal

echo %PATH%

:: Check if Node.js is installed
where node >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo Node.js is not installed. Installing Node.js 18.12.1...

    :: Download Node.js MSI installer
    powershell -ExecutionPolicy Bypass -Command "[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; Invoke-WebRequest -Uri 'https://nodejs.org/dist/v18.12.1/node-v18.12.1-x64.msi' -OutFile 'nodejs.msi'"

    :: Install Node.js
    echo Installing Node.js...
    start /wait msiexec /i nodejs.msi /quiet /norestart INSTALLDIR="C:\Program Files\nodejs"

    :: Delete installer after installation
    del nodejs.msi

    :: Notify user about restart requirement
    echo.
)

:: Temporarily set Node.js PATH for this session
set "PATH=C:\Program Files\nodejs;%PATH%"

:: Verify if Node.js is now available
where node >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is still not recognized.
)

:: Display Node.js version
node -v

:: Navigate to the project folder
call cd maico

:: Install project dependencies
call npm install .

:: Start the development server
call npm run dev