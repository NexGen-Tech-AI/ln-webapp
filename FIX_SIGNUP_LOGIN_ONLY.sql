-- FOCUSED FIX: Just make signup/login work without breaking your complex system

-- 1. Check what columns the users table actually has
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. The signup is likely failing because it's trying to insert into columns that don't exist
-- Let's add ONLY the columns your signup form is trying to use:

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS profession TEXT,
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS interests TEXT[],
ADD COLUMN IF NOT EXISTS tier_preference TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS position INTEGER,
ADD COLUMN IF NOT EXISTS referral_code TEXT,
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'waitlist';

-- 3. Handle the referred_by column carefully (checking type first)
DO $$
BEGIN
    -- Only add referred_by if it doesn't exist at all
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'referred_by'
    ) THEN
        ALTER TABLE public.users ADD COLUMN referred_by UUID;
    END IF;
END $$;

-- 4. Create sequence for position if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'users_position_seq') THEN
        CREATE SEQUENCE users_position_seq START 100;
    END IF;
END $$;

-- 5. Fix the waitlist_count view (it has SECURITY DEFINER issue)
DROP VIEW IF EXISTS public.waitlist_count CASCADE;
CREATE VIEW public.waitlist_count AS
SELECT COUNT(*) as total_users
FROM public.users
WHERE user_type = 'waitlist';

-- Grant appropriate permissions
GRANT SELECT ON public.waitlist_count TO anon;
GRANT SELECT ON public.waitlist_count TO authenticated;

-- 6. Ensure the trigger exists for creating user records
CREATE OR REPLACE FUNCTION public.handle_new_user_simple() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (id, email, created_at)
    VALUES (NEW.id, NEW.email, NOW())
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_simple();

-- 7. Test what we have now
SELECT 
    COUNT(*) as total_columns,
    COUNT(*) FILTER (WHERE column_name IN ('name', 'profession', 'company', 'interests', 'tier_preference', 'position', 'referral_code', 'user_type')) as signup_columns
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public';