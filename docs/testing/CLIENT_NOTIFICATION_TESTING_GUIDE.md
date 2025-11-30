# Client Notification System - Testing Guide

## Prerequisites

1. ✅ Database migration `0034_add_client_notification_system.sql` has been run
2. ⚠️ VAPID keys generated and added to `.env` file
3. ✅ Backend and frontend servers running

## Step-by-Step Testing

### Step 1: Generate VAPID Keys

Run the script to generate VAPID keys:
```bash
cd server && node scripts/generate-vapid-keys.js
```

Add the output to your `.env` file:
```
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:admin@halcyon.com
```

**Important:** Restart the backend server after adding VAPID keys.

### Step 2: Create a Client with PIN

1. Navigate to `/clients` page
2. Click "Add Client" button
3. Fill in client information:
   - First Name: `John`
   - Last Name: `Doe`
   - Phone: `(555) 123-4567`
   - Email: `john.doe@example.com`
   - **4-Digit PIN: `1234`** (or any 4 digits)
   - Select a Program
4. Click "Create"
5. **Note the PIN** - you'll need it for signup

### Step 3: Generate QR Code for Program

1. Navigate to `/programs` page
2. Find the program where you created the client
3. Click the **"QR Code"** button on the program card
4. QR code dialog should open showing:
   - QR code image
   - Signup URL (copyable)
   - Download button
   - Regenerate button
5. **Copy the signup URL** or download the QR code image

### Step 4: Test Public Signup Page

1. Open the signup URL in a new browser window (or scan QR code)
   - URL format: `http://localhost:5173/public/qr-verify/[token]`
2. You should see the signup form with:
   - Program name displayed
   - Disclosure about notifications
   - Form fields: First Name, Last Name, Phone, Email, PIN
   - Opt-in checkbox
3. Fill in the form:
   - First Name: `John` (must match client)
   - Last Name: `Doe` (must match client)
   - Phone: `(555) 123-4567` (optional but recommended)
   - Email: `john.doe@example.com` (optional)
   - **PIN: `1234`** (the PIN you assigned)
   - Check "I agree to receive push notifications"
4. Click "Sign Up for Notifications"
5. Expected results:
   - ✅ If info matches: Success message, browser prompts for push permission
   - ❌ If info doesn't match: Error "No matching client found"
   - ❌ If PIN is wrong: Error "Invalid PIN"

### Step 5: Grant Push Permission

1. When browser prompts for notification permission, click **"Allow"**
2. You should see: "You're all set! You'll receive trip notifications."
3. Check browser console for: "✅ Push subscription saved"

### Step 6: Test Push Notifications

#### Test 1: New Trip Creation
1. Navigate to `/trips` page
2. Create a new trip for the client you just signed up
3. **Expected:** Client should receive push notification: "Trip scheduled"

#### Test 2: Trip Status Update
1. Find the trip you just created
2. Update trip status to `in_progress`
3. **Expected:** Client should receive push notification: "Driver is on the way!"

#### Test 3: Trip Completion
1. Update trip status to `completed`
2. **Expected:** Client should receive push notification: "Trip completed"

### Step 7: Test Group Trip Notifications

1. Create a client group with multiple clients
2. Have all clients in the group opt-in (repeat Step 4 for each)
3. Create a group trip for the client group
4. **Expected:** All group members should receive push notifications

## Troubleshooting

### VAPID Keys Not Configured
- **Error:** "VAPID keys not configured"
- **Fix:** Generate keys and add to `.env`, restart backend server

### QR Code Not Generating
- **Error:** 500 error when clicking "QR Code" button
- **Fix:** Check backend logs, ensure `qrcode` package is installed

### Client Verification Fails
- **Error:** "No matching client found"
- **Fix:** 
  - Ensure first name and last name match exactly (case-insensitive)
  - Ensure client belongs to the program associated with the QR code
  - Check that client is active (`is_active = true`)

### PIN Verification Fails
- **Error:** "Invalid PIN"
- **Fix:**
  - Ensure PIN is exactly 4 digits
  - Ensure PIN matches what was set during client creation
  - Check that PIN was hashed correctly in database

### Push Notifications Not Received
- **Check:**
  - Browser notification permission is granted
  - Service worker is registered (check browser console)
  - Push subscription was saved (check `push_subscriptions` table)
  - Client has `push_notifications_enabled = true`
  - VAPID keys are configured correctly
  - Backend logs for push notification errors

### Service Worker Not Registering
- **Check:**
  - `public/sw.js` file exists
  - Service worker is registered in `App.tsx`
  - Browser console for service worker errors
  - HTTPS is required for production (localhost works for development)

## Database Verification Queries

### Check if client has PIN
```sql
SELECT id, first_name, last_name, pin_hash IS NOT NULL as has_pin 
FROM clients 
WHERE first_name = 'John' AND last_name = 'Doe';
```

### Check if client opted in
```sql
SELECT * FROM client_opt_ins 
WHERE client_id = '[client_id]';
```

### Check push subscriptions
```sql
SELECT * FROM push_subscriptions 
WHERE user_id = '[notification_user_id]';
```

### Check notification users
```sql
SELECT * FROM users 
WHERE is_notification_only = true;
```

## Expected Database State After Testing

1. **clients** table:
   - Client has `pin_hash` set (not null)
   - Client has `push_notifications_enabled = true`
   - Client has `notification_user_id` set

2. **users** table:
   - New user with `role = 'client_user'`
   - `is_notification_only = true`
   - `client_id` links to the client

3. **client_opt_ins** table:
   - New record with `is_active = true`
   - Links client to program and notification user

4. **push_subscriptions** table:
   - New subscription with `is_active = true`
   - Contains endpoint, p256dh_key, auth_key

5. **program_qr_codes** table:
   - QR code record with `is_active = true`
   - Contains `qr_token` and `qr_image_url`

