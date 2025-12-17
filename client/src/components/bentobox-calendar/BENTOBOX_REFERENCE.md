# BentoBox Calendar - Current State Reference

**Date:** December 2024  
**Branch:** `feature/universal-tagging-badges`  
**Status:** ✅ Working as intended

---

## 📁 File Structure

```
client/src/components/bentobox-calendar/
├── AddActivityDialog.tsx      # Dialog for adding new activity atoms
├── BentoBoxGanttView.tsx     # Main Gantt-style calendar view
├── BentoBoxSidebar.tsx       # Left sidebar with navigation, builder, pool
├── EncounterActions.tsx      # Actions for scheduled encounters (Edit, Duplicate, Remove)
├── TemplateBuilder.tsx       # Component for building new encounter templates
├── index.ts                  # Component exports
├── store.ts                   # Zustand store with localStorage persistence
└── types.ts                   # TypeScript interfaces and types
```

**Page:**
- `client/src/pages/calendar-experiment.tsx` - Main calendar page

---

## 🏗️ Architecture

### Atomic Design System
- **Atoms:** Basic units (Staff, Activity, Client, Location, Duration)
- **Molecules:** Pre-built combinations of atoms
- **Organisms:** Complete encounter templates
- **Scheduled Encounters:** Instances of templates on the calendar

### State Management
- **Store:** Zustand with `persist` middleware
- **Storage:** localStorage (key: `bentobox-calendar-storage`)
- **Date Handling:** Automatic date serialization/deserialization via `reviver` function

---

## 🎨 Layout Structure

### Main Page (`calendar-experiment.tsx`)
```
┌─────────────────────────────────────────────────────────┐
│ Header (flex-shrink-0)                                   │
│ - Title & Description                                    │
│ - View Toggle (Day/Week/Month)                          │
│ - Date Navigation (Prev/Today/Next)                     │
│ - Stats (scheduled count)                               │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│ Sidebar      │  Gantt View                              │
│ (flex-       │  (flex-1)                                │
│  shrink-0)   │                                          │
│              │  - Days Header (sticky top)             │
│              │  - Time Grid (scrollable)                │
│              │    - Time Column (sticky left)           │
│              │    - Days Grid (scrollable)              │
│              │                                          │
└──────────────┴──────────────────────────────────────────┘
```

### Key Layout Classes
- **Container:** `h-screen flex flex-col bg-background overflow-hidden`
- **Main Content:** `flex flex-1 overflow-hidden min-h-0`
- **Sidebar:** `flex-shrink-0 h-full overflow-hidden`
- **Calendar:** `flex-1 overflow-hidden min-w-0 min-h-0`

---

## 📊 Gantt View Features

### Time Slots
- **Range:** 6 AM to 10 PM (17 hours)
- **Height:** 
  - Mobile: `h-12` (48px)
  - Desktop: `md:h-14` (56px)
- **Dynamic Calculation:** `pixelsPerMinute` calculated from actual rendered height

### Week View (7 days)
- **Layout:** Flexbox with `flex-1` on each day column
- **No horizontal scroll** - all 7 days visible
- **Vertical scroll** for time slots

### Month View (28 days)
- **Layout:** `min-w-[120px] md:min-w-[150px] lg:min-w-[180px]` per day
- **Horizontal scroll** enabled for days beyond viewport
- **Vertical scroll** for time slots

### Encounter Positioning
- **Calculation:** Based on `pixelsPerMinute` (dynamically calculated)
- **Formula:** 
  ```typescript
  top = ((startHour - 6) * 60 + startMinute) * pixelsPerMinute
  height = ((endHour - startHour) * 60 + (endMinute - startMinute)) * pixelsPerMinute
  ```
- **Minimum Height:** 24px for visibility

---

## 🎯 Key Features

### 1. Drag & Drop
- **Pool Templates → Calendar:** Drop template onto time slot to schedule
- **Scheduled Encounters:** Drag existing encounters to reschedule
- **Visual Feedback:** Opacity change when dragging, highlight on drag over

### 2. Template Building
- **Location:** Sidebar → Card Bar Builder section
- **Process:** Drag atoms (Staff, Activity, Clients, Location, Duration) to builder
- **Save:** Creates template and adds to library + pool

### 3. Encounter Actions
- **Edit:** (Currently removed from UI)
- **Duplicate:** Creates copy on next day
- **Remove:** Options for "Remove this instance" or "Remove all duplicates"

### 4. Duration Handling
- **Storage:** `DurationAtom` with `minutes` property
- **Calculation:** 
  ```typescript
  endTime.setMinutes(endTime.getMinutes() + template.duration.minutes)
  ```
- **Validation:** Handles both number and object formats
- **Default:** 120 minutes if missing

### 5. Color Coding
- **Categories:**
  - Clinical → Coral (`#ff555d`)
  - Life Skills → Lime (`#f1fec9`)
  - Recreation → Ice (`#e8fffe`)
  - Medical → Charcoal (`#26282b`)
  - Administrative → Silver (`#eaeaea`)

---

## 🔧 Technical Details

### Responsive Design
- **Time Column Width:** `w-16 md:w-20`
- **Day Column Width (Week):** `flex-1` (equal distribution)
- **Day Column Width (Month):** `min-w-[120px] md:min-w-[150px] lg:min-w-[180px]`
- **Time Slot Height:** `h-12 md:h-14`
- **Padding:** Responsive padding throughout

### State Persistence
- **Storage Key:** `bentobox-calendar-storage`
- **Reviver Function:** Converts date strings back to Date objects on rehydration
- **Automatic:** Saves on every state change

### Default Data
- **Staff:** 7 default staff members
- **Activities:** 7 default activities (Life-Skills, Fitness, Transport, Therapy, etc.)
- **Clients:** 2 default clients
- **Client Groups:** 2 default groups
- **Locations:** 2 default locations
- **Durations:** 30, 60, 90, 120 minutes
- **Templates:** 2 default templates (Life-Skills Group, Group Therapy)

---

## 🐛 Known Issues / Notes

1. **Duration Debug Logging:** Console logs added for duration verification (can be removed)
2. **Template Editor Removed:** TemplateEditor, PoolSection, LibrarySection components deleted
3. **Encounter Edit:** Edit functionality removed from EncounterActions
4. **180-minute Duration:** Some templates may have incorrect 180-minute duration (needs investigation)

---

## 📝 Component Props

### BentoBoxGanttView
```typescript
interface BentoBoxGanttViewProps {
  currentDate: Date;
  onDateChange?: (date: Date) => void;
}
```

### BentoBoxSidebar
- No props (uses store directly)

### EncounterActions
```typescript
interface EncounterActionsProps {
  encounter: ScheduledEncounter;
}
```

---

## 🎨 Styling

### Design System
- **Fire Design System:** Uses predefined color palette
- **Theme Support:** Dark/light mode compatible
- **Tailwind CSS:** Utility-first styling

### Key Classes
- **Background:** `bg-background`
- **Borders:** `border`, `border-r`, `border-b`
- **Hover States:** `hover:bg-muted/30`
- **Sticky Elements:** `sticky top-0`, `sticky left-0`
- **Overflow:** `overflow-hidden`, `overflow-y-auto`, `overflow-x-auto`

---

## 🔄 Data Flow

1. **Template Creation:** Builder → Store → Library + Pool
2. **Scheduling:** Pool → Drag → Calendar → Store → Scheduled Encounters
3. **Rescheduling:** Calendar → Drag → New Time Slot → Store Update
4. **Duplication:** Encounter → Duplicate Action → Store → New Encounter
5. **Deletion:** Encounter → Remove Action → Store → Remove from Array

---

## 📦 Dependencies

- `zustand` - State management
- `date-fns` - Date manipulation
- `lucide-react` - Icons
- `shadcn/ui` - UI components (Card, Button, HoverCard, etc.)

---

## 🚀 Usage

Access at: `http://localhost:5173/calendar-experiment`

**Workflow:**
1. Open sidebar → Card Bar Builder
2. Drag atoms to builder zones
3. Name template and select category
4. Save → Template added to pool
5. Drag template from pool to calendar time slot
6. Encounter scheduled and visible on calendar

---

## ✅ Current State Summary

- ✅ Flexbox layout with proper height constraints
- ✅ Week view shows all 7 days without horizontal scroll
- ✅ Month view allows horizontal scroll for 28 days
- ✅ Dynamic pixel calculation based on rendered time slot height
- ✅ Responsive design for mobile and desktop
- ✅ Drag-and-drop functionality working
- ✅ Duration calculation working (with debug logging)
- ✅ Color-coded encounter blocks
- ✅ Hover cards with encounter details
- ✅ Encounter actions (Duplicate, Remove)
- ✅ Template builder functional
- ✅ State persistence via localStorage

---

**Last Updated:** December 2024  
**Branch:** `feature/universal-tagging-badges`  
**Commit:** Latest working state














