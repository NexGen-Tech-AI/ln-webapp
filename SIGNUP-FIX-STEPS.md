# Steps to Fix Signup Issues

## The Problem
The signup is failing because:
1. Complex database triggers are throwing errors
2. The trigger is looking for columns that might not exist
3. Permissions might be misconfigured

## The Solution

### 1. Run the Simple Fix SQL (WORKING-SIGNUP-FIX.sql)
This SQL file:
- Creates all necessary tables with proper columns
- Removes complex triggers that can fail
- Sets up proper permissions
- Creates only a simple email verification trigger

### 2. How Signup Works
The signup route (`/api/auth/signup-simple`) already handles everything:
- Creates the auth user with Supabase
- Creates the user profile directly (doesn't rely on triggers)
- Handles referral tracking
- Sends welcome email

### 3. Why This Approach Works
- No complex triggers that can fail during signup
- All data is saved by the API route itself
- Email verification is tracked with a simple trigger
- If any step fails, the signup still completes

### 4. To Test
```bash
# Run the test script
node test-signup.js

# Or test manually with curl
curl -X POST http://localhost:3000/api/auth/signup-simple \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "name": "Test User",
    "profession": "Developer",
    "company": "Test Co",
    "interests": ["financial planning & wealth building"],
    "tierPreference": "pro"
  }'
```

### 5. Email Issues
Make sure in your `.env.local`:
```
RESEND_API_KEY=your_resend_api_key
NEXT_PUBLIC_APP_URL=https://lifenavigator.tech
```

And that these email addresses are verified in Resend:
- noreply@lifenavigator.tech
- updates@lifenavigator.tech
- support@lifenavigator.tech

### 6. If Signup Still Fails
Check the Supabase logs:
1. Go to Supabase Dashboard
2. Click on "Logs" 
3. Look for errors in "Auth logs" and "Database logs"

The error will tell you exactly what's wrong.

## Key Point
The signup route creates the user profile directly in the `users` table, so we don't need complex triggers. The simple SQL file just ensures all tables exist with proper structure and permissions.