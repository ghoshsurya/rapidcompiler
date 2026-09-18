-- Fix the trigger function to handle user creation properly
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

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- For existing users without profiles, create them manually
INSERT INTO public.users (id, username, email, full_name, is_admin)
SELECT 
  au.id,
  split_part(au.email, '@', 1) as username,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', '') as full_name,
  false as is_admin
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- Make your email admin
UPDATE public.users 
SET is_admin = true 
WHERE email = 'suryakanta9662@gmail.com';