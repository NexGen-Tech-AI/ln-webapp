-- COMPLETE FIX: This will make signup work properly

-- 1. First, let's see what's in auth.users metadata
SELECT 
    id,
    email,
    raw_user_meta_data,
    user_metadata,
    created_at
FROM auth.users
WHERE created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;

-- 2. Drop and recreate the trigger function to handle BOTH metadata fields
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
BEGIN
    -- Get metadata from EITHER source (Supabase uses both!)
    meta := COALESCE(NEW.raw_user_meta_data, NEW.user_metadata, '{}'::jsonb);
    
    -- Extract values with defaults
    user_name := COALESCE(meta->>'name', NEW.email);
    user_profession := meta->>'profession';
    user_company := meta->>'company';
    user_tier := COALESCE(meta->>'tier_preference', meta->>'tierPreference', 'free');
    user_referral_code := COALESCE(meta->>'referral_code', upper(substr(md5(random()::text || NEW.id::text), 1, 8)));
    user_position := COALESCE((meta->>'position')::int, nextval('users_position_seq'));
    
    -- Handle interests array
    IF meta->'interests' IS NOT NULL THEN
        user_interests := ARRAY(SELECT jsonb_array_elements_text(meta->'interests'));
    ELSE
        user_interests := '{}'::text[];
    END IF;
    
    -- Insert or update the user
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
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        profession = EXCLUDED.profession,
        company = EXCLUDED.company,
        interests = EXCLUDED.interests,
        tier_preference = EXCLUDED.tier_preference,
        updated_at = NOW();
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log but don't fail
        RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 4. Fix any existing users that are missing data
INSERT INTO public.users (id, email, referral_code, position, created_at)
SELECT 
    au.id,
    au.email,
    upper(substr(md5(random()::text || au.id::text), 1, 8)),
    nextval('users_position_seq'),
    au.created_at
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL;

-- 5. Update existing users with missing metadata
UPDATE public.users u
SET
    name = COALESCE(
        u.name,
        au.raw_user_meta_data->>'name',
        au.user_metadata->>'name',
        u.email
    ),
    profession = COALESCE(
        u.profession,
        au.raw_user_meta_data->>'profession',
        au.user_metadata->>'profession'
    ),
    company = COALESCE(
        u.company,
        au.raw_user_meta_data->>'company',
        au.user_metadata->>'company'
    ),
    tier_preference = COALESCE(
        u.tier_preference,
        au.raw_user_meta_data->>'tier_preference',
        au.user_metadata->>'tier_preference',
        au.raw_user_meta_data->>'tierPreference',
        au.user_metadata->>'tierPreference',
        'free'
    ),
    interests = CASE 
        WHEN u.interests IS NULL OR array_length(u.interests, 1) = 0 THEN
            COALESCE(
                ARRAY(SELECT jsonb_array_elements_text(au.raw_user_meta_data->'interests')),
                ARRAY(SELECT jsonb_array_elements_text(au.user_metadata->'interests')),
                '{}'::text[]
            )
        ELSE u.interests
    END
FROM auth.users au
WHERE u.id = au.id;

-- 6. Check the results
SELECT 
    u.email,
    u.name,
    u.profession,
    u.company,
    u.interests,
    u.tier_preference,
    u.referral_code,
    u.created_at
FROM public.users u
ORDER BY u.created_at DESC
LIMIT 10;