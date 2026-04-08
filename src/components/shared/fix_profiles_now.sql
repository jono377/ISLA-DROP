-- ============================================================
-- Run this in Supabase → SQL Editor → Run
-- ============================================================

-- Step 1: Allow authenticated users to insert their own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Step 2: Auto-create profile on every signup (permanent fix)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'customer'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Create profiles for existing users with no profile
INSERT INTO public.profiles (id, full_name, role)
SELECT
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
  'customer'
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;

-- Step 4: Set your account to ops (replace your@email.com)
UPDATE public.profiles
SET role = 'ops'
WHERE id = (SELECT id FROM auth.users WHERE email = 'your@email.com');

-- Step 5: Verify
SELECT au.email, p.role, p.full_name
FROM public.profiles p
JOIN auth.users au ON au.id = p.id
ORDER BY p.created_at DESC;
