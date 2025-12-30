# Contract Analysis - Save Mechanism Explained

**Date:** 2025-12-21  
**Feature:** Contract Analysis Modal

---

## How "Save to Facility" Works

When you click **"Save Analysis"** in the Contract Analysis modal, here's what happens:

### 1. Immediate Save (localStorage)
- The analysis is saved as part of the **facility object** in the Zustand store
- The facility object now includes: `facility.contractAnalysis = { ...your analysis data... }`
- This is immediately persisted to **browser localStorage** (key: `prophet-calculator`)
- **Location:** `localStorage.getItem('prophet-calculator').facilities[facilityIndex].contractAnalysis`

### 2. Cloud Sync (Supabase) - Automatic
- After ~5 seconds (debounced), the Prophet calculator automatically syncs to Supabase
- The entire facility object (including `contractAnalysis`) is saved to the `prophet_facilities` table
- **Table:** `prophet_facilities`
- **Column:** `data` (JSONB) - stores the complete facility object
- **User Isolation:** Only your user_id can see your data (RLS policies)

### 3. Recall Mechanism
- When you click "Analyze Contract" again, the modal:
  1. Looks up the facility in the store
  2. Checks if `facility.contractAnalysis` exists
  3. If found → loads your saved analysis
  4. If not found → creates new empty analysis

---

## Data Structure

```typescript
// Facility object structure:
TreatmentFacility {
  id: "facility-123",
  name: "Facility Name",
  slot: 1,
  // ... other facility properties ...
  contractAnalysis: {  // ← Saved here
    facilityId: "facility-123",
    facilityName: "Facility Name",
    overheadCosts: { ... },
    contractTerms: { ... },
    comparisons: [ ... ],
    // ... all your analysis data ...
  }
}
```

---

## Storage Locations

### 1. Browser localStorage
- **Key:** `prophet-calculator`
- **Path:** `localStorage['prophet-calculator'].facilities[].contractAnalysis`
- **Persistence:** Survives page refresh, browser restart
- **Scope:** Device-specific (not shared across devices)

### 2. Supabase Database
- **Table:** `prophet_facilities`
- **Column:** `data` (JSONB)
- **Query:** 
  ```sql
  SELECT data->'contractAnalysis' 
  FROM prophet_facilities 
  WHERE user_id = 'YOUR_USER_ID' 
    AND id = 'FACILITY_ID';
  ```
- **Persistence:** Cross-device, cloud-backed
- **Scope:** User-specific (RLS ensures only you see your data)

---

## Supabase Sync - No Option Needed

**The sync is automatic** - there's no toggle or option to enable it.

### How It Works:
1. **On Mount:** Prophet calculator calls `syncFromSupabase()` to load your data
2. **On Change:** When you save analysis, `pendingSync = true` is set
3. **Auto-Sync:** After 5 seconds (debounced), `syncToSupabase()` runs automatically
4. **Error Handling:** If Supabase tables don't exist, it gracefully falls back to localStorage only

### To Verify Sync is Working:
```sql
-- Check if your analysis is in Supabase
SELECT 
  id,
  slot,
  data->>'name' as facility_name,
  data->'contractAnalysis'->>'updatedAt' as last_updated
FROM prophet_facilities
WHERE user_id = 'YOUR_USER_ID';
```

---

## Cross-Device Flow

### Device A:
1. Save analysis → localStorage + Supabase
2. Data is now in the cloud

### Device B:
1. Sign in → `syncFromSupabase()` runs automatically
2. Your facility data (including analysis) loads from Supabase
3. Click "Analyze Contract" → Your saved analysis appears

---

## Summary

**"Save to Facility" means:**
- The analysis becomes part of the facility object
- Saved to localStorage immediately
- Synced to Supabase automatically (no option needed)
- Recalled automatically when you reopen the modal
- Persists across devices (via Supabase)
- User-specific (only you can see your analysis)

**No manual sync needed** - it's all automatic! 🚀



