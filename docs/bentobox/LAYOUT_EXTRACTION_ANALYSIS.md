# Layout Extraction Analysis

## Key Responsive Patterns Found in Full-Calendar

### Week View Layout Structure
```tsx
// Key responsive patterns:
1. ScrollArea with fixed height: h-[736px]
2. Grid layout: grid grid-cols-7 (7 equal columns)
3. Time column: w-18 (fixed width)
4. Hour slots: height: "96px" (fixed)
5. Responsive text: sm:hidden / hidden sm:inline
6. Flex direction: flex-col sm:flex (stack on mobile)
```

### Critical Responsive Features
1. **Fixed Height Container**: Uses `ScrollArea` with `h-[736px]` for consistent scrolling
2. **Grid System**: `grid grid-cols-7` ensures equal column widths
3. **Time Column**: Fixed `w-18` width, doesn't shrink
4. **Hour Slots**: Fixed `96px` height per hour (24 hours = 2304px total)
5. **Mobile Handling**: `flex-col sm:flex` stacks on mobile

## What We Need to Extract

### Layout Structure Only
- ✅ Grid container structure
- ✅ ScrollArea wrapper
- ✅ Time column layout
- ✅ Day column grid
- ✅ Responsive breakpoints

### What We Keep from BentoBox
- ✅ All encounter rendering logic
- ✅ DnD handlers
- ✅ Time slot calculations (6 AM - 10 PM)
- ✅ All BentoBox-specific features

## Integration Plan

### Step 1: Create Layout Wrapper
Extract the grid structure from `calendar-week-view.tsx` and create a pure layout component.

### Step 2: Adapt for BentoBox
- Change 24 hours → 17 hours (6 AM - 10 PM)
- Change hour height from 96px → dynamic based on container
- Keep BentoBox encounter rendering
- Keep BentoBox DnD

### Step 3: Replace Grid in BentoBoxGanttView
Replace the flex-based grid with the grid-based layout from full-calendar.




