-- FINAL COMPLETE FIX - This fixes EVERYTHING

-- 1. Add missing column for verification token
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS verification_token TEXT;

-- 2. Drop and recreate the trigger function to handle ALL metadata properly
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

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
    -- Get metadata from raw_user_meta_data (the only metadata field in auth.users)
    meta := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
    
    -- Log what we found for debugging
    RAISE NOTICE 'handle_new_user: email=%, meta=%', NEW.email, meta;
    
    -- Extract values with defaults
    user_name := COALESCE(meta->>'name', NEW.email);
    user_profession := meta->>'profession';
    user_company := meta->>'company';
    user_tier := COALESCE(meta->>'tier_preference', meta->>'tierPreference', 'free');
    user_referral_code := COALESCE(meta->>'referral_code', upper(substr(md5(random()::text || NEW.id::text), 1, 8)));
    user_position := COALESCE((meta->>'position')::int, nextval('users_position_seq'));
    
    -- Handle interests array
    IF meta->'interests' IS NOT NULL AND jsonb_array_length(meta->'interests') > 0 THEN
        user_interests := ARRAY(SELECT jsonb_array_elements_text(meta->'interests'));
    ELSE
        user_interests := '{}'::text[];
    END IF;
    
    -- Insert the user
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
        user_type,
        auth_provider,
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
        COALESCE(meta->>'user_type', 'waitlist'),
        COALESCE(meta->>'auth_provider', 'email'),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = CASE WHEN EXCLUDED.name != EXCLUDED.email THEN EXCLUDED.name ELSE users.name END,
        profession = COALESCE(EXCLUDED.profession, users.profession),
        company = COALESCE(EXCLUDED.company, users.company),
        interests = CASE 
            WHEN array_length(EXCLUDED.interests, 1) > 0 THEN EXCLUDED.interests 
            ELSE users.interests 
        END,
        tier_preference = COALESCE(EXCLUDED.tier_preference, users.tier_preference),
        updated_at = NOW();
    
    -- Handle referral tracking
    referrer_id := (meta->>'referred_by')::uuid;
    IF referrer_id IS NOT NULL THEN
        -- Update referral count
        UPDATE public.users
        SET referral_count = COALESCE(referral_count, 0) + 1
        WHERE id = referrer_id;
        
        -- Update referred_by
        UPDATE public.users
        SET referred_by = referrer_id
        WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log detailed error
        RAISE WARNING 'Error in handle_new_user for %: % (SQLSTATE: %)', NEW.email, SQLERRM, SQLSTATE;
        -- Still try to create basic record
        INSERT INTO public.users (id, email, referral_code, created_at)
        VALUES (NEW.id, NEW.email, user_referral_code, NOW())
        ON CONFLICT (id) DO NOTHING;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 4. Also handle updates to capture data if it comes later
CREATE OR REPLACE FUNCTION public.handle_auth_user_updated()
RETURNS TRIGGER AS $$
BEGIN
    -- If metadata changed, update the user record
    IF NEW.raw_user_meta_data IS DISTINCT FROM OLD.raw_user_meta_data THEN
        -- Call the same logic as handle_new_user
        PERFORM handle_new_user();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_auth_user_updated();

-- 5. Fix ALL existing users
WITH auth_data AS (
    SELECT 
        id,
        email,
        COALESCE(raw_user_meta_data, '{}'::jsonb) as meta,
        created_at
    FROM auth.users
)
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
    created_at
)
SELECT 
    ad.id,
    ad.email,
    COALESCE(ad.meta->>'name', ad.email),
    ad.meta->>'profession',
    ad.meta->>'company',
    CASE 
        WHEN ad.meta->'interests' IS NOT NULL 
        THEN ARRAY(SELECT jsonb_array_elements_text(ad.meta->'interests'))
        ELSE '{}'::text[]
    END,
    COALESCE(ad.meta->>'tier_preference', ad.meta->>'tierPreference', 'free'),
    upper(substr(md5(random()::text || ad.id::text), 1, 8)),
    nextval('users_position_seq'),
    ad.created_at
FROM auth_data ad
ON CONFLICT (id) DO UPDATE SET
    name = CASE 
        WHEN users.name IS NULL OR users.name = users.email 
        THEN EXCLUDED.name 
        ELSE users.name 
    END,
    profession = COALESCE(users.profession, EXCLUDED.profession),
    company = COALESCE(users.company, EXCLUDED.company),
    interests = CASE 
        WHEN array_length(users.interests, 1) IS NULL OR array_length(users.interests, 1) = 0
        THEN EXCLUDED.interests 
        ELSE users.interests 
    END,
    tier_preference = COALESCE(users.tier_preference, EXCLUDED.tier_preference);

-- 6. Create the increment function if missing
CREATE OR REPLACE FUNCTION public.increment_referral_count(user_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.users
    SET referral_count = COALESCE(referral_count, 0) + 1
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- 7. Verify the fix
SELECT 
    'Auth Users' as source,
    COUNT(*) as count,
    COUNT(CASE WHEN raw_user_meta_data IS NOT NULL AND raw_user_meta_data != '{}'::jsonb THEN 1 END) as with_metadata,
    0 as with_profession
FROM auth.users

UNION ALL

SELECT 
    'Public Users' as source,
    COUNT(*) as count,
    COUNT(CASE WHEN name IS NOT NULL AND name != email THEN 1 END) as with_metadata,
    COUNT(CASE WHEN profession IS NOT NULL THEN 1 END) as with_profession
FROM public.users;

-- 8. Show recent users to verify data
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