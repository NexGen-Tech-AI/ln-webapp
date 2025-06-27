
-- Fix Waitlist Signup Implementation
-- This migration ensures the waitlist signup works properly

-- 1. First, ensure the handle_new_user trigger properly handles all metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    name,
    profession,
    company,
    interests,
    tier_preference,
    referred_by,
    referral_code,
    position,
    user_type,
    auth_provider,
    avatar_url,
    joined_at
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', ''),
    COALESCE(new.raw_user_meta_data->>'profession', ''),
    COALESCE(new.raw_user_meta_data->>'company', ''),
    CASE 
      WHEN new.raw_user_meta_data->'interests' IS NOT NULL 
      THEN ARRAY(SELECT jsonb_array_elements_text(new.raw_user_meta_data->'interests'))
      ELSE '{}'::text[]
    END,
    COALESCE(new.raw_user_meta_data->>'tierPreference', 'free'),
    new.raw_user_meta_data->>'referralCode',
    generate_referral_code(),
    DEFAULT, -- Let position auto-increment
    'waitlist', -- All new users start on waitlist
    COALESCE(new.raw_app_meta_data->>'provider', 'email'),
    new.raw_user_meta_data->>'avatar_url',
    NOW()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Create or replace the increment_referral_count function
CREATE OR REPLACE FUNCTION public.increment_referral_count(referral_code text)
RETURNS void AS $$
BEGIN
  UPDATE public.users 
  SET referral_count = referral_count + 1
  WHERE users.referral_code = increment_referral_count.referral_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Ensure RLS is enabled but allows signup
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Service role can manage all users" ON public.users;

-- Create new policies
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Service role can manage all users" ON public.users
  FOR ALL
  USING (auth.role() = 'service_role');

-- 5. Ensure referral_tracking table has proper RLS
ALTER TABLE public.referral_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage referral tracking" ON public.referral_tracking;
CREATE POLICY "Service role can manage referral tracking" ON public.referral_tracking
  FOR ALL
  USING (auth.role() = 'service_role');

-- 6. Ensure audit_logs table has proper RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage audit logs" ON public.audit_logs;
CREATE POLICY "Service role can manage audit logs" ON public.audit_logs
  FOR ALL
  USING (auth.role() = 'service_role');

-- 7. Create a function to check signup health
CREATE OR REPLACE FUNCTION public.check_signup_health()
RETURNS TABLE (
  check_name text,
  status text,
  details text
) AS $$
BEGIN
  -- Check if handle_new_user trigger exists
  RETURN QUERY
  SELECT 
    'User creation trigger'::text,
    CASE 
      WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created')
      THEN 'OK'::text
      ELSE 'MISSING'::text
    END,
    'Trigger that creates user profile on signup'::text;

  -- Check if RLS is properly configured
  RETURN QUERY
  SELECT 
    'RLS on users table'::text,
    CASE 
      WHEN (SELECT relrowsecurity FROM pg_class WHERE relname = 'users')
      THEN 'ENABLED'::text
      ELSE 'DISABLED'::text
    END,
    'Row Level Security status'::text;

  -- Check if service role policies exist
  RETURN QUERY
  SELECT 
    'Service role policies'::text,
    CASE 
      WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Service role can manage all users')
      THEN 'OK'::text
      ELSE 'MISSING'::text
    END,
    'Policies allowing API to create users'::text;

  -- Check recent signups
  RETURN QUERY
  SELECT 
    'Recent signups'::text,
    CASE 
      WHEN (SELECT COUNT(*) FROM public.users WHERE joined_at > NOW() - INTERVAL '24 hours') > 0
      THEN 'ACTIVE'::text
      ELSE 'NONE'::text
    END,
    (SELECT COUNT(*)::text || ' signups in last 24 hours' FROM public.users WHERE joined_at > NOW() - INTERVAL '24 hours');
END;
$$ LANGUAGE plpgsql;

-- 8. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.referral_tracking TO service_role;
GRANT ALL ON public.audit_logs TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_referral_count TO service_role;
GRANT EXECUTE ON FUNCTION public.check_signup_health TO service_role, anon, authenticated;

-- 9. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON public.users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_position ON public.users(position);

-- Run health check
SELECT * FROM public.check_signup_health();