# Address Fields Audit - HALCYON TMS
**Date:** 2025-12-22  
**Purpose:** Comprehensive audit of all address field usage before implementing separated address fields

## Database Tables with Address Fields

### 1. **trips** table
- `pickup_address` (TEXT, NOT NULL) - Currently single text field
- `dropoff_address` (TEXT, NOT NULL) - Currently single text field  
- `stops` (JSONB array) - Array of address strings for multi-stop trips

**Usage:** Primary trip addresses (origin/destination and intermediate stops)

### 2. **frequent_locations** table
- `street_address` (TEXT, NOT NULL) - ✅ Already separated
- `city` (TEXT, NOT NULL) - ✅ Already separated
- `state` (TEXT, NOT NULL) - ✅ Already separated
- `zip_code` (TEXT) - ✅ Already separated
- `full_address` (TEXT, NOT NULL) - Computed/display field

**Status:** ✅ Already has separated fields! This is the model to follow.

### 3. **locations** table
- `address` (TEXT, NOT NULL) - Currently single text field

**Usage:** Program locations (service areas, offices)

### 4. **clients** table
- `address` (TEXT) - Currently single text field (nullable)

**Usage:** Client home addresses

### 5. **corporate_clients** table
- `address` (TEXT) - Currently single text field (nullable)

**Usage:** Corporate client headquarters

### 6. **programs** table
- `address` (TEXT) - Currently single text field (nullable)

**Usage:** Program office addresses

## UI Components Using Addresses

### 1. **Booking Forms**
- `client/src/components/booking/simple-booking-form.tsx`
  - Uses `originAddress` and `destinationAddress` (strings)
  - Uses `QuickAddLocation` component for address input
  - Handles `stops` array for multi-stop trips
  
- `client/src/components/booking/quick-booking-form.tsx`
  - Uses `pickupAddress` and `dropoffAddress` (strings)
  - Uses `QuickAddLocation` component

### 2. **QuickAddLocation Component**
- `client/src/components/booking/quick-add-location.tsx`
  - Main address input component used in booking forms
  - Currently accepts/returns full address string
  - Integrates with frequent_locations (which already has separated fields)
  - Needs to be updated to handle separated fields

### 3. **Client Forms**
- `client/src/components/forms/ComprehensiveClientForm.tsx`
  - Uses `address` field (Textarea)
  - Has "Use location address" checkbox

### 4. **Location Management**
- `client/src/pages/locations.tsx`
  - Create/edit locations
  - Uses `address` field (Textarea)

### 5. **Frequent Locations**
- `client/src/pages/frequent-locations.tsx`
  - Already uses separated fields (street_address, city, state, zip_code)
  - ✅ This is the reference implementation

### 6. **Profile Page**
- `client/src/pages/profile.tsx`
  - User profile address field (Textarea)

### 7. **Corporate Client Settings**
- `client/src/components/settings/CorporateClientCards.tsx`
  - Corporate client address management

### 8. **CMS1500 Form**
- `client/src/components/CMS1500Form.tsx`
  - Already uses separated fields for patient address!
  - ✅ Good reference for separated field implementation

## API Endpoints Using Addresses

### Trip Creation/Update
- `POST /api/trips` - Creates trip with pickup_address, dropoff_address, stops
- `PUT /api/trips/:id` - Updates trip addresses

### Route Estimation
- `POST /api/trips/estimate-route` - Takes fromAddress, toAddress (strings)
- `POST /api/trips/estimate-multi-leg-route` - Takes addresses array

## Current Issues Identified

1. **Data Quality:**
   - Duplicate addresses (e.g., "5335 Newton St, Denver, CO 80221, Denver, CO 80221")
   - Inconsistent formatting
   - No validation on format

2. **Geocoding Issues:**
   - Inconsistent address formats cause geocoding failures
   - Duplicate city/state/zip causes API errors

3. **Query Limitations:**
   - Cannot easily filter/search by city, state, or zip
   - Cannot generate reports by geographic region

4. **User Experience:**
   - Free-form text input allows errors
   - No real-time validation
   - No address autocomplete

## Implementation Plan

### Phase 1: Database Schema Updates
1. Add separated fields to all address tables:
   - `trips`: `pickup_street`, `pickup_city`, `pickup_state`, `pickup_zip`, `dropoff_street`, `dropoff_city`, `dropoff_state`, `dropoff_zip`
   - `locations`: `street_address`, `city`, `state`, `zip_code`
   - `clients`: `street_address`, `city`, `state`, `zip_code`
   - `corporate_clients`: `street_address`, `city`, `state`, `zip_code`
   - `programs`: `street_address`, `city`, `state`, `zip_code`

2. Keep existing fields for backward compatibility during migration
3. Add CHECK constraints for validation
4. Create computed `full_address` field or function

### Phase 2: Reusable Address Component
1. Create `AddressInput` component with separated fields
2. Include validation rules
3. Support address autocomplete (future enhancement)
4. Generate `full_address` automatically

### Phase 3: UI Updates
1. Update all forms to use new `AddressInput` component
2. Update `QuickAddLocation` to work with separated fields
3. Update trip creation/editing forms
4. Update client forms
5. Update location management

### Phase 4: API Updates
1. Update trip creation/update endpoints
2. Update route estimation to accept separated fields
3. Add validation middleware
4. Backfill existing data from `full_address` fields

### Phase 5: Data Migration
1. Parse existing `full_address` fields
2. Populate separated fields
3. Validate migrated data
4. Remove old fields (after verification period)

## Validation Rules

### Street Address
- Required (except for optional addresses)
- Max length: 255 characters
- Pattern: Allow alphanumeric, spaces, common punctuation

### City
- Required (except for optional addresses)
- Max length: 100 characters
- Pattern: Letters, spaces, hyphens, apostrophes

### State
- Required (except for optional addresses)
- Length: Exactly 2 characters
- Pattern: Uppercase letters only (A-Z)
- Validation: Must be valid US state code

### Zip Code
- Optional but recommended
- Length: 5 digits (US standard)
- Pattern: Numeric only (0-9)
- Future: Support ZIP+4 format (12345-6789)

## Notes

- `frequent_locations` table already has separated fields - use as reference
- `CMS1500Form` already uses separated fields - use as reference
- Keep `full_address` as computed/display field for backward compatibility
- Consider address autocomplete integration (Google Places, etc.) in future


