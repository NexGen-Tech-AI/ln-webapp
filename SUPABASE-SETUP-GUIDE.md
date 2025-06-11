# Supabase Setup Guide for LifeNavigator

## Prerequisites
- Supabase project created at https://supabase.com
- Project URL and API keys from Supabase dashboard

## Step 1: Environment Variables
Add these to your `.env.local` (development) and production environment:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_BASE_URL=https://your-domain.com

# Email service (SendGrid)
SENDGRID_API_KEY=your-sendgrid-key
SENDGRID_FROM_EMAIL=noreply@your-domain.com
SENDGRID_FROM_NAME=LifeNavigator

# Admin configuration
ADMIN_USER_IDS=comma,separated,user,ids
ADMIN_IP_WHITELIST=optional,ip,addresses
```

## Step 2: Database Setup

### Run Migrations in Order
Execute these SQL files in your Supabase SQL editor in this exact order:

1. **Enable Extensions**
```sql
-- Run this first
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

2. **Initial Schema** (`schema.sql`)
   - Creates all base tables
   - Sets up RLS policies
   - Creates initial functions and triggers

3. **Analytics Schema** (`analytics_schema.sql`)
   - Creates analytics tables
   - Sets up tracking infrastructure

4. **Referral Rewards System** (`add_referral_rewards_system.sql`)
   - Adds referral tracking tables
   - Creates credit system
   - Sets up reward calculations

5. **Fix Signup Trigger** (`fix_signup_trigger.sql`)
   - Ensures user metadata is properly captured
   - Fixes referral code tracking

6. **Database Optimization** (`complete_database_optimization.sql`)
   - Adds performance indexes
   - Optimizes queries

7. **Waitlist Tracking** (`add_waitlist_tracking.sql`)
   - Adds materialized views for statistics
   - Creates tracking indexes

## Step 3: Authentication Setup

### Enable Email Authentication
1. Go to Authentication > Providers in Supabase dashboard
2. Enable Email provider
3. Configure email templates (optional)

### Set Authentication Settings
1. Go to Authentication > Settings
2. Set site URL to your production domain
3. Add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://your-domain.com/auth/callback`

## Step 4: Storage Setup (if needed)

### Create Buckets
```sql
-- Run in SQL editor if you need file storage
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('documents', 'documents', false);
```

### Set Storage Policies
```sql
-- Allow users to upload their own avatars
CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to view avatars
CREATE POLICY "Avatars are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');
```

## Step 5: Realtime Setup (Optional)

### Enable Realtime for Tables
```sql
-- Enable realtime for specific tables if needed
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE referral_tracking;
```

## Step 6: Edge Functions (Optional)

### Deploy Edge Functions
If you have edge functions, deploy them:
```bash
supabase functions deploy function-name
```

## Step 7: Security Configuration

### Row Level Security (RLS)
Verify RLS is enabled on all tables:
```sql
-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### API Security
1. Go to Settings > API
2. Ensure RLS is enforced
3. Set appropriate rate limits

## Step 8: Testing

### Test User Creation
```sql
-- Check if trigger works
SELECT * FROM auth.users LIMIT 1;
SELECT * FROM public.users LIMIT 1;
```

### Test Referral System
```sql
-- Check referral tracking
SELECT * FROM public.referral_tracking;
SELECT * FROM public.referral_statistics;
```

## Step 9: Monitoring

### Set Up Alerts
1. Go to Reports > Alerts
2. Create alerts for:
   - Failed authentication attempts
   - Database errors
   - High API usage

### Enable Logging
1. Go to Logs > Settings
2. Enable query logs for debugging

## Common Issues and Solutions

### Issue: User data not saving
**Solution**: Ensure the signup trigger is properly created:
```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

### Issue: Referral codes not working
**Solution**: Verify the increment function exists:
```sql
-- Check function
SELECT proname FROM pg_proc WHERE proname = 'increment_referral_count';
```

### Issue: Email not sending
**Solution**: 
1. Check SendGrid API key is correct
2. Verify sender email is authenticated in SendGrid
3. Check email queue table for errors

## Production Checklist

- [ ] All migrations applied successfully
- [ ] Environment variables set in production
- [ ] Email authentication enabled
- [ ] RLS policies active on all tables
- [ ] API rate limits configured
- [ ] Monitoring alerts set up
- [ ] Backup schedule configured
- [ ] SSL certificate active

## Maintenance

### Regular Tasks
1. **Weekly**: Check referral statistics materialized view
   ```sql
   REFRESH MATERIALIZED VIEW CONCURRENTLY referral_statistics;
   ```

2. **Monthly**: Clean up old audit logs
   ```sql
   DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days';
   ```

3. **As Needed**: Update user statistics
   ```sql
   SELECT update_paying_referral_count();
   ```

## Support

For Supabase-specific issues:
- Documentation: https://supabase.com/docs
- Discord: https://discord.supabase.com
- Support: support@supabase.com