-- FINAL COMPLETE DATABASE FIX
-- This fixes all signup data capture issues and triggers
-- 
-- After running this SQL:
-- 1. Test signup with a new user to verify data is captured
-- 2. Check the verification query results at the bottom
-- 3. To send the Plaid announcement email to all users, run:
--    node send-announcement.js
--    (Make sure RESEND_API_KEY and Supabase env vars are set)

-- 1. First, drop all existing triggers to start fresh
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_auth_user_updated() CASCADE;

-- 2. Ensure all required columns exist in the users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS profession TEXT,
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tier_preference TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS position INTEGER,
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'waitlist',
ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'email',
ADD COLUMN IF NOT EXISTS verification_token TEXT,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Create sequence for position if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'users_position_seq') THEN
        CREATE SEQUENCE users_position_seq START 100;
    END IF;
END$$;

-- 4. Create a more robust trigger function that captures ALL metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    meta jsonb;
    user_name text;
    user_profession text;
    user_company text;
    user_interests text[];
    user_tier text;
    user_referral_code text;
    user_position int;
    referrer_id uuid;
BEGIN
    -- Get metadata - check both raw_user_meta_data and user_metadata
    -- Note: Supabase stores user_metadata in raw_user_meta_data field
    meta := COALESCE(NEW.raw_user_meta_data, NEW.user_metadata, '{}'::jsonb);
    
    -- Log for debugging
    RAISE NOTICE 'handle_new_user triggered for email: %, metadata: %', NEW.email, meta;
    
    -- Extract all values from metadata
    user_name := COALESCE(
        meta->>'name',
        meta->>'full_name',
        split_part(NEW.email, '@', 1)
    );
    
    user_profession := COALESCE(
        meta->>'profession',
        meta->>'job_title',
        NULL
    );
    
    user_company := COALESCE(
        meta->>'company',
        meta->>'organization',
        NULL
    );
    
    user_tier := COALESCE(
        meta->>'tier_preference',
        meta->>'tierPreference',
        meta->>'tier',
        'free'
    );
    
    -- Handle referral code - use from metadata or generate new
    user_referral_code := COALESCE(
        meta->>'referral_code',
        meta->>'referralCode',
        upper(substr(md5(random()::text || NEW.id::text), 1, 8))
    );
    
    -- Get position from metadata or sequence
    IF meta->>'position' IS NOT NULL THEN
        user_position := (meta->>'position')::int;
    ELSE
        user_position := nextval('users_position_seq');
    END IF;
    
    -- Handle interests array
    IF meta ? 'interests' AND jsonb_typeof(meta->'interests') = 'array' THEN
        user_interests := ARRAY(SELECT jsonb_array_elements_text(meta->'interests'));
    ELSE
        user_interests := '{}'::text[];
    END IF;
    
    -- Handle referrer
    IF meta->>'referred_by' IS NOT NULL THEN
        referrer_id := (meta->>'referred_by')::uuid;
    ELSIF meta->>'referral_code_used' IS NOT NULL THEN
        -- Look up referrer by their referral code
        SELECT id INTO referrer_id 
        FROM public.users 
        WHERE referral_code = meta->>'referral_code_used'
        LIMIT 1;
    END IF;
    
    -- Insert or update the user record with ALL data
    INSERT INTO public.users (
        id,
        email,
        name,
        profession,
        company,
        interests,
        tier_preference,
        referral_code,
        position,
        referred_by,
        user_type,
        auth_provider,
        email_verified,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        user_name,
        user_profession,
        user_company,
        user_interests,
        user_tier,
        user_referral_code,
        user_position,
        referrer_id,
        COALESCE(meta->>'user_type', 'waitlist'),
        COALESCE(meta->>'auth_provider', 'email'),
        COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
        COALESCE(NEW.created_at, NOW()),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = COALESCE(EXCLUDED.name, users.name),
        profession = COALESCE(EXCLUDED.profession, users.profession),
        company = COALESCE(EXCLUDED.company, users.company),
        interests = CASE 
            WHEN array_length(EXCLUDED.interests, 1) > 0 THEN EXCLUDED.interests 
            ELSE users.interests 
        END,
        tier_preference = COALESCE(EXCLUDED.tier_preference, users.tier_preference),
        referral_code = COALESCE(users.referral_code, EXCLUDED.referral_code),
        position = COALESCE(users.position, EXCLUDED.position),
        referred_by = COALESCE(EXCLUDED.referred_by, users.referred_by),
        email_verified = EXCLUDED.email_verified OR users.email_verified,
        updated_at = NOW();
    
    -- Update referral count if there's a referrer
    IF referrer_id IS NOT NULL THEN
        UPDATE public.users
        SET referral_count = COALESCE(referral_count, 0) + 1
        WHERE id = referrer_id;
        
        -- Create referral tracking record
        INSERT INTO public.referral_tracking (
            referrer_id,
            referred_id,
            created_at
        ) VALUES (
            referrer_id,
            NEW.id,
            NOW()
        ) ON CONFLICT DO NOTHING;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the signup
        RAISE WARNING 'Error in handle_new_user for %: % (SQLSTATE: %)', NEW.email, SQLERRM, SQLSTATE;
        -- Still try to create minimal record
        INSERT INTO public.users (id, email, referral_code, position, created_at)
        VALUES (NEW.id, NEW.email, user_referral_code, user_position, NOW())
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            updated_at = NOW();
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create update trigger to capture metadata that comes later
CREATE OR REPLACE FUNCTION public.handle_auth_user_updated()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process if metadata changed
    IF NEW.raw_user_meta_data IS DISTINCT FROM OLD.raw_user_meta_data 
       AND NEW.raw_user_meta_data IS NOT NULL 
       AND NEW.raw_user_meta_data != '{}'::jsonb THEN
        
        -- Log for debugging
        RAISE NOTICE 'User metadata updated for %: %', NEW.email, NEW.raw_user_meta_data;
        
        -- Call the same function to update user data
        PERFORM handle_new_user();
    END IF;
    
    -- Update email verification status
    IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
        UPDATE public.users
        SET email_verified = true
        WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create the triggers
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_auth_user_updated();

-- 7. Create/fix the increment function
CREATE OR REPLACE FUNCTION public.increment_referral_count(user_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.users
    SET referral_count = COALESCE(referral_count, 0) + 1
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- 8. Fix all existing users - capture any missing metadata from auth.users
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
        au.raw_user_meta_data->>'profession',
        au.raw_user_meta_data->>'job_title'
    ),
    company = COALESCE(
        u.company,
        au.raw_user_meta_data->>'company',
        au.raw_user_meta_data->>'organization'
    ),
    interests = CASE 
        WHEN u.interests IS NULL OR array_length(u.interests, 1) = 0 
        AND au.raw_user_meta_data ? 'interests' 
        AND jsonb_typeof(au.raw_user_meta_data->'interests') = 'array'
        THEN ARRAY(SELECT jsonb_array_elements_text(au.raw_user_meta_data->'interests'))
        ELSE u.interests
    END,
    tier_preference = COALESCE(
        u.tier_preference,
        au.raw_user_meta_data->>'tier_preference',
        au.raw_user_meta_data->>'tierPreference',
        'free'
    ),
    referral_code = COALESCE(
        u.referral_code,
        upper(substr(md5(random()::text || u.id::text), 1, 8))
    ),
    position = COALESCE(
        u.position,
        (au.raw_user_meta_data->>'position')::int,
        (SELECT COALESCE(MAX(position), 99) + 1 FROM public.users WHERE id != u.id)
    ),
    email_verified = COALESCE(u.email_verified, au.email_confirmed_at IS NOT NULL),
    updated_at = NOW()
FROM auth.users au
WHERE u.id = au.id;

-- 9. Ensure all users have required fields
UPDATE public.users
SET 
    referral_code = upper(substr(md5(random()::text || id::text), 1, 8))
WHERE referral_code IS NULL;

UPDATE public.users
SET 
    position = (SELECT COALESCE(MAX(position), 99) + 1 FROM public.users p WHERE p.id != users.id)
WHERE position IS NULL;

-- 10. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 11. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON public.users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_position ON public.users(position);

-- 12. Verification query - check if everything is working
SELECT 
    'Total Users' as metric,
    COUNT(*) as count
FROM public.users

UNION ALL

SELECT 
    'Users with Names' as metric,
    COUNT(*) as count
FROM public.users
WHERE name IS NOT NULL AND name != email

UNION ALL

SELECT 
    'Users with Professions' as metric,
    COUNT(*) as count
FROM public.users
WHERE profession IS NOT NULL

UNION ALL

SELECT 
    'Users with Interests' as metric,
    COUNT(*) as count
FROM public.users
WHERE interests IS NOT NULL AND array_length(interests, 1) > 0

UNION ALL

SELECT 
    'Users Missing Data' as metric,
    COUNT(*) as count
FROM public.users
WHERE name IS NULL OR referral_code IS NULL OR position IS NULL;

-- 13. Show sample of recent users to verify data capture
SELECT 
    email,
    name,
    profession,
    company,
    array_length(interests, 1) as interest_count,
    tier_preference,
    referral_code,
    position,
    created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 10;