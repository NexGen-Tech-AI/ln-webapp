-- WORKING SIGNUP FIX - This will allow signups to work properly

-- 1. First ensure the users table has all required columns
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    profession TEXT,
    company TEXT,
    interests TEXT[] DEFAULT '{}',
    tier_preference TEXT DEFAULT 'free',
    referral_code TEXT UNIQUE,
    position INTEGER,
    referred_by UUID REFERENCES public.users(id),
    referral_count INTEGER DEFAULT 0,
    user_type TEXT DEFAULT 'waitlist',
    auth_provider TEXT DEFAULT 'email',
    verification_token TEXT,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Drop problematic triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_auth_user_updated() CASCADE;

-- 3. Create sequence for position if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'users_position_seq') THEN
        CREATE SEQUENCE users_position_seq START 100;
    END IF;
END$$;

-- 4. Create the increment function
CREATE OR REPLACE FUNCTION public.increment_referral_count(user_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.users
    SET referral_count = COALESCE(referral_count, 0) + 1
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- 5. Create referral_tracking table if missing
CREATE TABLE IF NOT EXISTS public.referral_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID REFERENCES public.users(id),
    referred_id UUID REFERENCES public.users(id),
    subscription_tier TEXT DEFAULT 'free',
    subscription_amount DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(referrer_id, referred_id)
);

-- 6. Create notification_preferences table if missing
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    email_referral_milestone BOOLEAN DEFAULT true,
    email_referral_converted BOOLEAN DEFAULT true,
    email_product_updates BOOLEAN DEFAULT true,
    email_marketing BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 7. Create audit_logs table if missing
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id),
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Create simple trigger to track email verification
CREATE OR REPLACE FUNCTION public.update_email_verified()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
        UPDATE public.users
        SET email_verified = true, updated_at = NOW()
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_email_verified
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    WHEN (NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL)
    EXECUTE FUNCTION public.update_email_verified();

-- 9. Grant all necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 10. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON public.users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_position ON public.users(position);

-- 11. Test the setup
SELECT 
    'Users Table' as check_type,
    COUNT(*) as count
FROM public.users

UNION ALL

SELECT 
    'Position Sequence' as check_type,
    last_value as count
FROM users_position_seq

UNION ALL

SELECT 
    'Referral Tracking' as check_type,
    COUNT(*) as count
FROM public.referral_tracking;