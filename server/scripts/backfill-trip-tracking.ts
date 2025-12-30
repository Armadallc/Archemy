/**
 * Backfill Script for Trip Tracking
 * 
 * This script backfills created_by, updated_by, and updated_at for existing trips.
 * 
 * Strategy:
 * - Set updated_at to created_at for trips where updated_at is NULL
 * - Leave created_by and updated_by as NULL for old trips (accurate - they were created before tracking)
 * - New trips will have proper tracking from now on
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env.local') });
dotenv.config({ path: join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.error('   Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function backfillTripTracking() {
  console.log('🔄 Starting Trip Tracking Backfill\n');

  try {
    // Step 1: Count trips that need backfilling
    console.log('📊 Analyzing trips...');
    
    const { data: stats, error: statsError } = await supabase
      .from('trips')
      .select('id, created_at, updated_at, created_by, updated_by', { count: 'exact' });

    if (statsError) throw statsError;

    const { count: totalTrips } = await supabase
      .from('trips')
      .select('*', { count: 'exact', head: true });

    const { count: tripsWithNullUpdatedAt } = await supabase
      .from('trips')
      .select('*', { count: 'exact', head: true })
      .is('updated_at', null);

    const { count: oldTrips } = await supabase
      .from('trips')
      .select('*', { count: 'exact', head: true })
      .is('created_by', null);

    const { count: tripsWithTracking } = await supabase
      .from('trips')
      .select('*', { count: 'exact', head: true })
      .not('created_by', 'is', null);

    console.log(`   Total trips: ${totalTrips || 0}`);
    console.log(`   Trips with NULL updated_at: ${tripsWithNullUpdatedAt || 0}`);
    console.log(`   Old trips (created_by IS NULL): ${oldTrips || 0}`);
    console.log(`   Trips with tracking (created_by set): ${tripsWithTracking || 0}`);

    if (tripsWithNullUpdatedAt === 0) {
      console.log('\n✅ All trips already have updated_at timestamp. No backfill needed.');
      return;
    }

    // Step 2: Backfill updated_at
    console.log('\n🔄 Backfilling updated_at...');
    
    const { data: updateResult, error: updateError } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE trips
        SET updated_at = created_at
        WHERE updated_at IS NULL
        RETURNING id;
      `
    });

    // Use direct query instead of RPC if RPC doesn't exist
    if (updateError && updateError.message.includes('function') && updateError.message.includes('does not exist')) {
      console.log('   Using direct UPDATE query...');
      
      // Get trips that need updating
      const { data: tripsToUpdate, error: fetchError } = await supabase
        .from('trips')
        .select('id, created_at')
        .is('updated_at', null);

      if (fetchError) throw fetchError;

      if (tripsToUpdate && tripsToUpdate.length > 0) {
        console.log(`   Updating ${tripsToUpdate.length} trips...`);
        
        // Update in batches
        const batchSize = 100;
        for (let i = 0; i < tripsToUpdate.length; i += batchSize) {
          const batch = tripsToUpdate.slice(i, i + batchSize);
          
          for (const trip of batch) {
            if (trip.created_at) {
              const { error: updateErr } = await supabase
                .from('trips')
                .update({ updated_at: trip.created_at })
                .eq('id', trip.id);

              if (updateErr) {
                console.error(`   ❌ Error updating trip ${trip.id}:`, updateErr.message);
              }
            }
          }
          
          console.log(`   ✅ Updated batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(tripsToUpdate.length / batchSize)}`);
        }
      }
    } else if (updateError) {
      throw updateError;
    }

    // Step 3: Verify the backfill
    console.log('\n✅ Verifying backfill...');
    
    const { count: remainingNullUpdatedAt } = await supabase
      .from('trips')
      .select('*', { count: 'exact', head: true })
      .is('updated_at', null);

    if (remainingNullUpdatedAt === 0) {
      console.log('   ✅ All trips now have updated_at timestamp');
    } else {
      console.log(`   ⚠️  ${remainingNullUpdatedAt} trips still have NULL updated_at`);
      console.log('   This may be due to trips with NULL created_at');
    }

    // Step 4: Summary
    console.log('\n📊 Backfill Summary:');
    console.log(`   ✅ Updated ${tripsWithNullUpdatedAt || 0} trips with updated_at timestamp`);
    console.log(`   ℹ️  ${oldTrips || 0} old trips have created_by = NULL (accurate - created before tracking)`);
    console.log(`   ℹ️  ${tripsWithTracking || 0} trips have tracking data (created after migration)`);
    
    console.log('\n💡 Notes:');
    console.log('   - Old trips (created_by IS NULL) are accurate - they were created before tracking');
    console.log('   - New trips will automatically have created_by and updated_by set');
    console.log('   - When old trips are updated, they will get updated_by and updated_at set');

    console.log('\n✅ Backfill complete!');

  } catch (error: any) {
    console.error('❌ Backfill failed:', error.message);
    console.error('   Error details:', error);
    process.exit(1);
  }
}

backfillTripTracking().catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});


