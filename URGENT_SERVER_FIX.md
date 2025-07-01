# URGENT: Fix Your Production Server NOW

## Issue Found
Your auto-update script failed because it's checking for environment variables that aren't set in the shell. The variables are in `.env.local` but not exported to the shell environment.

## Immediate Fix - Run These Commands on Your Server:

```bash
# 1. SSH into your server
ssh root@srv848177

# 2. Navigate to your app directory
cd /var/www/lifenavigator/ln-webapp

# 3. Check if .env.local exists and has the required variables
cat .env.local | grep -E "SUPABASE_URL|SUPABASE_ANON_KEY"

# 4. Since the new files were already pulled, build and restart manually:
npm install
npm run build
pm2 restart lifenavigator
pm2 save

# 5. Check if it's running
pm2 status
pm2 logs lifenavigator --lines 50
```

## Fix the Auto-Update Script

Edit `/var/www/lifenavigator/auto-update.sh` on your server and add this after the git pull:

```bash
# Add this section after "git pull origin main"

# Check for new migrations
echo "$(date): Checking for new database migrations..."
NEW_MIGRATIONS=$(git diff --name-only $OLD_COMMIT $NEW_COMMIT | grep -E "supabase/migrations/.*\.sql$" || true)
if [ ! -z "$NEW_MIGRATIONS" ]; then
    echo "$(date): ⚠️  NEW DATABASE MIGRATIONS DETECTED:"
    echo "$NEW_MIGRATIONS"
    echo "$(date): Please run these migrations in Supabase dashboard!"
fi
```

## Most Important: Run the Database Migrations!

Go to your Supabase Dashboard > SQL Editor and run:

```sql
-- This is why your data isn't saving!
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS profession TEXT,
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS interests TEXT[],
ADD COLUMN IF NOT EXISTS tier_preference TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS position INTEGER,
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'waitlist',
ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create sequence for position
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'users_position_seq') THEN
        CREATE SEQUENCE users_position_seq START 100;
    END IF;
END $$;

-- Create waitlist count view
CREATE OR REPLACE VIEW public.waitlist_count AS
SELECT COUNT(*) as total_users
FROM public.users
WHERE user_type = 'waitlist';

GRANT SELECT ON public.waitlist_count TO anon;
GRANT SELECT ON public.waitlist_count TO authenticated;
```

## Quick Deployment Checklist

1. ✅ Code is updated (git pull worked)
2. ❌ Database migrations need to be run manually
3. ❓ Check if demo-screenshot.png exists: `ls -la public/demo-screenshot.png`
4. ❓ Verify .env.local has all required variables

## To Check What's Missing in Production Database

After you get the app running, visit:
```
https://yourdomain.com/api/debug/check-schema
```

This will show you exactly which columns are missing!