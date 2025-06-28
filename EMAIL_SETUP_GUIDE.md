# LifeNavigator Email Setup Guide

## Overview
This guide will help you set up the email system for LifeNavigator using Resend.

## Prerequisites
- Resend account (sign up at https://resend.com)
- Domain ownership (lifenavigator.tech)
- Access to DNS settings

## Step 1: Get Resend API Key

1. Sign up for Resend at https://resend.com
2. Go to API Keys section
3. Create a new API key
4. Copy the API key

## Step 2: Add API Key to Environment

Add to your `.env.local` file:
```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

## Step 3: Verify Your Domain

1. In Resend dashboard, go to Domains
2. Add domain: `lifenavigator.tech`
3. Add the following DNS records to your domain:

### Required DNS Records:
```
Type: TXT
Name: resend._domainkey
Value: [Provided by Resend]

Type: TXT  
Name: @
Value: v=spf1 include:amazonses.com ~all

Type: MX
Name: feedback-smtp
Value: feedback-smtp.us-east-1.amazonses.com
Priority: 10

Type: CNAME
Name: resend._domainkey
Value: [Provided by Resend]
```

## Step 4: Configure Email Addresses

After domain verification, you can use these email addresses:
- `welcome@lifenavigator.tech` - Welcome emails
- `updates@lifenavigator.tech` - Product updates
- `security@lifenavigator.tech` - Security emails
- `support@lifenavigator.tech` - Support emails
- `noreply@lifenavigator.tech` - General notifications

## Step 5: Test Email Integration

Run the test script:
```bash
node test-email.js
```

## Email Templates Available

### 1. Welcome Email
- Location: `/src/emails/WelcomeEmail.tsx`
- Usage: Sent when new users sign up
- Features: Verification link, feature highlights, branded design

### 2. Update Email
- Location: `/src/emails/UpdateEmail.tsx`
- Usage: Product updates and announcements
- Features: Customizable content, feature lists, CTA buttons

## API Endpoints

### Send Welcome Email
```
POST /api/email/send-welcome
{
  "email": "user@example.com",
  "userName": "John Doe",
  "verificationUrl": "https://lifenavigator.tech/verify?token=xxx"
}
```

### Send Update Email
```
POST /api/email/send-update
{
  "email": "user@example.com",
  "userName": "John Doe",
  "updateTitle": "New Features Released!",
  "updateContent": "Check out what's new...",
  "features": [
    {
      "emoji": "🚀",
      "title": "Feature Name",
      "description": "Feature description"
    }
  ],
  "ctaText": "Try Now",
  "ctaUrl": "https://lifenavigator.tech/dashboard"
}
```

## Using Email Service in Code

```typescript
import { sendWelcomeEmail, sendUpdateEmail } from '@/services/emailService';

// Send welcome email
await sendWelcomeEmail({
  email: 'user@example.com',
  userName: 'John',
  verificationToken: 'token123'
});

// Send update email
await sendUpdateEmail({
  email: 'user@example.com',
  userName: 'John',
  updateTitle: 'New Features!',
  updateContent: 'Check out our latest updates...',
  features: [
    {
      emoji: '🎯',
      title: 'Goal Tracking',
      description: 'Track your goals with AI insights'
    }
  ]
});
```

## Monitoring & Analytics

Resend provides:
- Email delivery status
- Open rates
- Click rates
- Bounce handling
- Spam complaints

Access these in your Resend dashboard under Analytics.

## Troubleshooting

### Email not sending
1. Check API key is correct
2. Verify domain is verified in Resend
3. Check for errors in server logs
4. Test with Resend's test email addresses

### Domain verification issues
1. Ensure DNS records are added correctly
2. Wait 24-48 hours for DNS propagation
3. Use DNS checker tools to verify records

## Production Checklist

- [ ] Resend API key added to production environment
- [ ] Domain verified in Resend
- [ ] DNS records configured
- [ ] Email templates tested
- [ ] Error handling implemented
- [ ] Monitoring set up
- [ ] Fallback for email failures

## Support

For issues with:
- Resend: support@resend.com
- LifeNavigator implementation: Check server logs and error messages