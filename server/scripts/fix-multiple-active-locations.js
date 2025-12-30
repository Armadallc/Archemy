#!/usr/bin/env node
/**
 * Fix Multiple Active Locations Script
 * 
 * Deactivates all but the most recent active location for a driver
 * 
 * Usage:
 *   node server/scripts/fix-multiple-active-locations.js <driver_id>
 *   node server/scripts/fix-multiple-active-locations.js --all-drivers
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env or as environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixDriverLocations(driverId) {
  try {
    console.log(`\n🔧 Fixing locations for driver: ${driverId}`);
    
    // Get all active locations for this driver
    const { data: activeLocations, error: fetchError } = await supabase
      .from('driver_locations')
      .select('*')
      .eq('driver_id', driverId)
      .eq('is_active', true)
      .order('timestamp', { ascending: false });

    if (fetchError) {
      console.error('❌ Error fetching locations:', fetchError);
      return;
    }

    if (!activeLocations || activeLocations.length === 0) {
      console.log('   ℹ️  No active locations found');
      return;
    }

    if (activeLocations.length === 1) {
      console.log('   ✅ Only one active location - no fix needed');
      return;
    }

    console.log(`   Found ${activeLocations.length} active locations`);
    
    // Keep the most recent one (first in the sorted list)
    const mostRecent = activeLocations[0];
    const toDeactivate = activeLocations.slice(1);

    console.log(`   Keeping most recent: ${mostRecent.id} (${mostRecent.timestamp})`);
    console.log(`   Deactivating ${toDeactivate.length} older location(s)`);

    // Deactivate all but the most recent
    const idsToDeactivate = toDeactivate.map(loc => loc.id);
    const { error: updateError } = await supabase
      .from('driver_locations')
      .update({ is_active: false })
      .in('id', idsToDeactivate);

    if (updateError) {
      console.error('   ❌ Error deactivating locations:', updateError);
      return;
    }

    console.log(`   ✅ Fixed! Now only 1 active location`);
    console.log(`   Active location: ${mostRecent.latitude}, ${mostRecent.longitude}`);
    console.log(`   Timestamp: ${mostRecent.timestamp}`);

  } catch (error) {
    console.error(`❌ Error fixing locations for driver ${driverId}:`, error);
  }
}

async function fixAllDrivers() {
  try {
    console.log('🔧 Fixing multiple active locations for all drivers...\n');

    // Get all drivers
    const { data: drivers, error: driversError } = await supabase
      .from('drivers')
      .select('id');

    if (driversError) {
      console.error('❌ Error fetching drivers:', driversError);
      return;
    }

    if (!drivers || drivers.length === 0) {
      console.log('No drivers found');
      return;
    }

    console.log(`Found ${drivers.length} driver(s)\n`);

    for (const driver of drivers) {
      await fixDriverLocations(driver.id);
    }

    console.log('\n✅ Done fixing all drivers');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
Fix Multiple Active Locations Script

Usage:
  node server/scripts/fix-multiple-active-locations.js <driver_id>
  node server/scripts/fix-multiple-active-locations.js --all-drivers

Examples:
  node server/scripts/fix-multiple-active-locations.js driver_monarch_1758946085589
  node server/scripts/fix-multiple-active-locations.js --all-drivers
`);
    process.exit(0);
  }

  if (args[0] === '--all-drivers') {
    await fixAllDrivers();
  } else {
    await fixDriverLocations(args[0]);
  }
}

main();



