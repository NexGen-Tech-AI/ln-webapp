-- Add referral rewards tracking to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS paying_referral_count INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'regular' CHECK (user_type IN ('pilot', 'waitlist', 'regular'));
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_paying BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_tier TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_amount DECIMAL(10,2);

-- Service member verification
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS service_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS service_type TEXT CHECK (service_type IN ('military', 'veteran', 'first_responder', 'law_enforcement', 'teacher'));
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS service_verification_date TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS idme_verification_id TEXT;

-- Create referral credits table
CREATE TABLE IF NOT EXISTS public.referral_credits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  credit_amount DECIMAL(10,2) NOT NULL,
  credit_type TEXT NOT NULL CHECK (credit_type IN ('month_free', 'dollar_amount')),
  tier_value DECIMAL(10,2) NOT NULL, -- Average tier value that generated this credit
  referral_batch_count INTEGER NOT NULL, -- Number of referrals that created this credit (5, 10, or 20)
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  used_for_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_expiration CHECK (expires_at > created_at)
);

-- Create detailed referral tracking table
CREATE TABLE IF NOT EXISTS public.referral_tracking (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  referrer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  acknowledged_at TIMESTAMPTZ DEFAULT NOW(),
  became_paying_at TIMESTAMPTZ,
  subscription_tier TEXT,
  subscription_amount DECIMAL(10,2),
  included_in_credit_batch UUID REFERENCES public.referral_credits(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referrer_id, referred_id)
);

-- Create notification preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
  referral_milestones BOOLEAN DEFAULT TRUE,
  credit_expiration BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_referral_credits_user_expires ON public.referral_credits(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_referral_credits_unused ON public.referral_credits(user_id, used_at) WHERE used_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_referral_tracking_referrer ON public.referral_tracking(referrer_id, became_paying_at);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_unpaid ON public.referral_tracking(referrer_id) WHERE became_paying_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_service_verified ON public.users(service_verified) WHERE service_verified = TRUE;

-- Function to update paying referral count
CREATE OR REPLACE FUNCTION update_paying_referral_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the referrer's paying referral count
  UPDATE public.users
  SET paying_referral_count = (
    SELECT COUNT(*)
    FROM public.referral_tracking
    WHERE referrer_id = NEW.referrer_id
    AND became_paying_at IS NOT NULL
  )
  WHERE id = NEW.referrer_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update paying referral count
DROP TRIGGER IF EXISTS update_paying_referral_count_trigger ON public.referral_tracking;
CREATE TRIGGER update_paying_referral_count_trigger
AFTER INSERT OR UPDATE OF became_paying_at ON public.referral_tracking
FOR EACH ROW
WHEN (NEW.became_paying_at IS NOT NULL)
EXECUTE FUNCTION update_paying_referral_count();

-- Function to check and create referral credits
CREATE OR REPLACE FUNCTION check_referral_credit_eligibility(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_user_type TEXT;
  v_paying_count INTEGER;
  v_uncredited_count INTEGER;
  v_required_referrals INTEGER;
  v_eligible_referrals JSON;
  v_average_tier_value DECIMAL(10,2);
BEGIN
  -- Get user type and current paying referral count
  SELECT user_type, paying_referral_count
  INTO v_user_type, v_paying_count
  FROM public.users
  WHERE id = p_user_id;
  
  -- Determine required referrals based on user type
  v_required_referrals := CASE v_user_type
    WHEN 'pilot' THEN 5
    WHEN 'waitlist' THEN 10
    WHEN 'regular' THEN 20
    ELSE 20
  END;
  
  -- Count uncredited paying referrals
  SELECT COUNT(*), AVG(subscription_amount)
  INTO v_uncredited_count, v_average_tier_value
  FROM public.referral_tracking
  WHERE referrer_id = p_user_id
  AND became_paying_at IS NOT NULL
  AND included_in_credit_batch IS NULL;
  
  -- Check if eligible for credit
  IF v_uncredited_count >= v_required_referrals THEN
    -- Get the referrals to be credited
    SELECT json_agg(json_build_object(
      'id', id,
      'referred_id', referred_id,
      'subscription_amount', subscription_amount
    ))
    INTO v_eligible_referrals
    FROM (
      SELECT id, referred_id, subscription_amount
      FROM public.referral_tracking
      WHERE referrer_id = p_user_id
      AND became_paying_at IS NOT NULL
      AND included_in_credit_batch IS NULL
      ORDER BY became_paying_at
      LIMIT v_required_referrals
    ) AS eligible;
    
    RETURN json_build_object(
      'eligible', true,
      'referral_count', v_uncredited_count,
      'required_referrals', v_required_referrals,
      'average_tier_value', v_average_tier_value,
      'eligible_referrals', v_eligible_referrals
    );
  ELSE
    RETURN json_build_object(
      'eligible', false,
      'referral_count', v_uncredited_count,
      'required_referrals', v_required_referrals,
      'remaining_needed', v_required_referrals - v_uncredited_count
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to create referral credit
CREATE OR REPLACE FUNCTION create_referral_credit(
  p_user_id UUID,
  p_referral_ids UUID[]
)
RETURNS UUID AS $$
DECLARE
  v_credit_id UUID;
  v_average_amount DECIMAL(10,2);
  v_referral_count INTEGER;
BEGIN
  -- Calculate average subscription amount
  SELECT AVG(subscription_amount), COUNT(*)
  INTO v_average_amount, v_referral_count
  FROM public.referral_tracking
  WHERE id = ANY(p_referral_ids);
  
  -- Create the credit
  INSERT INTO public.referral_credits (
    user_id,
    credit_amount,
    credit_type,
    tier_value,
    referral_batch_count,
    expires_at
  ) VALUES (
    p_user_id,
    v_average_amount,
    'dollar_amount',
    v_average_amount,
    v_referral_count,
    NOW() + INTERVAL '30 days'
  )
  RETURNING id INTO v_credit_id;
  
  -- Mark referrals as credited
  UPDATE public.referral_tracking
  SET included_in_credit_batch = v_credit_id
  WHERE id = ANY(p_referral_ids);
  
  RETURN v_credit_id;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security Policies
ALTER TABLE public.referral_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only see their own credits
CREATE POLICY "Users can view own credits" ON public.referral_credits
  FOR SELECT USING (auth.uid() = user_id);

-- Users can see their referral tracking
CREATE POLICY "Users can view own referrals" ON public.referral_tracking
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Users can manage their notification preferences
CREATE POLICY "Users can manage own notifications" ON public.notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Service role can do everything
CREATE POLICY "Service role full access credits" ON public.referral_credits
  FOR ALL USING (auth.role() = 'service_role');
  
CREATE POLICY "Service role full access tracking" ON public.referral_tracking
  FOR ALL USING (auth.role() = 'service_role');
  
CREATE POLICY "Service role full access notifications" ON public.notification_preferences
  FOR ALL USING (auth.role() = 'service_role');