#!/bin/bash

# This script uses the Supabase CLI to apply the database fix

# First, check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Get the project ref from the URL
SUPABASE_URL=$(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d '=' -f2)
PROJECT_REF=$(echo $SUPABASE_URL | sed 's/https:\/\/\([^.]*\).supabase.co/\1/')

echo "Project Reference: $PROJECT_REF"

# Link to your project (you'll need to login first time)
supabase link --project-ref $PROJECT_REF

# Apply the SQL migration
echo "Applying database fix..."
supabase db execute -f fix-signup-trigger.sql

echo "Database fix applied successfully!"