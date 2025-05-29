# Referral Discount Implementation Guide

## Current Database Setup
The database already tracks:
- `referral_code` - Each user's unique code
- `referred_by` - Who referred this user
- `referral_count` - How many people they've referred

## Suggested Discount Structure

### For the Referrer (person sharing their code):
- 1-2 referrals: 10% lifetime discount
- 3-4 referrals: 20% lifetime discount
- 5-9 referrals: 30% lifetime discount
- 10+ referrals: 50% lifetime discount
- 25+ referrals: Free Pro tier for life

### For the Referred (person using a code):
- 10% discount on first 3 months
- Priority access to Pilot Program

## Implementation Steps

1. **Add discount tracking to database**:
```sql
ALTER TABLE public.users ADD COLUMN discount_percentage INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN discount_type TEXT DEFAULT 'none'; -- 'none', 'referral', 'lifetime_free'
```

2. **Create function to calculate discounts**:
```sql
CREATE OR REPLACE FUNCTION calculate_referral_discount(user_referral_count INTEGER)
RETURNS INTEGER AS $$
BEGIN
  IF user_referral_count >= 25 THEN
    RETURN 100; -- Free
  ELSIF user_referral_count >= 10 THEN
    RETURN 50;
  ELSIF user_referral_count >= 5 THEN
    RETURN 30;
  ELSIF user_referral_count >= 3 THEN
    RETURN 20;
  ELSIF user_referral_count >= 1 THEN
    RETURN 10;
  ELSE
    RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

3. **Update discount when referral count changes**:
```sql
CREATE OR REPLACE FUNCTION update_referral_discount()
RETURNS TRIGGER AS $$
BEGIN
  NEW.discount_percentage = calculate_referral_discount(NEW.referral_count);
  IF NEW.referral_count >= 25 THEN
    NEW.discount_type = 'lifetime_free';
  ELSIF NEW.referral_count > 0 THEN
    NEW.discount_type = 'referral';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_discount_on_referral
  BEFORE UPDATE OF referral_count ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_referral_discount();
```

4. **Track referral source in Stripe metadata** when creating customers:
```javascript
const customer = await stripe.customers.create({
  email: user.email,
  metadata: {
    user_id: user.id,
    referral_code: user.referral_code,
    referred_by: user.referred_by,
    discount_percentage: user.discount_percentage,
    waitlist_position: user.position
  }
});
```

5. **Apply discounts automatically** in Stripe subscriptions:
```javascript
const subscription = await stripe.subscriptions.create({
  customer: customer.id,
  items: [{ price: priceId }],
  coupon: user.discount_percentage > 0 ? `REFERRAL_${user.discount_percentage}` : undefined,
  metadata: {
    referral_discount: user.discount_percentage
  }
});
```

## Dashboard Updates Needed

Add to the referral card:
- Current discount level
- Progress to next discount tier
- Visual indicator of discount status

## Email Notifications

Send emails when:
- Someone uses their referral code
- They reach a new discount tier
- They earn lifetime free access