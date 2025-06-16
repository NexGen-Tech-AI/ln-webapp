# Supabase OAuth Authentication - Hostinger VPS Deployment Guide

## Overview
This guide covers deploying your Supabase Auth system with OAuth providers (Google, Microsoft, LinkedIn, Twitter, Facebook) to a Hostinger VPS.

## Pre-Deployment Checklist

### 1. Supabase Dashboard Configuration

Before deployment, configure OAuth providers in your Supabase dashboard:

1. Go to [Supabase Dashboard](https://app.supabase.com) → Your Project → Authentication → Providers
2. Enable and configure each OAuth provider:

#### Google OAuth
- Create OAuth 2.0 credentials at [Google Cloud Console](https://console.cloud.google.com/)
- Authorized redirect URI: `https://wcsqkdooarbolnxppczi.supabase.co/auth/v1/callback`
- Copy Client ID and Client Secret to Supabase

#### Microsoft Azure OAuth
- Register app at [Azure Portal](https://portal.azure.com/)
- Add redirect URI: `https://wcsqkdooarbolnxppczi.supabase.co/auth/v1/callback`
- Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"

#### LinkedIn OAuth
- Create app at [LinkedIn Developers](https://www.linkedin.com/developers/)
- OAuth 2.0 redirect URL: `https://wcsqkdooarbolnxppczi.supabase.co/auth/v1/callback`

#### Twitter OAuth
- Create app at [Twitter Developer Portal](https://developer.twitter.com/)
- Callback URL: `https://wcsqkdooarbolnxppczi.supabase.co/auth/v1/callback`

#### Facebook OAuth
- Create app at [Facebook Developers](https://developers.facebook.com/)
- Valid OAuth Redirect URI: `https://wcsqkdooarbolnxppczi.supabase.co/auth/v1/callback`

### 2. Update Redirect URLs in Supabase

1. Go to Authentication → URL Configuration
2. Set Site URL: `https://yourdomain.com`
3. Add to Redirect URLs:
   - `https://yourdomain.com/auth/callback`
   - `https://yourdomain.com/login`
   - `https://yourdomain.com/`

### 3. Environment Variables

Create `.env.production`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://wcsqkdooarbolnxppczi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key

# App URL (must match Supabase Site URL)
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Email Service
RESEND_API_KEY=your_resend_api_key

# Admin Configuration
ADMIN_USER_IDS=uuid1,uuid2  # From auth.users table
ADMIN_ALLOWED_IPS=  # Optional IP whitelist
ADMIN_CREATION_SECRET=generate_strong_secret_here
ADMIN_SESSION_KEY=generate_strong_session_key
ADMIN_MFA_ENABLED=true

# Security Settings
ADMIN_SESSION_LIFETIME=3600
ADMIN_MAX_LOGIN_ATTEMPTS=3
ADMIN_LOCKOUT_DURATION=900

# Payment Integration (if using referrals)
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# ID.me (optional)
IDME_CLIENT_ID=
IDME_CLIENT_SECRET=
```

## Deployment Steps

### Step 1: Build the Application

```bash
# Install dependencies
npm install

# Build for production
npm run build
```

### Step 2: Prepare Files for Upload

Create deployment package:

```bash
# Files to upload:
.next/              # Built Next.js app
app/                # App directory
src/                # Source files  
public/             # Static assets
supabase/           # Supabase migrations
package.json
package-lock.json
next.config.js
middleware.ts
tsconfig.json
.env.production
```

### Step 3: Server Setup

SSH into your Hostinger VPS:

```bash
ssh root@your-server-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
npm install -g pm2

# Create app directory
mkdir -p /var/www/your-app
cd /var/www/your-app
```

### Step 4: Upload Files

From your local machine:

```bash
# Upload all files
scp -r .next app src public supabase package*.json next.config.js middleware.ts tsconfig.json .env.production root@your-server-ip:/var/www/your-app/
```

### Step 5: Install and Start

On the VPS:

```bash
cd /var/www/your-app

# Install production dependencies
npm install --production

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'your-app',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/app-error.log',
    out_file: '/var/log/pm2/app-out.log',
    time: true,
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
}
EOF

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Step 6: Nginx Configuration

```bash
# Install Nginx
sudo apt-get install -y nginx

# Create site configuration
sudo nano /etc/nginx/sites-available/your-app
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com www.yourdomain.com;

    # SSL configuration (will be added by Certbot)
    
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

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/your-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 7: SSL Certificate (Required for OAuth)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

## Post-Deployment Verification

### 1. Test OAuth Providers

Visit each login option:
- `https://yourdomain.com/login`
- Test Google login
- Test Microsoft login
- Test LinkedIn login
- Test Twitter login
- Test Facebook login

### 2. Verify Auth Callbacks

Check that callbacks work:
```bash
# Monitor logs
pm2 logs your-app

# Check for callback errors
tail -f /var/log/pm2/app-error.log
```

### 3. Test Email Authentication

- Sign up with email
- Check email delivery
- Verify confirmation link works

### 4. Admin Access

Test admin login:
- `https://yourdomain.com/admin/login`
- Verify only authorized UUIDs can access

## Troubleshooting

### OAuth Redirect Errors

1. Check Supabase Dashboard → Authentication → URL Configuration
2. Ensure production domain is in redirect URLs
3. Verify OAuth provider callbacks match Supabase URL

### Session Issues

```bash
# Check environment variables
pm2 env 0 | grep SUPABASE

# Restart application
pm2 restart your-app
```

### Common Issues

1. **"Invalid redirect_to URL"**
   - Add URL to Supabase redirect whitelist
   
2. **OAuth provider errors**
   - Verify client ID/secret in Supabase dashboard
   - Check provider-specific redirect URIs
   
3. **Email not sending**
   - Verify RESEND_API_KEY
   - Check Supabase email templates

## Security Checklist

- [ ] SSL certificate installed and auto-renewing
- [ ] Environment variables secured (not in git)
- [ ] Admin UUIDs properly configured
- [ ] Supabase RLS policies enabled
- [ ] OAuth providers using production credentials
- [ ] Redirect URLs limited to your domain
- [ ] Nginx security headers configured

## Monitoring

```bash
# View application logs
pm2 logs your-app --lines 100

# Monitor performance
pm2 monit

# Check auth events in Supabase
# Dashboard → Authentication → Logs
```

## Backup Strategy

1. **Database**: Use Supabase dashboard backups
2. **Environment**: Backup `.env.production` securely
3. **Code**: Use git tags for deployed versions

## Quick Commands Reference

```bash
# Restart application
pm2 restart your-app

# View logs
pm2 logs your-app

# Check status
pm2 status

# Update and restart
git pull && npm install && npm run build && pm2 restart your-app
```