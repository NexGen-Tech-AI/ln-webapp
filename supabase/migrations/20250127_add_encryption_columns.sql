-- =====================================================
-- ADD ENCRYPTION COLUMNS TO EXISTING TABLES
-- =====================================================
-- This migration adds the missing encrypted columns to existing tables
-- =====================================================

-- Add encrypted columns to users table if they don't exist
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS email_encrypted TEXT,
ADD COLUMN IF NOT EXISTS profession_encrypted TEXT,
ADD COLUMN IF NOT EXISTS company_encrypted TEXT;

-- Add other missing columns that might not exist
ALTER TABLE public.users 
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
ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP WITH TIME ZONE;

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

-- Now run the main migration
-- (Copy the rest of the fixed migration here, starting from the functions section)

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

-- =====================================================
-- SECTION 1: EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pgjwt";

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
    new_referral_code TEXT;
    ref_position INTEGER;
    ref_email_encrypted TEXT;
    ref_profession_encrypted TEXT;
    ref_company_encrypted TEXT;
BEGIN
    -- Get values from metadata
    new_referral_code := COALESCE(NEW.raw_user_meta_data->>'referral_code', generate_referral_code());
    ref_position := COALESCE((NEW.raw_user_meta_data->>'position')::INTEGER, nextval('users_position_seq'));
    
    -- Encrypt sensitive fields
    ref_email_encrypted := encrypt_sensitive(NEW.email);
    ref_profession_encrypted := encrypt_sensitive(NEW.raw_user_meta_data->>'profession');
    ref_company_encrypted := encrypt_sensitive(NEW.raw_user_meta_data->>'company');
    
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
        ref_position,
        new_referral_code,
        ref_email_encrypted,
        ref_profession_encrypted,
        ref_company_encrypted
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

-- Increment referral count function (for backend use)
CREATE OR REPLACE FUNCTION increment_referral_count(user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.users 
    SET referral_count = referral_count + 1
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

-- =====================================================
-- SECTION 12: VIEWS
-- =====================================================

-- Create view for decrypted user data (authorized access only)
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
FROM public.users;

-- Grant permissions
GRANT SELECT ON public.users_decrypted TO authenticated;

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

-- Grant necessary function permissions
GRANT EXECUTE ON FUNCTION generate_secure_referral_link TO authenticated;
GRANT EXECUTE ON FUNCTION get_referral_stats TO authenticated;
GRANT EXECUTE ON FUNCTION increment_referral_count TO authenticated;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- This migration adds encryption columns and updates the system
-- =====================================================