#!/bin/bash

# Build script for Hostinger deployment
echo "Building LifeNavigator for production..."

# Install dependencies
npm install

# Build the Next.js app
npm run build

# Create deployment package
echo "Creating deployment package..."
mkdir -p dist

# Copy built files
cp -r .next dist/
cp -r public dist/
cp package.json dist/
cp package-lock.json dist/

# Create .htaccess for Hostinger
cat > dist/.htaccess << 'EOF'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^(.*)$ /index.js [L]
</IfModule>
EOF

# Create start script for Hostinger
cat > dist/index.js << 'EOF'
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = false
const hostname = 'localhost'
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port, dir: __dirname })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  }).listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})
EOF

echo "Build complete! Upload the 'dist' folder contents to your Hostinger hosting."
echo ""
echo "Don't forget to:"
echo "1. Set up Node.js on your Hostinger hosting"
echo "2. Upload your environment variables in Hostinger's control panel"
echo "3. Run 'npm install' in the hosting directory"
echo "4. Set up PM2 or similar to keep the app running"