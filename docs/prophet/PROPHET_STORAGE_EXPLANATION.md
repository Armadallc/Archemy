# Prophet Calculator Storage Architecture

## Current State

### ✅ What's Already Implemented

The Prophet calculator has a **hybrid storage system** that uses both:

1. **localStorage (Primary)**
   - Stores all data locally in the browser
   - Persists across browser sessions on the same device
   - Works immediately without database setup
   - **Limitation**: Data is device-specific and not shared across devices

2. **Supabase Cloud Sync (Secondary)**
   - Code is already written to sync to/from Supabase
   - User-specific data isolation (filters by `user_id`)
   - Auto-syncs on mount and after changes (5-second debounce)
   - **Current Status**: Tables don't exist yet, so it gracefully falls back to localStorage

### 🔍 How It Works

#### Storage Flow:
```
User Action → Zustand Store Update → localStorage (immediate)
                                    ↓
                            pendingSync = true
                                    ↓
                            (5 second debounce)
                                    ↓
                            syncToSupabase() → Supabase Tables
```

#### Sync Functions:
- **`syncToSupabase()`**: Saves scenarios, facilities, and custom service codes to Supabase
- **`syncFromSupabase()`**: Loads user's data from Supabase on app mount
- **Error Handling**: If tables don't exist, it silently falls back to localStorage

#### User Isolation:
- All queries filter by `user_id`: `.eq('user_id', user.id)`
- Each user only sees their own scenarios, facilities, and custom codes
- RLS (Row Level Security) policies ensure data privacy

## What Needs to Be Done

### ❌ Missing: Database Tables

The code expects these Supabase tables to exist:
- `prophet_scenarios` - Stores business scenarios
- `prophet_facilities` - Stores treatment facilities
- `prophet_service_codes` - Stores custom service code overrides

**Solution**: Run the migration file `migrations/0041_prophet_calculator_storage.sql`

### ✅ After Migration: Full Cross-Device Support

Once the tables are created:
1. **First Device**: User creates scenarios → Saved to localStorage + Synced to Supabase
2. **Second Device**: User signs in → `syncFromSupabase()` loads their scenarios
3. **Both Devices**: Changes sync automatically (5-second debounce)
4. **User Isolation**: Each user only sees their own data

## Data Stored

### What Gets Synced:
- ✅ **Scenarios**: All business scenarios with trips, costs, and calculations
- ✅ **Facilities**: Treatment facilities (up to 5 slots)
- ✅ **Service Codes**: Custom rate overrides (only modified codes, not defaults)
- ✅ **Cost Structure**: Fixed, variable, and staffing costs

### What Stays Local:
- Active tab selection
- UI state (expanded/collapsed sections)
- Temporary form data

## Testing the Implementation

### Before Migration (Current State):
1. Create scenarios on Device A → Saved to localStorage
2. Sign in on Device B → No scenarios visible (localStorage is empty)
3. Check browser console → May see warnings about missing tables

### After Migration:
1. Create scenarios on Device A → Saved to localStorage + Supabase
2. Sign in on Device B → Scenarios automatically load from Supabase
3. Edit scenario on Device B → Syncs to Supabase
4. Refresh Device A → Changes appear (or wait for auto-sync)

## Migration Steps

1. **Run the migration**:
   ```sql
   -- Execute migrations/0041_prophet_calculator_storage.sql
   -- In Supabase SQL Editor or via migration tool
   ```

2. **Verify tables exist**:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name LIKE 'prophet_%';
   ```

3. **Test sync**:
   - Create a scenario in the Prophet calculator
   - Check Supabase table: `SELECT * FROM prophet_scenarios;`
   - Sign in on another device
   - Verify scenario appears

## Code Locations

- **Store**: `client/src/components/prophet/hooks/useProphetStore.ts`
  - Lines 738-786: `syncToSupabase()` function
  - Lines 788-860: `syncFromSupabase()` function
  - Lines 1044-1073: Zustand persist configuration

- **Component**: `client/src/components/prophet/ProphetCalculator.tsx`
  - Lines 46-48: Initial sync on mount
  - Lines 51-58: Auto-sync on changes

## Summary

**Current Status**: ✅ Code is ready, ❌ Tables missing

**What You Need**: Run the migration to enable cross-device persistence

**User Experience After Migration**:
- ✅ Scenarios persist across devices
- ✅ User-specific data isolation
- ✅ Automatic sync (5-second debounce)
- ✅ Works offline (localStorage fallback)



