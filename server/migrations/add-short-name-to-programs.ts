import { supabase } from '../minimal-supabase.js';

/**
 * Migration: Add short_name field to programs table
 * Also update existing program names to their correct short versions
 */
export async function addShortNameToPrograms() {
  console.log('🔧 Running migration: add short_name to programs table...');

  try {
    // Step 1: Add short_name column if it doesn't exist
    console.log('📝 Step 1: Adding short_name column...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE programs 
        ADD COLUMN IF NOT EXISTS short_name VARCHAR(100);
      `
    });

    if (alterError) {
      console.error('❌ Error adding short_name column:', alterError);
      throw alterError;
    }

    console.log('✅ Successfully added short_name column');

    // Step 2: Update existing programs with correct names and short_names
    console.log('📝 Step 2: Updating program names and short_names...');
    
    const programUpdates = [
      {
        id: 'monarch_competency',
        name: 'Monarch Competency',
        short_name: 'Competency'
      },
      {
        id: 'monarch_mental_health',
        name: 'Monarch Mental Health',
        short_name: 'Mental Health'
      },
      {
        id: 'monarch_sober_living',
        name: 'Monarch Sober Living',
        short_name: 'Sober Living'
      },
      {
        id: 'halcyon_detox',
        name: 'Halcyon Detox Program',
        short_name: 'Detox'
      }
    ];

    for (const program of programUpdates) {
      const { error: updateError } = await supabase
        .from('programs')
        .update({
          name: program.name,
          short_name: program.short_name
        })
        .eq('id', program.id);

      if (updateError) {
        console.error(`❌ Error updating program ${program.id}:`, updateError);
      } else {
        console.log(`✅ Updated program: ${program.name}`);
      }
    }

    console.log('✅ Migration completed successfully!');
    return { success: true };

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addShortNameToPrograms()
    .then(() => {
      console.log('✅ Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

