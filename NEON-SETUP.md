# RapidCompiler: Auth0 + Neon Setup Guide

## Quick Setup

### 1. Auth0 Setup
1. Create account at https://auth0.com
2. Create Single Page Application
3. Configure URLs:
   - Callback: `http://localhost:3000, https://your-site.netlify.app`
   - Logout: `http://localhost:3000, https://your-site.netlify.app`
   - Web Origins: `http://localhost:3000, https://your-site.netlify.app`
4. Create API in Auth0 dashboard
5. Note: Domain, Client ID, API Identifier

### 2. Neon Database Setup
1. Go to https://neon.tech
2. Create free account and database
3. Run schema: Copy content from `database/neon-schema.sql` and execute in Neon SQL Editor
4. Note connection string

### 3. Environment Variables

#### Frontend (.env)
```
REACT_APP_AUTH0_DOMAIN=your-domain.auth0.com
REACT_APP_AUTH0_CLIENT_ID=your_client_id
REACT_APP_AUTH0_AUDIENCE=your_api_identifier
REACT_APP_API_URL=/.netlify/functions
```

#### Netlify Environment Variables
Add in Site Settings > Environment Variables:
```
REACT_APP_AUTH0_DOMAIN=your-domain.auth0.com
REACT_APP_AUTH0_CLIENT_ID=your_client_id
REACT_APP_AUTH0_AUDIENCE=your_api_identifier
DATABASE_URL=postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_AUDIENCE=your_api_identifier
```

### 4. Local Development
```bash
# Frontend
cd frontend
npm install
npm start

# Backend (optional - for local testing)
cd backend
pip install -r requirements-neon.txt
cp .env.neon.example .env
# Edit .env with your values
python app-neon.py
```

### 5. Deploy to Netlify
1. Push to GitHub
2. Connect repository to Netlify
3. Add environment variables in Netlify dashboard
4. Deploy automatically

## API Endpoints
- `GET /.netlify/functions/neon-api/health` - Health check
- `GET /.netlify/functions/neon-api/users/:id` - Get user
- `POST /.netlify/functions/neon-api/users` - Create user
- `GET /.netlify/functions/neon-api/projects` - Get projects
- `POST /.netlify/functions/neon-api/projects` - Create project
- `POST /.netlify/functions/run` - Execute code

## Features
✅ Auth0 Universal Login
✅ Neon PostgreSQL Database
✅ Serverless Architecture
✅ Multi-language Code Execution
✅ Project Management
✅ User Profiles
✅ Auto-deployment from GitHub