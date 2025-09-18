@echo off
echo Checking and installing compilers for OnlineGDB...

echo.
echo Checking Python...
python --version
if %errorlevel% neq 0 (
    echo Python not found! Please install Python from python.org
) else (
    echo Python: OK
)

echo.
echo Checking Node.js...
node --version
if %errorlevel% neq 0 (
    echo Node.js not found! Please install Node.js from nodejs.org
) else (
    echo Node.js: OK
)

echo.
echo Checking GCC (C compiler)...
gcc --version
if %errorlevel% neq 0 (
    echo GCC not found! Installing MinGW...
    echo Please download and install MinGW from: https://www.mingw-w64.org/downloads/
    echo Or use: winget install mingw
) else (
    echo GCC: OK
)

echo.
echo Checking G++ (C++ compiler)...
g++ --version
if %errorlevel% neq 0 (
    echo G++ not found! Please install MinGW (includes G++)
) else (
    echo G++: OK
)

echo.
echo Checking Java...
java -version
if %errorlevel% neq 0 (
    echo Java not found! Please install JDK from oracle.com or openjdk.org
) else (
    echo Java Runtime: OK
)

echo.
echo Checking Java Compiler...
javac -version
if %errorlevel% neq 0 (
    echo Java Compiler not found! Please install JDK (not just JRE)
) else (
    echo Java Compiler: OK
)

echo.
echo Installation check complete!
echo If any compilers are missing, please install them and restart the application.

pause