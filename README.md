# 🚀 Codesplex - Professional Online Code Editor & Compiler

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://codesplex.netlify.app)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue)](https://github.com/ghoshsurya/codesplex)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A production-ready, enterprise-grade online code editor and compiler platform with advanced features, security, and multi-language support. Built with modern technologies and optimized for performance.

## ✨ Key Features

### 🎨 **Advanced Code Editor**
- **Monaco Editor** (VS Code engine) with syntax highlighting
- **Intelligent IntelliSense** for all supported languages
- **Custom code snippets** and autocomplete
- **Resizable panels** with drag-and-drop functionality
- **Dark/Light theme** with persistent preferences

### 💻 **Multi-Language Support**
- **Python** 3.9+ with full library support
- **JavaScript** (Node.js 16) with ES6+ features
- **C/C++** with GCC compiler
- **Java** with OpenJDK 11
- **C#** with .NET runtime
- **PHP** with latest interpreter
- **SQL** with query execution
- **HTML/CSS/JS** with live preview

### 🔐 **Enterprise Security**
- **Docker containerization** for isolated execution
- **Resource limits**: 128MB RAM, CPU quotas
- **Network isolation** and timeout protection (10s)
- **JWT authentication** with secure token management
- **Input sanitization** and XSS protection

### 👥 **User Management**
- **Supabase authentication** integration
- **User profiles** with project history
- **Admin dashboard** for platform management
- **Project sharing** with unique URLs
- **Real-time collaboration** ready

### 🌐 **Production Features**
- **SEO optimized** with meta tags and structured data
- **PWA ready** with offline capabilities
- **Responsive design** for all devices
- **Performance optimized** with code splitting
- **Error tracking** and logging

## 🏗️ Architecture

### **Frontend Stack**
```
React 18 + TypeScript
├── Monaco Editor (VS Code)
├── Tailwind CSS + PostCSS
├── React Router v6
├── Axios for API calls
├── Lucide React icons
└── Supabase client
```

### **Backend Stack**
```
Python Flask + PostgreSQL
├── Flask-JWT-Extended
├── Flask-SQLAlchemy
├── Docker Python SDK
├── bcrypt encryption
├── CORS middleware
└── Gunicorn WSGI
```

### **Infrastructure**
```
Docker + Docker Compose
├── PostgreSQL 15 database
├── Nginx reverse proxy
├── Multi-stage builds
├── Health checks
└── Volume persistence
```

## 🚀 Quick Start

### Prerequisites
- **Docker** & **Docker Compose**
- **Node.js** 16+ and **npm**
- **Python** 3.9+ and **pip**
- **Git** for version control

### 1. Clone Repository
```bash
git clone https://github.com/ghoshsurya/codesplex.git
cd codesplex
```

### 2. Environment Setup
```bash
# Backend environment
cp backend/.env.example backend/.env

# Frontend environment
cp frontend/.env.example frontend/.env
```

### 3. Docker Deployment (Recommended)
```bash
# Start all services
docker-compose up --build

# Run in background
docker-compose up -d --build
```

### 4. Manual Development Setup
```bash
# Backend setup
cd backend
pip install -r requirements.txt
python app.py

# Frontend setup (new terminal)
cd frontend
npm install
npm start
```

### 5. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Database**: PostgreSQL on port 5432

## 📁 Project Structure

```
codesplex/
├── 📁 frontend/                 # React application
│   ├── 📁 public/              # Static assets
│   ├── 📁 src/
│   │   ├── 📁 components/      # React components
│   │   ├── 📁 pages/          # Route pages
│   │   ├── 📁 hooks/          # Custom hooks
│   │   ├── 📁 lib/            # Utilities
│   │   └── 📁 utils/          # Helper functions
│   ├── 📄 package.json
│   └── 📄 tailwind.config.js
├── 📁 backend/                  # Flask API server
│   ├── 📄 app.py              # Main application
│   ├── 📄 requirements.txt    # Python dependencies
│   └── 📄 Dockerfile          # Backend container
├── 📁 database/                # Database schemas
│   └── 📄 schema.sql          # PostgreSQL schema
├── 📁 docker/                  # Docker configurations
│   └── 📄 nginx.conf          # Nginx config
├── 📁 netlify/                 # Serverless functions
│   └── 📁 functions/          # API functions
├── 📄 docker-compose.yml       # Multi-container setup
├── 📄 netlify.toml            # Netlify deployment
└── 📄 README.md               # Documentation
```

## 🔌 API Documentation

### Authentication Endpoints
```http
POST /api/auth/register    # User registration
POST /api/auth/login       # User login
GET  /api/auth/profile     # Get user profile
```

### Code Execution
```http
POST /api/run              # Execute code
{
  "language": "python",
  "code": "print('Hello World')",
  "input": "optional input"
}
```

### Project Management
```http
GET    /api/projects           # List user projects
POST   /api/projects           # Create new project
GET    /api/projects/:id       # Get project details
PUT    /api/projects/:id       # Update project
DELETE /api/projects/:id       # Delete project
POST   /api/projects/:id/share # Share project
```

### Public Endpoints
```http
GET /api/share/:shareId        # Get shared project
GET /api/health               # Health check
```

## 🛡️ Security Implementation

### Code Execution Security
- **Docker isolation** with restricted containers
- **Resource limits**: Memory (128MB), CPU quotas
- **Network disabled** during execution
- **Timeout protection** (10 seconds max)
- **Temporary file cleanup**

### Authentication Security
- **JWT tokens** with expiration
- **bcrypt password hashing**
- **CORS protection**
- **Input validation** and sanitization
- **SQL injection prevention**

### Infrastructure Security
- **Environment variables** for secrets
- **Database connection pooling**
- **Rate limiting** ready
- **HTTPS enforcement** in production

## 🌐 SEO & Performance

### SEO Features
- **Meta tags** (Open Graph, Twitter Cards)
- **Structured data** (JSON-LD)
- **XML sitemap** generation
- **Robots.txt** optimization
- **Canonical URLs**
- **Semantic HTML5** structure

### Performance Optimizations
- **Code splitting** and lazy loading
- **Bundle optimization** with Webpack
- **Image optimization** and compression
- **CDN ready** for static assets
- **Caching strategies** implemented

## 🚀 Deployment Options

### 1. Netlify (Frontend) + Railway (Backend)
```bash
# Frontend deployment
npm run build
netlify deploy --prod --dir=build

# Backend deployment
git push railway main
```

### 2. Docker Production
```bash
# Production build
docker-compose -f docker-compose.prod.yml up -d
```

### 3. AWS/GCP/Azure
- **Container deployment** with ECS/Cloud Run
- **Database**: RDS/Cloud SQL
- **Storage**: S3/Cloud Storage
- **CDN**: CloudFront/Cloud CDN

## 🧪 Testing

```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd backend
python -m pytest

# Integration tests
python test-api.py
python test-compilers.py
```

## 📊 Monitoring & Analytics

- **Error tracking** with Sentry integration ready
- **Performance monitoring** with Web Vitals
- **User analytics** with Google Analytics
- **API monitoring** with health checks
- **Database monitoring** with connection pooling

## 🤝 Contributing

1. **Fork** the repository
2. **Create** feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** changes (`git commit -m 'Add amazing feature'`)
4. **Push** to branch (`git push origin feature/amazing-feature`)
5. **Open** Pull Request

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Surya Ghosh** - [@ghoshsurya](https://github.com/ghoshsurya)

## 🙏 Acknowledgments

- **Monaco Editor** team for the excellent code editor
- **Docker** for containerization technology
- **React** and **Flask** communities
- **Open source** contributors

---

<div align="center">
  <strong>⭐ Star this repository if you find it helpful!</strong>
</div>