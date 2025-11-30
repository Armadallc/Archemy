# Mobile App Calendar Integration Plan

**Date:** 2025-01-27  
**Goal:** Integrate EventCalendar into driver mobile app with day/week/month views while maintaining all current trip log functionality

---

## 📋 Current State Analysis

### Current Mobile Trip Log (`mobile/app/(tabs)/trips.tsx`)
**Features:**
- ✅ FlatList of trip cards
- ✅ Status indicators (scheduled, in_progress, completed, cancelled, no_show)
- ✅ Status update buttons (Start Trip, Complete Trip, No Show)
- ✅ Client info (name, phone, call button)
- ✅ Pickup/dropoff locations with navigation buttons
- ✅ Special requirements display
- ✅ Notes display
- ✅ Stats (Scheduled, In Progress, Completed counts)
- ✅ Pull-to-refresh
- ✅ Auto-refresh (30s interval)
- ✅ Status update confirmation modal
- ✅ Navigation to trip details screen
- ✅ Empty state handling

### Web Calendar "Today" View (`EnhancedTripCalendar.tsx`)
**Features:**
- ✅ Time grid (6 AM - 10 PM)
- ✅ Time column on left
- ✅ Trips positioned by scheduled time
- ✅ Color-coded by status
- ✅ Hover card with trip details
- ✅ Click to view trip details
- ✅ Shows trip time, client name, addresses

**Gap Analysis:**
- ❌ No status update buttons
- ❌ No call client button
- ❌ No navigation buttons
- ❌ No special requirements display
- ❌ No notes display
- ❌ No confirmation modal

---

## 🎯 Implementation Strategy

### Approach: Enhanced Day View
**Replace current FlatList with calendar Day View that includes all trip log functionality**

**Key Requirements:**
1. **Day View** = Enhanced trip log with time grid
2. **Week View** = Week overview with trips
3. **Month View** = Month overview with trip counts
4. **View Toggle** = Switch between day/week/month
5. **All Functionality** = Maintain every feature from current trip log

---

## 📋 Phase 1: Create Mobile Calendar Components

### Step 1.1: Create Mobile Day View Component
**File:** `mobile/components/calendar/DayView.tsx` (NEW)

**Features:**
- Time grid (6 AM - 10 PM) using React Native components
- Trip cards positioned by time (absolute positioning)
- Each trip card includes:
  - Status indicator (color dot)
  - Time display
  - Client name and phone
  - Pickup/dropoff locations
  - Action buttons (Start/Complete/No Show)
  - Special requirements badge
  - Notes section
  - Call button
  - Navigate buttons
- Scrollable time grid
- Pull-to-refresh support
- Tap trip to navigate to details

**React Native Implementation:**
```typescript
// Use ScrollView for time grid
// Use absolute positioning for trip cards
// Use TouchableOpacity for interactions
// Use Modal for confirmation dialogs
```

### Step 1.2: Create Mobile Week View Component
**File:** `mobile/components/calendar/WeekView.tsx` (NEW)

**Features:**
- 7-day grid layout (simple calendar grid)
- **Trip count numbers** on each day (e.g., "3", "5", "2")
- Tap day to switch to Day View for that date
- Color-coded trip count badges:
  - Green: All trips completed
  - Blue: Has scheduled trips
  - Orange: Has in-progress trips
  - Red: Has cancelled/no-show trips
- Week navigation (prev/next week)
- Today indicator

**Simplified Approach:**
- No trip details in Week view
- Just trip counts for quick overview
- Tap to drill down to Day View

### Step 1.3: Create Mobile Month View Component
**File:** `mobile/components/calendar/MonthView.tsx` (NEW)

**Features:**
- Standard calendar grid (7 columns, 5-6 rows)
- **Trip count numbers** on each day (e.g., "3", "5", "2")
- Tap day to switch to Day View for that date
- Color-coded trip count badges (same as Week view)
- Month navigation (prev/next month)
- Today indicator
- Current month highlighted

**Simplified Approach:**
- No trip details in Month view
- Just trip counts for planning ahead
- Tap to drill down to Day View
- Efficient for long-term planning

### Step 1.4: Create Calendar Container Component
**File:** `mobile/components/calendar/DriverCalendar.tsx` (NEW)

**Features:**
- View toggle (Day/Week/Month)
- Date navigation (prev/next, today)
- Wraps Day/Week/Month views
- Manages calendar state
- Integrates with trip data

---

## 📋 Phase 2: Integrate with Mobile App

### Step 2.1: Update Trips Tab
**File:** `mobile/app/(tabs)/trips.tsx` (MODIFY)

**Changes:**
- Replace FlatList with `DriverCalendar` component
- Keep all existing functionality:
  - Status update mutations
  - Confirmation modal
  - Navigation handlers
  - Call handlers
  - Refresh logic
- Pass all handlers as props to calendar
- Maintain stats display (optional - can show in header)

### Step 2.2: Create Trip Card Component
**File:** `mobile/components/calendar/TripCard.tsx` (NEW)

**Extract trip card logic:**
- Reusable component for Day View
- Includes all action buttons
- Includes all trip information
- Handles tap to navigate
- Handles status updates
- Handles call/navigation

---

## 📋 Phase 3: Functionality Preservation

### All Features Must Be Maintained:

1. **Status Updates:**
   - ✅ Start Trip button (scheduled → in_progress)
   - ✅ Complete Trip button (in_progress → completed)
   - ✅ No Show button (scheduled → no_show)
   - ✅ Confirmation modal before updates
   - ✅ Mutation handling with loading states

2. **Client Interaction:**
   - ✅ Call client button (Linking.openURL tel:)
   - ✅ Client name and phone display

3. **Navigation:**
   - ✅ Navigate to pickup button
   - ✅ Navigate to dropoff button
   - ✅ Navigate to trip details (tap trip card)

4. **Information Display:**
   - ✅ Status indicator with color
   - ✅ Special requirements badge
   - ✅ Notes section
   - ✅ Passenger count
   - ✅ Trip type
   - ✅ Program name

5. **Data Management:**
   - ✅ Pull-to-refresh
   - ✅ Auto-refresh (30s)
   - ✅ Loading states
   - ✅ Error handling
   - ✅ Empty states

---

## 🎨 UI/UX Considerations

### Day View Layout:
```
┌─────────────────────────────────┐
│ [Day] [Week] [Month]  [Today]  │ ← View Toggle
├─────────────────────────────────┤
│ Stats: 3 Scheduled | 1 In Prog │ ← Optional Stats
├─────────────────────────────────┤
│ Time │ Trip Cards (positioned)  │
│ 6 AM │                          │
│ 7 AM │ [Trip Card 1]            │
│ 8 AM │                          │
│ 9 AM │ [Trip Card 2]            │
│ ...  │                          │
│10 PM │                          │
└─────────────────────────────────┘
```

### Trip Card in Day View:
```
┌─────────────────────────────────┐
│ ● SCHEDULED        8:30 AM      │
│ John Doe - (555) 123-4567       │
│ 📍 123 Main St → 456 Oak Ave   │
│ 🚗 Navigate | 📞 Call           │
│ [Start Trip] [N/S]              │
│ ⚠️ Special Requirements         │
│ 📝 Notes: ...                    │
└─────────────────────────────────┘
```

### Week View Layout:
```
┌─────────────────────────────────┐
│ [Day] [Week] [Month]  [Today]  │
├─────────────────────────────────┤
│        ← Nov 10-16 →           │
│ Sun Mon Tue Wed Thu Fri Sat     │
│  10  11  12  13  14  15  16     │
│  [3] [5] [2] [4] [1] [0] [2]    │ ← Trip counts
│                                 │
│ Tap any day → Switch to Day View│
└─────────────────────────────────┘
```

**Trip Count Badge Colors:**
- 🟢 Green: All completed
- 🔵 Blue: Has scheduled/confirmed
- 🟠 Orange: Has in-progress
- 🔴 Red: Has cancelled/no-show

### Month View Layout:
```
┌─────────────────────────────────┐
│ [Day] [Week] [Month]  [Today]  │
├─────────────────────────────────┤
│      ← November 2025 →          │
│ S  M  T  W  T  F  S             │
│          1  2  3  4  5          │
│  6  7  8 [3]10 11 12 13         │ ← Trip counts
│ 14 15 16 17 18 19 20            │
│ 21 22 23 24 25 26 27            │
│ 28 29 30                         │
│                                 │
│ Tap any day → Switch to Day View│
└─────────────────────────────────┘
```

**Trip Count Badge Colors:** (Same as Week view)
- 🟢 Green: All completed
- 🔵 Blue: Has scheduled/confirmed
- 🟠 Orange: Has in-progress
- 🔴 Red: Has cancelled/no-show

---

## 🔧 Technical Implementation Details

### React Native Components to Use:
- `ScrollView` - For time grid scrolling
- `View` - For layout containers
- `TouchableOpacity` - For buttons and trip cards
- `Text` - For all text content
- `Modal` - For confirmation dialogs
- `Linking` - For phone calls and navigation
- `StyleSheet` - For styling
- `Dimensions` - For responsive sizing

### State Management:
- Use existing React Query hooks
- Use existing mutation hooks
- Add view state (day/week/month)
- Add date state for navigation

### Data Flow:
```
TripsScreen
  ↓
DriverCalendar (manages view state)
  ↓
DayView / WeekView / MonthView
  ↓
TripCard (reusable component)
  ↓
Action handlers (passed from TripsScreen)
```

---

## ✅ Functionality Checklist

### Day View Must Have:
- [ ] Time grid (6 AM - 10 PM)
- [ ] Trip cards positioned by time
- [ ] Status indicator on each trip
- [ ] Start Trip button
- [ ] Complete Trip button
- [ ] No Show button
- [ ] Call client button
- [ ] Navigate to pickup button
- [ ] Navigate to dropoff button
- [ ] Tap trip to view details
- [ ] Special requirements display
- [ ] Notes display
- [ ] Pull-to-refresh
- [ ] Auto-refresh (30s)
- [ ] Confirmation modal
- [ ] Loading states
- [ ] Empty state

### Week View Must Have:
- [ ] 7-day grid (simple calendar layout)
- [ ] **Trip count number** on each day (e.g., "3", "5")
- [ ] **Color-coded badges** based on trip statuses
- [ ] Tap day to switch to Day View for that date
- [ ] Week navigation (prev/next)
- [ ] Today indicator
- [ ] No trip details (just counts for quick overview)

### Month View Must Have:
- [ ] Standard calendar grid (7 columns, 5-6 rows)
- [ ] **Trip count number** on each day (e.g., "3", "5")
- [ ] **Color-coded badges** based on trip statuses
- [ ] Tap day to switch to Day View for that date
- [ ] Month navigation (prev/next)
- [ ] Today indicator
- [ ] Current month highlighted
- [ ] No trip details (just counts for planning ahead)

### View Toggle Must Have:
- [ ] Day/Week/Month buttons
- [ ] Active state indication
- [ ] Smooth transitions

---

## 🚀 Implementation Order

1. **Create TripCard component** (reusable)
2. **Create DayView component** (most complex)
3. **Create WeekView component**
4. **Create MonthView component**
5. **Create DriverCalendar container**
6. **Integrate into TripsScreen**
7. **Test all functionality**
8. **Polish UI/UX**

---

## ⏱️ Estimated Time

- **Phase 1:** 3-4 hours (components)
- **Phase 2:** 1-2 hours (integration)
- **Phase 3:** 1-2 hours (testing & polish)
- **Total:** 5-8 hours

---

## ✅ Simplified Week/Month View Approach

### Benefits:
- **Lightweight:** No trip details, just counts
- **Fast:** Quick rendering, efficient for mobile
- **Planning:** Easy to see trip distribution across week/month
- **Navigation:** Tap day to drill down to Day View for details
- **Consistent:** Same calendar component, different data display

### Implementation:
- Use same calendar grid component for both Week and Month
- Calculate trip counts per day
- Determine badge color based on trip statuses for that day
- Display count number in badge
- Handle tap to navigate to Day View with selected date

### Trip Count Calculation:
```typescript
const getTripCountForDate = (date: Date, trips: Trip[]) => {
  return trips.filter(trip => {
    const tripDate = new Date(trip.scheduled_pickup_time);
    return isSameDay(tripDate, date);
  }).length;
};

const getDayStatusColor = (date: Date, trips: Trip[]) => {
  const dayTrips = trips.filter(trip => {
    const tripDate = new Date(trip.scheduled_pickup_time);
    return isSameDay(tripDate, date);
  });
  
  if (dayTrips.length === 0) return 'gray';
  if (dayTrips.every(t => t.status === 'completed')) return 'green';
  if (dayTrips.some(t => t.status === 'in_progress')) return 'orange';
  if (dayTrips.some(t => t.status === 'cancelled' || t.status === 'no_show')) return 'red';
  return 'blue'; // Has scheduled/confirmed trips
};
```

## ❓ Questions to Clarify

1. **Stats Display:** Keep stats bar at top, or remove since calendar shows counts?
2. **Default View:** Start with Day view (today) or keep current list view as default?
3. **Trip Card Size:** Fixed height or dynamic based on content?
4. **Time Grid:** Scrollable or fixed height with scroll?
5. **Week/Month Badge Style:** Small number badge or larger badge with text?

---

## 📝 Notes

- **Uniformity:** Calendar matches web app design patterns
- **Functionality:** All current features must be preserved
- **Performance:** Optimize for mobile (virtualization if needed)
- **Accessibility:** Ensure touch targets are adequate (44x44 minimum)
- **Responsive:** Handle different screen sizes

---

**Ready to proceed?** Start with Phase 1, Step 1.1 (Create TripCard component for reusability).

