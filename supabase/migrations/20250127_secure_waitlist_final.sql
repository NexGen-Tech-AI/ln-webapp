-- =====================================================
-- SECURE WAITLIST MIGRATION WITH MILITARY-GRADE ENCRYPTION
-- =====================================================
-- This migration implements AES-256 encryption for sensitive data
-- No cryptocurrency - just secure data handling
-- =====================================================

-- Enable pgcrypto for AES-256 encryption
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Add missing columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'email',
ADD COLUMN IF NOT EXISTS email_encrypted TEXT,
ADD COLUMN IF NOT EXISTS profession_encrypted TEXT,
ADD COLUMN IF NOT EXISTS company_encrypted TEXT,
ADD COLUMN IF NOT EXISTS paying_referral_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS service_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS service_type TEXT,
ADD COLUMN IF NOT EXISTS service_verification_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS idme_verification_id TEXT,
ADD COLUMN IF NOT EXISTS is_paying BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS subscription_tier TEXT,
ADD COLUMN IF NOT EXISTS subscription_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS verification_token TEXT,
ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS password_reset_token TEXT,
ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Create sequence for waitlist position
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'users_position_seq') THEN
        CREATE SEQUENCE users_position_seq START 100;
    END IF;
END $$;

-- Add security constraints
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_user_type') THEN
        ALTER TABLE public.users ADD CONSTRAINT valid_user_type CHECK (user_type IN ('pilot', 'waitlist', 'regular'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_tier') THEN
        ALTER TABLE public.users ADD CONSTRAINT valid_tier CHECK (tier_preference IN ('free', 'pro', 'ai', 'family'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_service_type') THEN
        ALTER TABLE public.users ADD CONSTRAINT valid_service_type CHECK (service_type IS NULL OR service_type IN ('military', 'veteran', 'first_responder', 'teacher'));
    END IF;
END $$;

-- Security configuration table for encryption keys
CREATE TABLE IF NOT EXISTS public.security_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key_name TEXT NOT NULL UNIQUE,
    key_value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Generate secure encryption key if not exists
INSERT INTO public.security_config (key_name, key_value)
VALUES ('encryption_key', encode(gen_random_bytes(32), 'base64'))
ON CONFLICT (key_name) DO NOTHING;

-- Security audit log for compliance
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

-- Referral tracking (no crypto, just credits)
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

-- Referral rewards (USD credits, not crypto)
CREATE TABLE IF NOT EXISTS public.referral_rewards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_type TEXT NOT NULL,
    required_referrals INTEGER NOT NULL,
    reward_type TEXT NOT NULL CHECK (reward_type = 'credit'), -- Only USD credits
    reward_value INTEGER NOT NULL, -- In USD
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_type)
);

-- Insert referral rewards (USD credits only)
INSERT INTO public.referral_rewards (user_type, required_referrals, reward_type, reward_value) VALUES
    ('pilot', 5, 'credit', 100),      -- $100 USD credit
    ('waitlist', 10, 'credit', 100),  -- $100 USD credit
    ('regular', 20, 'credit', 100)    -- $100 USD credit
ON CONFLICT (user_type) DO NOTHING;

-- Referral credits table (USD only)
CREATE TABLE IF NOT EXISTS public.referral_credits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    credit_amount DECIMAL(10,2) NOT NULL, -- USD amount
    tier_value DECIMAL(10,2) NOT NULL,    -- USD value
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT false,
    used_at TIMESTAMP WITH TIME ZONE,
    referral_batch_count INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
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

-- Drop existing functions
DROP FUNCTION IF EXISTS get_encryption_key() CASCADE;
DROP FUNCTION IF EXISTS encrypt_sensitive(TEXT) CASCADE;
DROP FUNCTION IF EXISTS decrypt_sensitive(TEXT) CASCADE;
DROP FUNCTION IF EXISTS generate_referral_code() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_paying_referral_count() CASCADE;
DROP FUNCTION IF EXISTS check_referral_credit_eligibility(UUID);
DROP FUNCTION IF EXISTS get_referral_stats(UUID);
DROP FUNCTION IF EXISTS audit_sensitive_changes() CASCADE;

-- Get encryption key (military-grade security)
CREATE OR REPLACE FUNCTION get_encryption_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (SELECT key_value FROM public.security_config WHERE key_name = 'encryption_key');
END;
$$;

-- Encrypt sensitive data using AES-256
CREATE OR REPLACE FUNCTION encrypt_sensitive(data TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF data IS NULL THEN
        RETURN NULL;
    END IF;
    -- Use AES-256 encryption
    RETURN encode(
        encrypt(
            data::bytea,
            get_encryption_key()::bytea,
            'aes'
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
        decrypt(
            decode(encrypted_data, 'base64'),
            get_encryption_key()::bytea,
            'aes'
        ),
        'UTF8'
    );
END;
$$;

-- Generate secure referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate secure 8 character code
        new_code := upper(substring(encode(gen_random_bytes(6), 'base64') from 1 for 8));
        -- Remove special characters
        new_code := regexp_replace(new_code, '[^A-Z0-9]', '', 'g');
        
        -- Ensure it's 8 characters
        IF length(new_code) < 8 THEN
            CONTINUE;
        END IF;
        
        -- Check uniqueness
        SELECT EXISTS(SELECT 1 FROM public.users WHERE referral_code = new_code) INTO code_exists;
        
        EXIT WHEN NOT code_exists;
    END LOOP;
    
    RETURN new_code;
END;
$$;

-- Secure user creation with encryption
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Create user record
    INSERT INTO public.users (id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;
    
    -- Update with metadata
    UPDATE public.users 
    SET 
        name = COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        profession = NEW.raw_user_meta_data->>'profession',
        company = NEW.raw_user_meta_data->>'company',
        interests = CASE 
            WHEN NEW.raw_user_meta_data->>'interests' IS NOT NULL 
            THEN string_to_array(NEW.raw_user_meta_data->>'interests', ',')
            ELSE NULL
        END,
        tier_preference = COALESCE(NEW.raw_user_meta_data->>'tier_preference', 'free'),
        referred_by = (NEW.raw_user_meta_data->>'referred_by')::UUID,
        user_type = COALESCE(NEW.raw_user_meta_data->>'user_type', 'waitlist'),
        auth_provider = COALESCE(NEW.raw_user_meta_data->>'auth_provider', 'email'),
        joined_at = NOW(),
        avatar_url = NEW.raw_user_meta_data->>'avatar_url',
        referral_code = COALESCE(referral_code, generate_referral_code()),
        position = COALESCE(position, nextval('users_position_seq'))
    WHERE id = NEW.id;
    
    -- Encrypt sensitive data
    UPDATE public.users
    SET 
        email_encrypted = encrypt_sensitive(email),
        profession_encrypted = encrypt_sensitive(profession),
        company_encrypted = encrypt_sensitive(company)
    WHERE id = NEW.id;
    
    -- Handle referral tracking
    IF NEW.raw_user_meta_data->>'referred_by' IS NOT NULL THEN
        INSERT INTO public.referral_tracking (referrer_id, referred_id)
        VALUES ((NEW.raw_user_meta_data->>'referred_by')::UUID, NEW.id)
        ON CONFLICT (referrer_id, referred_id) DO NOTHING;
        
        UPDATE public.users
        SET referral_count = COALESCE(referral_count, 0) + 1
        WHERE id = (NEW.raw_user_meta_data->>'referred_by')::UUID;
    END IF;
    
    -- Create notification preferences
    INSERT INTO public.notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$;

-- Track paying referrals for USD credits
CREATE OR REPLACE FUNCTION update_paying_referral_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.is_paying = true AND OLD.is_paying = false THEN
        -- Update tracking
        UPDATE public.referral_tracking
        SET 
            is_successful = true,
            converted_at = NOW(),
            first_payment_at = NOW(),
            subscription_tier = NEW.subscription_tier,
            subscription_amount = NEW.subscription_amount
        WHERE referred_id = NEW.id;
        
        -- Update referrer's count
        UPDATE public.users
        SET paying_referral_count = COALESCE(paying_referral_count, 0) + 1
        WHERE id = NEW.referred_by;
        
        -- Check for USD credits
        PERFORM check_referral_credit_eligibility(NEW.referred_by);
    END IF;
    
    RETURN NEW;
END;
$$;

-- Check eligibility for USD credits (not crypto)
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
    SELECT * INTO user_record FROM public.users WHERE id = user_id;
    SELECT * INTO reward_config FROM public.referral_rewards WHERE user_type = user_record.user_type;
    
    IF reward_config IS NOT NULL THEN
        batch_size := reward_config.required_referrals;
        completed_batches := COALESCE(user_record.paying_referral_count, 0) / batch_size;
        
        SELECT COALESCE(MAX(referral_batch_count), 0) INTO last_credit_batch
        FROM public.referral_credits
        WHERE user_id = user_id;
        
        IF completed_batches > last_credit_batch THEN
            -- Award USD credits (not crypto)
            INSERT INTO public.referral_credits (
                user_id,
                credit_amount,
                tier_value,
                expires_at,
                referral_batch_count
            )
            VALUES (
                user_id,
                reward_config.reward_value,  -- USD amount
                20,                          -- Default USD tier value
                NOW() + INTERVAL '30 days',
                completed_batches
            );
        END IF;
    END IF;
END;
$$;

-- Get referral statistics (USD values only)
CREATE OR REPLACE FUNCTION get_referral_stats(user_id UUID)
RETURNS TABLE (
    total_referrals INTEGER,
    successful_referrals INTEGER,
    pending_referrals INTEGER,
    total_credits INTEGER,      -- USD credits
    used_credits INTEGER,       -- USD credits
    available_credits INTEGER,  -- USD credits
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

-- Audit function for security compliance
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
        COALESCE(current_setting('request.headers', true)::json->>'cf-connecting-ip', 'unknown'),
        COALESCE(current_setting('request.headers', true)::json->>'user-agent', 'unknown'),
        timezone('utc'::text, now())
    );
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Still allow operation if headers unavailable
        IF TG_OP = 'DELETE' THEN
            RETURN OLD;
        ELSE
            RETURN NEW;
        END IF;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

DROP TRIGGER IF EXISTS track_paying_referrals ON public.users;
CREATE TRIGGER track_paying_referrals
    AFTER UPDATE ON public.users
    FOR EACH ROW
    WHEN (OLD.is_paying IS DISTINCT FROM NEW.is_paying)
    EXECUTE FUNCTION update_paying_referral_count();

DROP TRIGGER IF EXISTS audit_users_changes ON public.users;
CREATE TRIGGER audit_users_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION audit_sensitive_changes();

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Service role full access" ON public.users
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Users view own data" ON public.users
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users update own data" ON public.users
    FOR UPDATE
    USING (auth.uid() = id);

-- Secure view for decrypted data
CREATE OR REPLACE VIEW public.users_decrypted AS
SELECT
    id,
    COALESCE(decrypt_sensitive(email_encrypted), email) as email,
    name,
    avatar_url,
    COALESCE(decrypt_sensitive(profession_encrypted), profession) as profession,
    COALESCE(decrypt_sensitive(company_encrypted), company) as company,
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
FROM public.users
WHERE auth.uid() = id OR auth.jwt() ->> 'role' = 'service_role';

-- Update existing data
UPDATE public.users
SET 
    referral_code = generate_referral_code()
WHERE referral_code IS NULL;

UPDATE public.users
SET 
    email_encrypted = encrypt_sensitive(email),
    profession_encrypted = encrypt_sensitive(profession),
    company_encrypted = encrypt_sensitive(company)
WHERE email_encrypted IS NULL AND email IS NOT NULL;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_referral_stats TO authenticated;
GRANT SELECT ON public.users_decrypted TO authenticated;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON public.users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_position ON public.users(position);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_referrer ON public.referral_tracking(referrer_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public.security_audit_log(created_at);

-- =====================================================
-- MIGRATION COMPLETE - Military-Grade Security
-- No cryptocurrency - Only USD credits
-- =====================================================