-- IMMEDIATE FIX FOR THE REFERRAL_CODE ERROR
-- Run this FIRST to fix the constraint issue

-- Step 1: Remove the NOT NULL constraint from referral_code if it exists
ALTER TABLE public.users ALTER COLUMN referral_code DROP NOT NULL;

-- Step 2: Generate referral codes for ALL users who don't have them
UPDATE public.users
SET referral_code = upper(substr(md5(random()::text || id::text), 1, 8))
WHERE referral_code IS NULL;

-- Step 3: Now sync existing auth users who don't have profiles
INSERT INTO public.users (id, email, referral_code, position, created_at)
SELECT 
    au.id, 
    au.email,
    upper(substr(md5(random()::text || au.id::text), 1, 8)) as referral_code,
    nextval('users_position_seq'),
    au.created_at
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Step 4: Update the trigger function to ALWAYS generate a referral code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_referral_code TEXT;
BEGIN
    -- Generate a unique referral code
    new_referral_code := upper(substr(md5(random()::text || NEW.id::text), 1, 8));
    
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
        auth_provider
    )
    VALUES (
        NEW.id, 
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        NEW.raw_user_meta_data->>'profession',
        NEW.raw_user_meta_data->>'company',
        CASE 
            WHEN NEW.raw_user_meta_data->'interests' IS NOT NULL 
            THEN ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'interests'))
            ELSE NULL
        END,
        COALESCE(NEW.raw_user_meta_data->>'tierPreference', 'free'),
        new_referral_code, -- Always use generated code
        nextval('users_position_seq'),
        COALESCE(NEW.raw_user_meta_data->>'auth_provider', 'email')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        updated_at = NOW();
    
    -- Handle referral tracking if a referral code was used
    IF NEW.raw_user_meta_data->>'referralCode' IS NOT NULL THEN
        -- Find the referrer by their referral code
        UPDATE public.users
        SET referral_count = COALESCE(referral_count, 0) + 1
        WHERE referral_code = NEW.raw_user_meta_data->>'referralCode';
        
        -- Update the new user's referred_by field
        UPDATE public.users
        SET referred_by = (
            SELECT id FROM public.users 
            WHERE referral_code = NEW.raw_user_meta_data->>'referralCode'
            LIMIT 1
        )
        WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the signup
        RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 6: Verify no NULL referral codes remain
SELECT COUNT(*) as null_referral_codes FROM public.users WHERE referral_code IS NULL;

-- Step 7: Add back the unique constraint (but not NOT NULL)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_referral_code_key;
ALTER TABLE public.users ADD CONSTRAINT users_referral_code_key UNIQUE (referral_code);

-- DONE! This should fix the referral_code issue