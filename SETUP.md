# LifeNavigator Waitlist - Setup Instructions

## Overview
This is a full-stack Next.js application with Supabase backend, complete email system, and payment integration ready.

## Setup Steps

### 1. Install Dependencies
```bash
# Clean install (if you have npm issues)
rm -rf node_modules package-lock.json
npm install
```

### 2. Supabase Setup
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the entire contents of `supabase/schema.sql`
3. Get your project URL and API keys from Settings > API
4. Update `.env.local` with your Supabase credentials

### 3. Email Service Setup

#### Option A: Resend (Recommended)
1. Sign up at [resend.com](https://resend.com)
2. Get your API key
3. Add to `.env.local`: `RESEND_API_KEY=re_...`

#### Option B: SendGrid
1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Get your API key
3. Add to `.env.local`: `SENDGRID_API_KEY=SG....`

#### Option C: Supabase Email Queue
- Use the simple email service that queues emails in database
- Process them later with your preferred service

### 4. Stripe Setup (for payments)
1. Create account at [stripe.com](https://stripe.com)
2. Get your test API keys
3. Add to `.env.local`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

### 5. Environment Variables
Complete your `.env.local` file:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email
RESEND_API_KEY=re_... # or SENDGRID_API_KEY

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Security
JWT_SECRET=generate-random-secret
ADMIN_SECRET=your-admin-secret
CRON_SECRET=your-cron-secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 6. Run Development Server
```bash
npm run dev
```

Visit http://localhost:3000

## Features Implemented

### Backend
- ✅ Supabase database with all tables
- ✅ Authentication system with JWT
- ✅ Row Level Security policies
- ✅ API routes for all features

### Email System
- ✅ Welcome emails on signup
- ✅ Update notifications to all users
- ✅ Weekly digest emails (with cron)
- ✅ Pilot application confirmations
- ✅ Partnership auto-replies
- ✅ Payment confirmations
- ✅ Unsubscribe management

### Features
- ✅ User signup/login with referrals
- ✅ Pilot program applications
- ✅ Partnership request portal
- ✅ Payment method setup (Stripe ready)
- ✅ Email preferences management
- ✅ Audit logging

### Security
- ✅ Password hashing with bcrypt
- ✅ JWT authentication
- ✅ Row Level Security
- ✅ Input validation with Zod
- ✅ Rate limiting protection
- ✅ SQL injection prevention

## Deployment

### Vercel Deployment
1. Push to GitHub
2. Import to Vercel
3. Add all environment variables
4. Deploy

### Cron Jobs
The `vercel.json` configures weekly digest emails to run every Monday at 9 AM.

## Email Templates
All email templates are in `src/services/email.ts` with:
- HTML + text versions
- Unsubscribe links
- Professional design
- Personalization

## Admin Features
- Send update notifications: `POST /api/admin/updates/notify`
- View pilot applications in Supabase dashboard
- Process partnership requests

## Testing
1. Create a test user
2. Apply for pilot program
3. Submit partnership request
4. Check email queue/logs in Supabase

## Support
- Database issues: Check Supabase logs
- Email issues: Check email service dashboard
- Payment issues: Check Stripe dashboard