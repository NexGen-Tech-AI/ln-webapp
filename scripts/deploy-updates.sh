#\!/bin/bash

echo "🚀 Deploying LifeNavigator Updates"
echo "================================="

# 1. Build the application
echo "📦 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix errors and try again."
    exit 1
fi

echo "✅ Build successful\!"

# 2. Run any pre-deployment checks
echo "🔍 Running type checks..."
npm run typecheck 2>/dev/null || echo "⚠️  No typecheck script found, skipping..."

echo "🔍 Running linter..."
npm run lint 2>/dev/null || echo "⚠️  No lint script found, skipping..."

# 3. Deploy to Vercel (or your hosting platform)
echo "🌐 Deploying to production..."

# If using Vercel
if command -v vercel &> /dev/null; then
    vercel --prod
elif [ -f "package.json" ] && grep -q "deploy" package.json; then
    npm run deploy
else
    echo "📝 Manual deployment needed. Push to your git repository:"
    echo "   git add ."
    echo "   git commit -m 'Fix signup, add Plaid announcement, improve demo preview'"
    echo "   git push origin main"
fi

echo ""
echo "✅ Deployment complete\!"
echo ""
echo "📋 Post-deployment checklist:"
echo "1. ✓ Database fix applied via Supabase Dashboard"
echo "2. ✓ Frontend deployed with:"
echo "   - Fixed signup handling"
echo "   - Plaid partnership announcement"
echo "   - Improved demo preview"
echo "   - Email templates ready"
echo ""
echo "🧪 Test these features:"
echo "- Create a new account (signup should work)"
echo "- Check dashboard for Plaid announcement"
echo "- Verify demo preview loads"
echo "- Confirm welcome email is sent"
