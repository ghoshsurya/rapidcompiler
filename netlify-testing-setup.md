# Netlify Testing Deployment

## Step 1: Create New Netlify Site
1. Go to https://netlify.com
2. New site from Git
3. Connect GitHub account
4. Choose repository: `rapidcompiler`
5. **Important**: Set branch to `auth0-neon-testing`
6. Build settings:
   - Build command: `cd frontend && npm install && npm run build && cd ../netlify/functions && npm install`
   - Publish directory: `frontend/build`

## Step 2: Add Environment Variables
Site Settings → Environment Variables → Add:

```
REACT_APP_AUTH0_DOMAIN=your-domain.auth0.com
REACT_APP_AUTH0_CLIENT_ID=your_client_id_here
REACT_APP_AUTH0_AUDIENCE=https://rapidcompiler-api
DATABASE_URL=postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_AUDIENCE=https://rapidcompiler-api
```

## Step 3: Deploy
1. Click "Deploy site"
2. Wait for build to complete
3. Note your testing URL: `https://amazing-name-123456.netlify.app`

## Step 4: Update Auth0 URLs
Go back to Auth0 and update URLs with your Netlify testing URL:
- Replace `https://your-test-site.netlify.app` with actual URL

## Step 5: Test
1. Visit your testing site
2. Click login button
3. Should redirect to Auth0
4. Login and return to site
5. Check if user profile created