#!/bin/bash

# This script connects directly to your Supabase PostgreSQL database

# Get credentials
SUPABASE_URL=$(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d '=' -f2)
PROJECT_REF=$(echo $SUPABASE_URL | sed 's/https:\/\/\([^.]*\).supabase.co/\1/')

echo "To apply the fix directly:"
echo "1. Go to your Supabase dashboard"
echo "2. Settings > Database"
echo "3. Find your connection string"
echo "4. Run: psql 'your-connection-string' -f fix-signup-trigger.sql"
echo ""
echo "Or use the connection pooler URL for better performance"

# Alternative: Use Supabase Management API (requires access token)
echo ""
echo "To use Supabase Management API:"
echo "1. Get your access token from: https://app.supabase.com/account/tokens"
echo "2. Run the following command:"
echo ""
echo "curl -X POST \\"
echo "  https://api.supabase.com/v1/projects/$PROJECT_REF/database/query \\"
echo "  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"query\": \"'$(cat fix-signup-trigger.sql | sed ':a;N;$!ba;s/\n/ /g' | sed 's/"/\\"/g')'\"}'"