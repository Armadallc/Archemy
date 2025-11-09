#!/usr/bin/env node

/**
 * Create Supabase Auth User Script
 * Creates a user in Supabase Auth for the super admin
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSupabaseUser() {
  try {
    console.log('🚀 Creating Supabase Auth User...\n');
    
    // Check if user already exists in Supabase Auth
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError.message);
      return;
    }
    
    const existingUser = existingUsers.users.find(user => user.email === 'admin@monarch.com');
    
    if (existingUser) {
      console.log('✅ Supabase Auth user already exists:', existingUser.email);
      console.log('🆔 Auth User ID:', existingUser.id);
      return existingUser;
    }
    
    // Create user in Supabase Auth
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: 'admin@monarch.com',
      password: 'admin123',
      email_confirm: true,
      user_metadata: {
        user_name: 'Super Admin',
        role: 'super_admin'
      }
    });
    
    if (createError) {
      console.error('❌ Error creating Supabase Auth user:', createError.message);
      return;
    }
    
    console.log('✅ Supabase Auth user created successfully!');
    console.log('📧 Email: admin@monarch.com');
    console.log('🔑 Password: admin123');
    console.log('🆔 Auth User ID:', newUser.user.id);
    
    // Update the database user with the auth_user_id
    const { error: updateError } = await supabase
      .from('users')
      .update({ auth_user_id: newUser.user.id })
      .eq('email', 'admin@monarch.com');
    
    if (updateError) {
      console.error('❌ Error updating database user:', updateError.message);
    } else {
      console.log('✅ Database user updated with auth_user_id');
    }
    
    return newUser.user;
    
  } catch (error) {
    console.error('❌ Fatal error creating Supabase Auth user:', error.message);
    process.exit(1);
  }
}

// Check if we're running this script directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createSupabaseUser();
}

export { createSupabaseUser };


