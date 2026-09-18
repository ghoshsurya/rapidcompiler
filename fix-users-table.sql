-- First, let's see what columns exist
-- Run this to check current table structure:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'users';

-- Add missing columns to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Update the trigger function with correct columns
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, email, full_name, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create missing user profiles for existing auth users
INSERT INTO public.users (id, username, email, is_admin)
SELECT 
  au.id,
  split_part(au.email, '@', 1) as username,
  au.email,
  false as is_admin
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Make your email admin
UPDATE public.users 
SET is_admin = true 
WHERE email = 'suryakanta9662@gmail.com';