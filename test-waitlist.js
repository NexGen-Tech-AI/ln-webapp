// Test script to verify waitlist functionality
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testWaitlistData() {
  console.log('Testing waitlist data...\n');

  // Test 1: Check if waitlist_count view exists
  console.log('1. Testing waitlist_count view:');
  try {
    const { data, error } = await supabase
      .from('waitlist_count')
      .select('total_users')
      .single();
    
    if (error) {
      console.error('❌ waitlist_count view error:', error.message);
      console.log('   Falling back to direct count...');
      
      // Fallback test
      const { count, error: countError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error('❌ Direct count error:', countError.message);
      } else {
        console.log(`✅ Direct count successful: ${count} users`);
      }
    } else {
      console.log(`✅ waitlist_count view works: ${data.total_users} users`);
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }

  // Test 2: Check users table structure
  console.log('\n2. Testing users table:');
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, position, referral_code, user_type, created_at')
      .limit(5)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Users table error:', error.message);
    } else {
      console.log(`✅ Found ${data.length} recent users`);
      data.forEach(user => {
        console.log(`   - ${user.name || user.email} (position: ${user.position}, type: ${user.user_type})`);
      });
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }

  // Test 3: Check if position sequence exists
  console.log('\n3. Testing position sequence:');
  try {
    const { data, error } = await supabase.rpc('nextval', { sequence_name: 'users_position_seq' });
    
    if (error) {
      console.error('❌ Position sequence error:', error.message);
    } else {
      console.log(`✅ Next position would be: ${data}`);
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }

  console.log('\n✨ Test complete!');
}

testWaitlistData();