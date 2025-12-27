# Multi-Stop Trips Implementation

## Overview
This document describes the multi-stop trip functionality that has been implemented, including OpenRouteService integration, leg calculations, and billing display.

## Features Implemented

### 1. Terminology Changes
- **PU/Pickup** → **Origin** (first stop of trip)
- **DO/Dropoff** → **Destination** (last stop of trip)
- **Add Leg** → **Add Stop** (adds intermediate stops)
- Maximum: Origin + 8 Stops + Destination = 10 total addresses

### 2. Multi-Stop Trip Structure
- **Leg 1**: Origin → Stop 1 (or Destination if no stops)
- **Leg 2**: Stop 1 → Stop 2 (or Destination → Origin if round trip)
- **Leg 3+**: Continue pattern for additional stops
- Each leg displays: distance (miles) and estimated time (minutes)

### 3. Round Trip Logic
- Round trip option only available when no stops are added
- When round trip is selected, automatically creates return leg (Destination → Origin)
- Adding any stop disables round trip option

### 4. OpenRouteService Integration
- **Service**: `server/services/openroute-service.ts`
- **API Endpoints**:
  - `POST /api/trips/estimate-route` - Calculate distance/time for single leg
  - `POST /api/trips/estimate-multi-leg-route` - Calculate distance/time for multiple legs
- **Fallback**: If API unavailable, uses Haversine formula + 42.5 mph average speed

### 5. Billing Calculation Display
- Shows breakdown based on selected trip code:
  - **Base Rate**: Only if code has baseRate
  - **Mileage Bands**: Only if applicable (0-10, 11-25, 26-50, 51+ miles)
  - **Flat Rate**: Only if code uses flat rate
- Automatically determines correct mileage band based on total trip miles
- Displays total billing amount

## Setup Required

### 1. OpenRouteService API Key ✅ CONFIGURED
The API key has been provided. Add it to your `.env` file in the project root:

```env
OPENROUTESERVICE_API_KEY=eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjMxOTVjMDk4M2MxOTQ2NjE5NTI2MGI2MWRlM2ViMWQ2IiwiaCI6Im11cm11cjY0In0=
```

**Note:** 
- Free tier: 2,000 requests/day
- The API key is already configured and ready to use
- If the API key is not set, the system will automatically fall back to Haversine calculation + 42.5 mph average speed

### 2. Database Schema
The current implementation calculates legs on-the-fly. If you want to store leg data:
- Add `stops` JSONB column to `trips` table (optional)
- Or create `trip_legs` table for detailed leg tracking (future enhancement)

### 3. Testing
- Test with API key: Should get accurate routing and distance
- Test without API key: Should fall back to Haversine calculation
- Test multi-stop trips: Add up to 8 stops between Origin and Destination
- Test round trip: Should auto-create return leg when no stops exist
- Test billing: Select different trip codes and verify billing calculation

## API Usage

### Estimate Single Route
```typescript
POST /api/trips/estimate-route
{
  "fromAddress": "123 Main St, City, State",
  "toAddress": "456 Oak Ave, City, State",
  "fromCoords": { "lat": 40.7128, "lng": -74.0060 }, // Optional
  "toCoords": { "lat": 40.7580, "lng": -73.9855 }     // Optional
}

Response:
{
  "distance": 5.23,  // miles
  "duration": 12,    // minutes
  "geometry": "..."  // Route geometry (optional)
}
```

### Estimate Multi-Leg Route
```typescript
POST /api/trips/estimate-multi-leg-route
{
  "addresses": [
    "Origin Address",
    "Stop 1 Address",
    "Stop 2 Address",
    "Destination Address"
  ],
  "coordinates": [  // Optional
    { "lat": 40.7128, "lng": -74.0060 },
    { "lat": 40.7580, "lng": -73.9855 },
    ...
  ]
}

Response:
{
  "legs": [
    { "distance": 5.23, "duration": 12, "geometry": "..." },
    { "distance": 3.45, "duration": 8, "geometry": "..." },
    ...
  ]
}
```

## Billing Calculation Logic

1. **Determine Mileage Band** (for NMT codes):
   - 0-10 miles → Band 1 (U1) → $22.28
   - 11-25 miles → Band 2 (U2) → $33.42
   - 26-50 miles → Band 3 (U3) → $55.70
   - 51+ miles → Band 4 (U4) → $78.00

2. **Calculate Billing**:
   - If code has `baseRate` and `rateType !== 'per_trip'`: Show Base Rate
   - If code has mileage bands (`rateType === 'per_trip'`): Use band rate
   - If code has `mileageRate`: Calculate `totalMiles × mileageRate`
   - If code is flat rate: Show Flat Rate

3. **Display Only Applicable Fields**:
   - Base Rate: Only if code has baseRate
   - Mileage Bands: Only if applicable
   - Flat Rate: Only if code uses flat rate

## Files Modified

1. **server/services/openroute-service.ts** - New service for OpenRouteService integration
2. **server/routes/trips.ts** - Added route estimation endpoints
3. **client/src/components/booking/simple-booking-form.tsx** - Updated form with multi-stop functionality
   - Changed `pickupAddress` → `originAddress`
   - Changed `dropoffAddress` → `destinationAddress`
   - Added `stops` array
   - Added leg calculation logic
   - Added billing calculation display

## Next Steps

1. **Set up OpenRouteService API key** (see Setup section above)
2. **Test the functionality** with various trip configurations
3. **Optional**: Add database storage for leg data if needed for analytics
4. **Optional**: Add route visualization on map (for Live Fleet Map)

## Notes

- Route geometry is returned from API but not currently used in trip creation UI
- Route visualization will be used in Live Fleet Map for driver tracking
- Speed limits are skipped as requested
- Leg calculations are done on-the-fly (not stored in database) for easier testing

