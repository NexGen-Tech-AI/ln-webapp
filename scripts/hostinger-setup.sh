#!/bin/bash

# LifeNavigator Hostinger VPS Setup Script
# This script automates the initial server setup for deployment

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting LifeNavigator VPS Setup...${NC}"

# Update system packages
echo -e "\n${YELLOW}📦 Updating system packages...${NC}"
apt update && apt upgrade -y

# Install Node.js 20.x
echo -e "\n${YELLOW}📦 Installing Node.js 20.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Verify Node.js installation
node_version=$(node -v)
echo -e "${GREEN}✅ Node.js installed: ${node_version}${NC}"

# Install Nginx
echo -e "\n${YELLOW}📦 Installing Nginx...${NC}"
apt-get install -y nginx

# Install Certbot for SSL
echo -e "\n${YELLOW}📦 Installing Certbot for SSL certificates...${NC}"
apt-get install -y certbot python3-certbot-nginx

# Install Git
echo -e "\n${YELLOW}📦 Installing Git...${NC}"
apt-get install -y git

# Install PM2 globally
echo -e "\n${YELLOW}📦 Installing PM2 process manager...${NC}"
npm install -g pm2

# Install additional useful tools
echo -e "\n${YELLOW}📦 Installing additional tools...${NC}"
apt-get install -y htop curl wget unzip

# Configure UFW Firewall
echo -e "\n${YELLOW}🔒 Configuring firewall...${NC}"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# Create application directory
echo -e "\n${YELLOW}📁 Creating application directory...${NC}"
mkdir -p /var/www/lifenavigator

# Create a deploy user (optional but recommended)
echo -e "\n${YELLOW}👤 Creating deploy user...${NC}"
if ! id -u deploy >/dev/null 2>&1; then
    adduser --disabled-password --gecos "" deploy
    usermod -aG sudo deploy
    echo -e "${GREEN}✅ Deploy user created${NC}"
else
    echo -e "${YELLOW}ℹ️  Deploy user already exists${NC}"
fi

# Set up swap file (useful for low-memory VPS)
echo -e "\n${YELLOW}💾 Setting up swap file...${NC}"
if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
    echo -e "${GREEN}✅ 2GB swap file created${NC}"
else
    echo -e "${YELLOW}ℹ️  Swap file already exists${NC}"
fi

# Install fail2ban for security
echo -e "\n${YELLOW}🔒 Installing fail2ban...${NC}"
apt-get install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban

# Create PM2 ecosystem config template
echo -e "\n${YELLOW}📝 Creating PM2 ecosystem config template...${NC}"
cat > /var/www/lifenavigator/ecosystem.config.js.template << 'EOF'
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
    },
    error_file: '/var/log/pm2/lifenavigator-error.log',
    out_file: '/var/log/pm2/lifenavigator-out.log',
    log_file: '/var/log/pm2/lifenavigator-combined.log',
    time: true
  }]
}
EOF

# Create Nginx config template
echo -e "\n${YELLOW}📝 Creating Nginx config template...${NC}"
cat > /etc/nginx/sites-available/lifenavigator.template << 'EOF'
server {
    listen 80;
    server_name YOUR_DOMAIN www.YOUR_DOMAIN;

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
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Static file caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript application/json;
}
EOF

# Create deployment helper script
echo -e "\n${YELLOW}📝 Creating deployment helper script...${NC}"
cat > /usr/local/bin/deploy-lifenavigator << 'EOF'
#!/bin/bash
cd /var/www/lifenavigator
echo "🔄 Pulling latest changes..."
git pull origin main
echo "📦 Installing dependencies..."
npm install
echo "🏗️  Building application..."
npm run build
echo "🔄 Restarting PM2..."
pm2 restart lifenavigator
echo "✅ Deployment complete!"
EOF
chmod +x /usr/local/bin/deploy-lifenavigator

# Create log directory for PM2
mkdir -p /var/log/pm2
chown -R deploy:deploy /var/log/pm2

# Summary
echo -e "\n${GREEN}✅ VPS Setup Complete!${NC}"
echo -e "\n${YELLOW}📋 Next Steps:${NC}"
echo "1. Clone your repository to /var/www/lifenavigator"
echo "2. Copy ecosystem.config.js.template to ecosystem.config.js"
echo "3. Create .env file with your environment variables"
echo "4. Update Nginx config with your domain name"
echo "5. Run 'npm install' and 'npm run build'"
echo "6. Start the app with PM2"
echo "7. Configure SSL with Certbot"
echo -e "\n${YELLOW}🔧 Useful Commands:${NC}"
echo "- Deploy updates: deploy-lifenavigator"
echo "- Check PM2 status: pm2 status"
echo "- View logs: pm2 logs lifenavigator"
echo "- Restart app: pm2 restart lifenavigator"
echo -e "\n${GREEN}🎉 Setup script finished!${NC}"