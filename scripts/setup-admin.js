#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔐 LifeNavigator Admin Setup Wizard\n');

const questions = [
  {
    name: 'userId',
    question: 'Enter your Supabase User ID: ',
    validate: (input) => input.length === 36 // UUID validation
  },
  {
    name: 'ipAddress',
    question: 'Enter your current IP address (or leave blank to skip IP whitelisting): ',
    validate: () => true
  },
  {
    name: 'enableMfa',
    question: 'Enable two-factor authentication? (y/n): ',
    validate: (input) => ['y', 'n'].includes(input.toLowerCase())
  }
];

async function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question.question, (answer) => {
      if (question.validate(answer)) {
        resolve(answer);
      } else {
        console.log('Invalid input. Please try again.');
        resolve(askQuestion(question));
      }
    });
  });
}

async function main() {
  const answers = {};
  
  for (const q of questions) {
    answers[q.name] = await askQuestion(q);
  }
  
  // Generate secure admin secret
  const adminSecret = crypto.randomBytes(32).toString('hex');
  
  // Generate secure session key
  const sessionKey = crypto.randomBytes(32).toString('hex');
  
  // Create environment variables
  const envContent = `
# Admin Security Configuration
ADMIN_USER_IDS=${answers.userId}
ADMIN_ALLOWED_IPS=${answers.ipAddress || ''}
ADMIN_CREATION_SECRET=${adminSecret}
ADMIN_SESSION_KEY=${sessionKey}
ADMIN_MFA_ENABLED=${answers.enableMfa === 'y' ? 'true' : 'false'}

# Security Settings
ADMIN_SESSION_LIFETIME=3600  # 1 hour
ADMIN_MAX_LOGIN_ATTEMPTS=3
ADMIN_LOCKOUT_DURATION=900  # 15 minutes
`;

  // Append to .env.local
  const envPath = path.join(process.cwd(), '.env.local');
  
  try {
    fs.appendFileSync(envPath, envContent);
    console.log('\n✅ Admin configuration added to .env.local');
    
    console.log('\n📋 Next Steps:');
    console.log('1. Deploy your application with these new environment variables');
    console.log('2. Make a POST request to /api/admin/create with:');
    console.log(JSON.stringify({
      userId: answers.userId,
      secretKey: adminSecret
    }, null, 2));
    console.log('\n3. Access your admin dashboard at /admin');
    
    if (answers.enableMfa === 'y') {
      console.log('\n🔐 Two-Factor Authentication:');
      console.log('1. Go to Supabase Dashboard → Authentication → Providers');
      console.log('2. Enable "Email OTP" or "Phone OTP"');
      console.log('3. Enable 2FA in your user settings');
    }
    
    console.log('\n⚠️  Security Reminders:');
    console.log('- Keep your admin secret safe - you\'ll need it only once');
    console.log('- Never share your admin credentials');
    console.log('- Regularly review security logs at /admin?tab=security');
    console.log('- Update your IP address if it changes');
    
  } catch (error) {
    console.error('❌ Error writing to .env.local:', error.message);
  }
  
  rl.close();
}

main().catch(console.error);