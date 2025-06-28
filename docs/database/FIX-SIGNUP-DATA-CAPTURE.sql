-- FIX SIGNUP DATA CAPTURE - This ensures ALL form data is saved properly

-- Step 1: Update the trigger function to properly capture ALL data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_referral_code TEXT;
    metadata JSONB;
    referrer_id UUID;
BEGIN
    -- Get metadata from both possible sources
    metadata := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
    
    -- Generate a unique referral code if not provided
    new_referral_code := COALESCE(
        metadata->>'referral_code',
        upper(substr(md5(random()::text || NEW.id::text), 1, 8))
    );
    
    -- Create the user record with ALL fields from signup
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
        joined_at,
        email_verified,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id, 
        NEW.email,
        COALESCE(metadata->>'name', NEW.email),
        metadata->>'profession',
        metadata->>'company',
        CASE 
            WHEN metadata->'interests' IS NOT NULL AND jsonb_typeof(metadata->'interests') = 'array'
            THEN ARRAY(SELECT jsonb_array_elements_text(metadata->'interests'))
            ELSE '{}'::TEXT[]
        END,
        COALESCE(metadata->>'tier_preference', 'free'),
        new_referral_code,
        COALESCE((metadata->>'position')::INTEGER, nextval('users_position_seq')),
        COALESCE(metadata->>'user_type', 'waitlist'),
        COALESCE(metadata->>'auth_provider', 'email'),
        NOW(),
        NEW.email_confirmed_at IS NOT NULL,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = COALESCE(EXCLUDED.name, users.name),
        profession = COALESCE(EXCLUDED.profession, users.profession),
        company = COALESCE(EXCLUDED.company, users.company),
        interests = CASE 
            WHEN EXCLUDED.interests IS NOT NULL AND array_length(EXCLUDED.interests, 1) > 0 
            THEN EXCLUDED.interests 
            ELSE users.interests 
        END,
        tier_preference = COALESCE(EXCLUDED.tier_preference, users.tier_preference),
        email_verified = NEW.email_confirmed_at IS NOT NULL,
        updated_at = NOW();
    
    -- Handle referral tracking
    referrer_id := (metadata->>'referred_by')::UUID;
    
    -- If no referrer_id but referral code provided, look it up
    IF referrer_id IS NULL AND metadata->>'referralCode' IS NOT NULL THEN
        SELECT id INTO referrer_id 
        FROM public.users 
        WHERE referral_code = metadata->>'referralCode'
        LIMIT 1;
    END IF;
    
    -- Update referral tracking
    IF referrer_id IS NOT NULL THEN
        -- Update the new user's referred_by field
        UPDATE public.users
        SET referred_by = referrer_id
        WHERE id = NEW.id;
        
        -- Create referral tracking entry
        INSERT INTO public.referral_tracking (referrer_id, referred_id)
        VALUES (referrer_id, NEW.id)
        ON CONFLICT (referrer_id, referred_id) DO NOTHING;
        
        -- Update referral count
        UPDATE public.users
        SET referral_count = COALESCE(referral_count, 0) + 1
        WHERE id = referrer_id;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error with details
        RAISE WARNING 'Error in handle_new_user for user %: % - %', NEW.id, SQLERRM, SQLSTATE;
        -- Still create a basic user record
        INSERT INTO public.users (id, email, referral_code, created_at)
        VALUES (NEW.id, NEW.email, new_referral_code, NOW())
        ON CONFLICT (id) DO NOTHING;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Create a function to update email verification status
CREATE OR REPLACE FUNCTION public.handle_user_email_confirmed()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.users
    SET 
        email_verified = true,
        email_verified_at = NEW.email_confirmed_at,
        updated_at = NOW()
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create trigger for email verification
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
    AFTER UPDATE OF email_confirmed_at ON auth.users
    FOR EACH ROW 
    WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
    EXECUTE FUNCTION public.handle_user_email_confirmed();

-- Step 5: Create a function to handle user updates (for metadata changes)
CREATE OR REPLACE FUNCTION public.handle_user_updated()
RETURNS TRIGGER AS $$
DECLARE
    metadata JSONB;
BEGIN
    -- Only process if metadata changed
    IF NEW.raw_user_meta_data IS DISTINCT FROM OLD.raw_user_meta_data THEN
        metadata := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
        
        UPDATE public.users
        SET
            name = COALESCE(metadata->>'name', name),
            profession = COALESCE(metadata->>'profession', profession),
            company = COALESCE(metadata->>'company', company),
            interests = CASE 
                WHEN metadata->'interests' IS NOT NULL AND jsonb_typeof(metadata->'interests') = 'array'
                THEN ARRAY(SELECT jsonb_array_elements_text(metadata->'interests'))
                ELSE interests
            END,
            tier_preference = COALESCE(metadata->>'tier_preference', tier_preference),
            updated_at = NOW()
        WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create trigger for user updates
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    WHEN (NEW.raw_user_meta_data IS DISTINCT FROM OLD.raw_user_meta_data)
    EXECUTE FUNCTION public.handle_user_updated();

-- Step 7: Fix existing users that have missing data
UPDATE public.users u
SET
    name = COALESCE(u.name, au.raw_user_meta_data->>'name', u.email),
    profession = COALESCE(u.profession, au.raw_user_meta_data->>'profession'),
    company = COALESCE(u.company, au.raw_user_meta_data->>'company'),
    interests = CASE 
        WHEN u.interests IS NULL OR array_length(u.interests, 1) = 0
        AND au.raw_user_meta_data->'interests' IS NOT NULL 
        THEN ARRAY(SELECT jsonb_array_elements_text(au.raw_user_meta_data->'interests'))
        ELSE u.interests
    END,
    tier_preference = COALESCE(u.tier_preference, au.raw_user_meta_data->>'tier_preference', 'free'),
    email_verified = COALESCE(u.email_verified, au.email_confirmed_at IS NOT NULL),
    email_verified_at = COALESCE(u.email_verified_at, au.email_confirmed_at),
    updated_at = NOW()
FROM auth.users au
WHERE u.id = au.id
AND (
    u.name IS NULL OR 
    u.profession IS NULL OR 
    u.interests IS NULL OR 
    array_length(u.interests, 1) = 0
);

-- Step 8: Create increment_referral_count function if it doesn't exist
CREATE OR REPLACE FUNCTION public.increment_referral_count(user_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.users
    SET referral_count = COALESCE(referral_count, 0) + 1
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Verify the fix
DO $$
DECLARE
    total_users INTEGER;
    users_with_data INTEGER;
    users_missing_data INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_users FROM public.users;
    
    SELECT COUNT(*) INTO users_with_data 
    FROM public.users 
    WHERE name IS NOT NULL 
    AND name != email;
    
    SELECT COUNT(*) INTO users_missing_data
    FROM public.users u
    JOIN auth.users au ON u.id = au.id
    WHERE u.name IS NULL OR u.name = u.email
    AND au.raw_user_meta_data->>'name' IS NOT NULL;
    
    RAISE NOTICE 'Total users: %', total_users;
    RAISE NOTICE 'Users with proper name data: %', users_with_data;
    RAISE NOTICE 'Users that could be fixed: %', users_missing_data;
END $$;

-- DONE! This properly captures ALL signup data