-- Make password_hash nullable since Supabase handles auth
ALTER TABLE public.users ALTER COLUMN password_hash DROP NOT NULL;

-- Or set a default value
UPDATE public.users SET password_hash = 'supabase_auth' WHERE password_hash IS NULL;
ALTER TABLE public.users ALTER COLUMN password_hash SET DEFAULT 'supabase_auth';

-- Now create your user profile
INSERT INTO public.users (id, username, email, password_hash, is_admin)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'suryakanta9662@gmail.com'),
  'suryakanta',
  'suryakanta9662@gmail.com',
  'supabase_auth',
  true
) ON CONFLICT (id) DO UPDATE SET is_admin = true;