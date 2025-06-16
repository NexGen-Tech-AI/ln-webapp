-- Complete System Update Migration
-- This migration includes all improvements: referral system, OAuth, analytics, and data capture

-- 1. Ensure users table has all required fields
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS auth_provider text DEFAULT 'email',
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS profession text,
ADD COLUMN IF NOT EXISTS company text,
ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tier_preference text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS referral_credits integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES users(id),
ADD COLUMN IF NOT EXISTS last_login timestamptz,
ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false;

-- 2. Create or update referral_rewards table
CREATE TABLE IF NOT EXISTS referral_rewards (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    referred_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    reward_type text NOT NULL CHECK (reward_type IN ('credit', 'discount', 'free_month')),
    reward_value numeric NOT NULL,
    reward_tier text,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'used', 'expired')),
    expires_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    used_at timestamptz,
    UNIQUE(user_id, referred_user_id)
);

-- 3. Create referral_credits table
CREATE TABLE IF NOT EXISTS referral_credits (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    credit_type text NOT NULL,
    credit_value numeric NOT NULL,
    tier text NOT NULL,
    status text DEFAULT 'active',
    expires_at timestamptz,
    used_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- 4. Create oauth_connections table
CREATE TABLE IF NOT EXISTS oauth_connections (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    provider text NOT NULL,
    provider_user_id text NOT NULL,
    provider_email text,
    provider_data jsonb,
    connected_at timestamptz DEFAULT now(),
    last_used timestamptz DEFAULT now(),
    UNIQUE(provider, provider_user_id)
);

-- 5. Update analytics tables
CREATE TABLE IF NOT EXISTS page_views (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id text NOT NULL,
    page_path text NOT NULL,
    page_title text,
    referrer text,
    user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    duration integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS form_analytics (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    form_id text NOT NULL,
    session_id text NOT NULL,
    user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    step_reached integer DEFAULT 1,
    completed boolean DEFAULT false,
    abandoned boolean DEFAULT false,
    time_spent integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_user_id ON referral_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_status ON referral_rewards(status);
CREATE INDEX IF NOT EXISTS idx_oauth_connections_user_id ON oauth_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_connections_provider ON oauth_connections(provider);
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_user_id ON page_views(user_id);

-- 7. Create or replace functions for referral system
CREATE OR REPLACE FUNCTION calculate_referral_reward()
RETURNS TRIGGER AS $$
DECLARE
    referrer_record RECORD;
    reward_tier text;
    reward_value numeric;
BEGIN
    -- Only process if user was referred
    IF NEW.referred_by IS NOT NULL THEN
        -- Get referrer details
        SELECT * INTO referrer_record FROM users WHERE id = NEW.referred_by;
        
        -- Determine reward tier based on the new user's tier preference
        reward_tier := NEW.tier_preference;
        
        -- Calculate reward value (1 month free for every 3 referrals)
        reward_value := CASE 
            WHEN reward_tier = 'free' THEN 0
            WHEN reward_tier = 'pro' THEN 20
            WHEN reward_tier = 'ai' THEN 99
            WHEN reward_tier = 'family' THEN 35
            ELSE 0
        END;
        
        -- Create reward record
        INSERT INTO referral_rewards (
            user_id,
            referred_user_id,
            reward_type,
            reward_value,
            reward_tier,
            status
        ) VALUES (
            NEW.referred_by,
            NEW.id,
            'pending',
            reward_value,
            reward_tier,
            'pending'
        );
        
        -- Update referrer's referral count
        UPDATE users 
        SET referral_count = COALESCE(referral_count, 0) + 1
        WHERE id = NEW.referred_by;
        
        -- Check if referrer qualifies for free month
        IF (SELECT referral_count FROM users WHERE id = NEW.referred_by) % 3 = 0 THEN
            INSERT INTO referral_credits (
                user_id,
                credit_type,
                credit_value,
                tier,
                status
            ) VALUES (
                NEW.referred_by,
                'free_month',
                reward_value,
                reward_tier,
                'active'
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger for referral rewards
DROP TRIGGER IF EXISTS on_user_created_referral ON users;
CREATE TRIGGER on_user_created_referral
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION calculate_referral_reward();

-- 9. Update handle_new_user function to capture all data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_position integer;
    referrer_id uuid;
BEGIN
    -- Get the next position in waitlist
    SELECT COALESCE(MAX(position), 0) + 1 INTO new_position FROM public.users;
    
    -- Extract data from auth metadata
    NEW.id := COALESCE(NEW.id, auth.uid());
    NEW.email := COALESCE(NEW.email, auth.email());
    NEW.name := COALESCE(NEW.name, NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
    NEW.profession := COALESCE(NEW.profession, NEW.raw_user_meta_data->>'profession');
    NEW.company := COALESCE(NEW.company, NEW.raw_user_meta_data->>'company');
    NEW.position := new_position;
    NEW.joined_at := COALESCE(NEW.joined_at, now());
    NEW.email_verified := COALESCE(NEW.email_verified, false);
    
    -- Generate unique referral code if not provided
    IF NEW.referral_code IS NULL THEN
        NEW.referral_code := UPPER(
            SUBSTR(REPLACE(NEW.name, ' ', ''), 1, 3) || 
            SUBSTR(MD5(NEW.id::text || now()::text), 1, 5)
        );
    END IF;
    
    -- Handle referral
    IF NEW.raw_user_meta_data->>'referralCode' IS NOT NULL THEN
        SELECT id INTO referrer_id 
        FROM public.users 
        WHERE referral_code = UPPER(NEW.raw_user_meta_data->>'referralCode')
        LIMIT 1;
        
        IF referrer_id IS NOT NULL AND referrer_id != NEW.id THEN
            NEW.referred_by := referrer_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create RLS policies
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_analytics ENABLE ROW LEVEL SECURITY;

-- Users can view their own referral rewards
CREATE POLICY "Users can view own referral rewards" ON referral_rewards
    FOR SELECT USING (auth.uid() = user_id);

-- Users can view their own credits
CREATE POLICY "Users can view own credits" ON referral_credits
    FOR SELECT USING (auth.uid() = user_id);

-- Users can view their own OAuth connections
CREATE POLICY "Users can view own OAuth connections" ON oauth_connections
    FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage all data
CREATE POLICY "Service role full access rewards" ON referral_rewards
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access credits" ON referral_credits
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access oauth" ON oauth_connections
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access analytics" ON page_views
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access form_analytics" ON form_analytics
    FOR ALL USING (auth.role() = 'service_role');

-- 11. Grant permissions
GRANT SELECT ON referral_rewards TO authenticated;
GRANT SELECT ON referral_credits TO authenticated;
GRANT SELECT ON oauth_connections TO authenticated;
GRANT INSERT ON page_views TO authenticated;
GRANT INSERT, UPDATE ON form_analytics TO authenticated;

-- 12. Create view for referral statistics
CREATE OR REPLACE VIEW referral_statistics AS
SELECT 
    u.id as user_id,
    u.email,
    u.name,
    u.referral_code,
    u.referral_count,
    COUNT(DISTINCT rr.referred_user_id) as successful_referrals,
    COUNT(DISTINCT rc.id) as total_credits,
    SUM(CASE WHEN rc.status = 'active' THEN 1 ELSE 0 END) as active_credits,
    SUM(CASE WHEN rc.status = 'used' THEN 1 ELSE 0 END) as used_credits
FROM users u
LEFT JOIN referral_rewards rr ON u.id = rr.user_id
LEFT JOIN referral_credits rc ON u.id = rc.user_id
GROUP BY u.id, u.email, u.name, u.referral_code, u.referral_count;

-- Grant access to the view
GRANT SELECT ON referral_statistics TO authenticated;

-- 13. Add audit log support for OAuth
ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS ip_address text,
ADD COLUMN IF NOT EXISTS user_agent text;

-- 14. Ensure all required functions exist
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create update triggers
CREATE TRIGGER update_referral_rewards_updated_at
    BEFORE UPDATE ON referral_rewards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_form_analytics_updated_at
    BEFORE UPDATE ON form_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();