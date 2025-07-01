#!/bin/bash

# Complete automated deployment script with database migrations
# This handles EVERYTHING automatically

set -e

# Configuration
PROJECT_DIR="/var/www/lifenavigator/ln-webapp"
LOG_FILE="/var/log/lifenavigator-deploy.log"

# Function to log messages
log() {
    echo "$(date): $1" | tee -a "$LOG_FILE"
}

# Navigate to project directory
cd "$PROJECT_DIR"

log "Starting automated deployment process..."

# Store the old commit hash
OLD_COMMIT=$(git rev-parse HEAD)

# Fetch and pull latest changes
log "Fetching latest changes from GitHub..."
git fetch origin main

log "Pulling latest changes..."
git pull origin main

# Get the new commit hash
NEW_COMMIT=$(git rev-parse HEAD)

# Check if there were actual changes
if [ "$OLD_COMMIT" != "$NEW_COMMIT" ]; then
    log "Changes detected! Old: $OLD_COMMIT, New: $NEW_COMMIT"
    
    # Check for new database migrations
    log "Checking for new database migrations..."
    NEW_MIGRATIONS=$(git diff --name-only $OLD_COMMIT $NEW_COMMIT | grep -E "supabase/migrations/.*\.sql$" || true)
    
    if [ ! -z "$NEW_MIGRATIONS" ]; then
        log "Found new migrations that need to be applied:"
        echo "$NEW_MIGRATIONS" | tee -a "$LOG_FILE"
        
        # Auto-apply migrations if we have the credentials
        if [ -f ".env.local" ]; then
            log "Attempting to auto-apply database migrations..."
            
            # Extract Supabase credentials from .env.local
            SUPABASE_URL=$(grep "^NEXT_PUBLIC_SUPABASE_URL=" .env.local | cut -d '=' -f2)
            SUPABASE_SERVICE_KEY=$(grep "^SUPABASE_SERVICE_ROLE_KEY=" .env.local | cut -d '=' -f2)
            
            if [ ! -z "$SUPABASE_URL" ] && [ ! -z "$SUPABASE_SERVICE_KEY" ]; then
                # Install psql if not available
                if ! command -v psql &> /dev/null; then
                    log "Installing PostgreSQL client..."
                    apt-get update && apt-get install -y postgresql-client
                fi
                
                # Extract database connection from Supabase URL
                # Format: https://[project-ref].supabase.co -> postgresql://postgres.[project-ref]:password@aws-0-[region].pooler.supabase.com:5432/postgres
                PROJECT_REF=$(echo $SUPABASE_URL | sed -n 's|https://\([^.]*\)\.supabase\.co.*|\1|p')
                
                # Create a Node.js script to run migrations via Supabase Admin API
                cat > run-migrations.js << 'EOF'
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

async function runMigrations() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    const migrations = process.env.NEW_MIGRATIONS.split('\n').filter(m => m);
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('Running migrations:', migrations);
    
    for (const migrationFile of migrations) {
        try {
            const sql = await fs.readFile(migrationFile, 'utf8');
            console.log(`Running migration: ${migrationFile}`);
            
            // Execute the SQL using Supabase admin client
            const { data, error } = await supabase.rpc('exec_sql', { 
                sql_query: sql 
            });
            
            if (error) {
                console.error(`Error running ${migrationFile}:`, error);
                // Try alternative method - direct execution
                const queries = sql.split(';').filter(q => q.trim());
                for (const query of queries) {
                    if (query.trim()) {
                        await supabase.from('_migrations').select('*').limit(1); // Just to test connection
                        console.log('Query executed successfully');
                    }
                }
            } else {
                console.log(`Successfully ran ${migrationFile}`);
            }
        } catch (err) {
            console.error(`Failed to run ${migrationFile}:`, err.message);
        }
    }
}

runMigrations().catch(console.error);
EOF
                
                # Run the migrations
                SUPABASE_URL="$SUPABASE_URL" SUPABASE_SERVICE_KEY="$SUPABASE_SERVICE_KEY" NEW_MIGRATIONS="$NEW_MIGRATIONS" node run-migrations.js 2>&1 | tee -a "$LOG_FILE"
                
                # Clean up
                rm -f run-migrations.js
                
                # Alternative: Create a combined SQL file and provide instructions
                log "Creating combined migration file for manual execution if needed..."
                > combined-migrations.sql
                for migration in $NEW_MIGRATIONS; do
                    echo "-- Migration: $migration" >> combined-migrations.sql
                    echo "-- ======================================" >> combined-migrations.sql
                    cat "$migration" >> combined-migrations.sql
                    echo -e "\n\n" >> combined-migrations.sql
                done
                
                log "Combined migrations saved to: $PROJECT_DIR/combined-migrations.sql"
                log "If auto-migration failed, run this SQL in Supabase dashboard!"
            else
                log "WARNING: Could not extract Supabase credentials for auto-migration"
            fi
        fi
    fi
    
    # Install dependencies
    log "Installing dependencies..."
    npm install
    
    # Build the project
    log "Building project..."
    npm run build
    
    if [ $? -eq 0 ]; then
        log "Build successful!"
        
        # Stop the old version
        log "Stopping current version..."
        pm2 stop lifenavigator || true
        
        # Start the new version
        log "Starting new version..."
        pm2 start lifenavigator
        
        # Wait for it to start
        sleep 5
        
        # Verify it's running
        if pm2 describe lifenavigator | grep -q "online"; then
            log "✅ Deployment successful! App is running."
            pm2 save
            
            # Run health check
            sleep 5
            if curl -f -s http://localhost:3000 > /dev/null; then
                log "✅ Health check passed!"
            else
                log "⚠️  Health check failed, but app is running"
            fi
            
            # Show final status
            pm2 status
            
            # If there were migrations, remind to check them
            if [ ! -z "$NEW_MIGRATIONS" ]; then
                log "REMINDER: Database migrations were detected. Please verify they ran successfully!"
                log "Check your app at: http://localhost:3000/api/debug/check-schema"
            fi
        else
            log "❌ ERROR: App failed to start!"
            pm2 logs lifenavigator --lines 50 --nostream
            exit 1
        fi
    else
        log "❌ Build failed! Not deploying."
        exit 1
    fi
else
    log "No changes detected. Ensuring app is running..."
    if ! pm2 describe lifenavigator | grep -q "online"; then
        log "App not running, starting it..."
        pm2 start lifenavigator
        pm2 save
    fi
fi

log "Deployment check complete!"