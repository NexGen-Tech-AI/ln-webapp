# Complete Deployment Steps

## Step 1: Apply Database Fix (REQUIRED)

1. Go to https://app.supabase.com
2. Open your project (wcsqkdooarbolnxppczi)
3. Click **SQL Editor** in sidebar
4. Click **New query**
5. Copy ALL contents from `fix-signup-trigger.sql`
6. Paste and click **Run**
7. You should see "Success. No rows returned"

## Step 2: Deploy Frontend Updates

### Option A: Auto-deploy via Git (if using Vercel/Netlify)
```bash
git add .
git commit -m "Fix signup, add Plaid announcement, improve demo preview"
git push origin main
```

### Option B: Manual deploy
```bash
npm run build
vercel --prod
# or
npm run deploy
```

## What Gets Fixed:

### ✅ Signup Error (Database)
- The trigger now handles `referralCode` field correctly
- Proper referral tracking
- Better error handling

### ✅ Frontend Updates
- **Plaid Partnership** announcement in dashboard
- **Demo Preview** with fallback to static image
- **Email Service** ready to send welcome emails

## Verify Everything Works:

1. **Test Signup**:
   - Go to your site
   - Create a new account
   - Should work without 500 error

2. **Check Dashboard**:
   - Login to see Plaid announcement
   - Verify demo preview shows

3. **Check Emails**:
   - New users should receive welcome email
   - Check Resend dashboard for delivery status

## Summary:
- **Database fix**: Handles field name mismatch
- **Frontend**: Already has all the improvements
- **Both must be deployed** for full fix