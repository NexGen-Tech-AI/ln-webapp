#!/bin/bash

# Ultimate Automated Deployment Script
# This handles EVERYTHING: code updates, dependencies, migrations, building, and restarting

set -e

# Configuration
PROJECT_DIR="${PROJECT_DIR:-/var/www/lifenavigator/ln-webapp}"
NODE_ENV="${NODE_ENV:-production}"
APP_NAME="${APP_NAME:-lifenavigator}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Change to project directory
cd "$PROJECT_DIR"
log "Working in: $PROJECT_DIR"

# Store current commit
OLD_COMMIT=$(git rev-parse HEAD)

# Pull latest changes
log "Fetching latest changes..."
git fetch origin main

log "Pulling latest changes..."
git pull origin main

# Get new commit
NEW_COMMIT=$(git rev-parse HEAD)

if [ "$OLD_COMMIT" = "$NEW_COMMIT" ]; then
    log "No new changes detected"
    # Still ensure app is running
    if ! pm2 describe $APP_NAME | grep -q "online"; then
        warning "App not running, starting it..."
        pm2 start $APP_NAME
    fi
    exit 0
fi

log "Changes detected! Updating from $OLD_COMMIT to $NEW_COMMIT"

# Check for package.json changes
if git diff --name-only $OLD_COMMIT $NEW_COMMIT | grep -q "package.json"; then
    log "Package.json changed, installing dependencies..."
    npm ci --production=false
else
    log "No package.json changes, skipping npm install"
fi

# Check for new migrations
NEW_MIGRATIONS=$(git diff --name-only $OLD_COMMIT $NEW_COMMIT | grep -E "supabase/migrations/.*\.sql$" || true)
if [ ! -z "$NEW_MIGRATIONS" ]; then
    warning "New database migrations detected!"
    echo "$NEW_MIGRATIONS"
    
    # Run automatic migrations if script exists
    if [ -f "scripts/auto-migrate.js" ]; then
        log "Running automatic database migrations..."
        if node scripts/auto-migrate.js; then
            log "✅ Database migrations completed successfully!"
        else
            error "Database migrations failed! Check the output above."
            error "You may need to run them manually in Supabase dashboard."
        fi
    else
        warning "Auto-migration script not found. Please run these migrations manually:"
        for migration in $NEW_MIGRATIONS; do
            echo "  - $migration"
        done
    fi
fi

# Build the application
log "Building application..."
if NODE_ENV=$NODE_ENV npm run build; then
    log "✅ Build successful!"
else
    error "Build failed! Check the errors above."
    exit 1
fi

# Gracefully restart the application
log "Restarting application..."
if pm2 reload $APP_NAME --update-env; then
    log "✅ Application restarted successfully!"
else
    warning "Reload failed, trying restart..."
    pm2 restart $APP_NAME
fi

# Save PM2 configuration
pm2 save

# Wait for app to stabilize
sleep 3

# Health check
log "Running health check..."
if pm2 describe $APP_NAME | grep -q "online"; then
    log "✅ Application is online!"
    
    # Try HTTP health check
    if command -v curl &> /dev/null; then
        sleep 2
        if curl -f -s http://localhost:3000 > /dev/null; then
            log "✅ HTTP health check passed!"
        else
            warning "HTTP health check failed, but process is running"
        fi
    fi
else
    error "Application failed to start!"
    pm2 logs $APP_NAME --lines 50
    exit 1
fi

# Show summary
echo ""
log "=== Deployment Summary ==="
log "Previous version: $OLD_COMMIT"
log "Current version:  $NEW_COMMIT"
log "Status: ✅ SUCCESS"

# Show recent logs
log "Recent logs:"
pm2 logs $APP_NAME --lines 10 --nostream

echo ""
log "🚀 Deployment complete!"