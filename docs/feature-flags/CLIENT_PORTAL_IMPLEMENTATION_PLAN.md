# Client Portal Implementation Plan

## Overview
Create a public client portal that allows clients to view their trips, track drivers in real-time, and see notification history without requiring traditional login. Access is granted via secure token-based authentication.

## Feature Flag
- **Flag Name**: `client_portal_enabled`
- **Scope**: Program-level (each program can enable/disable independently)
- **Default**: Disabled

## Architecture

### 1. Token-Based Authentication
- Generate secure access token when client opts in for notifications
- Store token in `client_opt_ins` table or create new `client_access_tokens` table
- Token format: `client_token_<random_64_char_hex>`
- Token expiration: Optional (e.g., 1 year, or never expires)
- Token is included in notification URLs: `/public/client/:token?tripId=xxx`

### 2. Database Schema Changes

#### New Table: `client_access_tokens` (Optional - can use existing `client_opt_ins`)
```sql
CREATE TABLE client_access_tokens (
  id VARCHAR(50) PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  program_id VARCHAR(50) NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  access_token VARCHAR(128) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE, -- NULL = never expires
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_client_access_tokens_token ON client_access_tokens(access_token);
CREATE INDEX idx_client_access_tokens_client ON client_access_tokens(client_id);
```

**OR** (Simpler approach - add to existing table):
```sql
ALTER TABLE client_opt_ins ADD COLUMN IF NOT EXISTS access_token VARCHAR(128) UNIQUE;
CREATE INDEX IF NOT EXISTS idx_client_opt_ins_token ON client_opt_ins(access_token);
```

### 3. Backend API Routes

#### Public Routes (No Auth Required)
- `GET /api/client-portal/trips/:token` - Get client's trips (current/upcoming)
- `GET /api/client-portal/trip/:tripId/:token` - Get specific trip details
- `GET /api/client-portal/driver-location/:tripId/:token` - Get driver location for active trip
- `GET /api/client-portal/notifications/:token` - Get notification history
- `GET /api/client-portal/verify-token/:token` - Verify token and get client info

#### Token Validation
- Validate token on every request
- Check if token is active and not expired
- Return client_id and program_id for authorized access

### 4. Frontend Routes

#### Public Client Portal Page
- `Route: /public/client/:token`
- Component: `client/src/pages/public/client-portal.tsx`
- Features:
  - Trip list (current/upcoming only, or include past trips?)
  - Interactive map with live driver tracking
  - Notification history
  - Mobile-responsive design

#### Deep Links from Notifications
- Update notification URLs in `server/routes/trips.ts`:
  ```typescript
  url: `/public/client/${clientAccessToken}?tripId=${trip.id}`
  ```

### 5. Components to Create

#### `client/src/pages/public/client-portal.tsx`
- Main portal page
- Token validation
- Trip list view
- Map view toggle
- Notification history

#### `client/src/components/client-portal/TripCard.tsx`
- Display trip information
- Status badge
- Action buttons (if needed)

#### `client/src/components/client-portal/LiveTrackingMap.tsx`
- Interactive map (using existing map component)
- Real-time driver location updates
- Route visualization
- ETA display

#### `client/src/components/client-portal/NotificationHistory.tsx`
- List of recent notifications
- Grouped by date
- Click to view trip details

#### `client/src/hooks/useClientPortal.ts`
- Hook for fetching client portal data
- Token management
- Real-time updates (WebSocket or polling)

### 6. Real-Time Updates

#### Option A: WebSocket (Recommended)
- Extend existing WebSocket to support client tokens
- Subscribe to trip updates for specific client
- Push driver location updates

#### Option B: Polling
- Poll driver location every 5-10 seconds when trip is active
- Poll trip status every 30 seconds
- Simpler but less efficient

### 7. Security Considerations

- Token generation: Use crypto.randomBytes(64).toString('hex')
- Token storage: Hash tokens in database (optional, for extra security)
- Rate limiting: Limit API requests per token
- CORS: Ensure public routes allow cross-origin if needed
- Token rotation: Allow clients to regenerate token (optional)

### 8. Implementation Steps

#### Phase 1: Token System
1. Add `access_token` column to `client_opt_ins` table
2. Generate token during QR verification opt-in
3. Create token validation service
4. Create public API routes with token validation

#### Phase 2: Basic Portal
1. Create `/public/client/:token` route
2. Build basic trip list view
3. Add token validation on page load
4. Update notification URLs to use token

#### Phase 3: Live Tracking
1. Integrate map component
2. Add driver location API endpoint
3. Implement real-time updates (WebSocket or polling)
4. Add ETA calculation

#### Phase 4: Notification History
1. Create notification history API
2. Build notification history component
3. Add filtering/sorting

#### Phase 5: Feature Flag Integration
1. Add `client_portal_enabled` feature flag
2. Conditionally show portal link in notifications
3. Conditionally enable portal routes

### 9. UI/UX Considerations

- **Mobile-first design**: Most clients will use mobile devices
- **Simple navigation**: Minimal clicks to see trip info
- **Clear status indicators**: Visual status badges
- **Accessibility**: Screen reader support, keyboard navigation
- **Offline support**: Service worker caching for basic trip info

### 10. Testing Checklist

- [ ] Token generation works correctly
- [ ] Token validation prevents unauthorized access
- [ ] Portal loads with valid token
- [ ] Trip list displays correctly
- [ ] Map shows driver location in real-time
- [ ] Notifications link to correct portal URL
- [ ] Mobile responsive design works
- [ ] Feature flag enables/disables portal correctly
- [ ] Token expiration works (if implemented)
- [ ] Rate limiting prevents abuse

### 11. Future Enhancements

- Trip history (past trips)
- Trip details view (full trip information)
- Contact driver button (if enabled)
- Estimated arrival time
- Route preview
- Multiple trips support
- Group trip support
- Push notification preferences
- Language selection

## Questions to Resolve

1. **Token Expiration**: Should tokens expire? If yes, how long? (Recommendation: 1 year or never)
2. **Trip History**: Show past trips or only current/upcoming? (Recommendation: Start with current/upcoming)
3. **Real-Time Updates**: WebSocket or polling? (Recommendation: WebSocket for better UX)
4. **Map Provider**: Use existing map component or new one? (Recommendation: Reuse existing)
5. **Group Trips**: How to handle group trips in portal? (Recommendation: Show all group members' trips)

## Estimated Timeline

- **Phase 1 (Token System)**: 2-3 hours
- **Phase 2 (Basic Portal)**: 4-6 hours
- **Phase 3 (Live Tracking)**: 6-8 hours
- **Phase 4 (Notification History)**: 3-4 hours
- **Phase 5 (Feature Flag)**: 1-2 hours
- **Total**: ~16-23 hours

## Dependencies

- Existing map component (`InteractiveMapWidget.tsx`)
- WebSocket infrastructure (already exists)
- Driver location tracking (already exists)
- Push notification system (already implemented)

