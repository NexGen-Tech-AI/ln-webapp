# LifeNavigator Deployment Guide for Hostinger

## Prerequisites
- Hostinger hosting account with Node.js support
- Domain configured on Hostinger
- Supabase project set up (you already have this ✓)
- Git installed locally

## Step 1: Prepare Your Project

### 1.1 Create Production Environment File
Create `.env.production` in your project root:
```bash
# Copy your Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=https://wcsqkdooarbolnxppczi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indjc3FrZG9vYXJib2xueHBwY3ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0NzMzNzUsImV4cCI6MjA2NDA0OTM3NX0.EwuGGUmxAJzDL4QzGVerKavbC6fhwHmDoi49v-xf3W4

# Add these when ready
RESEND_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
```

### 1.2 Update package.json for Production
Add these scripts to your package.json:
```json
"scripts": {
  "start": "NODE_ENV=production node server.js",
  "build:prod": "next build"
}
```

## Step 2: Build for Production

Run these commands locally:
```bash
# Install dependencies
npm install

# Build the production version
npm run build

# Test production build locally (optional)
npm run start
```

## Step 3: Prepare Deployment Files

### 3.1 Create server.js for Hostinger
Create `server.js` in your project root:
```javascript
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  }).listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})
```

### 3.2 Create .htaccess for Hostinger
Create `.htaccess` in your project root:
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
```

## Step 4: Upload to Hostinger

### 4.1 Access Hostinger File Manager
1. Log into Hostinger control panel
2. Go to Files → File Manager
3. Navigate to your domain's public_html folder

### 4.2 Upload Files
Upload these files/folders to public_html:
- `.next/` folder (entire build output)
- `public/` folder
- `node_modules/` folder (or run npm install on server)
- `package.json`
- `package-lock.json`
- `server.js`
- `.htaccess`
- `.env.production` (rename to `.env` on server)

### 4.3 Alternative: Use Git
If Hostinger supports Git:
```bash
# On Hostinger SSH
cd public_html
git clone your-repo-url .
npm install
npm run build
```

## Step 5: Configure Node.js on Hostinger

### 5.1 Set Up Node.js Application
1. In Hostinger panel, go to Advanced → Node.js
2. Create new Node.js application:
   - Node.js version: 18.x or higher
   - Application mode: Production
   - Application root: public_html
   - Application URL: your-domain.com
   - Application startup file: server.js

### 5.2 Set Environment Variables
In the Node.js configuration:
1. Click "Edit" on your app
2. Add environment variables:
   - `NODE_ENV` = `production`
   - `PORT` = `3000` (or assigned port)
   - Add all variables from `.env.production`

### 5.3 Install Dependencies
If you didn't upload node_modules:
1. SSH into your Hostinger account
2. Navigate to your app directory
3. Run: `npm install --production`

## Step 6: Start the Application

### 6.1 Using Hostinger Panel
1. In Node.js configuration
2. Click "Start" or "Restart" application

### 6.2 Using PM2 (Recommended)
If PM2 is available:
```bash
# Install PM2 globally (if not installed)
npm install -g pm2

# Start your app
pm2 start server.js --name "lifenavigator"

# Save PM2 configuration
pm2 save
pm2 startup
```

## Step 7: Configure Domain

### 7.1 Update Domain Settings
1. In Hostinger DNS settings
2. Point your domain to the Node.js application
3. Enable SSL certificate (Let's Encrypt)

### 7.2 Update Next.js for Production URL
Update your `.env` on Hostinger:
```
NEXTAUTH_URL=https://your-domain.com
```

## Step 8: Post-Deployment Checks

### 8.1 Test Core Functions
- [ ] Homepage loads
- [ ] User can sign up
- [ ] User can log in
- [ ] Dashboard displays correctly
- [ ] Disaster preparedness page works
- [ ] Database connections work

### 8.2 Monitor Logs
Check application logs in Hostinger:
- Node.js application logs
- Error logs
- Access logs

## Troubleshooting

### Common Issues:

1. **500 Internal Server Error**
   - Check Node.js is running
   - Verify all environment variables are set
   - Check error logs

2. **Database Connection Failed**
   - Verify Supabase credentials
   - Check if Hostinger IP needs whitelisting

3. **Styles Not Loading**
   - Ensure `.next/static` folder uploaded
   - Check public folder permissions

4. **Application Won't Start**
   - Verify Node.js version compatibility
   - Check package.json dependencies
   - Ensure port is not in use

### Useful Commands:
```bash
# Check if app is running
pm2 list

# View logs
pm2 logs lifenavigator

# Restart app
pm2 restart lifenavigator

# Check Node.js version
node --version
```

## Maintenance

### Updating the Application:
1. Build new version locally
2. Upload new `.next` folder
3. Restart Node.js application

### Database Backups:
- Supabase automatically backs up your database
- Download backups from Supabase dashboard regularly

### Monitoring:
- Set up uptime monitoring (e.g., UptimeRobot)
- Monitor Supabase usage dashboard
- Check Hostinger resource usage

## Security Checklist

- [ ] Environment variables not exposed
- [ ] HTTPS enabled
- [ ] Database credentials secure
- [ ] No sensitive data in public folders
- [ ] Regular security updates applied

## Support Resources

- Hostinger Support: https://www.hostinger.com/support
- Supabase Docs: https://supabase.com/docs
- Next.js Deployment: https://nextjs.org/docs/deployment

---

Remember to keep your local `.env.local` and production `.env` files synchronized when adding new features!