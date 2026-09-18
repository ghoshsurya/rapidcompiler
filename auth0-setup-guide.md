# Auth0 Quick Setup

## Step 1: Create Auth0 Account
1. Go to https://auth0.com
2. Sign up for free account
3. Create new tenant (choose region closest to you)

## Step 2: Create Application
1. Dashboard → Applications → Create Application
2. Name: "RapidCompiler Testing"
3. Type: Single Page Web Applications
4. Click Create

## Step 3: Configure Application
In Application Settings:
- **Allowed Callback URLs**: `http://localhost:3000, https://your-test-site.netlify.app`
- **Allowed Logout URLs**: `http://localhost:3000, https://your-test-site.netlify.app`
- **Allowed Web Origins**: `http://localhost:3000, https://your-test-site.netlify.app`
- **Allowed Origins (CORS)**: `http://localhost:3000, https://your-test-site.netlify.app`

## Step 4: Create API
1. Dashboard → APIs → Create API
2. Name: "RapidCompiler API"
3. Identifier: `https://rapidcompiler-api`
4. Signing Algorithm: RS256

## Step 5: Get Credentials
Copy these values:
- **Domain**: `dev-xxxxx.us.auth0.com`
- **Client ID**: `xxxxxxxxxxxxxxxxx`
- **API Identifier**: `https://rapidcompiler-api`

## Step 6: Test Login
1. Applications → Your App → Quick Start → React
2. Follow test instructions to verify setup