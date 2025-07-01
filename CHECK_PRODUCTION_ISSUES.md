# Production Issues Checklist

## 1. Demo Preview Not Showing in Production

The demo preview might not be showing because:

### Check 1: Static File Serving
```bash
# Verify the demo-screenshot.png is in the production build
ls -la .next/static/media/
```

### Check 2: Image Path
The demo uses `/demo-screenshot.png` which should be in the `public` folder. Make sure:
- The file exists in `public/demo-screenshot.png`
- It's included in your production deployment
- The image path is accessible (test: `https://yourdomain.com/demo-screenshot.png`)

### Check 3: Console Errors
Open browser DevTools on production and check for:
- 404 errors for the image
- CORS errors if using iframe fallback
- Any JavaScript errors

## 2. Database Not Capturing All Data

This is likely due to missing columns in your production database.

### Step 1: Run the Debug Endpoint
Visit: `https://yourdomain.com/api/debug/check-schema`

This will show you:
- What columns exist in your production database
- Which required columns are missing
- Sample data to see what's actually being stored

### Step 2: Check Missing Migrations
Your production database might be missing these migrations:

```bash
# List all migration files
ls -la supabase/migrations/

# Key migrations that add user data columns:
- 20250127_secure_waitlist_final.sql
- 20250127_add_all_missing_columns.sql
- 20250201_add_waitlist_count_view.sql
```

### Step 3: Apply Missing Migrations
In your Supabase dashboard SQL editor, run any missing migrations. The most important columns are:

```sql
-- Check if these columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('name', 'profession', 'company', 'interests', 'tier_preference');

-- If any are missing, add them:
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS profession TEXT,
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS interests TEXT[],
ADD COLUMN IF NOT EXISTS tier_preference TEXT DEFAULT 'free';
```

## 3. Quick Fix Script

Run this in your Supabase SQL editor to ensure all columns exist:

```sql
-- Add all potentially missing columns
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS profession TEXT,
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS interests TEXT[],
ADD COLUMN IF NOT EXISTS tier_preference TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS position INTEGER,
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'waitlist',
ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'email',
ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create the position sequence if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'users_position_seq') THEN
        CREATE SEQUENCE users_position_seq START 100;
    END IF;
END $$;

-- Create the waitlist_count view
CREATE OR REPLACE VIEW public.waitlist_count AS
SELECT COUNT(*) as total_users
FROM public.users
WHERE user_type = 'waitlist';

-- Grant permissions
GRANT SELECT ON public.waitlist_count TO anon;
GRANT SELECT ON public.waitlist_count TO authenticated;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_user_type ON public.users(user_type);
```

## 4. Verify Everything is Working

After applying the fixes:

1. **Test Signup**: Create a new account with all fields filled
2. **Check Database**: Verify all data is captured in Supabase Table Editor
3. **Check Dashboard**: Ensure demo preview shows and user data displays
4. **Check API**: Visit `/api/debug/check-schema` to confirm all columns exist

## 5. Production Deployment Checklist

For future deployments, ensure:
- [ ] All migration files are applied to production database
- [ ] Static assets (images) are included in build
- [ ] Environment variables match between local and production
- [ ] Database schema matches between environments
- [ ] Run `npm run build` locally to test production build