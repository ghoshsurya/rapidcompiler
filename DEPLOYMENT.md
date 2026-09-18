# Codesplex Production Deployment Guide

## 🚀 Netlify + Supabase Deployment

### Step 1: Setup Supabase

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Note your `Project URL` and `anon public key`

2. **Setup Database**
   - Go to SQL Editor in Supabase dashboard
   - Run the SQL from `supabase-schema.sql`

3. **Enable Authentication**
   - Go to Authentication > Settings
   - Enable Email authentication
   - Configure email templates (optional)

### Step 2: Setup Netlify

1. **Connect Repository**
   - Go to [netlify.com](https://netlify.com)
   - Connect your GitHub repository
   - Netlify will auto-detect `netlify.toml`

2. **Environment Variables**
   - Go to Site Settings > Environment Variables
   - Add:
     ```
     REACT_APP_SUPABASE_URL=your_supabase_project_url
     REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

3. **Deploy**
   - Push to main branch
   - Netlify will auto-deploy

### Step 3: Custom Domain (Optional)

1. **Add Domain**
   - Go to Domain Settings in Netlify
   - Add your custom domain
   - Update DNS records as instructed

2. **SSL Certificate**
   - Netlify provides free SSL automatically

## 🔧 Local Development

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Environment Variables**
   ```bash
   cp .env.example .env.local
   # Fill in your Supabase credentials
   ```

3. **Start Development**
   ```bash
   npm start
   ```

## 📊 Features in Production

- ✅ **Frontend**: React app on Netlify CDN
- ✅ **Backend**: Serverless functions for code execution
- ✅ **Database**: Supabase PostgreSQL
- ✅ **Authentication**: Supabase Auth
- ✅ **Code Execution**: Python & JavaScript via serverless
- ✅ **Web Preview**: HTML/CSS/JS & PHP preview
- ✅ **Auto-scaling**: Serverless architecture
- ✅ **Free Tier**: Up to 100GB bandwidth/month

## 🚨 Limitations

- **C/C++ Compilation**: Not available in serverless (use online compilers)
- **Execution Time**: 10-second limit per function
- **Memory**: 1GB limit per function

## 🔄 CI/CD

- **Auto-deploy**: Push to main branch
- **Preview**: Pull requests get preview URLs
- **Rollback**: One-click rollback in Netlify

## 📈 Monitoring

- **Netlify Analytics**: Built-in traffic analytics
- **Supabase Dashboard**: Database monitoring
- **Function Logs**: Real-time serverless logs