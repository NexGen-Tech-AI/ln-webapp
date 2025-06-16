# Complete Supabase OAuth Setup Guide

## Step 1: Configure Redirect URLs in Supabase

1. **Login to Supabase Dashboard**
   - Go to: https://app.supabase.com
   - Select your project

2. **Update URL Configuration**
   - Navigate to: Authentication → URL Configuration
   - Set **Site URL**: `https://yourdomain.com`
   - Add to **Redirect URLs**:
     ```
     https://yourdomain.com
     https://yourdomain.com/auth/callback
     https://yourdomain.com/login
     https://yourdomain.com/admin/login
     ```
   - Click **Save**

## Step 2: Enable OAuth Providers

For each provider you want to use:

### Google OAuth
1. Go to Authentication → Providers → Google
2. Toggle **Enable Google provider**
3. Add credentials from [Google Cloud Console](https://console.cloud.google.com/):
   - Client ID
   - Client Secret
4. Google's redirect URI (auto-filled): `https://wcsqkdooarbolnxppczi.supabase.co/auth/v1/callback`

### Microsoft/Azure OAuth
1. Go to Authentication → Providers → Azure
2. Toggle **Enable Azure provider**
3. Add credentials from [Azure Portal](https://portal.azure.com/):
   - Application (client) ID
   - Client Secret
4. Azure's redirect URI: `https://wcsqkdooarbolnxppczi.supabase.co/auth/v1/callback`

### LinkedIn OAuth
1. Go to Authentication → Providers → LinkedIn
2. Toggle **Enable LinkedIn provider**
3. Add credentials from [LinkedIn Developers](https://www.linkedin.com/developers/)
4. LinkedIn's redirect URI: `https://wcsqkdooarbolnxppczi.supabase.co/auth/v1/callback`

### Twitter OAuth
1. Go to Authentication → Providers → Twitter
2. Toggle **Enable Twitter provider**
3. Add credentials from [Twitter Developer Portal](https://developer.twitter.com/)
4. Twitter's callback URL: `https://wcsqkdooarbolnxppczi.supabase.co/auth/v1/callback`

### Facebook OAuth
1. Go to Authentication → Providers → Facebook
2. Toggle **Enable Facebook provider**
3. Add credentials from [Facebook Developers](https://developers.facebook.com/)
4. Facebook's redirect URI: `https://wcsqkdooarbolnxppczi.supabase.co/auth/v1/callback`

## Step 3: Configure OAuth Apps (Provider Side)

### For Google:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/Select project → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID
4. Add Authorized redirect URI: `https://wcsqkdooarbolnxppczi.supabase.co/auth/v1/callback`
5. Copy Client ID and Secret to Supabase

### For Microsoft Azure:
1. Go to [Azure Portal](https://portal.azure.com/)
2. App registrations → New registration
3. Add Redirect URI: `https://wcsqkdooarbolnxppczi.supabase.co/auth/v1/callback`
4. Create client secret
5. Copy Application ID and Secret to Supabase

### For LinkedIn:
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create app → Auth tab
3. Add Redirect URL: `https://wcsqkdooarbolnxppczi.supabase.co/auth/v1/callback`
4. Copy Client ID and Secret to Supabase

### For Twitter:
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create/Edit app → User authentication settings
3. Add Callback URL: `https://wcsqkdooarbolnxppczi.supabase.co/auth/v1/callback`
4. Copy API Key and Secret to Supabase

### For Facebook:
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create/Select app → Facebook Login → Settings
3. Add Valid OAuth Redirect URI: `https://wcsqkdooarbolnxppczi.supabase.co/auth/v1/callback`
4. Copy App ID and Secret to Supabase

## Step 4: Testing After Deployment

Once your app is deployed:

```bash
# Test each OAuth provider
curl https://yourdomain.com/login

# Check logs for any errors
pm2 logs your-app

# Monitor Supabase Auth logs
# Dashboard → Authentication → Logs
```

## Common Issues & Solutions

### "Redirect URL mismatch" Error
- Ensure your domain in Supabase matches exactly (with/without www)
- Check if using http vs https

### OAuth Provider Not Working
- Verify credentials are copied correctly
- Check provider-specific redirect URI
- Ensure provider app is not in development/test mode

### Session Not Persisting
- Check cookies are enabled
- Verify NEXT_PUBLIC_APP_URL matches your domain
- Ensure using HTTPS in production

## Important Notes

1. **HTTPS is Required**: OAuth providers require HTTPS in production
2. **Domain Must Match**: The domain in your app must exactly match Supabase config
3. **Provider Approval**: Some providers (Facebook, Twitter) may require app review for production use
4. **Rate Limits**: Be aware of provider-specific rate limits

## Quick Checklist

Before going live:
- [ ] Site URL set in Supabase
- [ ] All redirect URLs added
- [ ] OAuth providers enabled with credentials
- [ ] Provider apps configured with Supabase callback URL
- [ ] HTTPS/SSL certificate installed on your domain
- [ ] Environment variables correctly set in production

After deployment:
- [ ] Test each OAuth provider login
- [ ] Verify email/password login works
- [ ] Check user data is saved correctly
- [ ] Monitor for any authentication errors