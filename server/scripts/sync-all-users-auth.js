/**
 * Sync all database users to Supabase Auth
 * Creates Supabase Auth users for any database users that don't have auth_user_id
 * 
 * Usage: node server/scripts/sync-all-users-auth.js
 * 
 * This script will:
 * 1. Find all users in the database without auth_user_id
 * 2. Create Supabase Auth users for them
 * 3. Link them by updating auth_user_id in the database
 * 
 * Default password will be set to: {username}123 (e.g., alissa123)
 * Users will need to reset their password after first login.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function syncAllUsers() {
  try {
    console.log('\n🔧 Syncing all database users to Supabase Auth...\n');

    // Get all users from database
    const { data: allUsers, error: dbError } = await supabase
      .from('users')
      .select('user_id, email, user_name, role, auth_user_id, first_name, last_name')
      .order('email');

    if (dbError) {
      console.error('❌ Error fetching users:', dbError.message);
      process.exit(1);
    }

    if (!allUsers || allUsers.length === 0) {
      console.log('⚠️  No users found in database');
      process.exit(0);
    }

    console.log(`📊 Found ${allUsers.length} users in database\n`);

    // Get all existing Supabase Auth users
    const { data: authUsersData, error: authListError } = await supabase.auth.admin.listUsers();
    if (authListError) {
      console.error('❌ Error listing auth users:', authListError.message);
      process.exit(1);
    }

    const existingAuthUsers = new Map();
    authUsersData?.users?.forEach(u => {
      existingAuthUsers.set(u.email.toLowerCase(), u.id);
    });

    console.log(`📊 Found ${existingAuthUsers.size} existing Supabase Auth users\n`);

    let synced = 0;
    let skipped = 0;
    let errors = 0;

    for (const user of allUsers) {
      const email = user.email?.toLowerCase();
      
      if (!email) {
        console.log(`⚠️  Skipping user ${user.user_id}: no email`);
        skipped++;
        continue;
      }

      // Check if user already has auth_user_id
      if (user.auth_user_id) {
        // Verify the auth user still exists
        const authUserId = existingAuthUsers.get(email);
        if (authUserId && authUserId === user.auth_user_id) {
          console.log(`✅ ${email} - already linked (${user.auth_user_id.substring(0, 8)}...)`);
          skipped++;
          continue;
        } else {
          console.log(`⚠️  ${email} - has auth_user_id but auth user not found, will recreate`);
        }
      }

      // Check if auth user already exists
      let authUserId = existingAuthUsers.get(email);
      
      if (!authUserId) {
        // Generate default password: {username}123 or {email_prefix}123
        const defaultPassword = (user.user_name || email.split('@')[0]) + '123';
        
        console.log(`🔄 Creating Supabase Auth user for: ${email}`);
        
        // Create Supabase Auth user
        const { data: newAuthUser, error: authError } = await supabase.auth.admin.createUser({
          email: email,
          password: defaultPassword,
          email_confirm: true,
          user_metadata: {
            user_name: user.user_name || email.split('@')[0],
            role: user.role,
            first_name: user.first_name || '',
            last_name: user.last_name || ''
          }
        });

        if (authError) {
          console.error(`❌ Error creating auth user for ${email}:`, authError.message);
          errors++;
          continue;
        }

        authUserId = newAuthUser.user.id;
        console.log(`   ✅ Created (ID: ${authUserId.substring(0, 8)}...)`);
      } else {
        console.log(`   ℹ️  Auth user already exists (ID: ${authUserId.substring(0, 8)}...)`);
      }

      // Link auth user to database user
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          auth_user_id: authUserId,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.user_id);

      if (updateError) {
        console.error(`❌ Error linking auth user for ${email}:`, updateError.message);
        errors++;
        continue;
      }

      console.log(`   ✅ Linked to database user\n`);
      synced++;
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Synced: ${synced}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log('\n🎉 Sync complete!\n');
    console.log('⚠️  Note: Default passwords are set to {username}123');
    console.log('   Users should reset their passwords after first login.\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

syncAllUsers();













