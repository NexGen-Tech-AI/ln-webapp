-- Complete Database Optimization and Missing Features
-- This migration ensures all tables are ready for production with optimal performance

-- 1. Add missing columns for verification tokens
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS verification_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS password_reset_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMPTZ;

-- 2. Add email campaign tracking columns
ALTER TABLE public.email_campaigns
ADD COLUMN IF NOT EXISTS open_tracking_id TEXT UNIQUE DEFAULT gen_random_uuid()::text,
ADD COLUMN IF NOT EXISTS click_tracking_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS reply_to_email TEXT,
ADD COLUMN IF NOT EXISTS from_name TEXT DEFAULT 'LifeNav',
ADD COLUMN IF NOT EXISTS preview_text TEXT;

-- 3. Create email tracking events table
CREATE TABLE IF NOT EXISTS public.email_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_id UUID REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed')),
  event_data JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Add session management for better security
CREATE TABLE IF NOT EXISTS public.user_sessions_auth (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create rate limiting table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  identifier TEXT NOT NULL, -- IP or user_id
  action TEXT NOT NULL, -- login_attempt, api_call, email_send
  count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  blocked_until TIMESTAMPTZ
);

-- 6. Add performance indexes
-- User table indexes
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON public.users(email_verified) WHERE email_verified = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON public.users(verification_token) WHERE verification_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_last_login ON public.users(last_login DESC);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_tier_preference ON public.users(tier_preference);

-- Analytics indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_page_views_date_path ON public.page_views(created_at DESC, page_path);
CREATE INDEX IF NOT EXISTS idx_page_views_referrer_source ON public.page_views(referrer_source) WHERE referrer_source IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_sessions_date ON public.user_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversions_date_type ON public.conversions(created_at DESC, conversion_type);

-- Email tracking indexes
CREATE INDEX IF NOT EXISTS idx_email_events_campaign ON public.email_events(campaign_id, event_type);
CREATE INDEX IF NOT EXISTS idx_email_events_recipient ON public.email_events(recipient_email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_queue_pending ON public.email_queue(created_at) WHERE status = 'pending';

-- Rate limiting indexes
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_action ON public.rate_limits(identifier, action, window_start);

-- 7. Create materialized views for dashboard performance
CREATE MATERIALIZED VIEW IF NOT EXISTS public.dashboard_stats AS
SELECT 
  COUNT(DISTINCT u.id) as total_users,
  COUNT(DISTINCT CASE WHEN u.email_verified THEN u.id END) as verified_users,
  COUNT(DISTINCT CASE WHEN u.user_type = 'pilot' THEN u.id END) as pilot_users,
  COUNT(DISTINCT CASE WHEN u.is_paying THEN u.id END) as paying_users,
  COUNT(DISTINCT pa.id) as pilot_applications,
  COUNT(DISTINCT pr.id) as partnership_requests,
  SUM(u.referral_count) as total_referrals,
  AVG(u.referral_count)::DECIMAL(10,2) as avg_referrals_per_user
FROM public.users u
LEFT JOIN public.pilot_applications pa ON u.id = pa.user_id
LEFT JOIN public.partnership_requests pr ON true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_stats_refresh ON public.dashboard_stats(total_users);

-- 8. Create function to refresh dashboard stats
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.dashboard_stats;
END;
$$ LANGUAGE plpgsql;

-- 9. Optimize existing functions with better error handling
CREATE OR REPLACE FUNCTION generate_verification_token()
RETURNS TEXT AS $$
DECLARE
  token TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a URL-safe random token
    token := encode(gen_random_bytes(32), 'base64');
    token := replace(token, '+', '-');
    token := replace(token, '/', '_');
    token := replace(token, '=', '');
    
    -- Check if token already exists
    SELECT EXISTS(SELECT 1 FROM public.users WHERE verification_token = token) INTO exists;
    
    IF NOT exists THEN
      RETURN token;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 10. Update handle_new_user function to generate verification token
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  metadata jsonb;
  verification_token TEXT;
BEGIN
  -- Get metadata from the auth user
  metadata := NEW.raw_user_meta_data;
  
  -- Generate verification token
  verification_token := generate_verification_token();
  
  -- Insert with all available data
  INSERT INTO public.users (
    id, 
    email,
    name,
    profession,
    company,
    interests,
    tier_preference,
    referred_by,
    verification_token,
    verification_token_expires
  )
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(metadata->>'name', NULL),
    COALESCE(metadata->>'profession', NULL),
    COALESCE(metadata->>'company', NULL),
    CASE 
      WHEN metadata->'interests' IS NOT NULL THEN 
        ARRAY(SELECT jsonb_array_elements_text(metadata->'interests'))
      ELSE 
        '{}'::text[]
    END,
    COALESCE(metadata->>'tierPreference', 'free'),
    COALESCE(metadata->>'referralCode', NULL),
    verification_token,
    NOW() + INTERVAL '24 hours'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    name = EXCLUDED.name,
    profession = EXCLUDED.profession,
    company = EXCLUDED.company,
    interests = EXCLUDED.interests,
    tier_preference = EXCLUDED.tier_preference,
    referred_by = EXCLUDED.referred_by,
    verification_token = COALESCE(public.users.verification_token, EXCLUDED.verification_token),
    verification_token_expires = COALESCE(public.users.verification_token_expires, EXCLUDED.verification_token_expires),
    updated_at = NOW();
    
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth signup
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create cleanup function for expired tokens and sessions
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS void AS $$
BEGIN
  -- Clean expired verification tokens
  UPDATE public.users 
  SET verification_token = NULL, verification_token_expires = NULL
  WHERE verification_token_expires < NOW();
  
  -- Clean expired password reset tokens
  UPDATE public.users 
  SET password_reset_token = NULL, password_reset_expires = NULL
  WHERE password_reset_expires < NOW();
  
  -- Clean expired auth sessions
  DELETE FROM public.user_sessions_auth
  WHERE expires_at < NOW();
  
  -- Clean old rate limit entries
  DELETE FROM public.rate_limits
  WHERE window_start < NOW() - INTERVAL '1 hour';
  
  -- Clean old page views (keep 90 days)
  DELETE FROM public.page_views
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- 12. Create triggers for automatic cleanup
CREATE OR REPLACE FUNCTION trigger_cleanup_on_schedule()
RETURNS trigger AS $$
BEGIN
  -- This is a placeholder for cron-like functionality
  -- In production, use pg_cron or external scheduler
  PERFORM cleanup_expired_data();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 13. Row Level Security for new tables
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Email events policies
CREATE POLICY "Admins can view email events" ON public.email_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage email events" ON public.email_events
  FOR ALL USING (auth.role() = 'service_role');

-- Session policies
CREATE POLICY "Users can view own sessions" ON public.user_sessions_auth
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage sessions" ON public.user_sessions_auth
  FOR ALL USING (auth.role() = 'service_role');

-- 14. Create function for generating slugs (useful for referral codes)
CREATE OR REPLACE FUNCTION generate_unique_slug(base_text TEXT, table_name TEXT, column_name TEXT)
RETURNS TEXT AS $$
DECLARE
  slug TEXT;
  counter INTEGER := 0;
  exists BOOLEAN;
BEGIN
  -- Convert to lowercase and replace spaces with hyphens
  slug := lower(base_text);
  slug := regexp_replace(slug, '[^a-z0-9-]', '-', 'g');
  slug := regexp_replace(slug, '-+', '-', 'g');
  slug := trim(both '-' from slug);
  
  LOOP
    IF counter > 0 THEN
      slug := base_text || '-' || counter;
    END IF;
    
    EXECUTE format('SELECT EXISTS(SELECT 1 FROM %I WHERE %I = $1)', table_name, column_name)
    INTO exists
    USING slug;
    
    IF NOT exists THEN
      RETURN slug;
    END IF;
    
    counter := counter + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 15. Performance monitoring table
CREATE TABLE IF NOT EXISTS public.performance_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  query_type TEXT NOT NULL,
  execution_time_ms INTEGER,
  query_text TEXT,
  parameters JSONB,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_performance_logs_slow ON public.performance_logs(execution_time_ms DESC) 
WHERE execution_time_ms > 1000;

-- 16. Add composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_users_referral_tracking ON public.users(referred_by, created_at) 
WHERE referred_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pilot_apps_user_status ON public.pilot_applications(user_id, status);

CREATE INDEX IF NOT EXISTS idx_payment_methods_user_tier ON public.payment_methods(user_id, selected_tier);

-- 17. Create database statistics update function
CREATE OR REPLACE FUNCTION update_table_statistics()
RETURNS void AS $$
BEGIN
  ANALYZE public.users;
  ANALYZE public.page_views;
  ANALYZE public.user_sessions;
  ANALYZE public.email_campaigns;
  ANALYZE public.pilot_applications;
  ANALYZE public.partnership_requests;
END;
$$ LANGUAGE plpgsql;

-- 18. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Run initial statistics update
SELECT update_table_statistics();

-- Refresh dashboard stats
SELECT refresh_dashboard_stats();