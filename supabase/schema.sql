-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function to generate referral codes (must be created before the table)
CREATE OR REPLACE FUNCTION generate_referral_code() 
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := 'NAV-';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  profession TEXT,
  company TEXT,
  position SERIAL UNIQUE NOT NULL,
  referral_code TEXT UNIQUE NOT NULL DEFAULT generate_referral_code(),
  referred_by TEXT,
  referral_count INTEGER DEFAULT 0,
  interests TEXT[] DEFAULT '{}',
  tier_preference TEXT DEFAULT 'free',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  email_verified BOOLEAN DEFAULT FALSE,
  verification_token TEXT UNIQUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  email_updates BOOLEAN DEFAULT TRUE,
  email_weekly_digest BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pilot applications table
CREATE TABLE public.pilot_applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  why_pilot TEXT NOT NULL CHECK (char_length(why_pilot) >= 500),
  biggest_challenge TEXT NOT NULL,
  hours_per_week INTEGER NOT NULL CHECK (hours_per_week >= 0),
  commit_feedback BOOLEAN NOT NULL,
  feedback_explanation TEXT,
  linkedin_url TEXT,
  twitter_handle TEXT,
  website_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- Partnership requests table
CREATE TABLE public.partnership_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_name TEXT NOT NULL,
  website TEXT NOT NULL,
  industry TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_role TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  company_size TEXT,
  revenue_range TEXT,
  partnership_types TEXT[] NOT NULL,
  proposal TEXT NOT NULL CHECK (char_length(proposal) <= 1000),
  expected_volume TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'in_progress', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment methods table
CREATE TABLE public.payment_methods (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  stripe_payment_method_id TEXT NOT NULL,
  card_last4 VARCHAR(4),
  card_brand VARCHAR(20),
  selected_tier TEXT NOT NULL CHECK (selected_tier IN ('free', 'pro', 'ai', 'family')),
  auto_enroll BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Updates/announcements table
CREATE TABLE public.updates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  domain TEXT,
  type TEXT NOT NULL CHECK (type IN ('feature', 'announcement', 'milestone')),
  published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE public.audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email queue table (for processing emails)
CREATE TABLE public.email_queue (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  html TEXT NOT NULL,
  text TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_referral_code ON public.users(referral_code);
CREATE INDEX idx_users_position ON public.users(position);
CREATE INDEX idx_pilot_applications_status ON public.pilot_applications(status);
CREATE INDEX idx_partnership_requests_status ON public.partnership_requests(status);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_email_queue_status ON public.email_queue(status);
CREATE INDEX idx_email_queue_created_at ON public.email_queue(created_at);

-- Row Level Security (RLS) Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pilot_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.updates ENABLE ROW LEVEL SECURITY;

-- Users can only view and update their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Users can view and manage their own pilot applications
CREATE POLICY "Users can view own pilot application" ON public.pilot_applications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create pilot application" ON public.pilot_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pilot application" ON public.pilot_applications
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- Users can view and manage their own payment methods
CREATE POLICY "Users can view own payment method" ON public.payment_methods
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own payment method" ON public.payment_methods
  FOR ALL USING (auth.uid() = user_id);

-- Everyone can view published updates
CREATE POLICY "Anyone can view published updates" ON public.updates
  FOR SELECT USING (published = true);

-- Audit logs are write-only for users
CREATE POLICY "Users can create audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- Functions and Triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function to increment referral count
CREATE OR REPLACE FUNCTION increment_referral_count(referral_code TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.users 
  SET referral_count = referral_count + 1
  WHERE referral_code = $1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;