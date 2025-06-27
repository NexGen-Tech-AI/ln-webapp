-- =====================================================
-- ADD ALL MISSING COLUMNS TO EXISTING USERS TABLE
-- =====================================================
-- This migration adds ALL missing columns to the existing users table
-- =====================================================

-- First, let's add ALL the columns that might be missing
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
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

-- Create sequence for position if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS users_position_seq START 100;

-- Add constraints if they don't exist
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

-- =====================================================
-- CREATE MISSING TABLES
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
-- SECTION 0: DROP EXISTING FUNCTIONS WITH CONFLICTS
-- =====================================================
DROP FUNCTION IF EXISTS check_referral_credit_eligibility(UUID);
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS generate_referral_code() CASCADE;
DROP FUNCTION IF EXISTS update_paying_referral_count() CASCADE;
DROP FUNCTION IF EXISTS generate_secure_referral_link(UUID);
DROP FUNCTION IF EXISTS get_referral_stats(UUID);
DROP FUNCTION IF EXISTS increment_referral_count(UUID);
DROP FUNCTION IF EXISTS get_encryption_key() CASCADE;
DROP FUNCTION IF EXISTS encrypt_sensitive(TEXT) CASCADE;
DROP FUNCTION IF EXISTS decrypt_sensitive(TEXT) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS audit_sensitive_changes() CASCADE;

-- =====================================================
-- SECTION 1: EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pgjwt";

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

-- Handle new user creation (simplified version that only inserts what exists)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    col_exists BOOLEAN;
BEGIN
    -- Check which columns exist and only insert into those
    INSERT INTO public.users (id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;
    
    -- Update additional fields if columns exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'name'
    ) INTO col_exists;
    
    IF col_exists THEN
        UPDATE public.users 
        SET name = COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
        WHERE id = NEW.id;
    END IF;
    
    -- Update referral code
    UPDATE public.users 
    SET referral_code = COALESCE(referral_code, generate_referral_code())
    WHERE id = NEW.id AND referral_code IS NULL;
    
    -- Update position
    UPDATE public.users 
    SET position = COALESCE(position, nextval('users_position_seq'))
    WHERE id = NEW.id AND position IS NULL;
    
    -- Update other metadata fields
    UPDATE public.users
    SET 
        profession = COALESCE(profession, NEW.raw_user_meta_data->>'profession'),
        company = COALESCE(company, NEW.raw_user_meta_data->>'company'),
        interests = COALESCE(interests, 
            CASE 
                WHEN NEW.raw_user_meta_data->>'interests' IS NOT NULL 
                THEN string_to_array(NEW.raw_user_meta_data->>'interests', ',')
                ELSE NULL
            END
        ),
        tier_preference = COALESCE(tier_preference, NEW.raw_user_meta_data->>'tier_preference', 'free'),
        referred_by = COALESCE(referred_by, (NEW.raw_user_meta_data->>'referred_by')::UUID),
        user_type = COALESCE(user_type, NEW.raw_user_meta_data->>'user_type', 'waitlist'),
        auth_provider = COALESCE(auth_provider, NEW.raw_user_meta_data->>'auth_provider', 'email'),
        joined_at = COALESCE(joined_at, NOW()),
        avatar_url = COALESCE(avatar_url, NEW.raw_user_meta_data->>'avatar_url')
    WHERE id = NEW.id;
    
    -- Encrypt sensitive fields
    UPDATE public.users
    SET 
        email_encrypted = COALESCE(email_encrypted, encrypt_sensitive(email)),
        profession_encrypted = COALESCE(profession_encrypted, encrypt_sensitive(profession)),
        company_encrypted = COALESCE(company_encrypted, encrypt_sensitive(company))
    WHERE id = NEW.id;
    
    -- Handle referral tracking if referred by someone
    IF NEW.raw_user_meta_data->>'referred_by' IS NOT NULL THEN
        -- Insert referral tracking record
        INSERT INTO public.referral_tracking (referrer_id, referred_id)
        VALUES ((NEW.raw_user_meta_data->>'referred_by')::UUID, NEW.id)
        ON CONFLICT (referrer_id, referred_id) DO NOTHING;
        
        -- Update referrer's count
        UPDATE public.users
        SET referral_count = COALESCE(referral_count, 0) + 1
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
        SET paying_referral_count = COALESCE(paying_referral_count, 0) + 1
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
        completed_batches := COALESCE(user_record.paying_referral_count, 0) / batch_size;
        
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

-- Increment referral count function (for backend use)
CREATE OR REPLACE FUNCTION increment_referral_count(user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.users 
    SET referral_count = COALESCE(referral_count, 0) + 1
    WHERE id = user_id;
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
        current_setting('request.headers', true)::json->>'cf-connecting-ip',
        current_setting('request.headers', true)::json->>'user-agent',
        timezone('utc'::text, now())
    );
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- If headers aren't available, still allow the operation
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

-- Drop existing triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS track_paying_referrals ON public.users;
DROP TRIGGER IF EXISTS audit_users_changes ON public.users;

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

-- Enable RLS on tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
CREATE POLICY "Service role bypass" ON public.users
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE
    USING (auth.uid() = id);

-- =====================================================
-- SECTION 13: UPDATE EXISTING DATA
-- =====================================================

-- Update any existing users to have encrypted fields
UPDATE public.users
SET 
    email_encrypted = COALESCE(email_encrypted, encrypt_sensitive(email)),
    profession_encrypted = COALESCE(profession_encrypted, encrypt_sensitive(profession)),
    company_encrypted = COALESCE(company_encrypted, encrypt_sensitive(company))
WHERE email_encrypted IS NULL AND email IS NOT NULL;

-- Generate referral codes for existing users who don't have them
UPDATE public.users
SET referral_code = generate_referral_code()
WHERE referral_code IS NULL;

-- Set default values for new columns
UPDATE public.users
SET 
    referral_count = COALESCE(referral_count, 0),
    paying_referral_count = COALESCE(paying_referral_count, 0),
    email_verified = COALESCE(email_verified, false),
    is_paying = COALESCE(is_paying, false),
    service_verified = COALESCE(service_verified, false)
WHERE referral_count IS NULL 
   OR paying_referral_count IS NULL 
   OR email_verified IS NULL 
   OR is_paying IS NULL 
   OR service_verified IS NULL;

-- Grant necessary function permissions
GRANT EXECUTE ON FUNCTION generate_secure_referral_link TO authenticated;
GRANT EXECUTE ON FUNCTION get_referral_stats TO authenticated;
GRANT EXECUTE ON FUNCTION increment_referral_count TO authenticated;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- This migration adds all missing columns and functions
-- =====================================================