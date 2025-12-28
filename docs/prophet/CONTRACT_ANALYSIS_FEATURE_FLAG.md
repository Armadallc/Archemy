# Contract Analysis Feature Flag

**Feature Flag Name:** `contract_analysis`  
**Status:** Disabled by default  
**Location:** Prophet Calculator → Treatment Facilities

---

## Enabling the Feature Flag

### Option 1: Via Settings UI (Recommended)

1. Navigate to `/settings` (or your settings page)
2. Go to the "Feature Flags" tab
3. Find or create the flag: `contract_analysis`
4. Toggle it to **Enabled**
5. The "Analyze Contract" button will appear on facility cards

### Option 2: Via SQL (Direct Database)

```sql
-- Create the feature flag (if it doesn't exist)
INSERT INTO feature_flags (id, flag_name, is_enabled, description)
VALUES (
  gen_random_uuid(),
  'contract_analysis',
  true,  -- Set to true to enable
  'Contract Analysis feature for Prophet calculator'
)
ON CONFLICT (flag_name) 
DO UPDATE SET is_enabled = true;

-- Or update existing flag
UPDATE feature_flags 
SET is_enabled = true 
WHERE flag_name = 'contract_analysis';
```

### Option 3: Via API (Programmatic)

```bash
# Enable the flag
curl -X POST http://localhost:8081/api/feature-flags/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "flag_name": "contract_analysis",
    "is_enabled": true,
    "description": "Contract Analysis feature for Prophet calculator"
  }'
```

---

## Disabling the Feature Flag

### Via SQL

```sql
UPDATE feature_flags 
SET is_enabled = false 
WHERE flag_name = 'contract_analysis';
```

### Via Settings UI

1. Navigate to `/settings`
2. Go to "Feature Flags" tab
3. Find `contract_analysis`
4. Toggle it to **Disabled**

---

## Testing Checklist

After enabling the feature flag:

- [ ] Navigate to `/prophet`
- [ ] Go to "Treatment Facilities" tab
- [ ] Verify "Analyze Contract" button appears on facility cards
- [ ] Click "Analyze Contract" button
- [ ] Verify modal opens with 4 tabs:
  - [ ] Facility Overhead
  - [ ] Contract Terms
  - [ ] A/B Comparison
  - [ ] Summary
- [ ] Test inputting overhead costs
- [ ] Test selecting contract terms
- [ ] Test scenario comparison
- [ ] Test saving analysis
- [ ] Verify Prophet calculator still works correctly

---

## Rollback

If issues occur, instantly disable the feature:

```sql
UPDATE feature_flags 
SET is_enabled = false 
WHERE flag_name = 'contract_analysis';
```

The feature will be hidden immediately without code changes.

---

**Last Updated:** 2025-12-21  
**Feature Status:** Ready for Testing

