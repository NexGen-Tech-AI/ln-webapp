#!/bin/bash

# Database Migration Script
# This script applies all migrations and optimizations to your Supabase database

echo "🚀 Starting database migration and optimization..."

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

# Check if required environment variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: Supabase credentials not found in .env.local"
    exit 1
fi

# Extract project ref from Supabase URL
PROJECT_REF=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's/https:\/\/\([^.]*\).supabase.co/\1/')

echo "📊 Project Reference: $PROJECT_REF"

# Function to run SQL file
run_migration() {
    local file=$1
    local description=$2
    
    echo "⏳ Running: $description"
    
    # Use Supabase CLI or direct connection
    if command -v supabase &> /dev/null; then
        supabase db push --file "$file" --project-ref "$PROJECT_REF"
    else
        # Alternative: Use psql with connection string
        DATABASE_URL="postgresql://postgres:$SUPABASE_SERVICE_ROLE_KEY@db.$PROJECT_REF.supabase.co:5432/postgres"
        psql "$DATABASE_URL" -f "$file"
    fi
    
    if [ $? -eq 0 ]; then
        echo "✅ Success: $description"
    else
        echo "❌ Failed: $description"
        return 1
    fi
}

# Apply migrations in order
echo "📝 Applying database migrations..."

# Base schema (if not already applied)
if [ -f "supabase/schema.sql" ]; then
    run_migration "supabase/schema.sql" "Base schema"
fi

# Apply all migrations in order
for migration in supabase/migrations/*.sql; do
    if [ -f "$migration" ]; then
        filename=$(basename "$migration")
        run_migration "$migration" "$filename"
    fi
done

echo "
✨ Database migration complete!

Next steps:
1. Test the application: npm run dev
2. Check Supabase dashboard for table data
3. Monitor performance with the new indexes

Performance tips:
- The dashboard_stats materialized view speeds up analytics
- Run 'SELECT refresh_dashboard_stats();' periodically
- Monitor slow queries in performance_logs table
"

# Create a SQL script for manual verification
cat > verify_migration.sql << 'EOF'
-- Verify Migration Success
-- Run this in Supabase SQL editor to check everything is set up correctly

-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check user count and stats
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN email_verified THEN 1 END) as verified_users,
    COUNT(CASE WHEN user_type = 'pilot' THEN 1 END) as pilot_users
FROM public.users;

-- Check materialized view
SELECT * FROM public.dashboard_stats;

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
EOF

echo "
📋 Created verify_migration.sql - Run this in Supabase SQL editor to verify the migration.
"