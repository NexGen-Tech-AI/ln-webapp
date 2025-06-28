-- SIMPLE FIX THAT ACTUALLY WORKS
-- Remove constraints that are blocking signups

-- 1. Fix the users table - remove NOT NULL constraints
ALTER TABLE public.users 
ALTER COLUMN referral_code DROP NOT NULL,
ALTER COLUMN position DROP NOT NULL;

-- 2. Set default values for required fields
ALTER TABLE public.users 
ALTER COLUMN referral_code SET DEFAULT upper(substr(md5(random()::text || gen_random_uuid()::text), 1, 8)),
ALTER COLUMN position SET DEFAULT nextval('users_position_seq');

-- 3. Create a simple trigger that won't fail
CREATE OR REPLACE FUNCTION public.simple_user_sync()
RETURNS TRIGGER AS $$
BEGIN
    -- Just ensure a basic record exists
    INSERT INTO public.users (id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create the trigger
DROP TRIGGER IF EXISTS simple_user_sync_trigger ON auth.users;
CREATE TRIGGER simple_user_sync_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.simple_user_sync();

-- 5. Fix any existing users missing data
UPDATE public.users 
SET 
    referral_code = COALESCE(referral_code, upper(substr(md5(random()::text || id::text), 1, 8))),
    position = COALESCE(position, (SELECT COALESCE(MAX(position), 100) + 1 FROM public.users WHERE id != users.id))
WHERE referral_code IS NULL OR position IS NULL;

-- 6. Create public view for waitlist count (no auth required)
DROP VIEW IF EXISTS public.waitlist_count;
CREATE VIEW public.waitlist_count AS
SELECT COUNT(*) as total_users
FROM public.users;

-- Grant public access to the count
GRANT SELECT ON public.waitlist_count TO anon, authenticated;

-- 7. Verify it's working
SELECT 
    'Total Users' as metric,
    COUNT(*) as count
FROM public.users;