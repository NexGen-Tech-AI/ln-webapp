-- Analytics and Admin Dashboard Schema

-- Page views tracking
CREATE TABLE public.page_views (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  page_path TEXT NOT NULL,
  page_title TEXT,
  referrer TEXT,
  referrer_source TEXT, -- google, twitter, linkedin, direct, etc.
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  duration_seconds INTEGER DEFAULT 0,
  bounce BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User sessions tracking
CREATE TABLE public.user_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  visitor_id TEXT NOT NULL, -- Anonymous ID for non-logged-in users
  ip_address INET,
  user_agent TEXT,
  browser TEXT,
  browser_version TEXT,
  os TEXT,
  os_version TEXT,
  device_type TEXT, -- desktop, mobile, tablet
  country TEXT,
  region TEXT,
  city TEXT,
  timezone TEXT,
  language TEXT,
  screen_resolution TEXT,
  viewport_size TEXT,
  entry_page TEXT,
  exit_page TEXT,
  page_count INTEGER DEFAULT 1,
  total_duration_seconds INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  is_returning_visitor BOOLEAN DEFAULT FALSE
);

-- Form analytics (track signup funnel)
CREATE TABLE public.form_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES public.user_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  form_name TEXT NOT NULL, -- 'signup', 'pilot_application', etc.
  step_reached INTEGER DEFAULT 1,
  total_steps INTEGER,
  field_interactions JSONB DEFAULT '{}', -- Which fields they interacted with
  time_per_step JSONB DEFAULT '[]', -- Array of seconds spent on each step
  abandoned BOOLEAN DEFAULT FALSE,
  abandoned_at_step INTEGER,
  abandoned_reason TEXT,
  completed BOOLEAN DEFAULT FALSE,
  total_time_seconds INTEGER,
  validation_errors JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Click tracking for important CTAs
CREATE TABLE public.click_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES public.user_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  element_id TEXT,
  element_text TEXT,
  element_type TEXT, -- button, link, etc.
  page_path TEXT,
  target_url TEXT,
  click_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversion events
CREATE TABLE public.conversions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.user_sessions(id) ON DELETE SET NULL,
  conversion_type TEXT NOT NULL, -- 'signup', 'pilot_apply', 'referral_share', etc.
  conversion_value DECIMAL(10,2),
  attribution_source TEXT,
  time_to_convert_seconds INTEGER, -- Time from first visit to conversion
  visit_count_before_conversion INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User segments for list management
CREATE TABLE public.user_segments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  criteria JSONB NOT NULL, -- Dynamic criteria for segment
  user_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User segment membership
CREATE TABLE public.user_segment_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  segment_id UUID REFERENCES public.user_segments(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, segment_id)
);

-- Email campaigns
CREATE TABLE public.email_campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content_html TEXT NOT NULL,
  content_text TEXT,
  segment_id UUID REFERENCES public.user_segments(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  sent_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin users for dashboard access
CREATE TABLE public.admin_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor', 'admin')),
  permissions JSONB DEFAULT '{}',
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_page_views_session_id ON public.page_views(session_id);
CREATE INDEX idx_page_views_user_id ON public.page_views(user_id);
CREATE INDEX idx_page_views_created_at ON public.page_views(created_at);
CREATE INDEX idx_page_views_page_path ON public.page_views(page_path);

CREATE INDEX idx_user_sessions_visitor_id ON public.user_sessions(visitor_id);
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_started_at ON public.user_sessions(started_at);

CREATE INDEX idx_form_analytics_session_id ON public.form_analytics(session_id);
CREATE INDEX idx_form_analytics_form_name ON public.form_analytics(form_name);
CREATE INDEX idx_form_analytics_abandoned ON public.form_analytics(abandoned);

CREATE INDEX idx_conversions_user_id ON public.conversions(user_id);
CREATE INDEX idx_conversions_type ON public.conversions(conversion_type);
CREATE INDEX idx_conversions_created_at ON public.conversions(created_at);

-- Enable RLS
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.click_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_segment_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Only admins can read analytics data
CREATE POLICY "Admins can read page views" ON public.page_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert page views" ON public.page_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update page views" ON public.page_views
  FOR UPDATE USING (true);

-- Similar policies for other tables
CREATE POLICY "Admins can read sessions" ON public.user_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage sessions" ON public.user_sessions
  FOR ALL USING (true);

CREATE POLICY "Admins can read form analytics" ON public.form_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage form analytics" ON public.form_analytics
  FOR ALL USING (true);

-- Function to update user segment counts
CREATE OR REPLACE FUNCTION update_segment_user_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.user_segments
    SET user_count = user_count + 1
    WHERE id = NEW.segment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.user_segments
    SET user_count = user_count - 1
    WHERE id = OLD.segment_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_segment_count
  AFTER INSERT OR DELETE ON public.user_segment_members
  FOR EACH ROW
  EXECUTE FUNCTION update_segment_user_count();

-- Function to track page view duration
CREATE OR REPLACE FUNCTION update_page_view_duration(
  p_page_view_id UUID,
  p_duration_seconds INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.page_views
  SET duration_seconds = p_duration_seconds
  WHERE id = p_page_view_id;
  
  -- Also update session duration
  UPDATE public.user_sessions
  SET total_duration_seconds = total_duration_seconds + p_duration_seconds
  WHERE id = (
    SELECT session_id FROM public.page_views WHERE id = p_page_view_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;