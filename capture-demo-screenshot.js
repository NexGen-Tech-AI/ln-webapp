#!/usr/bin/env node

// This script captures a screenshot of the demo app
// Run: node capture-demo-screenshot.js

const puppeteer = require('puppeteer');
const path = require('path');

async function captureScreenshot() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Set viewport to a standard desktop size
    await page.setViewport({ width: 1366, height: 768 });
    
    // Navigate to the demo URL
    console.log('Navigating to demo app...');
    await page.goto('https://lifenavigator-p4l7rhvtw-riffe007s-projects.vercel.app/dashboard', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait a bit for animations to complete
    await page.waitForTimeout(2000);
    
    // Take screenshot
    const screenshotPath = path.join(__dirname, 'public', 'demo-screenshot.png');
    await page.screenshot({
      path: screenshotPath,
      fullPage: false
    });
    
    console.log(`Screenshot saved to: ${screenshotPath}`);
    
  } catch (error) {
    console.error('Error capturing screenshot:', error);
  } finally {
    await browser.close();
  }
}

// Alternative: Use a placeholder image for now
const fs = require('fs');
const https = require('https');

function downloadPlaceholder() {
  const placeholderUrl = 'https://via.placeholder.com/341x192/0a0a0a/ffffff?text=LifeNavigator+Demo';
  const outputPath = path.join(__dirname, 'public', 'demo-screenshot.png');
  
  // Create public directory if it doesn't exist
  if (!fs.existsSync(path.join(__dirname, 'public'))) {
    fs.mkdirSync(path.join(__dirname, 'public'), { recursive: true });
  }
  
  const file = fs.createWriteStream(outputPath);
  
  https.get(placeholderUrl, (response) => {
    response.pipe(file);
    
    file.on('finish', () => {
      file.close();
      console.log(`Placeholder image saved to: ${outputPath}`);
    });
  }).on('error', (err) => {
    fs.unlink(outputPath, () => {});
    console.error('Error downloading placeholder:', err.message);
  });
}

// Check if puppeteer is available
try {
  require.resolve('puppeteer');
  captureScreenshot();
} catch (e) {
  console.log('Puppeteer not found, using placeholder image instead');
  downloadPlaceholder();
}