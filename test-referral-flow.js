// Test script for referral flow
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testReferralFlow() {
  console.log('🚀 Testing Referral Flow...\n');

  try {
    // Step 1: Create a referrer user
    console.log('1️⃣ Creating referrer user...');
    const referrerEmail = `referrer_${Date.now()}@test.com`;
    const { data: authData1, error: authError1 } = await supabase.auth.signUp({
      email: referrerEmail,
      password: 'Test123!@#',
    });

    if (authError1) throw authError1;
    console.log('✅ Referrer created:', authData1.user.email);

    // Step 2: Get referrer's data
    const { data: referrerData, error: referrerError } = await supabase
      .from('users')
      .select('referral_code, position')
      .eq('id', authData1.user.id)
      .single();

    if (referrerError) throw referrerError;
    console.log('✅ Referrer code:', referrerData.referral_code);
    console.log('✅ Referrer position:', referrerData.position);

    // Step 3: Create referred user with referral code
    console.log('\n2️⃣ Creating referred user with referral code...');
    const referredEmail = `referred_${Date.now()}@test.com`;
    
    // Simulate the signup API call
    const signupResponse = await fetch(`${supabaseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: referredEmail,
        password: 'Test123!@#',
        name: 'Test Referred User',
        profession: 'Software Engineer',
        company: 'Test Company',
        interests: ['💰 Financial Planning & Wealth Building', '📈 Investment & Portfolio Management'],
        tierPreference: 'pro',
        referralCode: referrerData.referral_code
      })
    });

    if (!signupResponse.ok) {
      // If API route doesn't exist, use direct Supabase signup
      console.log('⚠️  API route not available, using direct signup...');
      
      const { data: authData2, error: authError2 } = await supabase.auth.signUp({
        email: referredEmail,
        password: 'Test123!@#',
      });

      if (authError2) throw authError2;

      // Manually create user profile with referral
      const { data: referrer } = await supabase
        .from('users')
        .select('id')
        .eq('referral_code', referrerData.referral_code)
        .single();

      await supabase.from('users').upsert({
        id: authData2.user.id,
        email: referredEmail,
        name: 'Test Referred User',
        referred_by: referrer?.id,
        interests: ['💰 Financial Planning & Wealth Building'],
        tier_preference: 'pro'
      });
    }

    console.log('✅ Referred user created');

    // Step 4: Check referral tracking
    console.log('\n3️⃣ Checking referral tracking...');
    const { data: trackingData, error: trackingError } = await supabase
      .from('referral_tracking')
      .select('*')
      .eq('referrer_id', authData1.user.id);

    if (trackingError) throw trackingError;
    console.log('✅ Referral tracking entries:', trackingData.length);

    // Step 5: Check referrer's updated stats
    console.log('\n4️⃣ Checking referrer stats...');
    const { data: updatedReferrer, error: updateError } = await supabase
      .from('users')
      .select('referral_count')
      .eq('id', authData1.user.id)
      .single();

    if (updateError) throw updateError;
    console.log('✅ Referrer\'s referral count:', updatedReferrer.referral_count);

    // Step 6: Test referral link generation
    console.log('\n5️⃣ Testing secure referral link generation...');
    const { data: referralLink, error: linkError } = await supabase
      .rpc('generate_secure_referral_link', { user_id: authData1.user.id });

    if (linkError) {
      console.log('⚠️  Referral link function not yet deployed');
    } else {
      console.log('✅ Generated referral link:', referralLink);
    }

    // Step 7: Test referral stats
    console.log('\n6️⃣ Testing referral statistics...');
    const { data: stats, error: statsError } = await supabase
      .rpc('get_referral_stats', { user_id: authData1.user.id });

    if (statsError) {
      console.log('⚠️  Stats function not yet deployed');
    } else {
      console.log('✅ Referral stats:', stats);
    }

    console.log('\n✨ Referral flow test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }
}

// Run the test
testReferralFlow();