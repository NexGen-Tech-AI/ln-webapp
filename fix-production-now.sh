#!/bin/bash

# Quick script to fix production immediately
# Run this on your server at 31.97.131.150

echo "Fixing production deployment..."

# Navigate to the app directory
cd /var/www/lifenavigator/ln-webapp

# Since git pull already happened, just build and restart
echo "Installing dependencies..."
npm install

echo "Building application..."
npm run build

echo "Restarting PM2..."
pm2 restart lifenavigator
pm2 save

echo "Checking status..."
pm2 status

echo "Done! Don't forget to run the database migrations in Supabase!"
echo ""
echo "IMPORTANT: Go to Supabase SQL Editor and run:"
echo "ALTER TABLE public.users ADD COLUMN IF NOT EXISTS name TEXT;"
echo "ALTER TABLE public.users ADD COLUMN IF NOT EXISTS profession TEXT;"
echo "ALTER TABLE public.users ADD COLUMN IF NOT EXISTS company TEXT;"
echo "ALTER TABLE public.users ADD COLUMN IF NOT EXISTS interests TEXT[];"
echo "ALTER TABLE public.users ADD COLUMN IF NOT EXISTS tier_preference TEXT;"