#!/bin/bash

# Deploy Updates Script for Referral System & Enhanced Security
# This script helps deploy all the necessary updates to Supabase

set -e  # Exit on error

echo "🚀 Starting deployment of referral system and security updates..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command_exists npx; then
    echo -e "${RED}❌ npx is not installed. Please install Node.js and npm.${NC}"
    exit 1
fi

if ! command_exists supabase; then
    echo -e "${YELLOW}⚠️  Supabase CLI not found. Installing...${NC}"
    npm install -g supabase
fi

# Check for required environment variables
if [ -z "$SUPABASE_PROJECT_REF" ]; then
    echo -e "${RED}❌ SUPABASE_PROJECT_REF environment variable is not set${NC}"
    echo "Please set it with: export SUPABASE_PROJECT_REF=your-project-ref"
    exit 1
fi

# Step 1: Link to Supabase project
echo -e "\n${GREEN}1️⃣ Linking to Supabase project...${NC}"
npx supabase link --project-ref $SUPABASE_PROJECT_REF

# Step 2: Push existing migrations
echo -e "\n${GREEN}2️⃣ Pushing existing migrations...${NC}"
npx supabase db push

# Step 3: Create a backup reminder
echo -e "\n${YELLOW}⚠️  IMPORTANT: Please backup your database before proceeding!${NC}"
echo "You can create a backup in the Supabase dashboard under Settings > Backups"
read -p "Have you created a backup? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Please create a backup before continuing.${NC}"
    exit 1
fi

# Step 4: Apply the enhanced security migration
echo -e "\n${GREEN}3️⃣ Applying enhanced security migration...${NC}"
echo "Please run the following SQL in your Supabase SQL Editor:"
echo "----------------------------------------"
echo "File: /supabase/migrations/20250127_enhanced_security_rls.sql"
echo "----------------------------------------"
echo "Copy the entire content and run it in the SQL Editor"
read -p "Press enter when you've run the migration in Supabase..."

# Step 5: Verify the deployment
echo -e "\n${GREEN}4️⃣ Running verification queries...${NC}"
cat << 'EOF' > verify-deployment.sql
-- Verify functions exist
SELECT COUNT(*) as function_count
FROM pg_proc 
WHERE proname IN ('generate_secure_referral_link', 'get_referral_stats', 'encrypt_sensitive', 'decrypt_sensitive');

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'referral_tracking', 'referral_rewards', 'referral_credits');

-- Check for encrypted columns
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'users' 
AND column_name IN ('email_encrypted', 'profession_encrypted', 'company_encrypted');
EOF

echo "Please run these verification queries in your SQL Editor:"
cat verify-deployment.sql
echo "----------------------------------------"

# Step 6: Build and deploy the application
echo -e "\n${GREEN}5️⃣ Building the application...${NC}"
npm run build

echo -e "\n${GREEN}✅ Deployment preparation complete!${NC}"
echo "Next steps:"
echo "1. Deploy your application using your preferred method (Vercel, Netlify, etc.)"
echo "2. Update environment variables in production"
echo "3. Test the referral flow using test-referral-flow.js"
echo "4. Monitor the security_audit_log table for any issues"

# Cleanup
rm -f verify-deployment.sql

echo -e "\n${GREEN}🎉 Done! Your referral system and security updates are ready to deploy.${NC}"