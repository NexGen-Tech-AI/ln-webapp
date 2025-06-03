#!/bin/bash

# Hostinger Deployment Script
# This script handles the deployment process to Hostinger VPS

set -e

echo "🚀 Starting Hostinger deployment..."

# Configuration
REMOTE_USER=${HOSTINGER_USER:-"root"}
REMOTE_HOST=${HOSTINGER_HOST:-"your-vps-ip"}
REMOTE_DIR=${HOSTINGER_DIR:-"/var/www/lifenav"}
PM2_APP_NAME="lifenav-waitlist"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Function to check if command was successful
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1${NC}"
    else
        echo -e "${RED}✗ $1 failed${NC}"
        exit 1
    fi
}

# Build the application
echo "📦 Building application..."
npm run build
check_status "Build"

# Create deployment package
echo "📋 Creating deployment package..."
rm -rf .deploy
mkdir -p .deploy

# Copy necessary files
cp -r .next .deploy/
cp -r public .deploy/
cp package*.json .deploy/
cp server.js .deploy/
cp ecosystem.config.js .deploy/
cp next.config.js .deploy/

# Create .env.local from environment variables
if [ -f .env.production ]; then
    cp .env.production .deploy/.env.local
else
    echo "⚠️  Warning: .env.production not found"
fi

check_status "Package creation"

# Compress the deployment package
echo "🗜️  Compressing files..."
cd .deploy
tar -czf ../deploy.tar.gz .
cd ..
check_status "Compression"

# Upload to server
echo "📤 Uploading to server..."
scp deploy.tar.gz $REMOTE_USER@$REMOTE_HOST:/tmp/
check_status "Upload"

# Deploy on server
echo "🔧 Deploying on server..."
ssh $REMOTE_USER@$REMOTE_HOST << 'ENDSSH'
set -e

# Navigate to app directory
cd /var/www/lifenav || mkdir -p /var/www/lifenav && cd /var/www/lifenav

# Backup current deployment
if [ -d ".next" ]; then
    echo "Backing up current deployment..."
    rm -rf backup
    mkdir backup
    cp -r .next backup/
    cp -r public backup/
fi

# Extract new deployment
echo "Extracting new files..."
tar -xzf /tmp/deploy.tar.gz
rm /tmp/deploy.tar.gz

# Install production dependencies
echo "Installing dependencies..."
npm ci --production

# Restart application with PM2
echo "Restarting application..."
pm2 reload ecosystem.config.js --update-env
pm2 save

# Clean up old backups (keep last 3)
ls -t backup_* 2>/dev/null | tail -n +4 | xargs -r rm -rf

echo "✅ Deployment complete!"
ENDSSH

check_status "Server deployment"

# Clean up local files
rm -rf .deploy deploy.tar.gz

echo -e "${GREEN}🎉 Deployment successful!${NC}"
echo "Your application is now live at: https://lifenav.ai"

# Health check
echo "🏥 Running health check..."
sleep 5
curl -f -s -o /dev/null https://lifenav.ai || echo -e "${RED}⚠️  Health check failed${NC}"