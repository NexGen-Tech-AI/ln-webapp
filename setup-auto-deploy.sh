#!/bin/bash

# Setup script to enable fully automated deployments on your server
# Run this ONCE on your server to set everything up

set -e

echo "🚀 Setting up automated deployment system..."

# 1. Install required npm packages globally
echo "Installing required packages..."
npm install -g dotenv
npm install --save-dev dotenv

# 2. Make scripts executable
chmod +x deploy.sh
chmod +x scripts/auto-migrate.js

# 3. Create cron job for auto-deployment
echo "Setting up automated deployment cron job..."

# Create the cron entry
CRON_CMD="*/5 * * * * cd /var/www/lifenavigator/ln-webapp && ./deploy.sh >> /var/log/lifenavigator-auto-deploy.log 2>&1"

# Add to crontab if not already present
(crontab -l 2>/dev/null | grep -v "lifenavigator.*deploy.sh" ; echo "$CRON_CMD") | crontab -

# 4. Create PM2 ecosystem file if not exists
if [ ! -f "ecosystem.config.js" ]; then
    cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'lifenavigator',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/lifenavigator/ln-webapp',
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
};
EOF
    echo "Created PM2 ecosystem file"
fi

# 5. Create log rotation config
if [ -d "/etc/logrotate.d" ]; then
    cat > /etc/logrotate.d/lifenavigator << EOF
/var/log/lifenavigator-auto-deploy.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
    create 0644 root root
}

/var/log/pm2/*.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
    create 0644 root root
}
EOF
    echo "Set up log rotation"
fi

# 6. Initial deployment
echo "Running initial deployment..."
./deploy.sh

# 7. Set up GitHub webhook (optional)
echo ""
echo "✅ Automated deployment system is now set up!"
echo ""
echo "What's configured:"
echo "- Auto-deployment runs every 5 minutes via cron"
echo "- Database migrations run automatically when detected"
echo "- PM2 manages the application with auto-restart"
echo "- Logs are rotated daily"
echo ""
echo "To manually deploy, run: ./deploy.sh"
echo "To check deployment logs: tail -f /var/log/lifenavigator-auto-deploy.log"
echo "To check app logs: pm2 logs lifenavigator"
echo ""
echo "🎉 Your deployment is now fully automated!"