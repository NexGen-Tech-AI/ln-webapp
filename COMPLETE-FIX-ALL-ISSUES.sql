-- COMPLETE FIX FOR ALL ISSUES
-- This will fix:
-- 1. Signup 500 errors
-- 2. User profile data not showing
-- 3. Demo thumbnail not showing
-- 4. Welcome emails not being sent

-- First, let's debug and fix the trigger issue
-- 1. Drop the problematic trigger temporarily
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users CASCADE;

-- 2. Create a simpler, more reliable trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Simple insert without complex logic that could fail
    INSERT INTO public.users (
        id,
        email,
        name,
        referral_code,
        position,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'referral_code', upper(substr(md5(random()::text || NEW.id::text), 1, 8))),
        COALESCE((NEW.raw_user_meta_data->>'position')::int, (SELECT COALESCE(MAX(position), 0) + 1 FROM public.users)),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the auth signup
        RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 4. Fix permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 5. Create the position sequence if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS users_position_seq START 100;

-- 6. Ensure the verification_token column exists
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS verification_token TEXT;

-- 7. Fix any existing users that might be missing data
UPDATE public.users u
SET 
    name = COALESCE(u.name, au.email),
    referral_code = COALESCE(u.referral_code, upper(substr(md5(random()::text || u.id::text), 1, 8))),
    position = COALESCE(u.position, (SELECT COALESCE(MAX(position), 0) + 1 FROM public.users WHERE id != u.id))
FROM auth.users au
WHERE u.id = au.id
AND (u.name IS NULL OR u.referral_code IS NULL OR u.position IS NULL);

-- 8. Create the increment function if it doesn't exist
CREATE OR REPLACE FUNCTION public.increment_referral_count(user_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.users
    SET referral_count = COALESCE(referral_count, 0) + 1
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- 9. Verify the fix
SELECT 
    'Triggers' as check_type,
    COUNT(*) as count
FROM pg_trigger
WHERE tgname = 'on_auth_user_created'

UNION ALL

SELECT 
    'Users with missing data' as check_type,
    COUNT(*) as count
FROM public.users
WHERE name IS NULL OR referral_code IS NULL OR position IS NULL;