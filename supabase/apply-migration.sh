#!/bin/bash

# Script to apply database migrations to Supabase

echo "🚀 Applying database migrations to fix signup issues..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local file not found!"
    echo "Please create .env.local with your Supabase credentials"
    exit 1
fi

# Load environment variables
export $(grep -v '^#' .env.local | xargs)

# Check if required variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: Required environment variables not found!"
    echo "Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local"
    exit 1
fi

# Extract project ref from URL
PROJECT_REF=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed -n 's/https:\/\/\(.*\)\.supabase\.co/\1/p')

echo "📍 Project Reference: $PROJECT_REF"
echo "🔧 Applying migration: fix_signup_trigger.sql"

# Apply the migration using Supabase CLI or direct SQL
# Note: You need to run this SQL in your Supabase dashboard SQL editor
echo ""
echo "⚠️  Please run the following steps in your Supabase Dashboard:"
echo ""
echo "1. Go to: $NEXT_PUBLIC_SUPABASE_URL"
echo "2. Navigate to SQL Editor"
echo "3. Create a new query"
echo "4. Copy and paste the contents of: supabase/migrations/fix_signup_trigger.sql"
echo "5. Run the query"
echo ""
echo "📝 The migration will:"
echo "   - Fix the trigger to handle user metadata properly"
echo "   - Prevent null values during signup"
echo "   - Add email verification trigger"
echo "   - Use UPSERT to handle race conditions"
echo ""
echo "After running the migration, your signup process should work correctly!"