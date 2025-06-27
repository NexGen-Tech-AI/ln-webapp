# Deployment Guide - Referral System & Enhanced Security

## Overview
This guide covers deploying the referral system, enhanced security features, and database updates to production.

## Pre-Deployment Checklist

### 1. Environment Variables
Ensure these are set in your production environment:
```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=your-database-url
```

### 2. Supabase Configuration
Update `supabase/config.toml` for production:
```toml
[auth]
site_url = "https://your-production-domain.com"

[auth.email.template.confirmation]
redirect_to = "https://your-production-domain.com/auth/confirm"
```

## Deployment Steps

### Step 1: Deploy Database Migrations

1. **Connect to Supabase Dashboard**
   ```bash
   npx supabase login
   npx supabase link --project-ref your-project-ref
   ```

2. **Push existing migrations**
   ```bash
   npx supabase db push
   ```

3. **Deploy the enhanced security migration**
   ```bash
   npx supabase migration up
   ```

### Step 2: Deploy Database Functions

Run these SQL commands in Supabase SQL Editor:

1. **Create encryption functions and RLS policies**
   - Go to Supabase Dashboard > SQL Editor
   - Copy and run the entire content of `/supabase/migrations/20250127_enhanced_security_rls.sql`

2. **Verify functions exist**
   ```sql
   -- Check if functions were created
   SELECT proname FROM pg_proc 
   WHERE proname IN ('generate_secure_referral_link', 'get_referral_stats', 'encrypt_sensitive', 'decrypt_sensitive');
   ```

### Step 3: Enable Required Extensions

In Supabase SQL Editor:
```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pgjwt;
```

### Step 4: Update RLS Policies

1. **Verify RLS is enabled on all tables**
   ```sql
   -- Check RLS status
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('users', 'referral_tracking', 'referral_rewards', 'referral_credits');
   ```

2. **Enable RLS if needed**
   ```sql
   ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.referral_tracking ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.referral_credits ENABLE ROW LEVEL SECURITY;
   ```

### Step 5: Encrypt Existing Data

**IMPORTANT**: Run this AFTER backing up your database!

```sql
-- Backup first!
-- Then encrypt existing user data
UPDATE public.users
SET 
    email_encrypted = encrypt_sensitive(email),
    profession_encrypted = encrypt_sensitive(profession),
    company_encrypted = encrypt_sensitive(company)
WHERE email_encrypted IS NULL;
```

### Step 6: Update Application Code

1. **Deploy Next.js application**
   ```bash
   npm run build
   npm run deploy  # or your deployment command
   ```

2. **Update environment variables in production**
   - Add any new environment variables
   - Ensure Supabase keys are correct

### Step 7: Post-Deployment Verification

1. **Test user signup with referral code**
   ```bash
   # Use the test script
   node test-referral-flow.js
   ```

2. **Verify referral tracking**
   ```sql
   -- Check recent referrals
   SELECT * FROM referral_tracking 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

3. **Test referral link generation**
   ```sql
   -- Test with a real user ID
   SELECT generate_secure_referral_link('user-uuid-here');
   ```

4. **Verify encryption is working**
   ```sql
   -- Check encrypted fields exist
   SELECT COUNT(*) FROM users WHERE email_encrypted IS NOT NULL;
   ```

## Rollback Plan

If issues occur, here's how to rollback:

1. **Database rollback**
   ```sql
   -- Remove encrypted columns (if needed)
   ALTER TABLE public.users 
   DROP COLUMN IF EXISTS email_encrypted,
   DROP COLUMN IF EXISTS profession_encrypted,
   DROP COLUMN IF EXISTS company_encrypted;
   
   -- Drop functions
   DROP FUNCTION IF EXISTS generate_secure_referral_link;
   DROP FUNCTION IF EXISTS get_referral_stats;
   DROP FUNCTION IF EXISTS encrypt_sensitive;
   DROP FUNCTION IF EXISTS decrypt_sensitive;
   ```

2. **Application rollback**
   - Deploy previous version of the application
   - Restore previous environment variables

## Monitoring

### Key Metrics to Track

1. **Referral Creation Rate**
   ```sql
   SELECT DATE(created_at), COUNT(*) 
   FROM referral_tracking 
   GROUP BY DATE(created_at) 
   ORDER BY DATE(created_at) DESC;
   ```

2. **Conversion Rate**
   ```sql
   SELECT 
     COUNT(*) FILTER (WHERE is_successful = true) * 100.0 / COUNT(*) as conversion_rate
   FROM referral_tracking;
   ```

3. **Security Audit Log**
   ```sql
   SELECT * FROM security_audit_log 
   WHERE created_at > NOW() - INTERVAL '24 hours'
   ORDER BY created_at DESC;
   ```

## Production Considerations

### Performance
- The encryption/decryption functions use pgcrypto which is optimized
- Indexes are created on encrypted columns for performance
- Consider caching referral stats if high traffic

### Security
- Encryption keys are stored in the database (consider external KMS for production)
- All sensitive operations are logged
- RLS policies require email verification

### Scaling
- Monitor database performance
- Consider read replicas for referral stats
- Implement rate limiting on referral generation

## Troubleshooting

### Common Issues

1. **"Function does not exist" error**
   - Ensure migration ran successfully
   - Check function ownership and permissions

2. **RLS policy blocking access**
   - Verify user email is verified
   - Check auth.uid() matches user ID

3. **Encryption errors**
   - Verify pgcrypto extension is enabled
   - Check encryption key exists in security_config

### Debug Commands

```sql
-- Check user's referral data
SELECT id, referral_code, referral_count, referred_by 
FROM users 
WHERE email = 'user@example.com';

-- View referral chain
WITH RECURSIVE referral_chain AS (
  SELECT id, email, referred_by, 0 as level
  FROM users
  WHERE id = 'starting-user-id'
  
  UNION ALL
  
  SELECT u.id, u.email, u.referred_by, rc.level + 1
  FROM users u
  JOIN referral_chain rc ON u.referred_by = rc.id
)
SELECT * FROM referral_chain;
```

## Support

For issues:
1. Check Supabase logs
2. Review security_audit_log table
3. Contact support with error messages and timestamps