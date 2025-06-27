# LifeNavigator Referral System Guide

## Overview
The LifeNavigator referral system is a comprehensive solution for user acquisition and retention through referral rewards. It includes automatic tracking, credit generation, and military-grade security.

## Features

### 1. Automatic Referral Code Generation
- Every user receives a unique 8-character referral code upon signup
- Codes are generated using cryptographically secure random functions
- Format: Alphanumeric (e.g., `ABC12XYZ`)

### 2. Referral Tracking
- Tracks both referrer and referred users
- Records conversion status (pending vs successful)
- Tracks payment events for reward qualification
- Complete audit trail of all referral activities

### 3. Reward System
Different reward tiers based on user type:
- **Pilot Users**: Reward after 5 successful referrals
- **Waitlist Users**: Reward after 10 successful referrals  
- **Regular Users**: Reward after 20 successful referrals

### 4. Credit Management
- Automatic credit generation when thresholds are met
- Credits expire 30 days after generation
- Credits can be used for premium features or discounts
- Real-time credit balance tracking

## Database Schema

### Core Tables

#### `users` Table
- `referral_code`: Unique code for sharing
- `referred_by`: UUID reference to referrer
- `referral_count`: Total successful referrals
- `email_encrypted`: Military-grade encrypted email
- `profession_encrypted`: Encrypted profession data
- `company_encrypted`: Encrypted company data

#### `referral_tracking` Table
- Tracks referrer-referred relationships
- Records conversion timestamps
- Monitors payment status
- Maintains referral chain integrity

#### `referral_rewards` Table
- Manages reward thresholds
- Tracks reward eligibility
- Records reward issuance

#### `referral_credits` Table
- Stores credit balances
- Manages credit expiration
- Tracks credit usage

## Security Features

### 1. Military-Grade Encryption
- AES-256 encryption for sensitive fields
- pgcrypto extension for PostgreSQL
- Secure key management
- Encrypted data at rest

### 2. Row-Level Security (RLS)
- Users can only view their own data
- Email verification required for access
- Service role bypass for admin operations
- Audit logging for all sensitive operations

### 3. Security Audit Trail
- All referral operations logged
- IP address and user agent tracking
- Timestamp recording
- Immutable audit log

## API Endpoints

### Generate Referral Link
```sql
SELECT generate_secure_referral_link(user_id);
```
Returns: `https://app.example.com/signup?ref=ABC12XYZ`

### Get Referral Statistics
```sql
SELECT * FROM get_referral_stats(user_id);
```
Returns:
- `total_referrals`: Total number of referrals
- `successful_referrals`: Converted referrals
- `pending_referrals`: Awaiting conversion
- `total_credits`: Lifetime credits earned
- `used_credits`: Credits consumed
- `available_credits`: Current balance
- `next_reward_at`: Referrals needed for next reward

## Implementation Examples

### 1. Display Referral Link
```typescript
const { data: referralLink } = await supabase
  .rpc('generate_secure_referral_link', { user_id: user.id });
```

### 2. Show Referral Stats
```typescript
const { data: stats } = await supabase
  .rpc('get_referral_stats', { user_id: user.id });
```

### 3. Track Referral Attribution
During signup, the system automatically:
1. Validates the referral code
2. Links the new user to the referrer
3. Updates referral counts
4. Checks for reward eligibility
5. Generates credits if thresholds are met

## Best Practices

### For Users
1. Share your unique referral link on social media
2. Track your progress in the dashboard
3. Use credits before they expire
4. Encourage referred users to complete signup

### For Developers
1. Always use the secure RPC functions
2. Never expose encryption keys
3. Monitor the audit log for suspicious activity
4. Test referral chains thoroughly
5. Implement rate limiting for referral generation

## Monitoring & Analytics

### Key Metrics
- Referral conversion rate
- Average referrals per user
- Credit utilization rate
- Time to conversion
- Viral coefficient

### Audit Queries
```sql
-- View recent referral activities
SELECT * FROM security_audit_log 
WHERE operation = 'GENERATE' 
AND table_name = 'referral_links'
ORDER BY created_at DESC;

-- Check referral chain integrity
SELECT * FROM referral_tracking
WHERE referrer_id = ? OR referred_id = ?
ORDER BY created_at DESC;
```

## Troubleshooting

### Common Issues
1. **Referral code not working**: Check if code exists and is valid
2. **Credits not appearing**: Verify threshold requirements met
3. **Stats not updating**: Check RLS policies and permissions
4. **Encryption errors**: Ensure pgcrypto extension is enabled

### Debug Checklist
- [ ] User email is verified
- [ ] Referral code exists in database
- [ ] RLS policies are properly configured
- [ ] Encryption keys are accessible
- [ ] Audit logs show expected operations

## Future Enhancements
- Multi-level referral tracking
- Custom reward tiers
- Referral campaigns
- A/B testing for referral messaging
- Advanced analytics dashboard