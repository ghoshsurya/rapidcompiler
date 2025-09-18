# Codesplex - Online Code Editor & Compiler Platform

A modern, SEO-optimized web application for online code editing and compilation with support for multiple programming languages including Python, JavaScript, C/C++, PHP, and HTML/CSS/JS.

## Features

- **Modern UI/UX**: React + Tailwind CSS with dark mode
- **Advanced Code Editor**: Monaco Editor with intelligent autocomplete for all languages
- **Multi-language Support**: Python, JavaScript, C, C++, PHP, HTML/CSS/JS
- **Resizable Layout**: Adjustable panels for optimal coding experience
- **Web Preview**: Live HTML/CSS/JS preview in browser
- **User Authentication**: JWT-based auth system
- **Project Management**: Save, share, and manage code snippets
- **SEO Optimized**: Complete meta tags, structured data, sitemap

## Tech Stack

- **Frontend**: React, Tailwind CSS, Monaco Editor
- **Backend**: Python Flask, PostgreSQL
- **Containerization**: Docker
- **Authentication**: JWT tokens

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 16+
- Python 3.9+

### Setup
```bash
# Clone and setup
git clone <repository>
cd Compiler

# Start with Docker Compose
docker-compose up --build

# Or manual setup:
# Backend
cd backend
pip install -r requirements.txt
python app.py

# Frontend
cd frontend
npm install
npm start
```

### Access
- Frontend: http://localhost:3000 (Codesplex)
- Backend API: http://localhost:5000

## Project Structure
```
Compiler/
├── frontend/          # React application
├── backend/           # Flask API server
├── docker/           # Docker configurations
├── database/         # Database schemas
└── docker-compose.yml
```

## API Endpoints

- `POST /api/run` - Execute code
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET/POST /api/projects` - Project management
- `POST /api/projects/share` - Share projects

## SEO Features

- Comprehensive meta tags (Open Graph, Twitter Cards)
- Structured data (JSON-LD)
- XML sitemap
- Robots.txt
- Canonical URLs
- Semantic HTML structure

## Security Features

- Execution time limits (10s)
- Input sanitization
- JWT token authentication
- Secure code execution environment