# Deploy to Production Guide

This guide covers updating Supabase and deploying to Hostinger VPS.

## Step 1: Apply Database Migrations

### 1.1 Access Supabase SQL Editor
1. Go to: https://wcsqkdooarbolnxppczi.supabase.co
2. Navigate to SQL Editor
3. Click "New Query"

### 1.2 Run the Complete System Update Migration
1. Copy the entire contents of `/supabase/migrations/complete_system_update.sql`
2. Paste into the SQL Editor
3. Click "Run" to execute

### 1.3 Verify Migration Success
Run these queries to verify:

```sql
-- Check users table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Check referral tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('referral_rewards', 'referral_credits', 'oauth_connections');

-- Verify triggers
SELECT trigger_name 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```

## Step 2: Configure OAuth Providers in Supabase

1. Go to Authentication → Providers
2. Enable and configure each provider:

### Google
- Enable Google
- Client ID: (from Google Cloud Console)
- Client Secret: (from Google Cloud Console)

### Microsoft (Azure)
- Enable Microsoft
- Client ID: (from Azure Portal)
- Client Secret: (from Azure Portal)

### LinkedIn
- Enable LinkedIn
- Client ID: (from LinkedIn Developers)
- Client Secret: (from LinkedIn Developers)

### Twitter
- Enable Twitter
- Client ID: (from Twitter Developer Portal)
- Client Secret: (from Twitter Developer Portal)

### Facebook
- Enable Facebook
- App ID: (from Facebook Developers)
- App Secret: (from Facebook Developers)

## Step 3: Update Production Environment Variables

Create production `.env` file:

```bash
# Production Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://wcsqkdooarbolnxppczi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indjc3FrZG9vYXJib2xueHBwY3ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0NzMzNzUsImV4cCI6MjA2NDA0OTM3NX0.EwuGGUmxAJzDL4QzGVerKavbC6fhwHmDoi49v-xf3W4
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indjc3FrZG9vYXJib2xueHBwY3ppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODQ3MzM3NSwiZXhwIjoyMDY0MDQ5Mzc1fQ.wwbO4E2_AuIgICa2lJZzA_Ccaa3ZzcFEMxB_-Pvljgk

# Email Configuration
RESEND_API_KEY=re_Mck3mUhp_HWzoNHEJjaGsV2QvGYHCNvHj

# Production URLs
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_OAUTH_REDIRECT_URL=https://your-domain.com

# Security (generate new values for production)
NEXTAUTH_SECRET=generate-new-secret-for-production
ADMIN_CREATION_SECRET=generate-new-secret-for-production
ADMIN_SESSION_KEY=generate-new-secret-for-production

# Admin Configuration
ADMIN_USER_IDS=5993408d-348e-4ab7-b22b-e8461a950255
ADMIN_MFA_ENABLED=true
ADMIN_SESSION_LIFETIME=3600
ADMIN_MAX_LOGIN_ATTEMPTS=3
ADMIN_LOCKOUT_DURATION=900
```

## Step 4: Build for Production

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Test the build locally
npm start
```

## Step 5: Deploy to Hostinger VPS

### 5.1 Connect to VPS
```bash
ssh root@your-vps-ip
```

### 5.2 Update the Application
```bash
cd /var/www/lifenavigator
git pull origin main

# Copy production environment variables
nano .env.local
# Paste the production environment variables

# Install dependencies
npm install

# Build the application
npm run build

# Restart the application
pm2 restart lifenavigator
```

### 5.3 Update Nginx Configuration (if needed)
```bash
sudo nano /etc/nginx/sites-available/lifenavigator

# Ensure it includes:
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### 5.4 Set up SSL (if not already done)
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## Step 6: Post-Deployment Verification

### 6.1 Test Core Features
- [ ] Email signup works
- [ ] OAuth login works (all providers)
- [ ] Referral links work
- [ ] Dashboard loads properly
- [ ] Analytics tracking works

### 6.2 Monitor Logs
```bash
# Application logs
pm2 logs lifenavigator

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 6.3 Check Database Connectivity
```bash
# From the VPS, test Supabase connection
curl https://wcsqkdooarbolnxppczi.supabase.co/rest/v1/users \
  -H "apikey: your-anon-key" \
  -H "Authorization: Bearer your-anon-key"
```

## Step 7: Update OAuth Redirect URLs

Once deployed, update all OAuth providers with production URLs:

1. **Google**: Add `https://your-domain.com` to authorized domains
2. **Microsoft**: Update redirect URI to production URL
3. **LinkedIn**: Update authorized redirect URLs
4. **Twitter**: Update callback URL
5. **Facebook**: Update valid OAuth redirect URIs

## Troubleshooting

### Common Issues:

1. **502 Bad Gateway**: Check if the app is running with `pm2 status`
2. **Database connection errors**: Verify environment variables
3. **OAuth errors**: Check redirect URLs match exactly
4. **SSL issues**: Ensure certbot is properly configured

### Debug Commands:
```bash
# Check application status
pm2 status
pm2 logs lifenavigator --lines 100

# Check system resources
htop
df -h

# Test database connection
node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"
```

## Rollback Plan

If issues occur:
```bash
cd /var/www/lifenavigator
git checkout [previous-commit-hash]
npm install
npm run build
pm2 restart lifenavigator
```

## Security Checklist

- [ ] All secrets are unique for production
- [ ] HTTPS is enforced
- [ ] Environment variables are secure
- [ ] Admin access is restricted
- [ ] Database RLS policies are active
- [ ] OAuth providers use production URLs
- [ ] Error messages don't expose sensitive data