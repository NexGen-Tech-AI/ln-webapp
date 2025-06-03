# Database Migration Instructions

Since the automated script requires Supabase CLI, please follow these manual steps to apply the database optimizations:

## Step 1: Open Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `wcsqkdooarbolnxppczi`
3. Navigate to the **SQL Editor** (in the left sidebar)

## Step 2: Run Migrations in Order

Copy and paste each SQL file content into the SQL editor and click "Run":

### 1. First, run the base schema (if not already set up)
File: `supabase/schema.sql`

### 2. Then run each migration in this order:

#### a) Fix Signup Trigger
File: `supabase/migrations/fix_signup_trigger.sql`

#### b) Analytics Schema
File: `supabase/migrations/analytics_schema.sql`

#### c) Referral Rewards System
File: `supabase/migrations/add_referral_rewards_system.sql`

#### d) Complete Database Optimization
File: `supabase/migrations/complete_database_optimization.sql`

## Step 3: Verify Migration Success

After running all migrations, run this verification query:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check user count and stats
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN email_verified THEN 1 END) as verified_users,
    COUNT(CASE WHEN user_type = 'pilot' THEN 1 END) as pilot_users
FROM public.users;

-- Check materialized view
SELECT * FROM public.dashboard_stats;

-- Check indexes
SELECT 
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

## Step 4: Set Up Scheduled Jobs (Optional but Recommended)

In Supabase Dashboard, go to **Database > Extensions** and enable `pg_cron` if available. Then create these scheduled jobs:

```sql
-- Daily cleanup job (runs at 2 AM)
SELECT cron.schedule(
    'cleanup-expired-data',
    '0 2 * * *',
    $$SELECT cleanup_expired_data();$$
);

-- Refresh dashboard stats every 6 hours
SELECT cron.schedule(
    'refresh-dashboard-stats',
    '0 */6 * * *',
    $$SELECT refresh_dashboard_stats();$$
);

-- Update table statistics weekly
SELECT cron.schedule(
    'update-table-stats',
    '0 3 * * 0',
    $$SELECT update_table_statistics();$$
);
```

## Expected Results

After running all migrations, you should have:
- ✅ All tables with proper indexes
- ✅ Email tracking capabilities
- ✅ Performance monitoring
- ✅ Materialized view for fast dashboard
- ✅ Session management
- ✅ Rate limiting protection

## Troubleshooting

If any migration fails:
1. Check for error messages in the SQL editor
2. Some tables might already exist (that's OK)
3. Run them one at a time to identify issues
4. Check the Supabase logs for details

## Next Steps

1. Test your application: `npm run dev`
2. Monitor the `performance_logs` table for slow queries
3. Check the dashboard stats are working
4. Set up regular backups in Supabase settings