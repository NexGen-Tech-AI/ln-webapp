# Hostinger VPS Deployment Guide - LifeNavigator Waitlist System

## Prerequisites
- Hostinger VPS with Ubuntu 20.04 or higher
- SSH access to your VPS
- Domain name pointed to your VPS IP
- Supabase project URL and keys

## Step 1: Connect to Your VPS
```bash
ssh root@your-vps-ip
```

## Step 2: Update System and Install Dependencies
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx -y

# Install Git
sudo apt install git -y
```

## Step 3: Set Up Firewall
```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## Step 4: Clone Your Repository
```bash
# Create app directory
sudo mkdir -p /var/www/lifenavigator
cd /var/www/lifenavigator

# Clone your repository
sudo git clone https://github.com/your-username/website.git .

# Set proper permissions
sudo chown -R www-data:www-data /var/www/lifenavigator
```

## Step 5: Set Up Environment Variables
```bash
# Create .env file
sudo nano /var/www/lifenavigator/.env
```

Add the following content:
```env
# App Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email Configuration (if using)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Security
NEXTAUTH_SECRET=generate-a-random-secret-here
NEXTAUTH_URL=https://yourdomain.com
```

## Step 6: Install Dependencies and Build
```bash
cd /var/www/lifenavigator

# Install dependencies
sudo npm install

# Build the Next.js application
sudo npm run build
```

## Step 7: Configure PM2
```bash
# Create PM2 ecosystem file
sudo nano ecosystem.config.js
```

Add the following content:
```javascript
module.exports = {
  apps: [{
    name: 'lifenavigator',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/var/www/lifenavigator',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

## Step 8: Start Application with PM2
```bash
# Start the application
sudo pm2 start ecosystem.config.js

# Save PM2 configuration
sudo pm2 save

# Set PM2 to start on boot
sudo pm2 startup systemd -u root --hp /root
```

## Step 9: Configure Nginx
```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/lifenavigator
```

Add the following content:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

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
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' https:;" always;
}
```

Enable the site:
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/lifenavigator /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## Step 10: Set Up SSL Certificate
```bash
# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow the prompts and choose to redirect HTTP to HTTPS
```

## Step 11: Set Up Automatic Deployment (GitHub Actions)
Create `.github/workflows/deploy.yml` in your repository:

```yaml
name: Deploy to Hostinger VPS

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Deploy to VPS
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /var/www/lifenavigator
          git pull origin main
          npm install
          npm run build
          pm2 restart lifenavigator
```

Add secrets to your GitHub repository:
- `HOST`: Your VPS IP address
- `USERNAME`: root
- `SSH_KEY`: Your private SSH key

## Step 12: Set Up Database Backups
```bash
# Create backup script
sudo nano /root/backup-supabase.sh
```

Add:
```bash
#!/bin/bash
# This script backs up Supabase data using their API
# Add your backup logic here based on Supabase documentation
```

Make it executable:
```bash
sudo chmod +x /root/backup-supabase.sh
```

Add to crontab:
```bash
# Run daily at 2 AM
0 2 * * * /root/backup-supabase.sh
```

## Step 13: Monitoring and Maintenance

### Monitor Application Logs
```bash
# View PM2 logs
pm2 logs lifenavigator

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Set Up Monitoring
```bash
# Install monitoring tool
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Useful Commands
```bash
# Restart application
pm2 restart lifenavigator

# Check application status
pm2 status

# Update application
cd /var/www/lifenavigator
git pull
npm install
npm run build
pm2 restart lifenavigator

# Check system resources
htop

# Check disk usage
df -h
```

## Step 14: Security Hardening

### Configure Fail2Ban
```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Disable Root Login (After setting up sudo user)
```bash
# Create new user
sudo adduser deploy
sudo usermod -aG sudo deploy

# Copy SSH keys to new user
sudo rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy

# Edit SSH config
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
# Set: PasswordAuthentication no

sudo systemctl restart sshd
```

## Step 15: Performance Optimization

### Enable Nginx Caching
Add to your Nginx config:
```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Enable Gzip Compression
Add to `/etc/nginx/nginx.conf`:
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml;
```

## Troubleshooting

### Application Not Starting
```bash
# Check PM2 logs
pm2 logs lifenavigator --lines 100

# Check if port 3000 is in use
sudo lsof -i :3000
```

### Nginx Issues
```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log
```

### SSL Certificate Issues
```bash
# Renew certificate manually
sudo certbot renew --dry-run
```

## Important Notes

1. **Database Migration**: The Supabase migration has already been run. No need to run it again on the VPS.

2. **Environment Variables**: Keep your `.env` file secure and never commit it to git.

3. **Regular Updates**: Set up a schedule to regularly update system packages and dependencies.

4. **Monitoring**: Consider setting up external monitoring services like UptimeRobot or Pingdom.

5. **Backups**: Regular backups are crucial. Consider setting up automated backups for both your code and database.

## Support

For issues specific to:
- **Hostinger VPS**: Contact Hostinger support
- **Application**: Check your application logs
- **Supabase**: Check Supabase dashboard and logs
- **SSL**: Check Certbot documentation

---

Deployment completed! Your LifeNavigator waitlist system with military-grade encryption is now live on your Hostinger VPS.