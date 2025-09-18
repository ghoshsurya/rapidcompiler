@echo off
echo Starting OnlineGDB Clone manually...

echo.
echo Starting PostgreSQL (make sure it's installed and running)
echo Database: onlinegdb
echo User: postgres
echo Password: password

echo.
echo Starting Backend...
start cmd /k "cd backend && python app.py"

timeout /t 3

echo.
echo Starting Frontend...
start cmd /k "cd frontend && npm start"

echo.
echo Application will be available at:
echo Frontend: http://localhost:3000
echo Backend: http://localhost:5000

pause