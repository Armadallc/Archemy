#!/usr/bin/env node

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

async function createHalcyonAdmin() {
  try {
    console.log('🚀 Creating Halcyon Admin User...\n');
    
    const email = 'admin@halcyon.com';
    const password = 'admin123';
    const userData = {
      email,
      password,
      user_name: 'Halcyon Admin',
      role: 'corporate_admin',
      corporate_client_id: 'halcyon',
      primary_program_id: 'halcyon_detox',
      authorized_programs: ['halcyon_detox', 'halcyon_outpatient']
    };
    
    // Check if user already exists in Supabase Auth
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError.message);
      return;
    }
    
    const existingUser = existingUsers.users.find(user => user.email === email);
    
    // Check if user exists in database first
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (existingUser && dbUser) {
      // Both Auth and DB user exist
      if (dbUser.auth_user_id) {
        console.log(`✅ User already fully configured: ${email}`);
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 Password: ${password}`);
        console.log(`👑 Role: ${dbUser.role}`);
        console.log(`🏢 Corporate Client: ${dbUser.corporate_client_id}`);
        return;
      } else {
        // DB user exists but missing auth_user_id, link them
        console.log(`⚠️ Database user exists but missing auth_user_id, linking...`);
        const { error: updateError } = await supabase
          .from('users')
          .update({ auth_user_id: existingUser.id })
          .eq('email', email);
          
        if (updateError) {
          console.error(`❌ Error linking auth_user_id: ${updateError.message}`);
          return;
        }
        
        console.log(`✅ Linked auth_user_id to existing database user`);
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 Password: ${password}`);
        return;
      }
    }
    
    if (existingUser && !dbUser) {
      // Auth user exists but not in database, create database entry
      console.log(`⚠️ Auth user exists but not in database, creating database entry...`);
      
      const userId = `user_corporate_admin_halcyon_${Date.now()}`;
      
      const { data: newDbUser, error: insertError } = await supabase
        .from('users')
        .insert({
          user_id: userId,
          user_name: userData.user_name,
          email: email,
          password_hash: '$2b$10$dummyhashfortest', // Placeholder - auth handled by Supabase
          role: userData.role,
          primary_program_id: userData.primary_program_id,
          corporate_client_id: userData.corporate_client_id,
          authorized_programs: userData.authorized_programs,
          auth_user_id: existingUser.id,
          is_active: true
        })
        .select()
        .single();
          
      if (insertError) {
        console.error(`❌ Error creating database user: ${insertError.message}`);
        return;
      }
      
      console.log(`✅ Database user created: ${email}`);
      console.log(`📧 Email: ${email}`);
      console.log(`🔑 Password: ${password}`);
      return;
    }
    
    if (!existingUser && dbUser) {
      // Database user exists but no Auth user - create Auth user and link
      console.log(`⚠️ Database user exists but no Auth user, creating Auth user...`);
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
          user_name: userData.user_name,
          role: userData.role
        }
      });
      
      if (createError) {
        console.error(`❌ Error creating Supabase Auth user: ${createError.message}`);
        return;
      }
      
      console.log(`✅ Supabase Auth user created: ${email}`);
      console.log(`🆔 Auth User ID: ${newUser.user.id}`);
      
      // Link auth_user_id to existing database user
      const { error: updateError } = await supabase
        .from('users')
        .update({ auth_user_id: newUser.user.id })
        .eq('email', email);
        
      if (updateError) {
        console.error(`❌ Error linking auth_user_id: ${updateError.message}`);
        return;
      }
      
      console.log(`✅ Linked auth_user_id to existing database user`);
      console.log(`📧 Email: ${email}`);
      console.log(`🔑 Password: ${password}`);
      return;
    }
    
    // Create user in Supabase Auth
    console.log(`📧 Creating Supabase Auth user: ${email}`);
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        user_name: userData.user_name,
        role: userData.role
      }
    });
    
    if (createError) {
      console.error(`❌ Error creating Supabase Auth user: ${createError.message}`);
      return;
    }
    
    console.log(`✅ Supabase Auth user created: ${email}`);
    console.log(`🆔 Auth User ID: ${newUser.user.id}`);
    
    // Create user in database (neither Auth nor DB user exists)
    const userId = `user_corporate_admin_halcyon_${Date.now()}`;
    
    const { data: newDbUser, error: insertError } = await supabase
      .from('users')
      .insert({
        user_id: userId,
        user_name: userData.user_name,
        email: email,
        password_hash: '$2b$10$dummyhashfortest', // Placeholder - auth handled by Supabase
        role: userData.role,
        primary_program_id: userData.primary_program_id,
        corporate_client_id: userData.corporate_client_id,
        authorized_programs: userData.authorized_programs,
        auth_user_id: newUser.user.id,
        is_active: true
      })
      .select()
      .single();
      
    if (insertError) {
      console.error(`❌ Error creating database user: ${insertError.message}`);
      return;
    }
    
    console.log(`✅ Database user created: ${email}`);
    console.log(`🆔 User ID: ${userId}`);
    
    console.log('\n🎉 Halcyon admin user creation completed!');
    console.log('\n📋 User Details:');
    console.log(`   📧 Email: ${email}`);
    console.log(`   🔑 Password: ${password}`);
    console.log(`   👑 Role: ${userData.role}`);
    console.log(`   🏢 Corporate Client: ${userData.corporate_client_id}`);
    console.log(`   📋 Authorized Programs: ${userData.authorized_programs.join(', ')}`);
    console.log(`   🆔 User ID: ${userId}`);
    
  } catch (error) {
    console.error('❌ Error creating Halcyon admin:', error);
    console.error('Stack:', error.stack);
  }
}

createHalcyonAdmin();

