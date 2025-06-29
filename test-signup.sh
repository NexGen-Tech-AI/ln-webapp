#!/bin/bash

# Test the signup flow
echo "Testing signup flow..."

curl -X POST http://localhost:3000/api/test-signup-flow \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "profession": "Software Engineer", 
    "company": "Test Corp",
    "interests": ["💰 Financial Planning & Wealth Building", "📈 Investment & Portfolio Management"],
    "tierPreference": "pro"
  }' | jq .

echo -e "\n\nChecking debug endpoint for recent users..."
curl http://localhost:3000/api/debug-users | jq .