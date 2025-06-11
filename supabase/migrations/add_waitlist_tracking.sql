-- Add indexes for better performance on referral tracking queries
CREATE INDEX IF NOT EXISTS idx_referral_tracking_subscription_amount 
  ON public.referral_tracking(subscription_amount) 
  WHERE subscription_amount > 0;

CREATE INDEX IF NOT EXISTS idx_referral_tracking_subscription_tier 
  ON public.referral_tracking(subscription_tier);

-- Add a materialized view for quick referral statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS referral_statistics AS
SELECT 
  r.referrer_id,
  COUNT(*) as total_referrals,
  COUNT(CASE WHEN rt.became_paying_at IS NOT NULL THEN 1 END) as paying_referrals,
  COUNT(CASE WHEN rt.became_paying_at IS NULL THEN 1 END) as waitlist_referrals,
  COUNT(CASE WHEN rt.became_paying_at IS NULL AND rt.subscription_amount > 0 THEN 1 END) as potential_paying_users,
  COALESCE(SUM(CASE WHEN rt.became_paying_at IS NULL THEN rt.subscription_amount ELSE 0 END), 0) as potential_revenue,
  COUNT(CASE WHEN rt.subscription_tier = 'free' THEN 1 END) as tier_free,
  COUNT(CASE WHEN rt.subscription_tier = 'pro' THEN 1 END) as tier_pro,
  COUNT(CASE WHEN rt.subscription_tier = 'ai' THEN 1 END) as tier_ai,
  COUNT(CASE WHEN rt.subscription_tier = 'family' THEN 1 END) as tier_family
FROM public.users r
LEFT JOIN public.referral_tracking rt ON r.id = rt.referrer_id
GROUP BY r.referrer_id;

-- Create index on the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_referral_statistics_referrer 
  ON referral_statistics(referrer_id);

-- Create a function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_referral_statistics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY referral_statistics;
END;
$$ LANGUAGE plpgsql;

-- Add a trigger to refresh statistics when referral_tracking changes
CREATE OR REPLACE FUNCTION trigger_refresh_referral_statistics()
RETURNS trigger AS $$
BEGIN
  -- Refresh the materialized view asynchronously
  PERFORM pg_notify('refresh_stats', 'referral_statistics');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for insert, update, and delete
DROP TRIGGER IF EXISTS refresh_stats_on_insert ON public.referral_tracking;
CREATE TRIGGER refresh_stats_on_insert
  AFTER INSERT ON public.referral_tracking
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_referral_statistics();

DROP TRIGGER IF EXISTS refresh_stats_on_update ON public.referral_tracking;
CREATE TRIGGER refresh_stats_on_update
  AFTER UPDATE ON public.referral_tracking
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_referral_statistics();

DROP TRIGGER IF EXISTS refresh_stats_on_delete ON public.referral_tracking;
CREATE TRIGGER refresh_stats_on_delete
  AFTER DELETE ON public.referral_tracking
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_referral_statistics();

-- Add RLS policy for the materialized view
ALTER MATERIALIZED VIEW referral_statistics OWNER TO authenticated;
GRANT SELECT ON referral_statistics TO authenticated;

-- Create a function to get referral statistics with proper RLS
CREATE OR REPLACE FUNCTION get_user_referral_stats(p_user_id UUID)
RETURNS TABLE (
  total_referrals BIGINT,
  paying_referrals BIGINT,
  waitlist_referrals BIGINT,
  potential_paying_users BIGINT,
  potential_revenue NUMERIC,
  tier_free BIGINT,
  tier_pro BIGINT,
  tier_ai BIGINT,
  tier_family BIGINT
) 
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the requesting user is the same as the requested user
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  RETURN QUERY
  SELECT 
    rs.total_referrals,
    rs.paying_referrals,
    rs.waitlist_referrals,
    rs.potential_paying_users,
    rs.potential_revenue,
    rs.tier_free,
    rs.tier_pro,
    rs.tier_ai,
    rs.tier_family
  FROM referral_statistics rs
  WHERE rs.referrer_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Initial population of the materialized view
REFRESH MATERIALIZED VIEW referral_statistics;