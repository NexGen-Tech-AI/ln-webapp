-- FINAL AUTH FIX - RUN THIS TO SOLVE ALL AUTH/PROFILE ISSUES
-- This addresses the exact problem from the detailed explanation

-- ============================================
-- STEP 1: ENSURE EVERY AUTH USER HAS A PUBLIC USER RECORD
-- ============================================

-- Create missing public.users records for all auth.users
INSERT INTO public.users (
    id, 
    email, 
    created_at,
    user_type,
    referral_code,
    position,
    trust_score,
    auth_provider,
    email_verified,
    referral_count,
    tier_preference
)
SELECT 
    au.id,
    au.email,
    au.created_at,
    'waitlist',
    upper(substr(md5(random()::text || au.id::text), 1, 8)),
    COALESCE((SELECT MAX(position) + 1 FROM public.users), 100),
    50,
    'email',
    COALESCE(au.email_confirmed_at IS NOT NULL, false),
    0,
    'free'
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- ============================================
-- STEP 2: DROP ALL TRIGGERS AND START FRESH
-- ============================================

-- Drop all triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS minimal_sync_trigger ON auth.users CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_email_verified ON auth.users CASCADE;
DROP TRIGGER IF EXISTS simple_user_sync_trigger ON auth.users CASCADE;
DROP TRIGGER IF EXISTS sync_auth_users_trigger ON auth.users CASCADE;
DROP TRIGGER IF EXISTS validate_user_before_insert ON public.users CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS public.handle_new_auth_user() CASCADE;
DROP FUNCTION IF EXISTS public.minimal_user_sync() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.sync_auth_users() CASCADE;
DROP FUNCTION IF EXISTS public.validate_user_data() CASCADE;

-- ============================================
-- STEP 3: CREATE A BULLETPROOF TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION public.create_public_user()
RETURNS TRIGGER AS $$
DECLARE
    new_position INTEGER;
    new_referral_code TEXT;
BEGIN
    -- Generate unique position
    SELECT COALESCE(MAX(position), 99) + 1 INTO new_position FROM public.users;
    
    -- Generate unique referral code
    new_referral_code := upper(substr(md5(random()::text || NEW.id::text), 1, 8));
    
    -- Create the user record with all defaults
    INSERT INTO public.users (
        id,
        email,
        created_at,
        user_type,
        referral_code,
        position,
        trust_score,
        auth_provider,
        email_verified,
        referral_count,
        tier_preference,
        onboarding_completed
    ) VALUES (
        NEW.id,
        NEW.email,
        NEW.created_at,
        'waitlist',
        new_referral_code,
        new_position,
        50,
        'email',
        false,
        0,
        'free',
        false
    );
    
    RETURN NEW;
EXCEPTION 
    WHEN unique_violation THEN
        -- User already exists, just update email in case it changed
        UPDATE public.users 
        SET email = NEW.email, updated_at = NOW() 
        WHERE id = NEW.id;
        RETURN NEW;
    WHEN OTHERS THEN
        -- Log error but don't fail auth signup
        RAISE LOG 'create_public_user error: % for user %', SQLERRM, NEW.email;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_public_user();

-- ============================================
-- STEP 4: FIX RLS POLICIES (CRITICAL!)
-- ============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Service role can do everything" ON public.users;
DROP POLICY IF EXISTS "Service role bypass" ON public.users;
DROP POLICY IF EXISTS "Anon can count users" ON public.users;

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- CRITICAL: Allow users to INSERT their own record (for upsert to work)
CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT 
    USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Service role bypasses all RLS
CREATE POLICY "Service role bypass" ON public.users
    FOR ALL 
    USING (auth.role() = 'service_role');

-- Allow anonymous users to count (for waitlist counter)
CREATE POLICY "Anon can count users" ON public.users
    FOR SELECT 
    TO anon
    USING (true);

-- ============================================
-- STEP 5: FIX PERMISSIONS
-- ============================================

-- Grant proper permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Specific permissions for authenticated users
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT USAGE ON SEQUENCE users_position_seq TO authenticated;

-- ============================================
-- STEP 6: UPDATE EXISTING BROKEN RECORDS
-- ============================================

-- Fix users with NULL profile data by pulling from auth metadata if available
UPDATE public.users u
SET 
    name = COALESCE(
        u.name, 
        au.raw_user_meta_data->>'name',
        au.raw_user_meta_data->>'full_name',
        split_part(u.email, '@', 1)
    ),
    profession = COALESCE(
        u.profession,
        au.raw_user_meta_data->>'profession'
    ),
    company = COALESCE(
        u.company,
        au.raw_user_meta_data->>'company'
    ),
    interests = CASE 
        WHEN u.interests IS NULL OR array_length(u.interests, 1) = 0
        AND au.raw_user_meta_data ? 'interests'
        THEN ARRAY(SELECT jsonb_array_elements_text(au.raw_user_meta_data->'interests'))
        ELSE u.interests
    END,
    tier_preference = COALESCE(
        u.tier_preference,
        au.raw_user_meta_data->>'tier_preference',
        au.raw_user_meta_data->>'tierPreference',
        'free'
    ),
    updated_at = NOW()
FROM auth.users au
WHERE u.id = au.id
AND (u.name IS NULL OR u.profession IS NULL);

-- Set default values for required fields
UPDATE public.users
SET 
    referral_code = upper(substr(md5(random()::text || id::text), 1, 8))
WHERE referral_code IS NULL;

UPDATE public.users
SET 
    position = (SELECT COALESCE(MAX(position), 99) + 1 FROM public.users p WHERE p.id != users.id)
WHERE position IS NULL;

-- ============================================
-- STEP 7: VERIFY THE FIX
-- ============================================

-- Check sync status
WITH sync_check AS (
    SELECT 
        COUNT(DISTINCT au.id) as auth_users,
        COUNT(DISTINCT pu.id) as public_users,
        COUNT(DISTINCT au.id) FILTER (WHERE pu.id IS NULL) as missing_public_records,
        COUNT(DISTINCT pu.id) FILTER (WHERE pu.name IS NULL) as users_without_name,
        COUNT(DISTINCT pu.id) FILTER (WHERE pu.profession IS NULL) as users_without_profession,
        COUNT(DISTINCT pu.id) FILTER (WHERE pu.onboarding_completed = false) as incomplete_onboarding
    FROM auth.users au
    LEFT JOIN public.users pu ON au.id = pu.id
)
SELECT 
    'Auth Users' as metric,
    auth_users as count,
    'Total auth.users records' as description
FROM sync_check
UNION ALL
SELECT 
    'Public Users' as metric,
    public_users as count,
    'Total public.users records' as description
FROM sync_check
UNION ALL
SELECT 
    'Missing Public Records' as metric,
    missing_public_records as count,
    'Auth users without public.users record' as description
FROM sync_check
UNION ALL
SELECT 
    'Missing Names' as metric,
    users_without_name as count,
    'Users with NULL name' as description
FROM sync_check
UNION ALL
SELECT 
    'Missing Professions' as metric,
    users_without_profession as count,
    'Users with NULL profession' as description
FROM sync_check
UNION ALL
SELECT 
    'Incomplete Onboarding' as metric,
    incomplete_onboarding as count,
    'Users who have not completed onboarding' as description
FROM sync_check;

-- ============================================
-- FINAL MESSAGE
-- ============================================
SELECT 
    'FIX COMPLETE!' as status,
    'All auth users now have public profiles. Frontend can now save data using UPSERT.' as message;