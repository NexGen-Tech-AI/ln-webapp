# Immediate Fixes for Production

## 1. Run Missing Database Migrations NOW

SSH into your server and run:

```bash
cd /var/www/lifenavigator/ln-webapp

# Check which migrations exist
ls -la supabase/migrations/

# Note which ones are new since your last deployment
```

Then go to Supabase Dashboard > SQL Editor and run AT MINIMUM:

```sql
-- CRITICAL: Add missing columns
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS profession TEXT,
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS interests TEXT[],
ADD COLUMN IF NOT EXISTS tier_preference TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS position INTEGER,
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'waitlist';

-- Create position sequence
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

## 2. Verify Static Assets

SSH into your server and check:

```bash
# Check if demo screenshot exists
ls -la /var/www/lifenavigator/ln-webapp/public/demo-screenshot.png

# If missing, you need to ensure it's in your git repository:
# On your local machine:
git add public/demo-screenshot.png
git commit -m "Add demo screenshot"
git push origin main
```

## 3. Check Environment Variables

On your server:

```bash
# Check if all required env vars are set
cd /var/www/lifenavigator/ln-webapp
cat .env.local | grep -E "SUPABASE_URL|SUPABASE_ANON_KEY|SERVICE_ROLE"

# Should see:
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# SUPABASE_SERVICE_ROLE_KEY=...
```

## 4. Manual Quick Fix

If auto-update isn't working properly:

```bash
cd /var/www/lifenavigator/ln-webapp

# Pull latest
git pull origin main

# Install deps
npm install

# Build
npm run build

# Restart
pm2 restart lifenavigator
pm2 save

# Check logs
pm2 logs lifenavigator --lines 50
```

## 5. Set Up Proper CI/CD

Consider using GitHub Actions for deployment:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.KEY }}
          script: |
            cd /var/www/lifenavigator/ln-webapp
            git pull origin main
            npm install
            npm run build
            pm2 restart lifenavigator
            pm2 save
      
      - name: Check deployment
        run: |
          sleep 10
          curl -f https://yourdomain.com || exit 1
```

## 6. Add Database Migration Automation

Install Supabase CLI on your server:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Then in your deployment script:
supabase db push
```

## The Root Cause

Your deployment script only handles code updates but doesn't:
1. Run database migrations
2. Verify environment variables
3. Check static assets
4. Run health checks

This is why your production is missing data fields and the demo image!