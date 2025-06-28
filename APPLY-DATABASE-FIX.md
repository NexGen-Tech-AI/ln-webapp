# How to Apply the Database Fix

The signup error is caused by a mismatch in the database trigger. Here's how to fix it:

## Easiest Method: Supabase Dashboard

1. **Open your Supabase project**: https://app.supabase.com
2. Click on **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy ALL the content from `fix-signup-trigger.sql`
5. Paste it into the SQL editor
6. Click **Run** (or press Ctrl/Cmd + Enter)

You should see "Success. No rows returned" - this means the fix was applied.

## Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Install CLI if needed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project (use your project ref from the URL)
supabase link --project-ref wcsqkdooarbolnxppczi

# Apply the fix
supabase db execute -f fix-signup-trigger.sql
```

## Verify the Fix

After applying the fix, test that signup works:

1. Go to your website
2. Try to create a new account
3. Check the browser console - you should NOT see the 500 error
4. Check Supabase Dashboard > Authentication > Users to see if the user was created

## What This Fix Does

1. Updates the `handle_new_user()` function to:
   - Accept both `referralCode` and `referred_by` field names
   - Properly parse JSON arrays for the interests field
   - Look up referral codes and link users correctly
   - Add error handling to prevent signup failures

2. Ensures all required tables exist:
   - `referral_tracking` table
   - `audit_logs` table

3. Adds proper indexes and permissions

## Troubleshooting

If you still get errors after applying the fix:

1. Check Supabase Dashboard > Logs > Postgres Logs for detailed error messages
2. Verify all required columns exist in the `users` table
3. Make sure the `users_position_seq` sequence exists
4. Check that the pgcrypto extension is enabled (for encryption functions)