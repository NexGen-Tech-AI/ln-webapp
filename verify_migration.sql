-- Verify Migration Success
-- Run this in Supabase SQL editor to check everything is set up correctly

-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check user count and stats
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN email_verified THEN 1 END) as verified_users,
    COUNT(CASE WHEN user_type = 'pilot' THEN 1 END) as pilot_users
FROM public.users;

-- Check materialized view
SELECT * FROM public.dashboard_stats;

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
