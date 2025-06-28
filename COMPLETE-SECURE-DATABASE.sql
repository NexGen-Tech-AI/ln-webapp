-- COMPLETE DATABASE SETUP WITH SECURITY AND DATA TRACKING
-- This ensures all data is captured, tracked, and secured properly

-- 1. Drop existing triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_auth_user_updated() CASCADE;

-- 2. Create all required tables with proper structure
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    profession TEXT,
    company TEXT,
    interests TEXT[] DEFAULT '{}',
    tier_preference TEXT DEFAULT 'free',
    referral_code TEXT UNIQUE NOT NULL,
    position INTEGER NOT NULL,
    referred_by UUID REFERENCES public.users(id),
    referral_count INTEGER DEFAULT 0,
    user_type TEXT DEFAULT 'waitlist',
    auth_provider TEXT DEFAULT 'email',
    verification_token TEXT,
    email_verified BOOLEAN DEFAULT false,
    stripe_customer_id TEXT,
    subscription_status TEXT DEFAULT 'none',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_tier CHECK (tier_preference IN ('free', 'pro', 'ai', 'family'))
);

-- 3. Create referral tracking with integrity
CREATE TABLE IF NOT EXISTS public.referral_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    subscription_tier TEXT DEFAULT 'free',
    subscription_amount DECIMAL(10,2) DEFAULT 0,
    converted_at TIMESTAMPTZ,
    commission_paid BOOLEAN DEFAULT false,
    commission_amount DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(referrer_id, referred_id)
);

-- Add missing columns if table already exists
ALTER TABLE public.referral_tracking 
ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS commission_paid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10,2) DEFAULT 0;

-- 4. Create notification preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    email_referral_milestone BOOLEAN DEFAULT true,
    email_referral_converted BOOLEAN DEFAULT true,
    email_product_updates BOOLEAN DEFAULT true,
    email_marketing BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 5. Create comprehensive audit logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create position sequence
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'users_position_seq') THEN
        CREATE SEQUENCE users_position_seq START 100;
    END IF;
END$$;

-- 7. Create secure functions for referral tracking
CREATE OR REPLACE FUNCTION public.increment_referral_count(user_id UUID)
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.users
    SET 
        referral_count = COALESCE(referral_count, 0) + 1,
        updated_at = NOW()
    WHERE id = user_id;
    
    -- Log the referral increment
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
    VALUES (user_id, 'referral_count_incremented', 'user', user_id, 
            jsonb_build_object('new_count', (SELECT referral_count FROM users WHERE id = user_id)));
END;
$$;

-- 8. Create function to track conversions
CREATE OR REPLACE FUNCTION public.track_referral_conversion(
    p_referred_id UUID,
    p_tier TEXT,
    p_amount DECIMAL
)
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_referrer_id UUID;
    v_commission DECIMAL;
BEGIN
    -- Get referrer
    SELECT referred_by INTO v_referrer_id FROM users WHERE id = p_referred_id;
    
    IF v_referrer_id IS NOT NULL THEN
        -- Calculate commission (10% for example)
        v_commission := p_amount * 0.10;
        
        -- Update referral tracking
        UPDATE referral_tracking
        SET 
            subscription_tier = p_tier,
            subscription_amount = p_amount,
            converted_at = NOW(),
            commission_amount = v_commission
        WHERE referrer_id = v_referrer_id AND referred_id = p_referred_id;
        
        -- Log conversion
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
        VALUES (v_referrer_id, 'referral_converted', 'referral', p_referred_id,
                jsonb_build_object('tier', p_tier, 'amount', p_amount, 'commission', v_commission));
    END IF;
END;
$$;

-- 9. Create email verification trigger
CREATE OR REPLACE FUNCTION public.update_email_verified()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
        UPDATE public.users
        SET 
            email_verified = true,
            updated_at = NOW()
        WHERE id = NEW.id;
        
        -- Log verification
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
        VALUES (NEW.id, 'email_verified', 'user', NEW.id);
    END IF;
    RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_email_verified ON auth.users;
CREATE TRIGGER on_auth_user_email_verified
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    WHEN (NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL)
    EXECUTE FUNCTION public.update_email_verified();

-- 10. ROW LEVEL SECURITY POLICIES

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Service role can do everything" ON public.users;
DROP POLICY IF EXISTS "Users can view own referrals" ON public.referral_tracking;
DROP POLICY IF EXISTS "Service role full access" ON public.referral_tracking;
DROP POLICY IF EXISTS "Users can manage own preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Service role full access" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can view own logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Service role full access" ON public.audit_logs;

-- Users table policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Service role can do everything" ON public.users
    FOR ALL USING (auth.role() = 'service_role');

-- Referral tracking policies
CREATE POLICY "Users can view own referrals" ON public.referral_tracking
    FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Service role full access" ON public.referral_tracking
    FOR ALL USING (auth.role() = 'service_role');

-- Notification preferences policies
CREATE POLICY "Users can manage own preferences" ON public.notification_preferences
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Service role full access" ON public.notification_preferences
    FOR ALL USING (auth.role() = 'service_role');

-- Audit logs policies (read-only for users)
CREATE POLICY "Users can view own logs" ON public.audit_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role full access" ON public.audit_logs
    FOR ALL USING (auth.role() = 'service_role');

-- 11. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON public.users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_position ON public.users(position);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON public.users(referred_by);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_referrer ON public.referral_tracking(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_referred ON public.referral_tracking(referred_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at);

-- 12. Create views for analytics
DROP VIEW IF EXISTS public.referral_analytics;
CREATE VIEW public.referral_analytics AS
SELECT 
    u.id,
    u.email,
    u.name,
    u.referral_code,
    u.referral_count,
    COUNT(rt.id) as successful_referrals,
    SUM(rt.subscription_amount) as total_referral_value,
    SUM(rt.commission_amount) as total_commission_earned
FROM public.users u
LEFT JOIN public.referral_tracking rt ON u.id = rt.referrer_id
GROUP BY u.id, u.email, u.name, u.referral_code, u.referral_count;

-- Grant view access
GRANT SELECT ON public.referral_analytics TO authenticated;

-- 13. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Specific permissions for authenticated users
GRANT SELECT, UPDATE ON public.users TO authenticated;
GRANT SELECT ON public.referral_tracking TO authenticated;
GRANT ALL ON public.notification_preferences TO authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT SELECT ON public.referral_analytics TO authenticated;

-- 14. Add data validation triggers
CREATE OR REPLACE FUNCTION public.validate_user_data()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
    -- Ensure referral code is uppercase
    NEW.referral_code = UPPER(NEW.referral_code);
    
    -- Ensure position is set
    IF NEW.position IS NULL THEN
        NEW.position = nextval('users_position_seq');
    END IF;
    
    -- Update timestamp
    NEW.updated_at = NOW();
    
    RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS validate_user_before_insert ON public.users;
CREATE TRIGGER validate_user_before_insert
    BEFORE INSERT OR UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_user_data();

-- 15. Verification queries
SELECT 'Database Setup Complete' as status;

-- Check table counts
SELECT 
    'Users' as table_name,
    COUNT(*) as count,
    COUNT(CASE WHEN email_verified THEN 1 END) as verified_count
FROM public.users

UNION ALL

SELECT 
    'Referrals' as table_name,
    COUNT(*) as count,
    COUNT(CASE WHEN converted_at IS NOT NULL THEN 1 END) as verified_count
FROM public.referral_tracking

UNION ALL

SELECT 
    'Audit Logs' as table_name,
    COUNT(*) as count,
    COUNT(DISTINCT user_id) as verified_count
FROM public.audit_logs;

-- Check RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'referral_tracking', 'notification_preferences', 'audit_logs');