-- Test Migration Success - Run these queries in Supabase SQL Editor

-- 1. CHECK ALL TABLES WERE CREATED
SELECT table_name, 
       CASE 
         WHEN table_name IN ('users', 'pilot_applications', 'email_queue') THEN '✅ Core'
         WHEN table_name IN ('page_views', 'user_sessions', 'form_analytics') THEN '📊 Analytics'
         WHEN table_name IN ('referral_tracking', 'referral_credits') THEN '🎁 Referral'
         WHEN table_name IN ('email_events', 'performance_logs') THEN '🚀 Optimization'
         ELSE '📦 Other'
       END as category
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY category, table_name;
-- Should see 20+ tables

-- 2. CHECK CRITICAL COLUMNS WERE ADDED
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN (
  'verification_token_expires',
  'user_type', 
  'is_paying',
  'paying_referral_count',
  'service_verified'
)
ORDER BY column_name;
-- Should see 5 rows

-- 3. CHECK INDEXES FOR PERFORMANCE
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname
LIMIT 20;
-- Should see many performance indexes

-- 4. CHECK THE NEW SIGNUP TRIGGER
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name = 'on_auth_user_created';
-- Should show the improved trigger

-- 5. CHECK MATERIALIZED VIEW
SELECT * FROM public.dashboard_stats;
-- Should show aggregated stats (may be zeros)

-- 6. TEST VERIFICATION TOKEN GENERATION
SELECT generate_verification_token();
-- Should return a random token

-- 7. CHECK RLS POLICIES
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname
LIMIT 10;
-- Should show security policies

-- 8. QUICK PERFORMANCE CHECK
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM users 
WHERE email_verified = true 
LIMIT 10;
-- Should show "Index Scan" not "Seq Scan"