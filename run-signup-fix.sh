#!/bin/bash

# Get Supabase credentials from .env.local
export SUPABASE_URL=$(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d '=' -f2)
export SUPABASE_SERVICE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d '=' -f2)

echo "Applying signup fix to Supabase..."

# Apply the fix using psql through Supabase API
curl -X POST "$SUPABASE_URL/rest/v1/rpc/query" \
  -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d @- <<EOF
{
  "query": "$(cat fix-signup-trigger.sql | sed 's/"/\\"/g' | tr '\n' ' ')"
}
EOF

echo "Fix applied. Testing signup functionality..."

# You can also use the Supabase CLI if installed
# supabase db push --db-url "$SUPABASE_URL"