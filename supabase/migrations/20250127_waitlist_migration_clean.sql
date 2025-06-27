-- =====================================================
-- WAITLIST MIGRATION - Clean and Simple
-- =====================================================
-- This migration sets up the waitlist system with referral tracking
-- =====================================================

-- Add missing columns to existing users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
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
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'users_position_seq') THEN
        CREATE SEQUENCE users_position_seq START 100;
    END IF;
END $$;

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

-- Create referral tracking table
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

-- Create referral rewards configuration
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

-- Create referral credits table
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

-- Create notification preferences
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
DROP FUNCTION IF EXISTS generate_referral_code() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_paying_referral_count() CASCADE;
DROP FUNCTION IF EXISTS check_referral_credit_eligibility(UUID);
DROP FUNCTION IF EXISTS get_referral_stats(UUID);
DROP FUNCTION IF EXISTS increment_referral_count(UUID);
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;

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
BEGIN
    -- Create user record
    INSERT INTO public.users (id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;
    
    -- Update fields from metadata
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

-- Update referral counts when user becomes paying
CREATE OR REPLACE FUNCTION update_paying_referral_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
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
        
        -- Update referrer's count
        UPDATE public.users
        SET paying_referral_count = COALESCE(paying_referral_count, 0) + 1
        WHERE id = NEW.referred_by;
        
        -- Check for credits
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
    SELECT * INTO user_record FROM public.users WHERE id = user_id;
    SELECT * INTO reward_config FROM public.referral_rewards WHERE user_type = user_record.user_type;
    
    IF reward_config IS NOT NULL THEN
        batch_size := reward_config.required_referrals;
        completed_batches := COALESCE(user_record.paying_referral_count, 0) / batch_size;
        
        SELECT COALESCE(MAX(referral_batch_count), 0) INTO last_credit_batch
        FROM public.referral_credits
        WHERE user_id = user_id;
        
        IF completed_batches > last_credit_batch THEN
            INSERT INTO public.referral_credits (
                user_id,
                credit_amount,
                tier_value,
                expires_at,
                referral_batch_count
            )
            VALUES (
                user_id,
                reward_config.reward_value,
                20, -- Default tier value
                NOW() + INTERVAL '30 days',
                completed_batches
            );
        END IF;
    END IF;
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

-- Increment referral count
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

-- Create triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS track_paying_referrals ON public.users;
CREATE TRIGGER track_paying_referrals
    AFTER UPDATE ON public.users
    FOR EACH ROW
    WHEN (OLD.is_paying IS DISTINCT FROM NEW.is_paying)
    EXECUTE FUNCTION update_paying_referral_count();

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Service role bypass" ON public.users
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE
    USING (auth.uid() = id);

-- Update existing data
UPDATE public.users
SET 
    referral_code = generate_referral_code()
WHERE referral_code IS NULL;

UPDATE public.users
SET 
    referral_count = COALESCE(referral_count, 0),
    paying_referral_count = COALESCE(paying_referral_count, 0),
    email_verified = COALESCE(email_verified, false),
    is_paying = COALESCE(is_paying, false),
    service_verified = COALESCE(service_verified, false);

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_referral_stats TO authenticated;
GRANT EXECUTE ON FUNCTION increment_referral_count TO authenticated;

-- =====================================================
-- MIGRATION COMPLETE - Clean Waitlist System
-- =====================================================