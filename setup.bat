@echo off
echo Setting up OnlineGDB Clone...

echo.
echo Installing backend dependencies...
cd backend
pip install -r requirements.txt
cd ..

echo.
echo Installing frontend dependencies...
cd frontend
npm install
cd ..

echo.
echo Creating environment file...
copy backend\.env.example backend\.env

echo.
echo Setup complete! 
echo.
echo To start the application:
echo 1. Start with Docker: docker-compose up --build
echo 2. Or start manually:
echo    - Backend: cd backend && python app.py
echo    - Frontend: cd frontend && npm start
echo.
echo Make sure PostgreSQL is running and Docker is available for code execution.

pause