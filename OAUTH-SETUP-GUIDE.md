# OAuth Setup Guide for LifeNavigator

This guide will help you set up OAuth authentication with Google, Microsoft, LinkedIn, Twitter, and Facebook.

## Prerequisites

1. A Supabase project with Authentication enabled
2. Developer accounts for each OAuth provider
3. Access to your Supabase dashboard

## Step 1: Configure OAuth Providers in Supabase

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Configure OAuth consent screen:
   - Add your app name and support email
   - Add authorized domains: `your-domain.com`, `supabase.co`
6. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized JavaScript origins: 
     - `https://your-project-ref.supabase.co`
     - `http://localhost:3000` (for development)
   - Authorized redirect URIs:
     - `https://your-project-ref.supabase.co/auth/v1/callback`
7. Copy Client ID and Client Secret

### Microsoft OAuth Setup

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to Azure Active Directory → App registrations → New registration
3. Configure:
   - Name: LifeNavigator
   - Supported account types: Personal Microsoft accounts and organizational
   - Redirect URI: `https://your-project-ref.supabase.co/auth/v1/callback`
4. After creation, go to Certificates & secrets → New client secret
5. Copy Application (client) ID and Client Secret

### LinkedIn OAuth Setup

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create a new app
3. Add OAuth 2.0 products:
   - Sign In with LinkedIn
   - Share on LinkedIn (optional)
4. Configure OAuth 2.0 settings:
   - Authorized redirect URLs: `https://your-project-ref.supabase.co/auth/v1/callback`
5. Copy Client ID and Client Secret

### Twitter OAuth Setup

1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new app in your project
3. Set up OAuth 2.0:
   - Type of App: Web App
   - Callback URI: `https://your-project-ref.supabase.co/auth/v1/callback`
   - Website URL: Your app URL
4. Copy Client ID and Client Secret

### Facebook OAuth Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app (Consumer type)
3. Add Facebook Login product
4. Configure Facebook Login settings:
   - Valid OAuth Redirect URIs: `https://your-project-ref.supabase.co/auth/v1/callback`
   - Deauthorize Callback URL: `https://your-domain.com/auth/deauthorize`
5. Copy App ID and App Secret

## Step 2: Configure Supabase

1. Go to your Supabase project dashboard
2. Navigate to Authentication → Providers
3. Enable and configure each provider:

### For each provider:
- Toggle "Enable [Provider]" to ON
- Enter the Client ID/App ID
- Enter the Client Secret/App Secret
- Save configuration

## Step 3: Update Environment Variables

Add the following to your `.env.local`:

```env
# OAuth Redirect URL (for local development)
NEXT_PUBLIC_OAUTH_REDIRECT_URL=http://localhost:3000

# Optional: Provider-specific settings
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_MICROSOFT_CLIENT_ID=your-microsoft-client-id
NEXT_PUBLIC_LINKEDIN_CLIENT_ID=your-linkedin-client-id
NEXT_PUBLIC_TWITTER_CLIENT_ID=your-twitter-client-id
NEXT_PUBLIC_FACEBOOK_APP_ID=your-facebook-app-id
```

## Step 4: Production Setup

For production deployment:

1. Update OAuth redirect URIs in each provider to use your production domain
2. Add production domain to authorized domains in each provider
3. Update environment variables with production URLs
4. Ensure HTTPS is enabled (required for OAuth)

## Security Considerations

1. Never commit OAuth secrets to version control
2. Use environment variables for all sensitive data
3. Implement proper error handling for OAuth failures
4. Set up webhook endpoints for provider-specific events (optional)
5. Configure OAuth scopes to request minimal permissions

## Testing OAuth Providers

1. Test each provider in development first
2. Verify email is retrieved correctly
3. Check user profile data mapping
4. Test error scenarios (cancelled auth, invalid credentials)
5. Verify logout works correctly for each provider

## Troubleshooting

### Common Issues:

1. **Redirect URI mismatch**: Ensure the redirect URI in your provider settings exactly matches Supabase's callback URL
2. **Invalid client**: Double-check client ID and secret are correctly copied
3. **Scope errors**: Some providers require specific scopes to be requested
4. **Domain not authorized**: Add all domains (including localhost for dev) to provider settings

### Provider-Specific Notes:

- **Google**: May require app verification for production use
- **Microsoft**: Needs proper tenant configuration for organizational accounts
- **LinkedIn**: Has rate limits on authentication requests
- **Twitter**: Requires elevated access for some features
- **Facebook**: Requires app review for production use with general public