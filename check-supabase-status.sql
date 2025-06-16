-- Supabase Status Check Queries
-- Run these in your Supabase SQL Editor to verify everything is set up correctly

-- 1. Check if all required tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('users', 'referral_rewards', 'referral_credits', 'oauth_connections', 'page_views', 'form_analytics', 'audit_logs')
        THEN '✅ Exists'
        ELSE '❌ Missing'
    END as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('users', 'referral_rewards', 'referral_credits', 'oauth_connections', 'page_views', 'form_analytics', 'audit_logs')
ORDER BY table_name;

-- 2. Check users table columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- 4. Check indexes for performance
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('users', 'referral_rewards', 'oauth_connections')
ORDER BY tablename, indexname;

-- 5. Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 6. Test user count and sample data
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN referred_by IS NOT NULL THEN 1 END) as referred_users,
    COUNT(CASE WHEN auth_provider != 'email' THEN 1 END) as oauth_users
FROM users;

-- 7. Check for any recent errors in auth.audit_log_entries
SELECT 
    created_at,
    ip_address,
    payload->>'event_message' as event_message,
    payload->>'error_message' as error_message
FROM auth.audit_log_entries
WHERE created_at > NOW() - INTERVAL '24 hours'
AND payload->>'error_message' IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- 8. Verify referral system setup
SELECT 
    'Referral Codes' as check_type,
    COUNT(DISTINCT referral_code) as unique_codes,
    COUNT(*) as total_users,
    CASE 
        WHEN COUNT(DISTINCT referral_code) = COUNT(*) THEN '✅ All unique'
        ELSE '⚠️ Duplicates found'
    END as status
FROM users;

-- 9. Check OAuth provider configuration
SELECT 
    provider,
    CASE 
        WHEN is_enabled THEN '✅ Enabled'
        ELSE '❌ Disabled'
    END as status
FROM auth.flow_config
WHERE provider IN ('google', 'azure', 'linkedin_oidc', 'twitter', 'facebook');

-- 10. Summary dashboard
SELECT 
    'System Health Check' as metric,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('users', 'referral_rewards', 'referral_credits')) = 3
        THEN '✅ All core tables present'
        ELSE '❌ Missing core tables'
    END as status
UNION ALL
SELECT 
    'User Authentication',
    CASE 
        WHEN (SELECT COUNT(*) FROM users) > 0 THEN '✅ Users exist'
        ELSE '⚠️ No users yet'
    END
UNION ALL
SELECT 
    'Referral System',
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_user_created_referral')
        THEN '✅ Trigger configured'
        ELSE '❌ Trigger missing'
    END
UNION ALL
SELECT 
    'OAuth Setup',
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'oauth_connections')
        THEN '✅ Table ready'
        ELSE '❌ Table missing'
    END;