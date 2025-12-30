#!/usr/bin/env node
/**
 * Location Tracking Diagnostic Script
 * 
 * Diagnoses location tracking issues for a specific driver
 * 
 * Usage:
 *   node server/scripts/diagnose-location-tracking.js <driver_id>
 *   node server/scripts/diagnose-location-tracking.js <user_id> --by-user-id
 *   node server/scripts/diagnose-location-tracking.js --all-drivers
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from project root (go up from server/scripts to project root)
const projectRoot = join(__dirname, '../..');
dotenv.config({ path: join(projectRoot, '.env') });
dotenv.config({ path: join(projectRoot, '.env.local') }); // .env.local overrides .env

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  console.error('');
  console.error('   Current values:');
  console.error(`   SUPABASE_URL: ${supabaseUrl ? 'Set (' + supabaseUrl.substring(0, 30) + '...)' : 'MISSING'}`);
  console.error(`   SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? 'Set (' + supabaseServiceKey.substring(0, 20) + '...)' : 'MISSING'}`);
  console.error('');
  console.error('   Please ensure these are set in your .env file in the project root.');
  console.error('   If they are placeholders (like "your_supabase_url_here"), replace with actual values.');
  process.exit(1);
}

// Check if values are placeholders
if (supabaseUrl.includes('your_supabase') || supabaseServiceKey.includes('your_')) {
  console.error('❌ Supabase credentials appear to be placeholders');
  console.error('   Please replace placeholder values with actual Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bold');
  console.log('='.repeat(60));
}

async function getDriverById(driverId) {
  const { data, error } = await supabase
    .from('drivers')
    .select(`
      *,
      users!drivers_user_id_fkey (
        user_name,
        email,
        role
      )
    `)
    .eq('id', driverId)
    .single();

  if (error) throw error;
  
  // Add name from users table
  if (data && data.users) {
    data.name = data.users.user_name || data.user_id || 'Unknown';
    data.email = data.users.email;
    data.user_role = data.users.role;
  }
  
  return data;
}

async function getDriverByUserId(userId) {
  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data;
}

async function getAllDrivers() {
  // Get drivers with user names via join
  const { data, error } = await supabase
    .from('drivers')
    .select(`
      id,
      user_id,
      is_available,
      program_id,
      created_at,
      display_id,
      users!drivers_user_id_fkey (
        user_name,
        email
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  // Flatten the response to include user_name
  return (data || []).map(driver => ({
    ...driver,
    name: driver.users?.user_name || driver.user_id || 'Unknown',
    email: driver.users?.email || null,
  }));
}

async function getDriverLocations(driverId) {
  const { data, error } = await supabase
    .from('driver_locations')
    .select('*')
    .eq('driver_id', driverId)
    .order('timestamp', { ascending: false })
    .limit(10);

  if (error) throw error;
  return data || [];
}

async function getActiveLocation(driverId) {
  const { data, error } = await supabase
    .from('driver_locations')
    .select('*')
    .eq('driver_id', driverId)
    .eq('is_active', true)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
  return data || null;
}

async function getMultipleActiveLocations(driverId) {
  const { data, error } = await supabase
    .from('driver_locations')
    .select('*')
    .eq('driver_id', driverId)
    .eq('is_active', true)
    .order('timestamp', { ascending: false });

  if (error) throw error;
  return data || [];
}

async function getUserById(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data;
}

function formatTimestamp(timestamp) {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  return date.toLocaleString();
}

function formatTimeAgo(timestamp) {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
}

async function diagnoseDriver(driverId) {
  try {
    logSection(`🔍 DIAGNOSING DRIVER: ${driverId}`);

    // 1. Get driver information
    log('\n📋 Driver Information', 'cyan');
    const driver = await getDriverById(driverId);
    if (!driver) {
      log(`❌ Driver not found: ${driverId}`, 'red');
      return;
    }

    console.log(`   ID: ${driver.id}`);
    console.log(`   Name: ${driver.name || driver.user_id || 'N/A'}`);
    console.log(`   User ID: ${driver.user_id || 'N/A'}`);
    console.log(`   Program ID: ${driver.program_id || 'N/A'}`);
    console.log(`   Display ID: ${driver.display_id || 'N/A'}`);
    console.log(`   Created: ${formatTimestamp(driver.created_at)}`);

    // Check availability
    log('\n📍 Availability Status', 'cyan');
    if (driver.is_available === true) {
      log('   ✅ is_available = true', 'green');
    } else {
      log('   ❌ is_available = false', 'red');
      log('   ⚠️  This will prevent:', 'yellow');
      log('      - Location updates from being sent (mobile app)', 'yellow');
      log('      - Location from being broadcast (WebSocket)', 'yellow');
      log('      - Location from appearing on map (dashboard)', 'yellow');
    }

    // 2. Get user information
    if (driver.user_id) {
      log('\n👤 User Information', 'cyan');
      try {
        const user = await getUserById(driver.user_id);
        console.log(`   User ID: ${user.user_id}`);
        console.log(`   Email: ${user.email || 'N/A'}`);
        console.log(`   Role: ${user.role || 'N/A'}`);
        if (user.role !== 'driver') {
          log('   ⚠️  User role is not "driver" - location tracking may not initialize', 'yellow');
        }
      } catch (error) {
        log(`   ⚠️  Could not fetch user: ${error.message}`, 'yellow');
      }
    }

    // 3. Get location data
    log('\n🗺️  Location Data', 'cyan');
    const locations = await getDriverLocations(driverId);
    
    if (locations.length === 0) {
      log('   ❌ No location records found', 'red');
      log('   ⚠️  This means:', 'yellow');
      log('      - Location tracking may not be initialized', 'yellow');
      log('      - Location updates may not be reaching the server', 'yellow');
      log('      - Mobile app may not have location permissions', 'yellow');
    } else {
      console.log(`   Total location records: ${locations.length}`);
      
      // Check for multiple active locations
      const activeLocations = await getMultipleActiveLocations(driverId);
      if (activeLocations.length === 0) {
        log('   ❌ No active location found', 'red');
        log('   ⚠️  This means the map will not show this driver', 'yellow');
      } else if (activeLocations.length === 1) {
        log(`   ✅ One active location found`, 'green');
        const active = activeLocations[0];
        console.log(`   Latitude: ${active.latitude}`);
        console.log(`   Longitude: ${active.longitude}`);
        console.log(`   Accuracy: ${active.accuracy ? active.accuracy.toFixed(0) + 'm' : 'N/A'}`);
        console.log(`   Timestamp: ${formatTimestamp(active.timestamp)}`);
        console.log(`   Time ago: ${formatTimeAgo(active.timestamp)}`);
        
        // Check if location is recent
        const locationDate = new Date(active.timestamp);
        const now = new Date();
        const diffMins = Math.floor((now - locationDate) / 60000);
        
        if (diffMins > 60) {
          log(`   ⚠️  Location is ${diffMins} minutes old - may not be updating`, 'yellow');
        } else {
          log(`   ✅ Location is recent (${diffMins} minutes ago)`, 'green');
        }
      } else {
        log(`   ⚠️  Multiple active locations found: ${activeLocations.length}`, 'yellow');
        log('   ⚠️  This is a problem - only one location should be active', 'yellow');
        log('   ⚠️  The map may show incorrect location', 'yellow');
        activeLocations.forEach((loc, idx) => {
          console.log(`   ${idx + 1}. ${loc.latitude}, ${loc.longitude} - ${formatTimestamp(loc.timestamp)}`);
        });
      }

      // Show recent locations
      log('\n📊 Recent Location History', 'cyan');
      locations.slice(0, 5).forEach((loc, idx) => {
        const status = loc.is_active ? '🟢 ACTIVE' : '⚪ INACTIVE';
        console.log(`   ${idx + 1}. ${status} - ${loc.latitude}, ${loc.longitude}`);
        console.log(`      Time: ${formatTimestamp(loc.timestamp)} (${formatTimeAgo(loc.timestamp)})`);
        if (loc.trip_id) {
          console.log(`      Trip ID: ${loc.trip_id}`);
        }
      });
    }

    // 4. Summary and recommendations
    logSection('📝 DIAGNOSIS SUMMARY');

    const issues = [];
    const recommendations = [];

    if (driver.is_available !== true) {
      issues.push('Driver is_available = false');
      recommendations.push('Update driver: UPDATE drivers SET is_available = true WHERE id = \'' + driverId + '\';');
      recommendations.push('Or toggle "Available" ON in mobile app');
    }

    if (locations.length === 0) {
      issues.push('No location records found');
      recommendations.push('Check mobile app location permissions');
      recommendations.push('Verify location tracking is initialized in mobile app');
      recommendations.push('Check mobile app logs for location update errors');
    } else {
      const activeLocations = await getMultipleActiveLocations(driverId);
      if (activeLocations.length === 0) {
        issues.push('No active location found');
        recommendations.push('Check if latest location has is_active = true');
        recommendations.push('Verify location updates are being received');
      } else if (activeLocations.length > 1) {
        issues.push(`Multiple active locations (${activeLocations.length})`);
        recommendations.push('Deactivate old locations:');
        recommendations.push('  UPDATE driver_locations SET is_active = false');
        recommendations.push('  WHERE driver_id = \'' + driverId + '\' AND id != \'' + activeLocations[0].id + '\';');
      } else {
        const active = activeLocations[0];
        const locationDate = new Date(active.timestamp);
        const now = new Date();
        const diffMins = Math.floor((now - locationDate) / 60000);
        
        if (diffMins > 60) {
          issues.push(`Location is stale (${diffMins} minutes old)`);
          recommendations.push('Check if driver is moving');
          recommendations.push('Verify location updates are being sent from mobile app');
          recommendations.push('Check mobile app logs for "📍 Location update sent"');
        }
      }
    }

    if (issues.length === 0) {
      log('✅ No issues detected!', 'green');
      log('   Location tracking appears to be working correctly.', 'green');
    } else {
      log(`❌ Found ${issues.length} issue(s):`, 'red');
      issues.forEach((issue, idx) => {
        log(`   ${idx + 1}. ${issue}`, 'red');
      });

      log('\n💡 Recommendations:', 'yellow');
      recommendations.forEach((rec, idx) => {
        console.log(`   ${idx + 1}. ${rec}`);
      });
    }

  } catch (error) {
    log(`\n❌ Error diagnosing driver: ${error.message}`, 'red');
    console.error(error);
  }
}

async function listAllDrivers() {
  try {
    logSection('📋 ALL DRIVERS');
    
    const drivers = await getAllDrivers();
    
    if (drivers.length === 0) {
      log('No drivers found', 'yellow');
      return;
    }

    console.log(`Found ${drivers.length} driver(s):\n`);
    
    drivers.forEach((driver, idx) => {
      const available = driver.is_available ? '✅' : '❌';
      const name = driver.name || driver.user_id || driver.id;
      console.log(`${idx + 1}. ${available} ${name}`);
      console.log(`   ID: ${driver.id}`);
      console.log(`   User ID: ${driver.user_id || 'N/A'}`);
      console.log(`   Display ID: ${driver.display_id || 'N/A'}`);
      console.log(`   Available: ${driver.is_available ? 'Yes' : 'No'}`);
      console.log(`   Program: ${driver.program_id || 'N/A'}`);
      console.log('');
    });

    log('\n💡 Use a driver ID to diagnose: node server/scripts/diagnose-location-tracking.js <driver_id>', 'cyan');

  } catch (error) {
    log(`\n❌ Error listing drivers: ${error.message}`, 'red');
    console.error(error);
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
Location Tracking Diagnostic Script

Usage:
  node server/scripts/diagnose-location-tracking.js <driver_id>
  node server/scripts/diagnose-location-tracking.js <user_id> --by-user-id
  node server/scripts/diagnose-location-tracking.js --all-drivers

Examples:
  node server/scripts/diagnose-location-tracking.js driver_123
  node server/scripts/diagnose-location-tracking.js user_bobby_halcyon_detox_001 --by-user-id
  node server/scripts/diagnose-location-tracking.js --all-drivers
`);
    process.exit(0);
  }

  if (args[0] === '--all-drivers') {
    await listAllDrivers();
    return;
  }

  let driverId = args[0];
  const byUserId = args.includes('--by-user-id');

  try {
    if (byUserId) {
      // Get driver by user_id
      const driver = await getDriverByUserId(driverId);
      if (!driver) {
        log(`❌ No driver found for user_id: ${driverId}`, 'red');
        process.exit(1);
      }
      driverId = driver.id;
      log(`Found driver: ${driver.name || driver.id} (${driver.id})`, 'green');
    }

    await diagnoseDriver(driverId);
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

main();

