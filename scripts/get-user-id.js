const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function getUserId() {
    // Check if environment variables are set
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('❌ Supabase environment variables not found!');
        console.log('Make sure you have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file');
        return;
    }

    // Create Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔍 Fetching users from Supabase...\n');

    try {
        // Get all users
        const { data: users, error } = await supabase
            .from('users')
            .select('id, email, name, created_at')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('❌ Error fetching users:', error.message);
            return;
        }

        if (!users || users.length === 0) {
            console.log('No users found in the database.');
            return;
        }

        console.log(`Found ${users.length} user(s):\n`);
        console.log('━'.repeat(80));
        
        users.forEach((user, index) => {
            console.log(`User ${index + 1}:`);
            console.log(`  Name:       ${user.name || 'N/A'}`);
            console.log(`  Email:      ${user.email}`);
            console.log(`  User ID:    ${user.id}`);
            console.log(`  Created:    ${new Date(user.created_at).toLocaleString()}`);
            console.log('━'.repeat(80));
        });

        // If you want to find a specific user by email
        const emailToFind = process.argv[2];
        if (emailToFind) {
            console.log(`\n🔍 Looking for user with email: ${emailToFind}`);
            const specificUser = users.find(u => u.email === emailToFind);
            if (specificUser) {
                console.log(`\n✅ Found user:`);
                console.log(`User ID: ${specificUser.id}`);
                console.log(`\nTo make this user an admin, run:`);
                console.log(`npm run make-admin ${specificUser.id}`);
            } else {
                console.log(`❌ No user found with email: ${emailToFind}`);
            }
        }

    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

// Run the function
getUserId();

// Instructions
if (!process.argv[2]) {
    console.log('\n💡 TIP: You can search for a specific user by email:');
    console.log('   node scripts/get-user-id.js your-email@example.com');
}