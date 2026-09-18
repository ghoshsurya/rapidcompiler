# Testing Checklist for Auth0 + Neon Migration

## Setup Required Before Testing

### 1. Auth0 Setup
- [ ] Create Auth0 account at https://auth0.com
- [ ] Create Single Page Application
- [ ] Configure Allowed URLs:
  - Callback: `https://your-test-site.netlify.app`
  - Logout: `https://your-test-site.netlify.app`
  - Web Origins: `https://your-test-site.netlify.app`
- [ ] Create API in Auth0 dashboard
- [ ] Note credentials: Domain, Client ID, API Identifier

### 2. Neon Database Setup
- [ ] Create account at https://neon.tech
- [ ] Create new database
- [ ] Run schema from `database/neon-schema.sql`
- [ ] Copy connection string

### 3. Netlify Deployment
- [ ] Connect `auth0-neon-testing` branch to new Netlify site
- [ ] Add environment variables:
  ```
  REACT_APP_AUTH0_DOMAIN=your-domain.auth0.com
  REACT_APP_AUTH0_CLIENT_ID=your_client_id
  REACT_APP_AUTH0_AUDIENCE=your_api_identifier
  DATABASE_URL=postgresql://...neon.tech/neondb?sslmode=require
  AUTH0_DOMAIN=your-domain.auth0.com
  AUTH0_AUDIENCE=your_api_identifier
  ```
- [ ] Deploy and test

## Testing Checklist

### Authentication Tests
- [ ] Login page loads without errors
- [ ] Auth0 login button works
- [ ] Redirects to Auth0 login page
- [ ] Successfully logs in and returns to app
- [ ] User profile created in Neon database
- [ ] Logout works correctly

### Database Tests
- [ ] Health endpoint works: `/.netlify/functions/neon-api/health`
- [ ] User profile loads after login
- [ ] Can create new project
- [ ] Can save project
- [ ] Can load saved projects
- [ ] Projects list displays correctly

### Code Execution Tests
- [ ] Python code execution works
- [ ] JavaScript code execution works
- [ ] C/C++ compilation and execution works
- [ ] Java compilation and execution works
- [ ] Error handling works correctly

### UI Tests
- [ ] All pages load without console errors
- [ ] Dark/light mode toggle works
- [ ] Responsive design works on mobile
- [ ] Navigation works correctly
- [ ] No broken links or missing components

## If All Tests Pass ✅

### Merge to Main Branch
```bash
git checkout main
git merge auth0-neon-testing
git push origin main
git branch -d auth0-neon-testing
git push origin --delete auth0-neon-testing
```

### Update Production Environment
- [ ] Add same environment variables to main production site
- [ ] Update Auth0 URLs to production domain
- [ ] Test production deployment

## If Tests Fail ❌

### Debug and Fix
- [ ] Check browser console for errors
- [ ] Verify environment variables
- [ ] Check Netlify function logs
- [ ] Test API endpoints manually
- [ ] Fix issues and re-test

### Rollback if Needed
```bash
git checkout main
# Main branch remains unchanged - safe fallback
```

## Current Status
- [x] Testing branch created: `auth0-neon-testing`
- [x] Code migrated to Auth0 + Neon
- [x] Build successful locally
- [ ] Auth0 setup pending
- [ ] Neon database setup pending
- [ ] Netlify deployment pending
- [ ] Testing pending