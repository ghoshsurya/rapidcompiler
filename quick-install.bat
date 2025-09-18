@echo off
echo Quick installer for OnlineGDB compilers...

echo.
echo This will install missing compilers using Chocolatey package manager.
echo Press Ctrl+C to cancel, or any key to continue...
pause

echo.
echo Installing Chocolatey (if not present)...
powershell -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))"

echo.
echo Installing compilers...
choco install mingw -y
choco install openjdk -y
choco install nodejs -y

echo.
echo Refreshing environment variables...
refreshenv

echo.
echo Installation complete! Please restart your command prompt and run the application again.

pause