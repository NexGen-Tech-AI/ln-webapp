#!/bin/bash

# Quick deployment script for Hostinger VPS
# This assumes you have SSH access configured

echo "🚀 Quick Deploy to Hostinger VPS"

# Configuration
VPS_USER="root"
VPS_HOST="your-vps-ip"  # Replace with your VPS IP
APP_DIR="/var/www/lifenavigator"

# Build locally first (skip the problematic npm build)
echo "📦 Creating deployment package..."
tar -czf deploy.tar.gz --exclude='node_modules' --exclude='.git' --exclude='deploy.tar.gz' .

# Upload to VPS
echo "📤 Uploading to VPS..."
scp deploy.tar.gz $VPS_USER@$VPS_HOST:/tmp/

# Deploy on VPS
echo "🔧 Deploying on VPS..."
ssh $VPS_USER@$VPS_HOST << 'ENDSSH'
  cd /var/www/lifenavigator
  pm2 stop lifenavigator || true
  tar -xzf /tmp/deploy.tar.gz
  npm install --production
  npm run build
  pm2 restart ecosystem.config.js --env production
  pm2 save
  nginx -s reload
  rm /tmp/deploy.tar.gz
ENDSSH

# Cleanup
rm deploy.tar.gz

echo "✅ Deployment complete!"
echo "🌐 Your app should be live at your domain"