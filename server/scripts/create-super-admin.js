#!/usr/bin/env node

/**
 * Create Super Admin User Script
 * Creates a super admin user for the HALCYON NMT system
 */

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createSuperAdmin() {
  try {
    console.log('🚀 Creating Super Admin User...\n');
    
    // Check if super admin already exists
    const { data: existingAdmin, error: checkError } = await supabase
      .from('users')
      .select('user_id, email')
      .eq('email', 'admin@monarch.com')
      .single();
    
    if (existingAdmin) {
      console.log('✅ Super admin already exists:', existingAdmin.email);
      console.log('📧 Email: admin@monarch.com');
      console.log('🔑 Password: admin123');
      return;
    }
    
    // Hash the password
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create super admin user
    const superAdminData = {
      user_id: 'super_admin_monarch_' + Date.now(),
      user_name: 'Super Admin',
      email: 'admin@monarch.com',
      password_hash: hashedPassword,
      role: 'super_admin',
      primary_program_id: 'monarch_competency',
      authorized_programs: ['monarch_competency', 'monarch_mental_health', 'monarch_sober_living', 'monarch_launch'],
      corporate_client_id: 'monarch',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: newAdmin, error: createError } = await supabase
      .from('users')
      .insert([superAdminData])
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Error creating super admin:', createError.message);
      return;
    }
    
    console.log('✅ Super Admin created successfully!');
    console.log('📧 Email: admin@monarch.com');
    console.log('🔑 Password: admin123');
    console.log('🆔 User ID:', newAdmin.user_id);
    console.log('👑 Role: super_admin');
    console.log('🏢 Corporate Client: monarch');
    console.log('📋 Authorized Programs: monarch_competency, monarch_mental_health, monarch_sober_living, monarch_launch');
    
    console.log('\n🎉 You can now login with:');
    console.log('   Email: admin@monarch.com');
    console.log('   Password: admin123');
    
  } catch (error) {
    console.error('❌ Fatal error creating super admin:', error.message);
    process.exit(1);
  }
}

// Check if we're running this script directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createSuperAdmin();
}

export { createSuperAdmin };


