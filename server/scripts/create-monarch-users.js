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

async function createMonarchUsers() {
  try {
    console.log('🚀 Creating Missing Monarch Users...\n');
    
    // Users to create
    const usersToCreate = [
      {
        email: 'corporate@monarch.com',
        password: 'corporate123',
        user_name: 'Monarch Corporate Admin',
        role: 'corporate_admin',
        corporate_client_id: 'monarch',
        primary_program_id: null,
        authorized_programs: ['monarch_competency', 'monarch_mental_health', 'monarch_sober_living', 'monarch_launch']
      },
      {
        email: 'programuser@monarch.com',
        password: 'programuser123',
        user_name: 'Monarch Program User',
        role: 'program_user',
        corporate_client_id: 'monarch',
        primary_program_id: 'monarch_competency',
        authorized_programs: ['monarch_competency']
      }
    ];
    
    for (const userData of usersToCreate) {
      console.log(`\n📧 Creating user: ${userData.email}`);
      
      // Check if user already exists in Supabase Auth
      const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
      
      if (listError) {
        console.error('❌ Error listing users:', listError.message);
        continue;
      }
      
      const existingUser = existingUsers.users.find(user => user.email === userData.email);
      
      if (existingUser) {
        console.log(`✅ Supabase Auth user already exists: ${userData.email}`);
        console.log(`🆔 Auth User ID: ${existingUser.id}`);
        
        // Check if user exists in database
        const { data: dbUser, error: dbError } = await supabase
          .from('users')
          .select('*')
          .eq('email', userData.email)
          .single();
          
        if (dbUser) {
          console.log(`✅ Database user already exists: ${userData.email}`);
          continue;
        }
      } else {
        // Create user in Supabase Auth
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true,
          user_metadata: {
            user_name: userData.user_name,
            role: userData.role
          }
        });
        
        if (createError) {
          console.error(`❌ Error creating Supabase Auth user: ${createError.message}`);
          continue;
        }
        
        console.log(`✅ Supabase Auth user created: ${userData.email}`);
        console.log(`🆔 Auth User ID: ${newUser.user.id}`);
        
        // Create user in database
        const userId = `user_${userData.role}_monarch_${Date.now()}`;
        
        const { data: dbUser, error: dbError } = await supabase
          .from('users')
          .insert({
            user_id: userId,
            user_name: userData.user_name,
            email: userData.email,
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
          
        if (dbError) {
          console.error(`❌ Error creating database user: ${dbError.message}`);
          continue;
        }
        
        console.log(`✅ Database user created: ${userData.email}`);
        console.log(`🆔 User ID: ${userId}`);
      }
    }
    
    console.log('\n🎉 Monarch user creation completed!');
    console.log('\n📋 Created Users:');
    console.log('   Corporate Admin: corporate@monarch.com (password: corporate123)');
    console.log('   Program User: programuser@monarch.com (password: programuser123)');
    
  } catch (error) {
    console.error('❌ Error creating Monarch users:', error);
  }
}

createMonarchUsers();
