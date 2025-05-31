# Hostinger VPS Deployment Guide for LifeNavigator

## Prerequisites
- Hostinger VPS with Ubuntu 20.04 or newer
- Root or sudo access to the VPS
- Domain pointed to your VPS IP address
- Local development environment working

## Step 1: Prepare Your VPS

### 1.1 Connect to Your VPS
```bash
ssh root@your-vps-ip
```

### 1.2 Update System and Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install nginx
sudo apt install nginx -y

# Install PM2 globally
sudo npm install -g pm2

# Install Git
sudo apt install git -y

# Install build essentials
sudo apt install build-essential -y
```

### 1.3 Create Application User
```bash
# Create a non-root user for the app
sudo adduser lifenavigator
sudo usermod -aG sudo lifenavigator

# Switch to the new user
su - lifenavigator
```

## Step 2: Set Up Application Directory

### 2.1 Create App Directory
```bash
# Create application directory
sudo mkdir -p /var/www/lifenavigator
sudo chown -R lifenavigator:lifenavigator /var/www/lifenavigator
cd /var/www/lifenavigator
```

### 2.2 Clone or Upload Your Application
Option A: Using Git
```bash
git clone https://github.com/your-username/lifenavigator.git .
```

Option B: Using SCP (from your local machine)
```bash
# From your local machine
scp -r ./* lifenavigator@your-vps-ip:/var/www/lifenavigator/
```

## Step 3: Configure Environment Variables

### 3.1 Create Production Environment File
```bash
nano /var/www/lifenavigator/.env.production
```

Add your environment variables:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://wcsqkdooarbolnxppczi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email (when ready)
RESEND_API_KEY=your-resend-key
SENDGRID_API_KEY=your-sendgrid-key

# Stripe (when ready)
STRIPE_SECRET_KEY=your-stripe-secret
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable

# App
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 3.2 Copy to .env.local for Next.js
```bash
cp .env.production .env.local
```

## Step 4: Build and Prepare Application

### 4.1 Install Dependencies
```bash
cd /var/www/lifenavigator
npm install --production=false
```

### 4.2 Build the Application
```bash
npm run build
```

### 4.3 Install Production Dependencies Only
```bash
rm -rf node_modules
npm install --production
```

## Step 5: Configure PM2

### 5.1 Create PM2 Ecosystem File
```bash
nano ecosystem.config.js
```

Add this configuration:
```javascript
module.exports = {
  apps: [{
    name: 'lifenavigator',
    script: './server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
```

### 5.2 Create Logs Directory
```bash
mkdir -p logs
```

### 5.3 Start Application with PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u lifenavigator --hp /home/lifenavigator
```

## Step 6: Configure Nginx

### 6.1 Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/lifenavigator
```

Add this configuration:
```nginx
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

    location /_next/static {
        alias /var/www/lifenavigator/.next/static;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    location /public {
        alias /var/www/lifenavigator/public;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 6.2 Enable the Site
```bash
sudo ln -s /etc/nginx/sites-available/lifenavigator /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 7: Set Up SSL with Let's Encrypt

### 7.1 Install Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 7.2 Obtain SSL Certificate
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### 7.3 Auto-renewal
```bash
sudo systemctl status certbot.timer
```

## Step 8: Configure Firewall

```bash
# Allow SSH
sudo ufw allow OpenSSH

# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable
```

## Step 9: Set Up Monitoring

### 9.1 PM2 Monitoring
```bash
# View application status
pm2 status

# View logs
pm2 logs lifenavigator

# Monitor resources
pm2 monit
```

### 9.2 System Monitoring
```bash
# Install htop for system monitoring
sudo apt install htop -y
```

## Step 10: Deployment Script

Create a deployment script for future updates:
```bash
nano /var/www/lifenavigator/deploy.sh
```

```bash
#!/bin/bash
echo "Deploying LifeNavigator..."

# Pull latest changes
git pull origin main

# Install dependencies
npm install --production=false

# Build application
npm run build

# Install production dependencies
rm -rf node_modules
npm install --production

# Restart PM2
pm2 restart lifenavigator

echo "Deployment complete!"
```

Make it executable:
```bash
chmod +x deploy.sh
```

## Maintenance Commands

### Application Management
```bash
# View app status
pm2 status

# Restart app
pm2 restart lifenavigator

# Stop app
pm2 stop lifenavigator

# View logs
pm2 logs lifenavigator --lines 100

# Clear logs
pm2 flush
```

### System Maintenance
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Check disk usage
df -h

# Check memory usage
free -m

# View nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Troubleshooting

### App Won't Start
1. Check PM2 logs: `pm2 logs lifenavigator`
2. Check Node version: `node --version` (should be 18.x)
3. Verify environment variables: `pm2 env lifenavigator`

### 502 Bad Gateway
1. Check if app is running: `pm2 status`
2. Check nginx config: `sudo nginx -t`
3. Restart services:
   ```bash
   pm2 restart lifenavigator
   sudo systemctl restart nginx
   ```

### Database Connection Issues
1. Verify Supabase credentials in `.env.local`
2. Check if VPS IP needs whitelisting in Supabase
3. Test connection from VPS

## Security Checklist

- [ ] Firewall configured
- [ ] SSL certificate installed
- [ ] Non-root user for application
- [ ] Environment variables secured
- [ ] Regular system updates scheduled
- [ ] Backup strategy in place

## Backup Strategy

### Database
- Supabase handles automatic backups
- Download backups periodically from Supabase dashboard

### Application Files
```bash
# Create backup script
nano /home/lifenavigator/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/lifenavigator/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/lifenavigator_$DATE.tar.gz /var/www/lifenavigator

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

## Performance Optimization

1. **Enable Gzip Compression** in Nginx
2. **Use PM2 Cluster Mode** (already configured)
3. **Set up CDN** for static assets (optional)
4. **Monitor with PM2 Plus** (optional)

---

## Quick Start Commands

```bash
# SSH to VPS
ssh lifenavigator@your-vps-ip

# Navigate to app
cd /var/www/lifenavigator

# Deploy updates
./deploy.sh

# View logs
pm2 logs

# Monitor app
pm2 monit
```

Remember to update your domain's DNS records to point to your VPS IP address!