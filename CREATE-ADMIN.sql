-- STEP 1: First register on website with these credentials:
-- Email: admin@codesplex.com
-- Password: Admin123!
-- Username: admin

-- STEP 2: Then run this SQL in Supabase to make admin:
UPDATE users 
SET is_admin = true 
WHERE email = 'admin@codesplex.com';

-- STEP 3: Verify admin was created:
SELECT username, email, is_admin FROM users WHERE is_admin = true;

-- Alternative: Make any existing user admin:
-- UPDATE users 
-- SET is_admin = true 
-- WHERE email = 'your-email@example.com';