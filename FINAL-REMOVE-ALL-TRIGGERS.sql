-- FINAL REMOVE ALL TRIGGERS
-- Remove ALL triggers that interfere with the API saving profile data

-- 1. Drop ALL existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Service role bypass" ON public.users;
DROP POLICY IF EXISTS "Service role can do everything" ON public.users;
DROP POLICY IF EXISTS "Service role full access" ON public.users;
DROP POLICY IF EXISTS "Anon can count users" ON public.users;

-- 2. Drop ALL triggers on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS minimal_sync_trigger ON auth.users CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_email_verified ON auth.users CASCADE;
DROP TRIGGER IF EXISTS simple_user_sync_trigger ON auth.users CASCADE;
DROP TRIGGER IF EXISTS sync_auth_users_trigger ON auth.users CASCADE;

-- 3. Drop ALL triggers on public.users
DROP TRIGGER IF EXISTS validate_user_before_insert ON public.users CASCADE;

-- 4. Drop ALL trigger functions
DROP FUNCTION IF EXISTS public.create_public_user() CASCADE;
DROP FUNCTION IF EXISTS public.ensure_public_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_auth_user() CASCADE;
DROP FUNCTION IF EXISTS public.minimal_user_sync() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.sync_auth_users() CASCADE;
DROP FUNCTION IF EXISTS public.validate_user_data() CASCADE;

-- 5. Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 6. Create clean policies
-- Service role gets full access
CREATE POLICY "Service role full access" ON public.users
    FOR ALL 
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT 
    TO authenticated
    USING (auth.uid() = id);

-- Users can insert their own profile (needed for upsert)
CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE 
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Anonymous users can count for waitlist
CREATE POLICY "Anon can count users" ON public.users
    FOR SELECT 
    TO anon
    USING (true);

-- 7. Verify no triggers remain
SELECT 
    'Triggers on auth.users:' as check_type,
    COUNT(*) as count
FROM pg_trigger 
WHERE tgrelid = 'auth.users'::regclass
AND tgname NOT LIKE 'RI_%'  -- Exclude foreign key triggers

UNION ALL

SELECT 
    'Triggers on public.users:' as check_type,
    COUNT(*) as count
FROM pg_trigger 
WHERE tgrelid = 'public.users'::regclass
AND tgname NOT LIKE 'RI_%';  -- Exclude foreign key triggers

-- 8. Sync any missing users from auth to public (one-time cleanup)
INSERT INTO public.users (
    id, 
    email, 
    created_at,
    user_type,
    referral_code,
    position
)
SELECT 
    au.id, 
    au.email, 
    au.created_at,
    'waitlist',
    upper(substr(md5(random()::text || au.id::text), 1, 8)),
    COALESCE((SELECT MAX(position) + 1 FROM public.users), 100)
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 9. Show recent users to verify data
SELECT 
    u.email,
    u.name,
    u.profession,
    u.company,
    array_length(u.interests, 1) as interest_count,
    u.tier_preference,
    u.created_at
FROM public.users u
ORDER BY u.created_at DESC
LIMIT 5;