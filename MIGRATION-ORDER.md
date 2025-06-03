# Database Migration Order for Waitlist Launch

## Current Schema Status:
Your base schema is already in place with the core tables. Here's what to run in order:

### 1. FIRST - Fix the signup trigger (CRITICAL)
Run: `fix_signup_trigger.sql`

**Why**: Your current `handle_new_user()` function only inserts id and email. The updated version captures ALL the metadata (name, profession, interests, referral code) from the signup form.

### 2. SECOND - Add analytics tables (OPTIONAL but recommended)
Run: `analytics_schema.sql`

**Why**: Tracks page views, sessions, and conversion funnel. Useful to see where users drop off in signup.

### 3. THIRD - Add referral rewards system (IMPORTANT)
Run: `add_referral_rewards_system.sql`

**Why**: Adds missing columns like:
- `paying_referral_count`
- `user_type` (pilot/waitlist/regular)
- `service_verified`
- Creates referral tracking tables
- Adds referral credit system

### 4. FOURTH - Complete optimization (IMPORTANT)
Run: `complete_database_optimization.sql`

**Why**: Adds:
- `verification_token_expires` (missing in your schema)
- Email tracking tables
- Performance indexes
- Materialized view for fast dashboard
- Rate limiting table
- Session management

## What Each Migration Fixes:

### Your Current Issues:
1. ❌ `handle_new_user()` loses user data (name, profession, etc.)
2. ❌ No verification token expiration
3. ❌ No email event tracking
4. ❌ Missing performance indexes
5. ❌ No referral credit system

### After Migrations:
1. ✅ Full user data captured on signup
2. ✅ Email verification with 24-hour expiry
3. ✅ Complete referral tracking
4. ✅ 25+ performance indexes
5. ✅ Dashboard loads instantly

## Quick Migration Steps:

1. Go to Supabase Dashboard → SQL Editor
2. Run in this EXACT order:
   - `fix_signup_trigger.sql` (2 seconds)
   - `analytics_schema.sql` (5 seconds)
   - `add_referral_rewards_system.sql` (3 seconds)
   - `complete_database_optimization.sql` (10 seconds)

Total time: ~20 seconds

## Verification Query:
After running all migrations, verify with:

```sql
-- Check new tables exist
SELECT COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public';
-- Should be 20+ tables

-- Check user table has new columns
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('verification_token_expires', 'user_type', 'service_verified');
-- Should show 3 rows

-- Check indexes
SELECT COUNT(*) as index_count 
FROM pg_indexes 
WHERE schemaname = 'public';
-- Should be 40+ indexes
```

## 🚨 MOST IMPORTANT:
The `fix_signup_trigger.sql` is CRITICAL - without it, new users lose their name, profession, and other data!