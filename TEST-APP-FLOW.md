# Testing Your Waitlist App - Step by Step

## 1. Database Verification (2 min)
Run the queries in `TEST-MIGRATIONS.sql` in Supabase SQL Editor to verify:
- ✅ All tables created
- ✅ New columns added
- ✅ Indexes in place
- ✅ Triggers working

## 2. Test Signup Flow (5 min)

### Start your app:
```bash
npm run dev
```

### Test these scenarios:

#### A. Basic Signup Test
1. Go to http://localhost:3000
2. Click "Join Waitlist"
3. Fill form with test data:
   - Email: test1@example.com
   - Name: Test User
   - Password: testpass123
4. Submit and check:
   - ✅ Redirects to dashboard
   - ✅ Shows position number
   - ✅ Shows referral code

#### B. Verify Data Saved Correctly
In Supabase SQL Editor:
```sql
-- Check user was created with ALL data
SELECT id, email, name, profession, company, 
       referral_code, position, verification_token,
       created_at
FROM users 
WHERE email = 'test1@example.com';
-- Should show ALL fields populated
```

#### C. Test Referral System
1. Copy the referral code from dashboard
2. Open incognito/private browser
3. Go to: http://localhost:3000/signup?ref=YOUR_REFERRAL_CODE
4. Sign up as second user
5. Check in database:
```sql
-- Check referral was tracked
SELECT * FROM referral_tracking 
WHERE referrer_id = (SELECT id FROM users WHERE email = 'test1@example.com');

-- Check referral count increased
SELECT email, referral_count 
FROM users 
WHERE email = 'test1@example.com';
-- Should show referral_count = 1
```

## 3. Test Email System (2 min)

Check if welcome email was queued:
```sql
SELECT * FROM email_queue 
ORDER BY created_at DESC 
LIMIT 5;
```

Check Resend dashboard: https://resend.com/emails
- Should see welcome emails sent

## 4. Test Analytics Tracking (2 min)

Browse around the site, then check:
```sql
-- Page views being tracked
SELECT COUNT(*) as page_views FROM page_views;

-- Sessions being tracked  
SELECT COUNT(*) as sessions FROM user_sessions;

-- Form analytics
SELECT * FROM form_analytics WHERE form_name = 'signup';
```

## 5. Test Dashboard Performance (1 min)

```sql
-- Should be instant with materialized view
SELECT * FROM dashboard_stats;

-- Refresh stats
SELECT refresh_dashboard_stats();
```

## 6. Quick Security Check

Try to access someone else's data:
```sql
-- This should return empty (RLS working)
-- when not logged in as admin
SELECT * FROM users WHERE email != 'your-email@example.com';
```

## ✅ Success Checklist:
- [ ] Users can sign up
- [ ] All user data is saved (not just email)
- [ ] Welcome emails are sent
- [ ] Referral tracking works
- [ ] Dashboard shows correct position
- [ ] Analytics are being tracked
- [ ] Performance is fast
- [ ] Security policies work

## 🚀 If All Tests Pass:
Your waitlist is ready to deploy! The migrations successfully:
1. Fixed data loss on signup
2. Added email tracking
3. Implemented referral rewards system
4. Optimized performance with indexes
5. Added security policies

## 🔧 Common Issues:

**Email not sending?**
- Check Resend API key in .env.local
- Check email_queue table for errors

**Referral not tracking?**
- Make sure you use the full URL with ?ref=CODE
- Check referral_tracking table

**Slow queries?**
- Run `SELECT refresh_dashboard_stats();`
- Check that indexes are being used