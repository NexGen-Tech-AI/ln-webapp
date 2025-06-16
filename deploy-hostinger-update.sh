#!/bin/bash

# Hostinger VPS Deployment Script
# This script updates the LifeNavigator app on Hostinger VPS

set -e  # Exit on error

echo "🚀 Starting LifeNavigator deployment to Hostinger VPS..."

# Configuration
VPS_HOST="${VPS_HOST:-your-vps-ip}"
VPS_USER="${VPS_USER:-root}"
APP_DIR="/var/www/lifenavigator"
PM2_APP_NAME="lifenavigator"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if we have VPS credentials
if [ "$VPS_HOST" = "your-vps-ip" ]; then
    print_error "Please set VPS_HOST environment variable or update the script"
    echo "Usage: VPS_HOST=your-vps-ip ./deploy-hostinger-update.sh"
    exit 1
fi

# Step 1: Build locally first
print_status "Building application locally..."
npm install
npm run build

if [ $? -ne 0 ]; then
    print_error "Build failed! Please fix errors before deploying."
    exit 1
fi

print_status "Local build successful!"

# Step 2: Create deployment package
print_status "Creating deployment package..."
tar -czf deploy.tar.gz \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='deploy.tar.gz' \
    --exclude='.env.local' \
    --exclude='.next' \
    .

# Step 3: Upload to VPS
print_status "Uploading to VPS..."
scp deploy.tar.gz ${VPS_USER}@${VPS_HOST}:/tmp/

# Step 4: Deploy on VPS
print_status "Deploying on VPS..."
ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
set -e

echo "📦 Extracting deployment package..."
cd /var/www/lifenavigator
tar -xzf /tmp/deploy.tar.gz
rm /tmp/deploy.tar.gz

echo "📋 Setting up environment..."
# Preserve existing .env.local
if [ ! -f .env.local ]; then
    echo "⚠️  No .env.local found! Please create one with production values."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install --production

echo "🏗️  Building application..."
npm run build

echo "🔄 Restarting application..."
pm2 restart lifenavigator

echo "✅ Deployment complete!"
pm2 status
ENDSSH

# Step 5: Cleanup
print_status "Cleaning up..."
rm deploy.tar.gz

# Step 6: Verify deployment
print_status "Verifying deployment..."
sleep 5  # Give the app time to start

# Check if the app is responding
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://${VPS_HOST}:3000 || echo "000")

if [ "$HEALTH_CHECK" = "200" ]; then
    print_status "Deployment successful! App is running."
    echo ""
    echo "🎉 LifeNavigator has been successfully deployed!"
    echo "🌐 Visit your site to verify everything is working correctly."
    echo ""
    echo "📝 Post-deployment checklist:"
    echo "  1. Test user registration and login"
    echo "  2. Test OAuth providers"
    echo "  3. Test referral links"
    echo "  4. Check analytics tracking"
    echo "  5. Monitor logs: ssh ${VPS_USER}@${VPS_HOST} 'pm2 logs lifenavigator'"
else
    print_error "Health check failed! HTTP status: $HEALTH_CHECK"
    echo "Check logs with: ssh ${VPS_USER}@${VPS_HOST} 'pm2 logs lifenavigator'"
    exit 1
fi