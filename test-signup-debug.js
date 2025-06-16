// Test script to debug signup issues
// Run with: node test-signup-debug.js

require('dotenv').config({ path: '.env.local' });

async function testSignup() {
  console.log('🔍 Testing Signup Flow\n');
  
  // Check environment variables
  console.log('1️⃣ Checking Environment Variables:');
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  let missingVars = false;
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: Set (${process.env[varName].substring(0, 20)}...)`);
    } else {
      console.log(`❌ ${varName}: Missing!`);
      missingVars = true;
    }
  });
  
  if (missingVars) {
    console.log('\n❌ Missing required environment variables. Cannot proceed.');
    return;
  }
  
  // Test API endpoint
  console.log('\n2️⃣ Testing Signup API Endpoint:');
  
  const testData = {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    name: 'Test User',
    profession: 'Developer',
    company: 'Test Company',
    interests: ['💰 Financial Planning & Wealth Building', '📈 Investment & Portfolio Management'],
    tierPreference: 'free',
    referralCode: ''
  };
  
  console.log('Sending test signup request...');
  console.log('Test data:', JSON.stringify(testData, null, 2));
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Signup successful!');
      console.log('Response:', result);
    } else {
      console.log(`❌ Signup failed with status ${response.status}`);
      console.log('Error:', result);
      
      // Additional debugging
      if (result.details) {
        console.log('\nValidation errors:');
        result.details.forEach(err => {
          console.log(`  - ${err.path.join('.')}: ${err.message}`);
        });
      }
    }
  } catch (error) {
    console.log('❌ Network or server error:', error.message);
  }
  
  // Test Supabase connection directly
  console.log('\n3️⃣ Testing Direct Supabase Connection:');
  
  const { createClient } = require('@supabase/supabase-js');
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    // Test database connection
    const { data: testQuery, error: testError } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.log('❌ Database connection error:', testError.message);
    } else {
      console.log('✅ Database connection successful!');
    }
    
    // Check if users table exists and has proper columns
    const { data: columns, error: columnsError } = await supabaseAdmin.rpc('get_table_columns', {
      table_name: 'users'
    }).catch(() => ({ data: null, error: 'RPC function not available' }));
    
    if (columns) {
      console.log('\nUsers table columns:', columns);
    }
    
  } catch (error) {
    console.log('❌ Supabase client error:', error.message);
  }
  
  console.log('\n4️⃣ Debugging Tips:');
  console.log('- Check Supabase Dashboard > Authentication > Logs for auth errors');
  console.log('- Run the SQL migration in Supabase SQL Editor: supabase/migrations/20240201_fix_waitlist_signup.sql');
  console.log('- Ensure email confirmation is disabled for testing');
  console.log('- Check browser console for client-side errors');
  console.log('- Verify CORS settings if running from different port');
}

// Run the test
testSignup().catch(console.error);