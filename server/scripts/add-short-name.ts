import { supabase } from './minimal-supabase.js';

/**
 * Add short_name field to programs table and update existing programs
 */
async function addShortNameToPrograms() {
  console.log('🔧 Adding short_name to programs table...');

  try {
    // Step 1: Add short_name column if it doesn't exist
    console.log('📝 Step 1: Adding short_name column...');
    
    const { error: alterError } = await supabase
      .from('programs')
      .update({ short_name: null })
      .limit(0); // This will fail if column doesn't exist

    // Check if short_name column exists
    const hasShortName = !alterError || (alterError.code && alterError.code !== 'PGRST301');

    if (!hasShortName) {
      console.log('⚠️  short_name column may not exist yet. Please add it manually in Supabase:');
      console.log('   ALTER TABLE programs ADD COLUMN short_name VARCHAR(100);');
      console.log('   Then run this script again.');
      return;
    }

    console.log('✅ short_name column exists');

    // Step 2: Update existing programs with correct names and short_names
    console.log('📝 Step 2: Updating program names and short_names...');
    
    const programUpdates = [
      {
        id: 'monarch_competency',
        name: 'Monarch Competency',
        short_name: 'Competency',
        description: 'Monarch Competency'
      },
      {
        id: 'monarch_mental_health',
        name: 'Monarch Mental Health',
        short_name: 'Mental Health',
        description: 'Monarch Mental Health'
      },
      {
        id: 'monarch_sober_living',
        name: 'Monarch Sober Living',
        short_name: 'Sober Living',
        description: 'Monarch Sober Living'
      },
      {
        id: 'monarch_launch',
        name: 'Monarch Launch',
        short_name: 'Launch',
        description: 'Monarch Launch'
      },
      {
        id: 'halcyon_detox',
        name: 'Halcyon Detox',
        short_name: 'Detox',
        description: 'Halcyon Detox'
      }
    ];

    for (const program of programUpdates) {
      console.log(`📝 Updating ${program.id}...`);
      const { error: updateError } = await supabase
        .from('programs')
        .update({
          name: program.name,
          short_name: program.short_name,
          description: program.description
        })
        .eq('id', program.id);

      if (updateError) {
        console.error(`❌ Error updating program ${program.id}:`, updateError);
      } else {
        console.log(`✅ Updated program: ${program.name} (${program.short_name})`);
      }
    }

    console.log('✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
addShortNameToPrograms()
  .then(() => {
    console.log('✅ Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });

