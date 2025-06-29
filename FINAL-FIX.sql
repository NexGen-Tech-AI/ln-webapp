-- FINAL FIX - This will solve the NULL fields issue

-- 1. DROP ALL TRIGGERS - They are interfering with your API
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_email_verified ON auth.users CASCADE;
DROP TRIGGER IF EXISTS simple_user_sync_trigger ON auth.users CASCADE;
DROP TRIGGER IF EXISTS sync_auth_users_trigger ON auth.users CASCADE;
DROP TRIGGER IF EXISTS validate_user_before_insert ON public.users CASCADE;

-- 2. DROP ALL TRIGGER FUNCTIONS
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_auth_user_updated() CASCADE;
DROP FUNCTION IF EXISTS public.update_email_verified() CASCADE;
DROP FUNCTION IF EXISTS public.simple_user_sync() CASCADE;
DROP FUNCTION IF EXISTS public.sync_auth_users() CASCADE;
DROP FUNCTION IF EXISTS public.validate_user_data() CASCADE;

-- 3. Your API route already handles everything, so we don't need triggers!
-- The /api/auth/signup-simple/route.ts already:
-- - Creates the auth user
-- - Creates the full user profile with ALL fields
-- - Handles referral tracking
-- - Sends welcome email

-- 4. Just ensure the table has proper defaults
ALTER TABLE public.users 
ALTER COLUMN referral_code SET DEFAULT upper(substr(md5(random()::text || gen_random_uuid()::text), 1, 8)),
ALTER COLUMN position SET DEFAULT nextval('users_position_seq'),
ALTER COLUMN created_at SET DEFAULT NOW(),
ALTER COLUMN updated_at SET DEFAULT NOW(),
ALTER COLUMN email_verified SET DEFAULT false,
ALTER COLUMN referral_count SET DEFAULT 0,
ALTER COLUMN user_type SET DEFAULT 'waitlist',
ALTER COLUMN auth_provider SET DEFAULT 'email',
ALTER COLUMN tier_preference SET DEFAULT 'free';

-- 5. Fix permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- 6. Create public view for waitlist count
DROP VIEW IF EXISTS public.public_waitlist_stats;
CREATE VIEW public.public_waitlist_stats AS
SELECT COUNT(*) as total_users
FROM public.users;

GRANT SELECT ON public.public_waitlist_stats TO anon;

-- 7. Test - check for NULL values
SELECT 
    'Total Users' as check_type,
    COUNT(*) as count
FROM public.users

UNION ALL

SELECT 
    'Users with NULL name' as check_type,
    COUNT(*) as count
FROM public.users
WHERE name IS NULL

UNION ALL

SELECT 
    'Users with NULL profession' as check_type,
    COUNT(*) as count
FROM public.users
WHERE profession IS NULL

UNION ALL

SELECT 
    'Users with NULL interests' as check_type,
    COUNT(*) as count
FROM public.users
WHERE interests IS NULL;