# Trip Order & Notification System - Implementation Plan

**Date:** December 30, 2025  
**Status:** Planning Phase

---

## 📋 Summary of Understanding

### Core Workflow

1. **Trip Creation → Order Status**
   - New trips start as "Order" (not "Scheduled")
   - Driver assignment is optional at creation - in the trip creation form change "Assign Driver (optional) to Request Driver (Optional). If a driver is not requested, the super admin should be notified so that the super admin can select driver and confirm trips. 
   - If driver assigned → notification sent to driver

2. **Driver Notification & Actions**
   - Driver receives notification with trip details
   - Three action buttons: Confirm, View Details, Decline
   - Driver can close notification and revisit later

3. **Order Confirmation**
   - Single trip: Confirm → Status changes to "Scheduled"
   - Recurring trip: Must confirm ALL instances (no partial confirmation)
   - Confirmation triggers notification to trip creator

4. **Order Decline**
   - Driver must provide reason/note - A Simple list of common reasons is a better option that the driver writing a custom reason in a note. We can provide the driver with a few reasons like (Conflict, Day Off, Unavailable etc) suggest 2-3 more reasons
   - Trip stays in "Order" status
   - Super admin notified to assign new driver

5. **Trip Status Updates & Notifications**
   - Start trip → Notify creator + tagged users
   - Client onboard → Track status
   - Drop-off → Track status - to minimize the number of buttons in the UI, would it be easier to automatically account for wait time if the trip type is round trip. So that once the driver selects Client Arrived the wait time clock automatically starts and indicated by the button changing states to "Waiting...". When the client is done with the appointment and is back in the car the driver selects the same button which then changes states from "Waiting..." to "Arrived" (to final destination). So the Driver starts trip and is prompted with "Client Aboard Y/N?". Driver selected Y then the trip status updates to In-Progress and Client Picked Up (notification sent to creator). Driver arrives with client to appointment and selects "Arrived" and is prompted with "Start wait time Y/N?".... or it might be easier to simply keep the single start/stop button but it must cycle through each leg of the trip before its actually complete. At each leg the driver will receive a prompt popover that follows the logic of the trip cycle, accounting for deadhead miles (no client aboard), wait time, client picked up, dropped off etc
   - Wait time → Track for round trips
   - Complete trip → Notify creator + tagged users
   - No-show → Notify creator + tagged users

6. **User Tagging System**
   - Trip creator can tag other users
   - Tagged users receive notifications
   - Users can configure notification preferences
   - Granular control (e.g., only start/complete)

---

## 💡 Suggestions & Improvements

### 1. Status Workflow Enhancement

**Current Statuses:** `scheduled`, `confirmed`, `in_progress`, `completed`, `cancelled`, `no_show`

**Proposed Addition:** `order` (new initial status)

**Suggested Status Flow:**
```
order → scheduled → in_progress → completed
  ↓         ↓           ↓
declined  cancelled  cancelled/no_show
```

**Benefits:**
- Clear distinction between "Order" (pending driver confirmation) and "Scheduled" (confirmed)
- Better workflow visibility
- Prevents confusion about trip state

### 2. Recurring Trip Confirmation Logic

**Current Requirement:** Must confirm ALL or NONE

**Suggestion:** Add "Confirm All" prompt with clear messaging:
- "This is a recurring trip (Standing Order). Confirming will schedule all instances."
- Show count: "This will confirm 12 trips from [start] to [end]"
- Allow driver to review pattern before confirming

**Alternative Consideration:** 
- Allow partial confirmation for recurring trips?
- **Recommendation:** Keep current requirement (all or none) for simplicity and consistency

### 3. Notification Action Buttons

**Current Plan:** Confirm, View Details, Decline

**Enhancement Suggestions:**
- **Confirm**: Immediate action, show confirmation dialog for recurring
- **View Details**: Opens full trip details modal/page
- **Decline**: Opens decline form with required note field
- **Snooze/Remind Later**: Add option to dismiss and set reminder (optional)

### 4. Wait Time Tracking

**New Fields Needed:**
- `wait_time_started_at` (TIMESTAMP)
- `wait_time_stopped_at` (TIMESTAMP)
- `client_onboard_at` (TIMESTAMP) - NEW
- `client_dropoff_at` (TIMESTAMP) - NEW

**Workflow:**
1. Driver starts trip → `in_progress` (en-route to pickup)
2. Driver arrives → Can mark "Client Onboard" → `client_onboard_at` set
3. For appointments: Driver marks "Client Dropped Off" → `client_dropoff_at` set
4. For round trips: Driver starts wait timer → `wait_time_started_at` set
5. Client ready → Driver stops wait timer → `wait_time_stopped_at` set
6. Driver en-route back → Continue trip

### 5. User Tagging System

**Database Schema:**
```sql
CREATE TABLE trip_notification_tags (
  id VARCHAR(50) PRIMARY KEY,
  trip_id VARCHAR(50) NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  created_by VARCHAR(50) NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(trip_id, user_id)
);

CREATE TABLE user_notification_preferences (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  trip_status_updates JSONB DEFAULT '{
    "order_confirmed": true,
    "order_declined": true,
    "trip_started": true,
    "client_onboard": false,
    "client_dropoff": false,
    "trip_completed": true,
    "no_show": true,
    "wait_time_started": false,
    "wait_time_stopped": false
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);
```

**Features:**
- Trip creator can add/remove tags
- Tagged users receive notifications based on preferences
- Default preferences: All enabled except optional events (onboard, dropoff, wait time)
- Users can customize per-event preferences

### 6. Notification Content Enhancement

**Order Notification to Driver:**
```
Title: "New Trip Order - [Client Name]"
Body: 
  Date: [Date]
  Time: [Time]
  Type: [One-Way/Round Trip]
  Client: [Client Name]
  Purpose: [Purpose]
  Recurring: Yes/No
  [If recurring: "This is a Standing Order with X instances"]

Actions: [Confirm] [View Details] [Decline]
```

**Confirmation Notification to Creator:**
```
Title: "Trip Order Confirmed"
Body: "Driver [Name] has confirmed the trip order for [Client] on [Date] at [Time]"
[If recurring: "All X instances of this Standing Order have been confirmed"]
```

**Status Update Notifications:**
```
Title: "Trip Status Update - [Status]"
Body: "Trip for [Client] has been updated to [Status] by Driver [Name]"
[Include relevant details: wait time, onboard status, etc.]
```

### 7. Mobile App Enhancements

**New Actions Needed:**
- "Client Onboard" button (after arriving at pickup)
- "Client Dropped Off" button (for appointments)
- "Start Wait Time" button (for round trips)
- "Stop Wait Time" button (when client ready)
- "No Show" button (if client not available)

**UI Flow:**
```
Trip Card → [Start Trip] 
  → [Arrived] → [Client Onboard]
    → [For Appointments: Drop Off] → [Start Wait Time] → [Stop Wait Time] → [Complete]
    → [For Direct: Complete]
```

### 8. Admin Workflow for Declined Orders

**Current Plan:** Super admin notified to assign new driver

**Enhancement:**
- Create "Unassigned Orders" dashboard/widget
- Show declined orders with reason
- Allow admin to:
  - Reassign to different driver
  - Cancel order
  - Modify trip details
- Auto-notify new driver when reassigned

---

## 🗄️ Database Schema Changes

### 1. Add "order" Status

**Migration:** `0062_add_order_status.sql`

```sql
-- Add 'order' to trip_status enum
ALTER TYPE trip_status ADD VALUE IF NOT EXISTS 'order';

-- Update default status for new trips
ALTER TABLE trips ALTER COLUMN status SET DEFAULT 'order';

-- Update status validator to include 'order'
```

### 2. Add Wait Time & Client Tracking Fields

**Migration:** `0063_add_trip_tracking_fields.sql`

```sql
ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS wait_time_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS wait_time_stopped_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS client_onboard_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS client_dropoff_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS decline_reason TEXT,
ADD COLUMN IF NOT EXISTS declined_by VARCHAR(50) REFERENCES users(user_id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS declined_at TIMESTAMP WITH TIME ZONE;
```

### 3. Add User Tagging Tables

**Migration:** `0064_add_trip_notification_tags.sql`

```sql
-- Trip notification tags
CREATE TABLE IF NOT EXISTS trip_notification_tags (
  id VARCHAR(50) PRIMARY KEY,
  trip_id VARCHAR(50) NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  created_by VARCHAR(50) NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(trip_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_trip_notification_tags_trip_id ON trip_notification_tags(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_notification_tags_user_id ON trip_notification_tags(user_id);

-- User notification preferences
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  trip_status_updates JSONB DEFAULT '{
    "order_confirmed": true,
    "order_declined": true,
    "trip_started": true,
    "client_onboard": false,
    "client_dropoff": false,
    "trip_completed": true,
    "no_show": true,
    "wait_time_started": false,
    "wait_time_stopped": false
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id ON user_notification_preferences(user_id);
```

---

## 🔧 Implementation Phases

### Phase 1: Database & Status System
- [ ] Add "order" status to enum
- [ ] Update default trip status to "order"
- [ ] Add wait time and client tracking fields
- [ ] Add user tagging tables
- [ ] Update status validator

### Phase 2: Backend - Order Management
- [ ] Update trip creation to set status "order"
- [ ] Create order confirmation endpoint
- [ ] Create order decline endpoint
- [ ] Handle recurring trip confirmation logic
- [ ] Update status transition validator

### Phase 3: Backend - Notification System
- [ ] Create order notification to driver
- [ ] Create confirmation notification to creator
- [ ] Create decline notification to admin
- [ ] Create status update notifications
- [ ] Implement user tagging system
- [ ] Implement notification preferences

### Phase 4: Backend - Trip Tracking
- [ ] Add client onboard tracking
- [ ] Add client dropoff tracking
- [ ] Add wait time tracking
- [ ] Update trip status update logic

### Phase 5: Frontend - Order Management
- [ ] Update trip creation form
- [ ] Add user tagging UI
- [ ] Create order confirmation modal
- [ ] Create order decline modal
- [ ] Update trip list to show "Order" status
- [ ] Add "Unassigned Orders" dashboard

### Phase 6: Mobile App - Driver Actions
- [ ] Update notification handling
- [ ] Add order confirmation UI
- [ ] Add order decline UI
- [ ] Add "Client Onboard" button
- [ ] Add "Client Dropped Off" button
- [ ] Add wait time controls
- [ ] Update trip status flow

### Phase 7: Testing & Refinement
- [ ] Test order workflow end-to-end
- [ ] Test recurring trip confirmation
- [ ] Test notification delivery
- [ ] Test user tagging
- [ ] Test notification preferences
- [ ] Performance testing

---

## 📝 API Endpoints

### Order Management

**POST `/api/trips/:id/confirm-order`**
- Confirm single trip order
- For recurring: Confirm all instances
- Returns: Updated trip(s)

**POST `/api/trips/:id/decline-order`**
- Decline trip order with reason
- Body: `{ reason: string }`
- Returns: Updated trip

**GET `/api/trips/orders/unassigned`**
- Get all unassigned/declined orders
- Returns: Array of trips with status "order"

### User Tagging

**POST `/api/trips/:id/tags`**
- Add user tag to trip
- Body: `{ user_id: string }`
- Returns: Tag object

**DELETE `/api/trips/:id/tags/:userId`**
- Remove user tag from trip
- Returns: Success message

**GET `/api/trips/:id/tags`**
- Get all tagged users for trip
- Returns: Array of user objects

### Notification Preferences

**GET `/api/users/:userId/notification-preferences`**
- Get user notification preferences
- Returns: Preferences object

**PUT `/api/users/:userId/notification-preferences`**
- Update user notification preferences
- Body: `{ trip_status_updates: {...} }`
- Returns: Updated preferences

### Trip Tracking

**POST `/api/trips/:id/client-onboard`**
- Mark client as onboard
- Sets `client_onboard_at`
- Returns: Updated trip

**POST `/api/trips/:id/client-dropoff`**
- Mark client as dropped off
- Sets `client_dropoff_at`
- Returns: Updated trip

**POST `/api/trips/:id/wait-time/start`**
- Start wait time clock
- Sets `wait_time_started_at`
- Returns: Updated trip

**POST `/api/trips/:id/wait-time/stop`**
- Stop wait time clock
- Sets `wait_time_stopped_at`
- Returns: Updated trip

---

## 🎨 UI/UX Considerations

### Order Status Color
- **Order**: Orange/Amber (`#F59E0B`) - Pending confirmation
- **Scheduled**: Blue (`#3B82F6`) - Confirmed and ready
- **In Progress**: Yellow (`#F59E0B`) - Active
- **Completed**: Green (`#059669`) - Done

### Notification UI
- Rich notifications with action buttons
- Persistent notifications until action taken
- Notification center with filter by type
- Badge count for unread notifications

### Mobile App Flow
- Clear action buttons for each status
- Confirmation dialogs for important actions
- Progress indicators for trip stages
- Wait time display (if active)

---

## 🔍 Edge Cases & Considerations

1. **Driver Unavailable**: What if driver declines and no other driver available?
   - Keep in "Order" status
   - Show in "Unassigned Orders" dashboard
   - Allow admin to modify or cancel

2. **Recurring Trip Partial Updates**: What if driver confirms but then some instances are cancelled?
   - Keep confirmed instances as "Scheduled"
   - Cancelled instances remain "Order" or become "Cancelled"

3. **Notification Preferences**: What if user disables all notifications?
   - Still track events in system
   - User can view in notification center
   - Respect user choice

4. **Multiple Tagged Users**: How to handle notification delivery?
   - Send to all tagged users
   - Respect individual preferences
   - Batch notifications if possible

5. **Wait Time Calculation**: How to calculate total wait time?
   - `wait_time_stopped_at - wait_time_started_at`
   - Store in separate field for reporting: `total_wait_time_minutes`

---

## ✅ Summary

This plan implements a comprehensive trip order and notification system with:

1. **Order Status Workflow**: Clear distinction between orders and scheduled trips
2. **Driver Confirmation System**: Robust order acceptance/decline process
3. **Recurring Trip Handling**: All-or-nothing confirmation for standing orders
4. **Enhanced Tracking**: Client onboard, dropoff, and wait time tracking
5. **User Tagging**: Flexible notification system with preferences
6. **Mobile App Integration**: Complete driver workflow support

**Next Steps:**
1. Review and approve this plan
2. Prioritize phases
3. Begin Phase 1 implementation


