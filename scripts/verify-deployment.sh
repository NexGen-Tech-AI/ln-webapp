#!/bin/bash

# Deployment Verification Script
# Tests all critical features after deployment

set -e

# Configuration
SITE_URL="${SITE_URL:-http://localhost:3000}"
SUPABASE_URL="https://wcsqkdooarbolnxppczi.supabase.co"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "🔍 Verifying LifeNavigator deployment..."
echo "Testing URL: $SITE_URL"
echo ""

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

# Function to test endpoint
test_endpoint() {
    local endpoint=$1
    local expected_status=$2
    local description=$3
    
    echo -n "Testing $description... "
    
    status=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL$endpoint" || echo "000")
    
    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✓${NC} (Status: $status)"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗${NC} (Expected: $expected_status, Got: $status)"
        ((TESTS_FAILED++))
    fi
}

# Function to test Supabase connection
test_supabase() {
    echo -n "Testing Supabase connection... "
    
    status=$(curl -s -o /dev/null -w "%{http_code}" "$SUPABASE_URL/rest/v1/" \
        -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" || echo "000")
    
    if [ "$status" = "200" ] || [ "$status" = "401" ]; then
        echo -e "${GREEN}✓${NC} (Connected)"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗${NC} (Status: $status)"
        ((TESTS_FAILED++))
    fi
}

# 1. Test main pages
echo "📄 Testing main pages..."
test_endpoint "/" "200" "Homepage"
test_endpoint "/login" "200" "Login page"
test_endpoint "/signup" "200" "Signup page"
test_endpoint "/disaster-preparedness" "200" "Disaster preparedness"
echo ""

# 2. Test API endpoints
echo "🔌 Testing API endpoints..."
test_endpoint "/api/analytics/pageview" "405" "Analytics pageview (expects POST)"
test_endpoint "/api/referral/credits" "401" "Referral credits (requires auth)"
echo ""

# 3. Test static assets
echo "📦 Testing static assets..."
test_endpoint "/_next/static/css/" "404" "CSS assets directory"
test_endpoint "/favicon.ico" "200" "Favicon"
echo ""

# 4. Test Supabase connection
echo "🔗 Testing database connection..."
if [ -n "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    test_supabase
else
    echo -e "${YELLOW}⚠${NC} Skipping - NEXT_PUBLIC_SUPABASE_ANON_KEY not set"
fi
echo ""

# 5. Test referral links
echo "🔗 Testing referral system..."
test_endpoint "/referral/TEST123" "200" "Referral link"
echo ""

# 6. Test OAuth callback
echo "🔐 Testing OAuth callback..."
test_endpoint "/auth/callback" "302" "Auth callback (should redirect)"
echo ""

# Summary
echo "======================================="
echo "Test Summary:"
echo -e "  Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "  Failed: ${RED}$TESTS_FAILED${NC}"
echo "======================================="

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please check the deployment.${NC}"
    exit 1
fi