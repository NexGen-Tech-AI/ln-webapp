#!/bin/bash

# Supabase Auth Deployment Script for Hostinger VPS
# This script prepares your app with Supabase OAuth for deployment

echo "=========================================="
echo "Supabase Auth Deployment Preparation"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed!${NC}"
    exit 1
fi

# Check for .env.production
if [ ! -f .env.production ]; then
    echo -e "${YELLOW}Creating .env.production from template...${NC}"
    cp .env.production.supabase .env.production
    echo -e "${RED}IMPORTANT: Edit .env.production with your production values!${NC}"
    exit 1
fi

# Verify critical environment variables
echo -e "\n${BLUE}Checking environment configuration...${NC}"

check_env_var() {
    if grep -q "^$1=.*_here" .env.production || ! grep -q "^$1=" .env.production; then
        echo -e "${RED}✗ $1 is not configured${NC}"
        return 1
    else
        echo -e "${GREEN}✓ $1 is configured${NC}"
        return 0
    fi
}

MISSING_VARS=0
check_env_var "NEXT_PUBLIC_SUPABASE_URL" || ((MISSING_VARS++))
check_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" || ((MISSING_VARS++))
check_env_var "SUPABASE_SERVICE_ROLE_KEY" || ((MISSING_VARS++))
check_env_var "NEXT_PUBLIC_APP_URL" || ((MISSING_VARS++))
check_env_var "RESEND_API_KEY" || ((MISSING_VARS++))

if [ $MISSING_VARS -gt 0 ]; then
    echo -e "\n${RED}Please configure all required environment variables before deployment!${NC}"
    exit 1
fi

# Build the application
echo -e "\n${BLUE}Building production application...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed! Fix errors before deployment.${NC}"
    exit 1
fi

# Create deployment directory
DEPLOY_DIR="hostinger-deploy"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

echo -e "\n${BLUE}Preparing deployment package...${NC}"

# Copy necessary files
cp -r .next $DEPLOY_DIR/
cp -r app $DEPLOY_DIR/
cp -r src $DEPLOY_DIR/
cp -r public $DEPLOY_DIR/
cp -r supabase $DEPLOY_DIR/
cp package*.json $DEPLOY_DIR/
cp next.config.js $DEPLOY_DIR/
cp middleware.ts $DEPLOY_DIR/
cp tsconfig.json $DEPLOY_DIR/
cp .env.production $DEPLOY_DIR/

# Create VPS upload script
cat > $DEPLOY_DIR/upload-to-vps.sh << 'EOF'
#!/bin/bash

# Configure your VPS details here
VPS_USER="root"
VPS_HOST="YOUR-VPS-IP"  # <-- UPDATE THIS
VPS_PATH="/var/www/your-app"

if [ "$VPS_HOST" = "YOUR-VPS-IP" ]; then
    echo "Please update VPS_HOST with your actual VPS IP address!"
    exit 1
fi

echo "Uploading to $VPS_USER@$VPS_HOST:$VPS_PATH"

# Create directory on VPS
ssh $VPS_USER@$VPS_HOST "mkdir -p $VPS_PATH"

# Upload files
echo "Uploading application files..."
scp -r .next app src public supabase package*.json next.config.js middleware.ts tsconfig.json .env.production $VPS_USER@$VPS_HOST:$VPS_PATH/

echo "Upload complete!"
echo ""
echo "Next steps on VPS:"
echo "1. SSH to VPS: ssh $VPS_USER@$VPS_HOST"
echo "2. cd $VPS_PATH"
echo "3. npm install --production"
echo "4. pm2 start ecosystem.config.js"
EOF

chmod +x $DEPLOY_DIR/upload-to-vps.sh

# Create PM2 ecosystem file
cat > $DEPLOY_DIR/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'supabase-app',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/your-app',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/app-error.log',
    out_file: '/var/log/pm2/app-out.log',
    log_file: '/var/log/pm2/app-combined.log',
    time: true,
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env_production: {
      NODE_ENV: 'production'
    }
  }]
}
EOF

# Create VPS setup script
cat > $DEPLOY_DIR/setup-vps.sh << 'EOF'
#!/bin/bash

echo "Setting up VPS for Supabase Auth deployment..."

# Update system
sudo apt-get update

# Install Node.js LTS
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt-get install -y nginx

# Create log directory
sudo mkdir -p /var/log/pm2
sudo chmod 755 /var/log/pm2

echo "VPS setup complete!"
echo "Next: Upload your files and configure Nginx"
EOF

chmod +x $DEPLOY_DIR/setup-vps.sh

# Create Nginx configuration
cat > $DEPLOY_DIR/nginx-site.conf << 'EOF'
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL configuration will be added by Certbot
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts for OAuth callbacks
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

# Create auth testing script
cat > $DEPLOY_DIR/test-auth.sh << 'EOF'
#!/bin/bash

DOMAIN="https://yourdomain.com"

echo "Testing Supabase Auth Endpoints..."
echo "=================================="

# Test main pages
echo -n "Homepage: "
curl -s -o /dev/null -w "%{http_code}\n" $DOMAIN/

echo -n "Login page: "
curl -s -o /dev/null -w "%{http_code}\n" $DOMAIN/login

echo -n "Auth callback: "
curl -s -o /dev/null -w "%{http_code}\n" $DOMAIN/auth/callback

echo -n "Admin login: "
curl -s -o /dev/null -w "%{http_code}\n" $DOMAIN/admin/login

echo -e "\nTo test OAuth providers:"
echo "1. Visit $DOMAIN/login"
echo "2. Try each social login button"
echo "3. Check PM2 logs: pm2 logs supabase-app"
EOF

chmod +x $DEPLOY_DIR/test-auth.sh

# Create deployment checklist
cat > $DEPLOY_DIR/DEPLOYMENT_CHECKLIST.md << 'EOF'
# Supabase Auth Deployment Checklist

## Before Deployment

### Supabase Dashboard Setup
- [ ] Enable OAuth providers in Supabase Dashboard
- [ ] Configure Google OAuth credentials
- [ ] Configure Microsoft/Azure OAuth
- [ ] Configure LinkedIn OAuth  
- [ ] Configure Twitter OAuth
- [ ] Configure Facebook OAuth
- [ ] Update Site URL to production domain
- [ ] Add production URLs to redirect whitelist

### Environment Variables
- [ ] NEXT_PUBLIC_SUPABASE_URL is correct
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY is set
- [ ] SUPABASE_SERVICE_ROLE_KEY is set
- [ ] NEXT_PUBLIC_APP_URL matches your domain
- [ ] RESEND_API_KEY for emails
- [ ] ADMIN_USER_IDS configured

## During Deployment

### Server Setup
- [ ] Node.js LTS installed
- [ ] PM2 installed globally
- [ ] Nginx installed and configured
- [ ] SSL certificate obtained (Certbot)

### Application Setup  
- [ ] Files uploaded to VPS
- [ ] npm install --production completed
- [ ] PM2 started with ecosystem.config.js
- [ ] PM2 startup configured
- [ ] Nginx site enabled

## After Deployment

### Verification
- [ ] Homepage loads over HTTPS
- [ ] Login page accessible
- [ ] OAuth providers work:
  - [ ] Google login
  - [ ] Microsoft login
  - [ ] LinkedIn login
  - [ ] Twitter login  
  - [ ] Facebook login
- [ ] Email signup/login works
- [ ] Password reset works
- [ ] Admin panel protected

### Monitoring
- [ ] Check PM2 logs for errors
- [ ] Verify Supabase Auth logs
- [ ] Test user can complete full auth flow
- [ ] Verify sessions persist

### Security
- [ ] SSL working properly
- [ ] Environment variables secure
- [ ] Admin routes protected
- [ ] Rate limiting active
EOF

# Summary
echo -e "\n${GREEN}✓ Deployment package created successfully!${NC}"
echo -e "\nPackage location: ${BLUE}$DEPLOY_DIR/${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Update VPS details in: $DEPLOY_DIR/upload-to-vps.sh"
echo "2. Run: cd $DEPLOY_DIR && ./upload-to-vps.sh"
echo "3. SSH to VPS and complete setup"
echo "4. Configure Supabase OAuth providers"
echo -e "\n${BLUE}Important Supabase Setup:${NC}"
echo "- Update redirect URLs in Supabase Dashboard"
echo "- Configure OAuth provider credentials"
echo "- Set Site URL to your production domain"

# Final checks
echo -e "\n${YELLOW}Pre-flight checks:${NC}"

# Check for localhost references
if grep -r "localhost:3000" app/ src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | grep -v "NEXT_PUBLIC_APP_URL"; then
    echo -e "${RED}Warning: Found hardcoded localhost URLs!${NC}"
fi

# Check Supabase URL
if grep -q "supabase.co" .env.production; then
    echo -e "${GREEN}✓ Supabase URL configured${NC}"
fi

echo -e "\n${GREEN}Ready for deployment!${NC}"