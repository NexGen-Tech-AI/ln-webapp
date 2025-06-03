#!/usr/bin/env node

console.log('🔐 Activating Admin Access...\n');

const userId = '5993408d-348e-4ab7-b22b-e8461a950255';
const secretKey = '7f9a8c6d5e4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8';

async function activateAdmin() {
  try {
    const response = await fetch('http://localhost:3000/api/admin/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        secretKey
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Admin access activated successfully!');
      console.log('\n📋 Next Steps:');
      console.log('1. Go to http://localhost:3000/admin/login');
      console.log('2. Login with timothy@riffeandassociates.com');
      console.log('3. You now have full admin access to:');
      console.log('   - Analytics Dashboard');
      console.log('   - User Management');
      console.log('   - Email Campaigns');
      console.log('   - Security Monitoring');
      console.log('\n🔒 Security Features Active:');
      console.log('   - IP address logging');
      console.log('   - Failed login tracking');
      console.log('   - Session management');
      console.log('   - Audit logging');
    } else {
      console.error('❌ Error:', data.error || 'Failed to activate admin');
      if (data.error === 'Admin user already exists') {
        console.log('\n✅ Admin access is already active!');
        console.log('   Go to http://localhost:3000/admin/login to access');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n⚠️  Make sure your development server is running:');
    console.log('   npm run dev');
  }
}

activateAdmin();