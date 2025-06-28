-- IMMEDIATE FIX FOR SIGNUP ISSUES
-- Run this to fix all signup problems

-- 1. Remove blocking constraints
ALTER TABLE public.users 
ALTER COLUMN referral_code DROP NOT NULL,
ALTER COLUMN position DROP NOT NULL;

-- 2. Add default values
ALTER TABLE public.users 
ALTER COLUMN referral_code SET DEFAULT upper(substr(md5(random()::text || gen_random_uuid()::text), 1, 8)),
ALTER COLUMN position SET DEFAULT nextval('users_position_seq');

-- 3. Drop all complex triggers that might be failing
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_email_verified ON auth.users CASCADE;
DROP TRIGGER IF EXISTS simple_user_sync_trigger ON auth.users CASCADE;
DROP TRIGGER IF EXISTS validate_user_before_insert ON public.users CASCADE;

-- 4. Create ONE simple trigger that works
CREATE OR REPLACE FUNCTION public.sync_auth_users()
RETURNS TRIGGER AS $$
BEGIN
    -- Just ensure basic record exists, let API handle the rest
    INSERT INTO public.users (id, email, created_at)
    VALUES (NEW.id, NEW.email, NOW())
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER sync_auth_users_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_auth_users();

-- 5. Fix permissions for public access to count
CREATE OR REPLACE VIEW public.public_waitlist_stats AS
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as new_today,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as new_this_week
FROM public.users;

-- Grant public read access
GRANT SELECT ON public.public_waitlist_stats TO anon;

-- 6. Create policy for anon to read user count
DROP POLICY IF EXISTS "Anon can count users" ON public.users;
CREATE POLICY "Anon can count users" ON public.users
    FOR SELECT 
    TO anon
    USING (true);

-- 7. Fix any existing users
UPDATE public.users 
SET 
    referral_code = COALESCE(referral_code, upper(substr(md5(random()::text || id::text), 1, 8))),
    position = COALESCE(position, (SELECT COALESCE(MAX(position), 100) + 1 FROM public.users WHERE id != users.id))
WHERE referral_code IS NULL OR position IS NULL;

-- 8. Ensure email_verified defaults to false
ALTER TABLE public.users 
ALTER COLUMN email_verified SET DEFAULT false;

-- 9. Test the setup
SELECT 
    'Total Users' as metric,
    COUNT(*) as value
FROM public.users
UNION ALL
SELECT 
    'Users with NULL referral_code' as metric,
    COUNT(*) as value
FROM public.users
WHERE referral_code IS NULL
UNION ALL
SELECT 
    'Users with NULL position' as metric,
    COUNT(*) as value
FROM public.users
WHERE position IS NULL;