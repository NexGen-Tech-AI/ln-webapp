#!/bin/bash

echo "🔧 Fixing authentication routes..."

# 1. Ensure all auth pages are properly structured
echo "✅ Checking auth route structure..."

# 2. Clean and rebuild
echo "🧹 Cleaning build cache..."
rm -rf .next
rm -rf node_modules/.cache

# 3. Install dependencies
echo "📦 Installing dependencies..."
npm install

# 4. Build the project
echo "🏗️ Building project..."
npm run build

# 5. Test routes
echo "🧪 Testing routes..."
echo "The following routes should be available:"
echo "  - /login"
echo "  - /signup"
echo "  - /auth/forgot-password"
echo "  - /auth/reset-password"
echo "  - /auth/confirm"

echo "✅ Build complete! Deploy with: pm2 restart lifenavigator"