# Testing Checklist for Signup, Database, and Referral Fixes

## 🔧 Pre-Testing Setup

1. **Apply Database Migration**
   - [ ] Run the migration in `supabase/migrations/fix_signup_trigger.sql` in your Supabase SQL editor
   - [ ] Verify the triggers were created successfully

2. **Update Environment Variables**
   - [ ] Ensure `NEXT_PUBLIC_BASE_URL` is set correctly in `.env.local`
   - [ ] Verify all Supabase credentials are correct

3. **Clear Browser Data**
   - [ ] Clear localStorage
   - [ ] Clear cookies
   - [ ] Use incognito/private browsing for testing

## ✅ Signup Flow Testing

### Test 1: Basic Signup (No Referral)
1. [ ] Navigate to `/signup`
2. [ ] Fill in all fields:
   - Email: test1@example.com
   - Password: TestPass123!
   - Name: Test User One
   - Profession: Software Engineer
   - Company: Test Corp
   - Select 2-3 interests
   - Choose a tier (e.g., Pro Navigator)
   - Leave referral code empty
3. [ ] Complete signup
4. [ ] Verify:
   - [ ] Redirected to dashboard
   - [ ] All user data displays correctly
   - [ ] No null values in database (check Supabase dashboard)
   - [ ] Referral code was auto-generated (NAV-XXXXXXXX format)
   - [ ] Position number assigned

### Test 2: Signup with Referral Code
1. [ ] Get a referral code from Test User One's dashboard
2. [ ] Open new incognito window
3. [ ] Navigate to `/signup`
4. [ ] Fill in all fields with different email
5. [ ] Enter the referral code in step 5
6. [ ] Complete signup
7. [ ] Verify:
   - [ ] New user created successfully
   - [ ] Check Test User One's referral count increased by 1
   - [ ] New user's `referred_by` field contains the referral code

### Test 3: Signup via Referral Link
1. [ ] From Test User One's dashboard, copy the referral link
2. [ ] Open new incognito window
3. [ ] Navigate to the referral link (e.g., `/referral/NAV-ABC12345`)
4. [ ] Verify:
   - [ ] Toast notification shows "Referral code applied!"
   - [ ] Redirected to signup page
   - [ ] Referral code is pre-filled in step 5
5. [ ] Complete signup with new email
6. [ ] Verify referral was tracked

## 📧 Email Verification Testing

### Test 4: Email Verification Flow
1. [ ] Check email for verification link
2. [ ] Click the verification link
3. [ ] Verify:
   - [ ] Redirected to `/auth/confirm` page
   - [ ] Success message displayed
   - [ ] Redirected to dashboard after 3 seconds
   - [ ] `email_verified` field is `true` in database

### Test 5: Invalid Verification Link
1. [ ] Try accessing `/auth/confirm` without parameters
2. [ ] Verify error message displayed
3. [ ] Try with invalid token: `/auth/confirm?token=invalid&type=email`
4. [ ] Verify appropriate error handling

## 🔗 Referral System Testing

### Test 6: Referral Link Display
1. [ ] Login to any test user account
2. [ ] Navigate to dashboard
3. [ ] Verify:
   - [ ] Referral link displays as full URL (not just code)
   - [ ] Copy button copies the full link
   - [ ] Tweet button includes the referral link
   - [ ] LinkedIn share includes the referral link

### Test 7: Referral Tracking
1. [ ] Create multiple accounts using same referral code/link
2. [ ] Verify:
   - [ ] Each signup increments referral count
   - [ ] Original user's referral count updates correctly
   - [ ] All referred users have correct `referred_by` value

## 🐛 Edge Cases

### Test 8: Duplicate Email
1. [ ] Try signing up with an existing email
2. [ ] Verify appropriate error message

### Test 9: Invalid Referral Code
1. [ ] Try signing up with invalid referral code (e.g., "INVALID123")
2. [ ] Verify signup still works but no referral is tracked

### Test 10: Network Issues
1. [ ] Disable network during signup
2. [ ] Verify appropriate error handling
3. [ ] Re-enable network and retry

## 📊 Database Verification

After testing, check in Supabase dashboard:

1. [ ] **Users Table**:
   - [ ] All fields populated (no unexpected nulls)
   - [ ] Referral codes are unique
   - [ ] Positions are sequential
   - [ ] Interests stored as array
   - [ ] Tier preferences saved correctly

2. [ ] **Audit Logs**:
   - [ ] Signup events logged
   - [ ] IP addresses captured
   - [ ] User agents recorded

3. [ ] **Email Queue** (if implemented):
   - [ ] Welcome emails queued
   - [ ] Verification emails sent

## 🚀 Performance Testing

1. [ ] Signup completes in < 3 seconds
2. [ ] No console errors during signup
3. [ ] Referral link loads quickly
4. [ ] Dashboard loads with all user data

## 📝 Final Checklist

- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Database data integrity maintained
- [ ] User experience is smooth
- [ ] Error messages are helpful

## 🔄 Rollback Plan

If issues occur:
1. Revert code changes
2. Drop and recreate triggers in database
3. Clear any corrupted user records
4. Document issues for debugging