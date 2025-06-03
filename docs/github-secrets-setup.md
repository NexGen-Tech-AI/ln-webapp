# GitHub Secrets Setup for CI/CD

This document lists all the GitHub secrets required for the automated deployment pipelines.

## Production Deployment Secrets

### Required for VPS Deployment
- `HOSTINGER_HOST` - Your VPS IP address or hostname
- `HOSTINGER_USER` - SSH username (usually `root` or custom user)
- `HOSTINGER_SSH_KEY` - Private SSH key for authentication
- `HOSTINGER_SSH_PORT` - SSH port (default: 22)
- `HOSTINGER_DIR` - Deployment directory (default: `/var/www/lifenav`)

### Required for FTP Deployment
- `FTP_SERVER` - Hostinger FTP server address
- `FTP_USERNAME` - FTP username
- `FTP_PASSWORD` - FTP password
- `DOMAIN` - Your domain name for the deployment path

### Application Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `NEXT_PUBLIC_APP_URL` - Production app URL (e.g., https://lifenav.ai)
- `SENDGRID_API_KEY` - SendGrid API key for emails
- `SENDGRID_FROM_EMAIL` - Email sender address
- `ADMIN_EMAIL` - Admin email for notifications
- `ADMIN_PASSWORD_HASH` - Hashed admin password
- `ADMIN_IP_WHITELIST` - Comma-separated list of allowed IPs
- `JWT_SECRET` - Secret for JWT token generation
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook endpoint secret
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key

## Staging Deployment Secrets

### Staging Infrastructure
- `STAGING_HOST` - Staging VPS IP or hostname
- `STAGING_USER` - Staging SSH username
- `STAGING_SSH_KEY` - Staging SSH private key
- `STAGING_SSH_PORT` - Staging SSH port (default: 22)
- `STAGING_DIR` - Staging deployment directory (default: `/var/www/lifenav-staging`)

### Staging Environment Variables
- `STAGING_NEXT_PUBLIC_SUPABASE_URL` - Staging Supabase URL
- `STAGING_NEXT_PUBLIC_SUPABASE_ANON_KEY` - Staging Supabase anon key
- `STAGING_SUPABASE_SERVICE_ROLE_KEY` - Staging service role key
- `STAGING_APP_URL` - Staging app URL
- `STAGING_SENDGRID_API_KEY` - Staging SendGrid API key
- `STAGING_SENDGRID_FROM_EMAIL` - Staging email sender

### Preview Deployments (Vercel)
- `VERCEL_TOKEN` - Vercel API token for preview deployments

## How to Add Secrets

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret with the exact name listed above
5. Paste the secret value (ensure no trailing spaces)

## Generating SSH Keys

For VPS deployment, generate an SSH key pair:

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "github-actions@lifenav" -f github_deploy_key

# Add public key to VPS
ssh-copy-id -i github_deploy_key.pub user@your-vps-ip

# Copy private key content for GitHub secret
cat github_deploy_key
```

**Important**: Never commit these secrets to your repository!