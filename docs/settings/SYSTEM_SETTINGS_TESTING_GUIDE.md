# System Settings - Testing Guide

**Status:** ✅ Implementation Complete - Ready for Migration & Testing  
**Date:** 2025-01-27

---

## 📋 Pre-Testing Checklist

- [ ] Backend server is running (`npm run dev`)
- [ ] You have access to Supabase Dashboard
- [ ] You're logged in as `super_admin` in the app

---

## Step 1: Run Database Migration

### Option A: Supabase Dashboard (Recommended)

1. **Navigate to Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

3. **Copy Migration SQL**
   - Open: `migrations/0028_create_system_settings_table.sql`
   - Copy **entire contents** (including `BEGIN;` and `COMMIT;`)

4. **Paste and Run**
   - Paste into SQL Editor
   - Click "Run" (or Cmd/Ctrl + Enter)

5. **Verify Success**
   - Should see "Success. No rows returned" or similar
   - Check "Tables" section → should see `system_settings`

### Option B: Verify Migration Ran

Run this query in SQL Editor to verify:

```sql
SELECT * FROM system_settings WHERE id = 'system';
```

Expected result: One row with default values.

---

## Step 2: Test Backend API

### Test 1: GET System Settings

**Using curl:**
```bash
curl -X GET http://localhost:8081/api/system-settings \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response (200 OK):**
```json
{
  "id": "system",
  "app_name": "HALCYON Transportation Management",
  "main_logo_url": null,
  "support_email": "support@halcyon.com",
  "support_phone": "+1 (555) 123-4567",
  "timezone": "America/New_York",
  "language": "en",
  "created_at": "2025-01-27T...",
  "updated_at": "2025-01-27T..."
}
```

**If Migration Not Run (404):**
```json
{
  "message": "System settings table does not exist. Please run migration: migrations/0028_create_system_settings_table.sql",
  "migrationRequired": true
}
```

### Test 2: PUT System Settings

**Using curl:**
```bash
curl -X PUT http://localhost:8081/api/system-settings \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "app_name": "HALCYON Transportation Management",
    "support_email": "support@halcyon.com",
    "support_phone": "+1 (555) 123-4567",
    "timezone": "America/Denver",
    "language": "en"
  }'
```

**Expected Response (200 OK):**
```json
{
  "id": "system",
  "app_name": "HALCYON Transportation Management",
  "support_email": "support@halcyon.com",
  "support_phone": "+1 (555) 123-4567",
  "timezone": "America/Denver",
  "language": "en",
  "updated_at": "2025-01-27T..."
}
```

**Verify Update:**
```bash
# GET again to verify timezone changed
curl -X GET http://localhost:8081/api/system-settings \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN"
```

Should show `"timezone": "America/Denver"`.

### Test 3: Using Test Script

```bash
node server/tests/test-system-settings-api.js
```

**Expected Output:**
```
🧪 Testing System Settings API
═══════════════════════════════════════

📋 Test 1: GET /api/system-settings
   ✅ Status: 200 OK
   📊 Response: {...}
   ✅ Response structure is valid

📋 Test 2: PUT /api/system-settings
   ✅ Status: 200 OK
   📊 Updated Settings: {...}
   ✅ Settings updated successfully

═══════════════════════════════════════
📊 Test Results: 2 passed, 0 failed
```

---

## Step 3: Test Frontend UI

### Test Flow:

1. **Login as super_admin**
   - Use: `admin@monarch.com` or your super_admin account

2. **Navigate to Settings**
   - Click "Settings" in sidebar
   - Or go to: `http://localhost:5173/settings`

3. **Open System Tab**
   - Click "System" tab (should be visible for super_admin only)

4. **Verify Settings Load**
   - ✅ Form fields should populate with database values
   - ✅ Not hardcoded defaults
   - ✅ Loading spinner appears briefly, then disappears

5. **Edit Settings**
   - Change "Application Name" to: `HALCYON Test`
   - Change "Timezone" to: `America/Denver`
   - Change "Support Email" to: `test@halcyon.com`

6. **Save Settings**
   - Click "Save System Settings" button
   - ✅ Button shows "Saving..." while processing
   - ✅ Success toast appears: "System Settings Saved"
   - ✅ Settings persist in form

7. **Refresh Page**
   - Press F5 or refresh browser
   - ✅ Settings should still show your changes (not defaults)

8. **Verify Database**
   - Run in Supabase SQL Editor:
     ```sql
     SELECT * FROM system_settings WHERE id = 'system';
     ```
   - ✅ Should show your updated values

---

## Step 4: Test Access Control

### Test Non-Super-Admin Access:

1. **Login as program_admin**
   - Use: `program_admin@monarch.com` or similar

2. **Navigate to Settings**
   - Go to: `http://localhost:5173/settings`

3. **Verify System Tab Hidden**
   - ✅ "System" tab should NOT be visible
   - ✅ Only see: Profile, Corporate Client, Program, Users, Contacts, Notifications

4. **Try Direct API Access**
   ```bash
   curl -X GET http://localhost:8081/api/system-settings \
     -H "Authorization: Bearer PROGRAM_ADMIN_TOKEN"
   ```
   - ✅ Should return 403 Forbidden

---

## Step 5: Test Edge Cases

### Test 1: Missing Required Fields

```bash
curl -X PUT http://localhost:8081/api/system-settings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "app_name": "Test"
  }'
```

**Expected:** 400 Bad Request with message about missing fields

### Test 2: Invalid Timezone

```bash
curl -X PUT http://localhost:8081/api/system-settings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "app_name": "Test",
    "support_email": "test@test.com",
    "support_phone": "+1 555-1234",
    "timezone": "Invalid/Timezone",
    "language": "en"
  }'
```

**Expected:** Should accept (validation happens at database level if constraint exists)

### Test 3: Empty String Values

```bash
curl -X PUT http://localhost:8081/api/system-settings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "app_name": "",
    "support_email": "",
    "support_phone": "",
    "timezone": "",
    "language": ""
  }'
```

**Expected:** May fail validation (database NOT NULL constraints)

---

## ✅ Success Criteria

- [ ] Migration runs successfully
- [ ] GET endpoint returns settings (200 OK)
- [ ] PUT endpoint updates settings (200 OK)
- [ ] Frontend loads settings from database
- [ ] Frontend saves settings successfully
- [ ] Settings persist after page refresh
- [ ] Non-super-admin cannot access System tab
- [ ] Non-super-admin gets 403 on API access
- [ ] Error handling works (404 if table doesn't exist)

---

## 🐛 Troubleshooting

### Issue: "Table does not exist" Error

**Solution:** Run the migration manually via Supabase Dashboard SQL Editor

### Issue: 403 Forbidden

**Solution:** Ensure you're logged in as `super_admin` and using correct auth token

### Issue: Settings Not Persisting

**Solution:** 
1. Check browser console for errors
2. Check backend logs for errors
3. Verify database row was updated: `SELECT * FROM system_settings;`

### Issue: Frontend Shows Hardcoded Defaults

**Solution:**
1. Check Network tab → `/api/system-settings` request
2. Verify response is 200 OK with database values
3. Check React Query cache: `queryClient.getQueryData(['/api/system-settings'])`

---

## 📝 Test Results Template

```
Date: ___________
Tester: ___________

Migration:
[ ] Ran successfully
[ ] Verified table exists
[ ] Verified default row exists

Backend API:
[ ] GET /api/system-settings - 200 OK
[ ] PUT /api/system-settings - 200 OK
[ ] Settings persist in database

Frontend UI:
[ ] Settings load from database
[ ] Can edit and save settings
[ ] Success toast appears
[ ] Settings persist after refresh

Access Control:
[ ] System tab hidden for non-super-admin
[ ] API returns 403 for non-super-admin

Notes:
_______________________________________
_______________________________________
```

---

**Ready to test!** Start with Step 1 (Migration), then proceed through each step.

