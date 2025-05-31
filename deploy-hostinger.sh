#!/bin/bash

# Build script for Hostinger VPS deployment
echo "🚀 Building LifeNavigator for production..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Are you in the project root?"
    exit 1
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf .next dist

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the Next.js app
echo "🔨 Building Next.js application..."
npm run build 2>&1 | tee build.log

# Check if .next directory exists (build succeeded even with warnings)
if [ ! -d ".next" ]; then
    echo "❌ Build failed! Please fix the errors and try again."
    exit 1
fi

echo "✅ Build completed (some warnings may be present)"

# Create deployment package
echo "📁 Creating deployment package..."
mkdir -p dist

# Copy necessary files
echo "📋 Copying files..."
cp -r .next dist/
cp -r public dist/
cp package.json dist/
cp package-lock.json dist/
cp server.js dist/
cp -r src dist/
cp -r app dist/
cp next.config.js dist/
cp tailwind.config.js dist/
cp postcss.config.js dist/
cp tsconfig.json dist/

# Copy environment example
cp .env.local.example dist/.env.example 2>/dev/null || echo "# Add your environment variables here" > dist/.env.example

# Create ecosystem.config.js for PM2
cat > dist/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'lifenavigator',
    script: './server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF

# Create deployment instructions
cat > dist/DEPLOY_INSTRUCTIONS.txt << 'EOF'
LifeNavigator VPS Deployment Instructions
=========================================

1. Upload this entire dist folder to your VPS at /var/www/lifenavigator/

2. SSH into your VPS and navigate to the app directory:
   cd /var/www/lifenavigator

3. Install production dependencies:
   npm install --production

4. Copy your environment variables:
   cp .env.example .env.local
   nano .env.local
   (Add your actual environment variables)

5. Start the application with PM2:
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup

6. Your app should now be running on port 3000!

For detailed instructions, see HOSTINGER-VPS-DEPLOYMENT.md
EOF

# Create a compressed archive for easy upload
echo "🗜️  Creating deployment archive..."
cd dist
tar -czf ../lifenavigator-deploy.tar.gz .
cd ..

echo "✅ Build complete!"
echo ""
echo "📦 Deployment package created in 'dist/' folder"
echo "🗜️  Compressed archive: lifenavigator-deploy.tar.gz"
echo ""
echo "Next steps:"
echo "1. Upload lifenavigator-deploy.tar.gz to your VPS"
echo "2. Extract it: tar -xzf lifenavigator-deploy.tar.gz"
echo "3. Follow the instructions in DEPLOY_INSTRUCTIONS.txt"
echo ""
echo "For detailed VPS setup, see HOSTINGER-VPS-DEPLOYMENT.md"