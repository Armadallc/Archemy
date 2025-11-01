import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addColumns() {
  console.log('🚀 Adding tag system columns to frequent_locations table...');

  try {
    // First, let's check if the columns already exist
    console.log('🔍 Checking current table structure...');
    
    const { data: sample, error: sampleError } = await supabase
      .from('frequent_locations')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('❌ Error checking table structure:', sampleError);
      return;
    }
    
    console.log('📊 Current columns:', Object.keys(sample[0] || {}));
    
    // Check if new columns already exist
    const hasNewColumns = sample[0] && (
      'tag' in sample[0] || 
      'is_service_location' in sample[0] || 
      'priority' in sample[0] || 
      'auto_synced' in sample[0]
    );
    
    if (hasNewColumns) {
      console.log('✅ New columns already exist! Skipping migration.');
      return;
    }

    console.log('⚠️  New columns not found. You need to add them manually in Supabase dashboard.');
    console.log('');
    console.log('📝 Please run this SQL in your Supabase SQL Editor:');
    console.log('');
    console.log('-- Add new columns to frequent_locations table');
    console.log('ALTER TABLE frequent_locations');
    console.log('ADD COLUMN IF NOT EXISTS tag VARCHAR(50) DEFAULT \'other\',');
    console.log('ADD COLUMN IF NOT EXISTS is_service_location BOOLEAN DEFAULT false,');
    console.log('ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0,');
    console.log('ADD COLUMN IF NOT EXISTS auto_synced BOOLEAN DEFAULT false;');
    console.log('');
    console.log('-- Create indexes for better performance');
    console.log('CREATE INDEX IF NOT EXISTS idx_frequent_locations_tag ON frequent_locations(tag);');
    console.log('CREATE INDEX IF NOT EXISTS idx_frequent_locations_priority ON frequent_locations(priority);');
    console.log('CREATE INDEX IF NOT EXISTS idx_frequent_locations_is_service_location ON frequent_locations(is_service_location);');
    console.log('');
    console.log('-- Update existing records to have default values');
    console.log('UPDATE frequent_locations');
    console.log('SET');
    console.log('  tag = \'other\',');
    console.log('  is_service_location = false,');
    console.log('  priority = 0,');
    console.log('  auto_synced = false');
    console.log('WHERE tag IS NULL;');
    console.log('');
    console.log('🔗 Go to: https://supabase.com/dashboard/project/[YOUR_PROJECT]/sql');
    console.log('📋 Copy and paste the SQL above, then click "Run"');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addColumns();
