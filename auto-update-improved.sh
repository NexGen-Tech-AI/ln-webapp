#!/bin/bash

# Exit on any error
set -e

# Navigate to project directory
cd /var/www/lifenavigator/ln-webapp

echo "$(date): Starting auto-update process..."

# Store the old commit hash
OLD_COMMIT=$(git rev-parse HEAD)

# Fetch latest changes first
echo "$(date): Fetching latest changes from GitHub..."
git fetch origin main

# Pull latest changes
echo "$(date): Pulling latest changes from GitHub..."
git pull origin main

# Get the new commit hash
NEW_COMMIT=$(git rev-parse HEAD)

# Check if there were actual changes
if [ "$OLD_COMMIT" != "$NEW_COMMIT" ]; then
    echo "$(date): Changes detected, updating..."
    echo "Old commit: $OLD_COMMIT"
    echo "New commit: $NEW_COMMIT"
    
    # Check for new migrations
    echo "$(date): Checking for new database migrations..."
    NEW_MIGRATIONS=$(git diff --name-only $OLD_COMMIT $NEW_COMMIT | grep -E "supabase/migrations/.*\.sql$" || true)
    if [ ! -z "$NEW_MIGRATIONS" ]; then
        echo "$(date): Found new migrations:"
        echo "$NEW_MIGRATIONS"
        echo "$(date): WARNING: New database migrations detected!"
        echo "$(date): Please run these migrations in Supabase dashboard before continuing."
        # Optionally, you could auto-apply migrations if you have Supabase CLI set up
        # supabase db push
    fi
    
    # Verify .env.local file exists (Next.js reads from this file, not shell env)
    echo "$(date): Checking for .env.local file..."
    if [ -f ".env.local" ]; then
        echo "$(date): Found .env.local file"
        # Just verify the file has some content
        if [ ! -s ".env.local" ]; then
            echo "$(date): WARNING - .env.local file is empty!"
        fi
    else
        echo "$(date): WARNING - .env.local file not found! App may not have database credentials!"
        echo "$(date): Continuing anyway as it might use different env setup..."
    fi
    
    # Install dependencies
    echo "$(date): Installing dependencies..."
    npm install
    
    # Stop PM2 completely before building
    echo "$(date): Stopping PM2 process..."
    pm2 stop lifenavigator || true  # Don't fail if already stopped
    
    # Clean the old build
    echo "$(date): Cleaning old build..."
    rm -rf .next
    
    # Build the project
    echo "$(date): Building project..."
    npm run build
    
    # Check if build was successful
    if [ $? -eq 0 ]; then
        echo "$(date): Build successful!"
        
        # Verify static assets are in place
        echo "$(date): Verifying static assets..."
        if [ ! -f "public/demo-screenshot.png" ]; then
            echo "$(date): WARNING - demo-screenshot.png not found in public directory!"
        fi
        
        # Copy any additional static files if needed
        # cp -r public/* .next/static/ 2>/dev/null || true
        
        echo "$(date): Starting PM2..."
        # Start PM2 with the new build
        pm2 start lifenavigator
        
        # Give the app time to start
        sleep 5
        
        # Check if the app is running
        pm2 describe lifenavigator | grep -q "online"
        if [ $? -eq 0 ]; then
            echo "$(date): App is running successfully!"
            
            # Run a health check
            echo "$(date): Running health check..."
            curl -f http://localhost:3000 > /dev/null 2>&1
            if [ $? -eq 0 ]; then
                echo "$(date): Health check passed!"
            else
                echo "$(date): WARNING - Health check failed, but app is running"
            fi
            
            # Save PM2 state
            pm2 save
            
            # Show PM2 status
            pm2 status
            
            # Show recent logs to verify no errors
            echo "$(date): Recent logs:"
            pm2 logs lifenavigator --lines 20 --nostream
            
            echo "$(date): Update complete!"
            echo "================================================"
            
            # Send notification if migrations are needed
            if [ ! -z "$NEW_MIGRATIONS" ]; then
                echo "$(date): REMINDER: Don't forget to run the database migrations!"
                # You could send an email/slack notification here
            fi
        else
            echo "$(date): ERROR - App failed to start properly!"
            echo "$(date): Showing last 50 lines of logs:"
            pm2 logs lifenavigator --lines 50 --nostream
            
            # Try to restart one more time
            echo "$(date): Attempting to restart..."
            pm2 restart lifenavigator
            sleep 3
            
            # Final status check
            pm2 describe lifenavigator | grep -q "online"
            if [ $? -eq 0 ]; then
                echo "$(date): App recovered on second attempt"
                pm2 save
            else
                echo "$(date): CRITICAL - App failed to start after multiple attempts!"
                exit 1
            fi
        fi
    else
        echo "$(date): ERROR - Build failed!"
        echo "$(date): Starting previous version..."
        pm2 start lifenavigator
        pm2 save
        echo "$(date): Reverted to previous version due to build failure"
        exit 1
    fi
else
    echo "$(date): No changes detected (already on commit $OLD_COMMIT)"
    
    # Ensure PM2 is running even if no changes
    pm2 describe lifenavigator | grep -q "online"
    if [ $? -ne 0 ]; then
        echo "$(date): App not running, starting it..."
        pm2 start lifenavigator
        pm2 save
    fi
fi

echo "$(date): Auto-update check complete"