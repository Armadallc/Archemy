# System Settings Migration - Manual Steps

**Migration File:** `migrations/0028_create_system_settings_table.sql`

Since Supabase doesn't have the `exec_sql` RPC function enabled, you'll need to run this migration manually.

## 📋 Steps to Run Migration

### Option 1: Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run Migration**
   - Copy the entire contents of `migrations/0028_create_system_settings_table.sql`
   - Paste into the SQL Editor
   - Click "Run" (or press Cmd/Ctrl + Enter)

4. **Verify**
   - Check the "Tables" section in the left sidebar
   - You should see `system_settings` table
   - Run this query to verify:
     ```sql
     SELECT * FROM system_settings;
     ```

### Option 2: Supabase CLI (If Available)

```bash
# If you have Supabase CLI installed
supabase db push migrations/0028_create_system_settings_table.sql
```

## ✅ Verification

After running the migration, verify:

1. **Table exists:**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'system_settings';
   ```

2. **Default row exists:**
   ```sql
   SELECT * FROM system_settings WHERE id = 'system';
   ```

3. **Trigger exists:**
   ```sql
   SELECT trigger_name 
   FROM information_schema.triggers 
   WHERE event_object_table = 'system_settings';
   ```

## 🚀 After Migration

Once the migration is complete, the API endpoints will work automatically:
- `GET /api/system-settings` - Will return default settings or initialize them
- `PUT /api/system-settings` - Will update/create settings

