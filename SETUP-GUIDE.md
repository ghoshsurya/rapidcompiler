# Complete Setup Guide for Codesplex

## 🔧 Supabase Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Note down your project URL and anon key

### 2. Run Database Schema
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the content from `supabase-complete-schema.sql`
3. Run the query to create all tables and policies

### 3. Enable Authentication
1. Go to Authentication → Settings
2. Enable email authentication
3. Configure email templates (optional)

### 4. Create Storage Bucket
1. Go to Storage
2. Create bucket named `avatars`
3. Make it public
4. Set up policies (already in schema)

### 5. Create First Admin User
1. Register a user through the app
2. Go to Supabase Dashboard → Table Editor → users
3. Find your user and set `is_admin = true`

## 🌐 Netlify Setup

### 1. Frontend Deployment
```bash
# Build the frontend
cd frontend
npm run build

# Deploy to Netlify
# Option 1: Drag and drop build folder to netlify.com
# Option 2: Connect GitHub repo for auto-deployment
```

### 2. Environment Variables in Netlify
Go to Site Settings → Environment Variables and add:
```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Netlify Functions (Optional)
- The `netlify/functions/` folder contains serverless functions
- These will auto-deploy with your site

## 📁 Environment Files

### Frontend (.env)
Create `frontend/.env`:
```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_API_URL=http://localhost:5000
```

### Backend (.env)
Create `backend/.env`:
```env
FLASK_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/onlinegdb
JWT_SECRET_KEY=your-super-secret-jwt-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
```

## 🚀 Deployment Options

### Option 1: Netlify + Supabase (Recommended)
- ✅ Frontend: Netlify (Free)
- ✅ Database: Supabase (Free tier)
- ✅ Authentication: Supabase Auth
- ✅ File Storage: Supabase Storage

### Option 2: Full Stack Deployment
- Frontend: Netlify/Vercel
- Backend: Railway/Render/Heroku
- Database: PostgreSQL (Railway/Render)

## 🔐 Security Configuration

### 1. Supabase RLS Policies
All tables have Row Level Security enabled with proper policies:
- Users can only access their own data
- Admins can access all user data
- Public projects are viewable by everyone

### 2. JWT Configuration
- Set strong JWT secret in production
- Configure token expiration times
- Enable refresh tokens

### 3. CORS Configuration
Update CORS settings for production domains

## 📱 Features Included

### ✅ User Management
- Registration with email verification
- Login/logout functionality
- Profile management with avatar upload
- Password change functionality

### ✅ Admin Panel
- Separate admin login at `/admin/login`
- User management (view, delete, promote)
- Statistics dashboard
- Project monitoring

### ✅ Code Editor
- Multi-language support
- Project save/load
- Code download with proper extensions
- Project sharing

### ✅ Security
- Row Level Security (RLS)
- Input validation
- XSS protection
- Secure file uploads

## 🧪 Testing

### Test User Registration
1. Go to `/register`
2. Create account with valid email
3. Check Supabase users table

### Test Admin Access
1. Set user as admin in Supabase
2. Go to `/admin/login`
3. Login with admin credentials
4. Access admin dashboard

### Test Code Execution
1. Write code in editor
2. Run code
3. Save project
4. Download project file

## 🔧 Troubleshooting

### Common Issues

1. **Supabase Connection Error**
   - Check environment variables
   - Verify project URL and keys
   - Check network connectivity

2. **Authentication Not Working**
   - Verify Supabase auth is enabled
   - Check RLS policies
   - Verify JWT configuration

3. **File Upload Issues**
   - Check storage bucket exists
   - Verify bucket is public
   - Check storage policies

4. **Admin Access Denied**
   - Verify user has `is_admin = true`
   - Check admin login route
   - Verify admin authentication logic

## 📞 Support

For issues:
1. Check browser console for errors
2. Check Supabase logs
3. Verify environment variables
4. Test with fresh user account

## 🎯 Next Steps

After setup:
1. Customize branding and colors
2. Add more programming languages
3. Implement real-time collaboration
4. Add code sharing features
5. Set up monitoring and analytics