# Admin Security Guide

## 🔐 Admin Access Setup

Your admin access has been configured with multiple security layers:

### 1. Current Configuration

**Admin User:** timothy@riffeandassociates.com  
**User ID:** 5993408d-348e-4ab7-b22b-e8461a950255

### 2. Activating Admin Access

Run this command once to activate your admin privileges:
```bash
node activate-admin.js
```

### 3. Accessing the Admin Dashboard

1. Go to: `http://localhost:3000/admin/login`
2. Login with your admin credentials
3. You'll be redirected to the secure admin dashboard

### 4. Security Features

#### 🛡️ Multi-Layer Protection
- **User ID Verification**: Only whitelisted user IDs can access admin
- **IP Whitelisting**: Optional IP address restrictions
- **Session Management**: 1-hour session timeout
- **Audit Logging**: All admin actions are logged
- **Failed Login Tracking**: Monitors unauthorized access attempts

#### 🔍 Security Monitoring
Access the Security tab in your admin dashboard to:
- View failed login attempts
- Monitor active sessions
- Review audit logs
- Terminate sessions if needed

### 5. Environment Variables

Your `.env.local` contains:
```env
ADMIN_USER_IDS=5993408d-348e-4ab7-b22b-e8461a950255
ADMIN_ALLOWED_IPS=  # Add comma-separated IPs if needed
ADMIN_CREATION_SECRET=<secure-key>  # Used only for initial setup
ADMIN_SESSION_KEY=<secure-key>      # For session encryption
ADMIN_MFA_ENABLED=false             # Set to true for 2FA
```

### 6. Adding IP Restrictions (Optional)

To restrict access to specific IP addresses:
1. Find your IP: Visit https://whatismyipaddress.com/
2. Add to `.env.local`: `ADMIN_ALLOWED_IPS=YOUR_IP_HERE`
3. Multiple IPs: `ADMIN_ALLOWED_IPS=IP1,IP2,IP3`

### 7. Enabling Two-Factor Authentication

To enable 2FA:
1. Set `ADMIN_MFA_ENABLED=true` in `.env.local`
2. Go to Supabase Dashboard → Authentication → Providers
3. Enable "Email OTP" or "Phone OTP"
4. Enable 2FA in your user profile

### 8. Security Best Practices

1. **Never share** your admin credentials or secret keys
2. **Regularly review** the Security tab for suspicious activity
3. **Update IP whitelist** if your IP changes
4. **Use strong passwords** and consider a password manager
5. **Monitor audit logs** for unauthorized access attempts
6. **Terminate sessions** when done working

### 9. Emergency Procedures

#### If you suspect unauthorized access:
1. Go to Security tab → Terminate All Sessions
2. Change your password immediately
3. Review audit logs for suspicious activity
4. Update ADMIN_USER_IDS in .env.local
5. Regenerate ADMIN_CREATION_SECRET

#### To revoke admin access:
1. Remove user ID from ADMIN_USER_IDS
2. Delete record from admin_users table in Supabase
3. Restart your application

### 10. Admin Dashboard Features

Once logged in, you have access to:

- **Analytics Dashboard**: Traffic sources, page views, user behavior
- **User Management**: Search, filter, export user data
- **Segment Builder**: Create user segments for targeting
- **Email Campaigns**: Manage email lists and campaigns
- **Security Monitoring**: Real-time security alerts

### 11. Troubleshooting

**Can't access admin?**
- Verify you're using the correct email/password
- Check that your user ID is in ADMIN_USER_IDS
- Ensure the dev server is running
- Check browser console for errors

**Getting IP blocked?**
- Your IP may have changed
- Update ADMIN_ALLOWED_IPS or leave it empty
- Check your current IP at whatismyipaddress.com

**Session expires too quickly?**
- Increase ADMIN_SESSION_LIFETIME in .env.local
- Value is in seconds (3600 = 1 hour)

---

Remember: With great power comes great responsibility. Your admin access allows you to view sensitive user data and analytics. Always follow privacy best practices and only access data necessary for your business operations.