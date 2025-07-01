# Waitlist System Fix Instructions

## Current Issues Found

1. **Missing `waitlist_count` view** - The API endpoint tries to use this view but it doesn't exist in the database
2. **Database migrations need to be applied** - The new migration for the view needs to be run
3. **Data verification needed** - Need to ensure data is being captured properly

## Steps to Fix

### 1. Apply the Database Migration

Run the new migration I created to add the missing view:

```bash
# Option 1: Using Supabase CLI (if installed)
supabase db push

# Option 2: Run directly in Supabase SQL Editor
# Go to your Supabase dashboard > SQL Editor
# Copy and paste the contents of: supabase/migrations/20250201_add_waitlist_count_view.sql
# Click "Run"
```

### 2. Verify the Waitlist is Working

Run the test script to verify everything is working:

```bash
node test-waitlist.js
```

This will check:
- If the waitlist_count view exists and works
- If users are being created with correct data
- If the position sequence is working

### 3. Test the Full Flow

1. **Test Signup:**
   - Go to http://localhost:3000/signup
   - Fill out the multi-step form
   - Verify you see the success message

2. **Check Dashboard:**
   - After signup, you should be redirected to /dashboard
   - Verify you see:
     - Your waitlist position
     - Total number of waitlisted users
     - Your referral code
     - The demo preview (already working!)
     - Product updates

3. **Check Database:**
   - Go to Supabase dashboard > Table Editor > users table
   - Verify new user has:
     - Correct position number
     - user_type = 'waitlist'
     - All form data (name, profession, company, interests, tier_preference)
     - A unique referral_code

## What's Already Working

✅ **Demo Preview** - The demo app thumbnail with link is already implemented and showing on the dashboard
✅ **Signup Flow** - The multi-step form correctly sends data to the API
✅ **API Endpoint** - The `/api/auth/signup-simple` endpoint creates users and handles referrals
✅ **Dashboard Display** - The dashboard shows all waitlist data when it exists

## Common Issues & Solutions

### Issue: "relation waitlist_count does not exist"
**Solution:** Apply the migration from step 1

### Issue: Dashboard shows "No user data found"
**Solution:** Make sure you're logged in. Check browser console for auth errors.

### Issue: Position shows as #1 for everyone
**Solution:** Check if the sequence exists:
```sql
SELECT nextval('users_position_seq');
```

### Issue: Referral code not working
**Solution:** The referral code should be saved in localStorage and picked up by the signup form automatically

## Architecture Overview

The waitlist system flow:
1. User lands on site → Sees waitlist counter (from `/api/waitlist-count`)
2. User clicks signup → Multi-step form collects data
3. Form submits to `/api/auth/signup-simple` → Creates auth user + profile
4. User redirected to dashboard → Shows position, referral info, and demo
5. Landing page updates → Shows new total count

## Next Steps

After fixing the view issue, the waitlist should be fully functional. The dashboard already has the demo preview working and will show all the waitlist data properly once the database view is created.