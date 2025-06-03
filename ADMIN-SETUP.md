# 🔐 Secure Admin Setup Guide

This guide will help you set up secure admin access to your LifeNavigator analytics dashboard.

## 🚨 Security Features Implemented

1. **Multi-Factor Authentication** (via Supabase)
2. **IP Whitelisting** (optional but recommended)
3. **Environment Variable Authentication** (no database checks)
4. **Security Headers** (prevent clickjacking, XSS)
5. **Audit Logging** (track all admin actions)
6. **Session Management** (automatic timeout)

## 📋 Initial Setup Steps

### Step 1: Enable Two-Factor Authentication

1. Go to your Supabase Dashboard
2. Navigate to Authentication → Providers
3. Enable "Email OTP" or "SMS OTP"
4. In your account settings, enable 2FA

### Step 2: Get Your User ID

1. Go to Supabase Dashboard → Authentication → Users
2. Find your account and copy the User ID
3. Save this ID - you'll need it for the next step

### Step 3: Configure Environment Variables

Add these to your `.env.local` file:

```env
# Admin Security Configuration
ADMIN_USER_IDS=your-user-id-here
ADMIN_ALLOWED_IPS=your-home-ip,your-office-ip
ADMIN_CREATION_SECRET=generate-a-very-strong-secret-here
ADMIN_SESSION_LIFETIME=3600  # 1 hour in seconds

# Optional: Email alerts for security events
ADMIN_ALERT_EMAIL=your-email@example.com
```

### Step 4: Find Your IP Address

To get your current IP address:
1. Visit: https://whatismyipaddress.com/
2. Copy your IPv4 address
3. Add it to `ADMIN_ALLOWED_IPS`

**Note**: If you have a dynamic IP, you may need to update this regularly or use a VPN with a static IP.

### Step 5: Make Yourself an Admin

Run this command once to add yourself as an admin:

```bash
curl -X POST https://your-domain.com/api/admin/create \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "your-user-id-here",
    "secretKey": "your-admin-creation-secret"
  }'
```

### Step 6: Test Admin Access

1. Clear your browser cookies/cache
2. Navigate to: https://your-domain.com/admin
3. Log in with your email/password
4. Complete 2FA verification
5. You should now see the admin dashboard

## 🔒 Security Best Practices

### 1. **Regular Security Audits**
- Check audit logs weekly: `/admin/security`
- Review failed access attempts
- Monitor for unusual patterns

### 2. **IP Management**
- Use a static IP or VPN
- Update IP whitelist when needed
- Consider using a bastion host

### 3. **Session Security**
- Admin sessions expire after 1 hour
- Always log out when done
- Use incognito/private browsing

### 4. **Access Monitoring**
Set up alerts for:
- Failed login attempts
- Unauthorized access attempts
- New IP addresses

### 5. **Backup Access**
- Keep a backup admin account
- Store credentials securely (use a password manager)
- Document your IP addresses

## 🚀 Accessing Analytics Data

Once logged in as admin, you can:

1. **View Analytics** at `/admin`
   - Real-time user tracking
   - Conversion funnels
   - Traffic sources
   - User behavior

2. **Manage Users** at `/admin?tab=users`
   - Search and filter users
   - Export user data
   - Create segments

3. **Run Campaigns** at `/admin?tab=campaigns`
   - Email campaigns
   - User segmentation
   - A/B testing

## 🆘 Troubleshooting

### "Access Denied" Error
1. Check your IP is whitelisted
2. Verify your user ID in env vars
3. Ensure you're logged in
4. Check browser console for errors

### Can't Access After Setup
1. Clear browser cache
2. Check middleware is deployed
3. Verify environment variables
4. Check Supabase auth settings

### Session Keeps Expiring
1. Increase `ADMIN_SESSION_LIFETIME`
2. Check for browser extensions blocking cookies
3. Use "Remember me" option

## 🔴 Emergency Access Recovery

If you're locked out:

1. **Via Supabase Dashboard**
   - Temporarily disable RLS on admin_users table
   - Manually add your user_id
   - Re-enable RLS

2. **Via Direct Database**
   ```sql
   INSERT INTO admin_users (user_id, role, permissions)
   VALUES ('your-user-id', 'admin', '{"all": true}');
   ```

3. **Via Backup Admin**
   - Use your backup admin account
   - Reset primary admin access

## 📊 Security Monitoring Queries

Run these in your Supabase SQL editor:

### Check Failed Admin Access Attempts
```sql
SELECT * FROM audit_logs 
WHERE action = 'unauthorized_admin_access' 
ORDER BY created_at DESC 
LIMIT 50;
```

### View Admin Activity
```sql
SELECT * FROM audit_logs 
WHERE user_id IN (
  SELECT user_id FROM admin_users
) 
ORDER BY created_at DESC 
LIMIT 100;
```

### Monitor Suspicious IPs
```sql
SELECT ip_address, COUNT(*) as attempts 
FROM audit_logs 
WHERE action LIKE '%unauthorized%' 
GROUP BY ip_address 
ORDER BY attempts DESC;
```

## 🛡️ Additional Security Recommendations

1. **Use a VPN**
   - Set up a business VPN with static IP
   - Add only the VPN IP to whitelist
   - Access admin only through VPN

2. **Hardware Security Key**
   - Enable WebAuthn in Supabase
   - Use YubiKey or similar
   - Most secure 2FA method

3. **Monitoring & Alerts**
   - Set up Supabase webhooks
   - Monitor failed logins
   - Alert on new IPs

4. **Regular Reviews**
   - Audit admin access monthly
   - Rotate secrets quarterly
   - Review security logs

## ⚠️ Important Security Notes

- **Never share** your admin credentials
- **Never commit** .env.local to git
- **Always use** HTTPS in production
- **Regularly update** dependencies
- **Monitor** for security advisories

Remember: Security is not a one-time setup but an ongoing process. Stay vigilant!