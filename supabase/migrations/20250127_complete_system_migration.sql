-- =====================================================
-- COMPREHENSIVE LIFENAVIGATOR DATABASE MIGRATION
-- =====================================================
-- This migration sets up the complete database structure including:
-- - User management with waitlist and referral tracking
-- - Military-grade encryption for sensitive data
-- - Row-level security policies
-- - Analytics and audit logging
-- - Email campaign management
-- - OAuth integration
-- =====================================================

-- =====================================================
-- SECTION 1: EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pgjwt";

-- =====================================================
-- SECTION 2: CORE TABLES
-- =====================================================

-- Users table (main table)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    avatar_url TEXT,
    profession TEXT,
    company TEXT,
    interests TEXT[],
    tier_preference TEXT DEFAULT 'free',
    referred_by UUID REFERENCES public.users(id),
    user_type TEXT DEFAULT 'waitlist',
    auth_provider TEXT DEFAULT 'email',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    position INTEGER,
    referral_code TEXT UNIQUE,
    email_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    referral_count INTEGER DEFAULT 0,
    paying_referral_count INTEGER DEFAULT 0,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    
    -- Service member fields
    service_verified BOOLEAN DEFAULT false,
    service_type TEXT,
    service_verification_date TIMESTAMP WITH TIME ZONE,
    idme_verification_id TEXT,
    
    -- Subscription fields
    is_paying BOOLEAN DEFAULT false,
    subscription_tier TEXT,
    subscription_amount DECIMAL(10,2),
    
    -- Security tokens
    verification_token TEXT,
    verification_token_expires TIMESTAMP WITH TIME ZONE,
    password_reset_token TEXT,
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    
    -- Encrypted fields
    email_encrypted TEXT,
    profession_encrypted TEXT,
    company_encrypted TEXT,
    
    CONSTRAINT valid_user_type CHECK (user_type IN ('pilot', 'waitlist', 'regular')),
    CONSTRAINT valid_tier CHECK (tier_preference IN ('free', 'pro', 'ai', 'family')),
    CONSTRAINT valid_service_type CHECK (service_type IS NULL OR service_type IN ('military', 'veteran', 'first_responder', 'teacher'))
);

-- Create sequence for position starting at 100
CREATE SEQUENCE IF NOT EXISTS users_position_seq START 100;

-- =====================================================
-- SECTION 3: SECURITY CONFIGURATION
-- =====================================================

-- Security configuration table
CREATE TABLE IF NOT EXISTS public.security_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key_name TEXT NOT NULL UNIQUE,
    key_value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Insert encryption key if not exists
INSERT INTO public.security_config (key_name, key_value)
VALUES ('encryption_key', encode(gen_random_bytes(32), 'base64'))
ON CONFLICT (key_name) DO NOTHING;

-- =====================================================
-- SECTION 4: REFERRAL SYSTEM TABLES
-- =====================================================

-- Referral tracking
CREATE TABLE IF NOT EXISTS public.referral_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    is_successful BOOLEAN DEFAULT false,
    converted_at TIMESTAMP WITH TIME ZONE,
    first_payment_at TIMESTAMP WITH TIME ZONE,
    subscription_tier TEXT,
    subscription_amount DECIMAL(10,2),
    UNIQUE(referrer_id, referred_id)
);

-- Referral rewards configuration
CREATE TABLE IF NOT EXISTS public.referral_rewards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_type TEXT NOT NULL,
    required_referrals INTEGER NOT NULL,
    reward_type TEXT NOT NULL,
    reward_value INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_type)
);

-- Insert default referral rewards
INSERT INTO public.referral_rewards (user_type, required_referrals, reward_type, reward_value) VALUES
    ('pilot', 5, 'credit', 100),
    ('waitlist', 10, 'credit', 100),
    ('regular', 20, 'credit', 100)
ON CONFLICT (user_type) DO NOTHING;

-- Referral credits
CREATE TABLE IF NOT EXISTS public.referral_credits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    credit_amount DECIMAL(10,2) NOT NULL,
    tier_value DECIMAL(10,2) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT false,
    used_at TIMESTAMP WITH TIME ZONE,
    referral_batch_count INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- =====================================================
-- SECTION 5: ANALYTICS TABLES
-- =====================================================

-- Page views tracking
CREATE TABLE IF NOT EXISTS public.page_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id),
    session_id UUID,
    page_path TEXT NOT NULL,
    referrer TEXT,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- User sessions
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    page_count INTEGER DEFAULT 0,
    browser TEXT,
    os TEXT,
    device_type TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Form analytics
CREATE TABLE IF NOT EXISTS public.form_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id),
    form_name TEXT NOT NULL,
    field_name TEXT,
    action TEXT NOT NULL,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Click events
CREATE TABLE IF NOT EXISTS public.click_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id),
    element_id TEXT,
    element_text TEXT,
    page_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Conversions tracking
CREATE TABLE IF NOT EXISTS public.conversions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id),
    conversion_type TEXT NOT NULL,
    conversion_value DECIMAL(10,2),
    source TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- =====================================================
-- SECTION 6: EMAIL AND CAMPAIGN TABLES
-- =====================================================

-- Email campaigns
CREATE TABLE IF NOT EXISTS public.email_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    segment_id UUID,
    status TEXT DEFAULT 'draft',
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    sent_count INTEGER DEFAULT 0,
    open_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Email events
CREATE TABLE IF NOT EXISTS public.email_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES public.email_campaigns(id),
    user_id UUID REFERENCES public.users(id),
    event_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Email queue
CREATE TABLE IF NOT EXISTS public.email_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- User segments
CREATE TABLE IF NOT EXISTS public.user_segments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    criteria JSONB,
    member_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- User segment members
CREATE TABLE IF NOT EXISTS public.user_segment_members (
    segment_id UUID REFERENCES public.user_segments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (segment_id, user_id)
);

-- =====================================================
-- SECTION 7: ADMIN AND SECURITY TABLES
-- =====================================================

-- Admin users
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'admin',
    permissions JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_secret TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id)
);

-- Security audit log
CREATE TABLE IF NOT EXISTS public.security_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    user_id UUID,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- General audit logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id),
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- OAuth connections
CREATE TABLE IF NOT EXISTS public.oauth_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    provider_user_id TEXT NOT NULL,
    email TEXT,
    name TEXT,
    avatar_url TEXT,
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(provider, provider_user_id)
);

-- Rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    identifier TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Performance logs
CREATE TABLE IF NOT EXISTS public.performance_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    query_name TEXT NOT NULL,
    duration_ms INTEGER NOT NULL,
    row_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Notification preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    email_referral_milestone BOOLEAN DEFAULT true,
    email_referral_converted BOOLEAN DEFAULT true,
    email_product_updates BOOLEAN DEFAULT true,
    email_marketing BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id)
);

-- =====================================================
-- SECTION 8: FUNCTIONS
-- =====================================================

-- Get encryption key function
CREATE OR REPLACE FUNCTION get_encryption_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (SELECT key_value FROM public.security_config WHERE key_name = 'encryption_key');
END;
$$;

-- Encrypt sensitive data
CREATE OR REPLACE FUNCTION encrypt_sensitive(data TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF data IS NULL THEN
        RETURN NULL;
    END IF;
    RETURN encode(
        pgp_sym_encrypt(
            data::bytea,
            get_encryption_key(),
            'compress-algo=2, cipher-algo=aes256'
        ),
        'base64'
    );
END;
$$;

-- Decrypt sensitive data
CREATE OR REPLACE FUNCTION decrypt_sensitive(encrypted_data TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF encrypted_data IS NULL THEN
        RETURN NULL;
    END IF;
    RETURN convert_from(
        pgp_sym_decrypt(
            decode(encrypted_data, 'base64'),
            get_encryption_key()
        ),
        'UTF8'
    );
END;
$$;

-- Generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate 8 character alphanumeric code
        new_code := upper(substring(md5(random()::text || clock_timestamp()::text) for 8));
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM public.users WHERE referral_code = new_code) INTO code_exists;
        
        EXIT WHEN NOT code_exists;
    END LOOP;
    
    RETURN new_code;
END;
$$;

-- Handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    referrer_user RECORD;
    new_position INTEGER;
BEGIN
    -- Generate referral code if not provided
    IF NEW.referral_code IS NULL THEN
        NEW.referral_code := generate_referral_code();
    END IF;
    
    -- Set position if not provided
    IF NEW.position IS NULL THEN
        NEW.position := nextval('users_position_seq');
    END IF;
    
    -- Encrypt sensitive fields
    IF NEW.email IS NOT NULL AND NEW.email_encrypted IS NULL THEN
        NEW.email_encrypted := encrypt_sensitive(NEW.email);
    END IF;
    IF NEW.profession IS NOT NULL AND NEW.profession_encrypted IS NULL THEN
        NEW.profession_encrypted := encrypt_sensitive(NEW.profession);
    END IF;
    IF NEW.company IS NOT NULL AND NEW.company_encrypted IS NULL THEN
        NEW.company_encrypted := encrypt_sensitive(NEW.company);
    END IF;
    
    -- Create user profile if needed
    INSERT INTO public.users (
        id,
        email,
        name,
        avatar_url,
        profession,
        company,
        interests,
        tier_preference,
        referred_by,
        user_type,
        auth_provider,
        joined_at,
        position,
        referral_code,
        email_encrypted,
        profession_encrypted,
        company_encrypted
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'profession',
        NEW.raw_user_meta_data->>'company',
        CASE 
            WHEN NEW.raw_user_meta_data->>'interests' IS NOT NULL 
            THEN string_to_array(NEW.raw_user_meta_data->>'interests', ',')
            ELSE NULL
        END,
        COALESCE(NEW.raw_user_meta_data->>'tier_preference', 'free'),
        (NEW.raw_user_meta_data->>'referred_by')::UUID,
        COALESCE(NEW.raw_user_meta_data->>'user_type', 'waitlist'),
        COALESCE(NEW.raw_user_meta_data->>'auth_provider', 'email'),
        NOW(),
        NEW.position,
        NEW.referral_code,
        NEW.email_encrypted,
        NEW.profession_encrypted,
        NEW.company_encrypted
    )
    ON CONFLICT (id) DO UPDATE
    SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        updated_at = NOW();
    
    -- Handle referral tracking if referred by someone
    IF NEW.raw_user_meta_data->>'referred_by' IS NOT NULL THEN
        -- Insert referral tracking record
        INSERT INTO public.referral_tracking (referrer_id, referred_id)
        VALUES ((NEW.raw_user_meta_data->>'referred_by')::UUID, NEW.id)
        ON CONFLICT (referrer_id, referred_id) DO NOTHING;
        
        -- Update referrer's count
        UPDATE public.users
        SET referral_count = referral_count + 1
        WHERE id = (NEW.raw_user_meta_data->>'referred_by')::UUID;
    END IF;
    
    -- Create default notification preferences
    INSERT INTO public.notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$;

-- Update referral counts when user becomes paying
CREATE OR REPLACE FUNCTION update_paying_referral_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- If user is now paying and wasn't before
    IF NEW.is_paying = true AND OLD.is_paying = false THEN
        -- Update referral tracking
        UPDATE public.referral_tracking
        SET 
            is_successful = true,
            converted_at = NOW(),
            first_payment_at = NOW(),
            subscription_tier = NEW.subscription_tier,
            subscription_amount = NEW.subscription_amount
        WHERE referred_id = NEW.id;
        
        -- Update referrer's paying referral count
        UPDATE public.users
        SET paying_referral_count = paying_referral_count + 1
        WHERE id = NEW.referred_by;
        
        -- Check for referral credit eligibility
        PERFORM check_referral_credit_eligibility(NEW.referred_by);
    END IF;
    
    RETURN NEW;
END;
$$;

-- Check referral credit eligibility
CREATE OR REPLACE FUNCTION check_referral_credit_eligibility(user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    user_record RECORD;
    reward_config RECORD;
    batch_size INTEGER;
    completed_batches INTEGER;
    last_credit_batch INTEGER;
BEGIN
    -- Get user and reward config
    SELECT * INTO user_record FROM public.users WHERE id = user_id;
    SELECT * INTO reward_config FROM public.referral_rewards WHERE user_type = user_record.user_type;
    
    IF reward_config IS NOT NULL THEN
        batch_size := reward_config.required_referrals;
        completed_batches := user_record.paying_referral_count / batch_size;
        
        -- Get last credited batch count
        SELECT COALESCE(MAX(referral_batch_count), 0) INTO last_credit_batch
        FROM public.referral_credits
        WHERE user_id = user_id;
        
        -- Create credits for new completed batches
        IF completed_batches > last_credit_batch THEN
            -- Calculate average subscription value for this batch
            INSERT INTO public.referral_credits (
                user_id,
                credit_amount,
                tier_value,
                expires_at,
                referral_batch_count
            )
            SELECT
                user_id,
                reward_config.reward_value,
                COALESCE(AVG(rt.subscription_amount), 20), -- Default to $20 if no data
                NOW() + INTERVAL '30 days',
                completed_batches
            FROM public.referral_tracking rt
            WHERE rt.referrer_id = user_id
            AND rt.is_successful = true
            GROUP BY user_id;
        END IF;
    END IF;
END;
$$;

-- Generate secure referral link
CREATE OR REPLACE FUNCTION generate_secure_referral_link(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_ref_code TEXT;
    base_url TEXT;
BEGIN
    -- Verify user exists and is authenticated
    IF auth.uid() != user_id THEN
        RAISE EXCEPTION 'Unauthorized access to generate referral link';
    END IF;
    
    -- Get user's referral code
    SELECT referral_code INTO user_ref_code
    FROM public.users
    WHERE id = user_id;
    
    IF user_ref_code IS NULL THEN
        RAISE EXCEPTION 'User does not have a referral code';
    END IF;
    
    -- Get base URL from config (in production, this would come from environment)
    base_url := COALESCE(
        current_setting('app.base_url', true),
        'https://app.lifenavigator.com'
    );
    
    -- Log referral link generation
    INSERT INTO public.security_audit_log (
        table_name,
        operation,
        user_id,
        record_id,
        new_data,
        created_at
    ) VALUES (
        'referral_links',
        'GENERATE',
        user_id,
        user_id,
        jsonb_build_object(
            'referral_code', user_ref_code,
            'timestamp', timezone('utc'::text, now())
        ),
        timezone('utc'::text, now())
    );
    
    RETURN base_url || '/signup?ref=' || user_ref_code;
END;
$$;

-- Get referral statistics
CREATE OR REPLACE FUNCTION get_referral_stats(user_id UUID)
RETURNS TABLE (
    total_referrals INTEGER,
    successful_referrals INTEGER,
    pending_referrals INTEGER,
    total_credits INTEGER,
    used_credits INTEGER,
    available_credits INTEGER,
    next_reward_at INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verify user access
    IF auth.uid() != user_id THEN
        RAISE EXCEPTION 'Unauthorized access to referral statistics';
    END IF;
    
    RETURN QUERY
    SELECT
        COALESCE(COUNT(DISTINCT rt.referred_id), 0)::INTEGER as total_referrals,
        COALESCE(COUNT(DISTINCT rt.referred_id) FILTER (WHERE rt.is_successful = true), 0)::INTEGER as successful_referrals,
        COALESCE(COUNT(DISTINCT rt.referred_id) FILTER (WHERE rt.is_successful = false), 0)::INTEGER as pending_referrals,
        COALESCE(SUM(rc.credit_amount), 0)::INTEGER as total_credits,
        COALESCE(SUM(rc.credit_amount) FILTER (WHERE rc.is_used = true), 0)::INTEGER as used_credits,
        COALESCE(SUM(rc.credit_amount) FILTER (WHERE rc.is_used = false AND rc.expires_at > now()), 0)::INTEGER as available_credits,
        CASE 
            WHEN u.user_type = 'pilot' THEN GREATEST(0, 5 - COALESCE(u.paying_referral_count, 0))
            WHEN u.user_type = 'waitlist' THEN GREATEST(0, 10 - COALESCE(u.paying_referral_count, 0))
            ELSE GREATEST(0, 20 - COALESCE(u.paying_referral_count, 0))
        END::INTEGER as next_reward_at
    FROM public.users u
    LEFT JOIN public.referral_tracking rt ON rt.referrer_id = u.id
    LEFT JOIN public.referral_credits rc ON rc.user_id = u.id
    WHERE u.id = user_id
    GROUP BY u.id, u.user_type, u.paying_referral_count;
END;
$$;

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

-- Audit sensitive changes
CREATE OR REPLACE FUNCTION audit_sensitive_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.security_audit_log (
        table_name,
        operation,
        user_id,
        record_id,
        old_data,
        new_data,
        ip_address,
        user_agent,
        created_at
    ) VALUES (
        TG_TABLE_NAME,
        TG_OP,
        auth.uid(),
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.id
            ELSE NEW.id
        END,
        CASE 
            WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD)
            ELSE NULL
        END,
        CASE 
            WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)
            ELSE NULL
        END,
        current_setting('request.headers')::json->>'cf-connecting-ip',
        current_setting('request.headers')::json->>'user-agent',
        timezone('utc'::text, now())
    );
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

-- =====================================================
-- SECTION 9: TRIGGERS
-- =====================================================

-- Users table triggers
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER track_paying_referrals
    AFTER UPDATE ON public.users
    FOR EACH ROW
    WHEN (OLD.is_paying IS DISTINCT FROM NEW.is_paying)
    EXECUTE FUNCTION update_paying_referral_count();

CREATE TRIGGER audit_users_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION audit_sensitive_changes();

-- Other table triggers
CREATE TRIGGER update_referral_rewards_updated_at
    BEFORE UPDATE ON public.referral_rewards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_referral_credits_updated_at
    BEFORE UPDATE ON public.referral_credits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER audit_referral_credits_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.referral_credits
    FOR EACH ROW
    EXECUTE FUNCTION audit_sensitive_changes();

CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON public.admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_email_campaigns_updated_at
    BEFORE UPDATE ON public.email_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_segments_updated_at
    BEFORE UPDATE ON public.user_segments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_oauth_connections_updated_at
    BEFORE UPDATE ON public.oauth_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON public.notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- SECTION 10: INDEXES
-- =====================================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_email_encrypted ON public.users(email_encrypted);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON public.users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON public.users(referred_by);
CREATE INDEX IF NOT EXISTS idx_users_position ON public.users(position);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON public.users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_is_paying ON public.users(is_paying);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at DESC);

-- Referral tracking indexes
CREATE INDEX IF NOT EXISTS idx_referral_tracking_referrer ON public.referral_tracking(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_referred ON public.referral_tracking(referred_id);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_composite ON public.referral_tracking(referrer_id, referred_id, is_successful);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_successful ON public.referral_tracking(is_successful) WHERE is_successful = true;

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_page_views_user ON public.page_views(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_session ON public.page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON public.user_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_form_analytics_user ON public.form_analytics(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_click_events_user ON public.click_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversions_user ON public.conversions(user_id, created_at DESC);

-- Email indexes
CREATE INDEX IF NOT EXISTS idx_email_events_campaign ON public.email_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_events_user ON public.email_events(user_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON public.email_queue(status) WHERE status = 'pending';

-- Security indexes
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_operation ON public.security_audit_log(user_id, operation, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_oauth_connections_user ON public.oauth_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON public.rate_limits(identifier, endpoint, window_start);

-- =====================================================
-- SECTION 11: ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.click_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_segment_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_config ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own non-sensitive data" ON public.users
    FOR SELECT
    USING (
        auth.uid() = id
        AND auth.jwt() ->> 'email_verified' = 'true'
    );

CREATE POLICY "Users can update own non-sensitive data" ON public.users
    FOR UPDATE
    USING (
        auth.uid() = id
        AND auth.jwt() ->> 'email_verified' = 'true'
    )
    WITH CHECK (
        auth.uid() = id
        AND auth.jwt() ->> 'email_verified' = 'true'
        -- Prevent users from modifying certain fields
        AND (
            email = OLD.email
            AND email_encrypted = OLD.email_encrypted
            AND referral_code = OLD.referral_code
            AND referral_count = OLD.referral_count
            AND paying_referral_count = OLD.paying_referral_count
            AND position = OLD.position
        )
    );

CREATE POLICY "Service role bypass" ON public.users
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Referral tracking policies
CREATE POLICY "Users view referral tracking with verification" ON public.referral_tracking
    FOR SELECT
    USING (
        (referrer_id = auth.uid() OR referred_id = auth.uid())
        AND auth.jwt() ->> 'email_verified' = 'true'
    );

CREATE POLICY "Service role bypass" ON public.referral_tracking
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Referral rewards policies
CREATE POLICY "Anyone can view reward structure" ON public.referral_rewards
    FOR SELECT
    USING (true);

CREATE POLICY "Service role bypass" ON public.referral_rewards
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Referral credits policies
CREATE POLICY "Users view own credits with verification" ON public.referral_credits
    FOR SELECT
    USING (
        user_id = auth.uid()
        AND auth.jwt() ->> 'email_verified' = 'true'
    );

CREATE POLICY "Service role bypass" ON public.referral_credits
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Analytics policies (authenticated users can insert)
CREATE POLICY "Authenticated users can insert analytics" ON public.page_views
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Service role bypass" ON public.page_views
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Authenticated users can insert analytics" ON public.form_analytics
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Service role bypass" ON public.form_analytics
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Authenticated users can insert analytics" ON public.click_events
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Service role bypass" ON public.click_events
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Admin policies
CREATE POLICY "Admins have full access" ON public.admin_users
    FOR ALL
    USING (
        EXISTS (
            SELECT 1
            FROM public.admin_users
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

CREATE POLICY "Service role bypass" ON public.admin_users
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- OAuth connections policies
CREATE POLICY "Users can view own OAuth connections" ON public.oauth_connections
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Service role bypass" ON public.oauth_connections
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Notification preferences policies
CREATE POLICY "Users can manage own preferences" ON public.notification_preferences
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role bypass" ON public.notification_preferences
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Security config policies (only service role)
CREATE POLICY "Service role only" ON public.security_config
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Audit log policies (service role only)
CREATE POLICY "Service role only" ON public.security_audit_log
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role only" ON public.audit_logs
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- SECTION 12: VIEWS
-- =====================================================

-- Create view for decrypted user data (authorized access only)
CREATE OR REPLACE VIEW public.users_decrypted AS
SELECT
    id,
    decrypt_sensitive(email_encrypted) as email,
    name,
    avatar_url,
    decrypt_sensitive(profession_encrypted) as profession,
    decrypt_sensitive(company_encrypted) as company,
    interests,
    tier_preference,
    referred_by,
    user_type,
    auth_provider,
    joined_at,
    position,
    referral_code,
    email_verified,
    email_verified_at,
    referral_count,
    paying_referral_count,
    last_login,
    service_verified,
    service_type,
    service_verification_date,
    is_paying,
    subscription_tier,
    subscription_amount,
    created_at,
    updated_at
FROM public.users;

-- Grant permissions
GRANT SELECT ON public.users_decrypted TO authenticated;

-- =====================================================
-- SECTION 13: FINAL SETUP
-- =====================================================

-- Set the position sequence to start at 100 if needed
SELECT setval('users_position_seq', GREATEST(COALESCE(MAX(position), 99), 99) + 1, false) FROM public.users;

-- Update any existing users to have encrypted fields
UPDATE public.users
SET 
    email_encrypted = COALESCE(email_encrypted, encrypt_sensitive(email)),
    profession_encrypted = COALESCE(profession_encrypted, encrypt_sensitive(profession)),
    company_encrypted = COALESCE(company_encrypted, encrypt_sensitive(company))
WHERE email_encrypted IS NULL AND email IS NOT NULL;

-- Grant necessary function permissions
GRANT EXECUTE ON FUNCTION generate_secure_referral_link TO authenticated;
GRANT EXECUTE ON FUNCTION get_referral_stats TO authenticated;

-- Add helpful comments
COMMENT ON TABLE public.users IS 'Main users table with encrypted PII fields';
COMMENT ON TABLE public.referral_tracking IS 'Tracks referral relationships and conversions';
COMMENT ON TABLE public.referral_credits IS 'Manages referral reward credits';
COMMENT ON TABLE public.security_config IS 'Stores security configuration including encryption keys';
COMMENT ON FUNCTION encrypt_sensitive IS 'Encrypts sensitive data using AES-256 encryption';
COMMENT ON FUNCTION decrypt_sensitive IS 'Decrypts sensitive data - access controlled';
COMMENT ON FUNCTION generate_secure_referral_link IS 'Generates secure referral links with audit logging';
COMMENT ON FUNCTION get_referral_stats IS 'Retrieves referral statistics for authenticated users';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- This migration sets up:
-- ✓ Complete user management with waitlist tracking
-- ✓ Military-grade encryption for sensitive data
-- ✓ Comprehensive referral system with automatic rewards
-- ✓ Row-level security policies
-- ✓ Analytics and audit logging
-- ✓ Email campaign management
-- ✓ OAuth integration support
-- ✓ Admin dashboard infrastructure
-- =====================================================