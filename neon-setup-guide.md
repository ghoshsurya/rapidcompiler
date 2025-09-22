# Neon Database Quick Setup

## Step 1: Create Neon Account
1. Go to https://neon.tech
2. Sign up with GitHub (recommended)
3. Create new project

## Step 2: Create Database
1. Project name: "rapidcompiler-testing"
2. Region: Choose closest to you
3. PostgreSQL version: 15 (default)
4. Click "Create Project"

## Step 3: Get Connection String
1. Dashboard → Connection Details
2. Copy connection string (looks like):
   `postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require`

## Step 4: Run Database Schema
1. Dashboard → SQL Editor
2. Copy content from `database/neon-schema.sql`
3. Paste and run in SQL Editor
4. Verify tables created: `users`, `projects`

## Step 5: Test Connection
Run this query to verify:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```
Should show: users, projects