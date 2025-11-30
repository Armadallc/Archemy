/**
 * Generate VAPID Keys Script
 * 
 * Run this script to generate VAPID keys for web push notifications
 * Add the output to your .env file:
 * VAPID_PUBLIC_KEY=...
 * VAPID_PRIVATE_KEY=...
 * VAPID_SUBJECT=mailto:admin@halcyon.com
 */

import webpush from 'web-push';

console.log('🔑 Generating VAPID keys for web push notifications...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('✅ VAPID keys generated!\n');
console.log('Add these to your .env file:\n');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:admin@halcyon.com\n`);
console.log('⚠️  Keep the private key secure! Never commit it to version control.\n');

