# 🚨 RUN THIS SQL TO FIX EVERYTHING

## One File, Complete Fix

1. Go to https://app.supabase.com
2. Open **SQL Editor**
3. **New Query**
4. Copy ALL of `/docs/database/COMPLETE-DATABASE-FIX.sql`
5. Paste and **RUN**

## What This Complete Script Does:

✅ Creates users table with proper columns  
✅ Removes NOT NULL constraint from referral_code  
✅ Generates referral codes for all users  
✅ Syncs all auth users to public.users  
✅ Sets up proper RLS policies (fixes 406 error)  
✅ Creates audit_logs table  
✅ Sets up triggers for new signups  
✅ Verifies everything at the end  

## After Running:

You'll see output like:
```
NOTICE: Users in public.users: X
NOTICE: Users in auth.users: X
```

If the numbers match, everything is synced correctly!

## Test It:
1. Try to sign up - should work
2. Try to login - should work
3. Dashboard should show user data

No more multiple files - this ONE script fixes EVERYTHING!