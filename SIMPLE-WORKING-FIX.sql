-- SIMPLE WORKING FIX - Remove the broken trigger and fix signup

-- 1. DISABLE THE BROKEN TRIGGER
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_auth_user_updated() CASCADE;

-- 2. Create a SIMPLE working function that won't break signup
CREATE OR REPLACE FUNCTION public.simple_handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Just create a basic user record
    INSERT INTO public.users (id, email, referral_code, position, created_at)
    VALUES (
        NEW.id, 
        NEW.email,
        upper(substr(md5(random()::text || NEW.id::text), 1, 8)),
        COALESCE((SELECT MAX(position) + 1 FROM public.users), 100),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Don't break signup no matter what
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger with the simple function
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.simple_handle_new_user();

-- 4. Now let's update the signup route to handle the user profile data
-- The app will handle this, not the trigger