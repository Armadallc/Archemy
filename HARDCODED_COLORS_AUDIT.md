# Hardcoded Colors Audit & Update Plan

## Overview
This document identifies all hardcoded color values that should be replaced with Fire design system CSS variables for consistency and maintainability.

---

## 1. CSS Variables Still Using Hardcoded Values

**File: `client/src/index.css`**

### Light Mode - Need to Derive from Fire Palette:

| CSS Variable | Current Value | Should Use | Notes |
|-------------|---------------|------------|-------|
| `--surface` | `#ffffff` | Keep as white (or use `var(--color-cloud)` for consistency) | White is standard for surfaces |
| `--foreground-secondary` | `#5c6166` | `var(--color-charcoal-muted)` | Already defined! |
| `--foreground-muted` | `#8a8f94` | Create new or use existing | Could derive from charcoal |
| `--foreground-inverse` | `#ffffff` | Keep white | Standard inverse |
| `--primary-foreground` | `#ffffff` | Keep white | Standard for primary buttons |
| `--border` | `#d4d7da` | Could derive from silver | Light gray border |
| `--border-strong` | `#b8bcc0` | Could derive from charcoal | Darker border |
| `--input` | `#ffffff` | Keep white | Standard input background |
| `--destructive` | `#dc2626` | Keep (or derive from coral) | Standard red |
| `--destructive-hover` | `#b91c1c` | Keep (or derive from coral) | Darker red |
| `--destructive-foreground` | `#ffffff` | Keep white | Standard |
| `--muted-foreground` | `#6b7280` | Could derive from charcoal | Muted text |
| `--card` | `#ffffff` | Keep white | Standard card background |
| `--popover` | `#ffffff` | Keep white | Standard popover background |

### Dark Mode - Need to Derive from Fire Palette:

| CSS Variable | Current Value | Should Use | Notes |
|-------------|---------------|------------|-------|
| `--foreground-secondary` | `#b8bcc0` | Could derive from charcoal | Lighter gray for dark mode |
| `--foreground-muted` | `#8a8f94` | Same as light mode | Consistent muted |
| `--primary-foreground` | `#ffffff` | Keep white | Standard |
| `--border` | `#464a4f` | `var(--color-charcoal-lighter)` | Already defined! |
| `--border-strong` | `#5c6166` | `var(--color-charcoal-muted)` | Already defined! |
| `--input-border` | `#464a4f` | `var(--color-charcoal-lighter)` | Already defined! |
| `--destructive` | `#f87171` | Keep (lighter for dark mode) | Standard |
| `--destructive-hover` | `#ef4444` | Keep | Standard |
| `--destructive-foreground` | `#ffffff` | Keep white | Standard |
| `--muted-foreground` | `#9ca3af` | Could derive | Muted text for dark |
| `--sidebar` | `#1a1c1e` | Could derive from charcoal | Darker sidebar |
| `--sidebar-foreground-muted` | `#6b7280` | Could derive | Muted sidebar text |
| `--sidebar-border` | `#2d3035` | Could derive from charcoal | Sidebar border |

---

## 2. Components Using Hardcoded Hex Colors in Tailwind Classes

### High Priority (Frequently Used):

**File: `client/src/components/layout/sidebar.tsx`**
- `text-[#26282b]` → `text-foreground`
- `dark:text-[#eaeaea]` → `dark:text-foreground`
- `bg-[#ff555d]` → `bg-primary`
- `hover:bg-[#ff444c]` → `hover:bg-primary-hover`
- `bg-[#2f3235]` → `bg-card` (dark mode)
- `text-[#26282b]/70` → `text-foreground-secondary`
- `text-[#cc5833]` → `text-destructive` (logout button)

**File: `client/src/components/dashboard/EnhancedAnalyticsWidget.tsx`**
- `text-[#26282b]` → `text-foreground`
- `dark:text-[#eaeaea]` → `dark:text-foreground`
- `text-[#26282b]/70` → `text-foreground-secondary`
- `bg-[#2f3235]` → `bg-card` (dark mode)

**File: `client/src/components/dashboard/FleetStatusWidget.tsx`**
- `text-[#26282b]` → `text-foreground`
- `dark:text-[#eaeaea]` → `dark:text-foreground`
- `text-[#26282b]/70` → `text-foreground-secondary`

**File: `client/src/components/dev-lab/kanban/kanban.tsx`**
- `bg-[#ff555d]` → `bg-primary`
- `hover:bg-[#ff444c]` → `hover:bg-primary-hover`
- `text-[#ff555d]` → `text-primary`
- `border-[#ff555d]` → `border-primary`
- `bg-[#2f3235]` → `bg-card` (dark mode)

**File: `client/src/components/dev-lab/kanban/KanbanExample.tsx`**
- `bg-[#ff555d]` → `bg-primary`
- `hover:bg-[#ff444c]` → `hover:bg-primary-hover`
- `bg-[#2f3235]` → `bg-card` (dark mode)

### Medium Priority (Status Colors):

**File: `client/src/components/activity-feed/ActivityFeed.tsx`**
- `#ccbd33` (trip) → Use `var(--in-progress)` or derive from Fire palette
- `#cc5833` (task) → Use `var(--destructive)` or derive from Fire palette
- `#33bccc` (client) → Could derive from Ice palette
- `#000000` (text) → Use `var(--foreground-inverse)` or appropriate contrast

**File: `client/src/components/dashboard/FleetStatusWidget.tsx`**
- `#ccbd33` (scheduled) → Use `var(--scheduled)` or `var(--status-warning)`
- `#cc33ab` (in_progress) → Use `var(--in-progress)` or `var(--status-warning)`
- `#33ccad` (completed) → Use `var(--completed)` or `var(--status-success)`
- `#cc5833` (cancelled) → Use `var(--cancelled)` or `var(--destructive)`
- `#6b7280` (default) → Use `var(--muted-foreground)`

**File: `client/src/components/EnhancedTripCalendar.tsx`**
- `#8B5CF6` (driver-color-1 fallback) → Already using CSS variable, but fallback should match
- `#EC4899` (driver-color-2 fallback) → Already using CSS variable
- `#06B6D4` (driver-color-3 fallback) → Already using CSS variable
- `#84CC16` (driver-color-4 fallback) → Already using CSS variable
- `#F97316` (driver-color-5 fallback) → Already using CSS variable
- `#6366F1` (driver-color-6 fallback) → Already using CSS variable
- `#6B7280` (muted fallback) → Use `var(--muted-foreground)`

---

## 3. Components Using Inline Styles with Hardcoded Colors

**File: `client/src/components/activity-feed/ActivityFeed.tsx`**
- Lines 410-412: Inline styles with `#ccbd33`, `#cc5833`, `#000000`
- Lines 446-448: Inline styles with `#33bccc`, `#000000`
- Lines 464-466: Inline styles with `#33bccc`, `#000000`

**File: `client/src/components/EnhancedTripCalendar.tsx`**
- Line 170: Inline style with `#cc33ab` (border color)

---

## 4. Old Design Tokens File

**File: `client/src/design-system/tokens/colors.ts`**
- Still contains old color system (blue primary, gray secondary, etc.)
- Should be updated to use Fire palette or deprecated if not used

---

## Recommended Action Plan

### Phase 1: Update CSS Variables (Quick Wins)
1. Replace hardcoded values in `index.css` with Fire palette variables where applicable
2. Add new CSS variables for missing colors (e.g., `--foreground-muted` derived from charcoal)

### Phase 2: Update High-Traffic Components
1. **Sidebar** - Replace all `text-[#26282b]` and `bg-[#ff555d]` with semantic classes
2. **Dashboard Widgets** - Replace hardcoded text colors with semantic classes
3. **Kanban Components** - Replace primary color references

### Phase 3: Update Status Colors
1. **ActivityFeed** - Replace inline styles with CSS variables or Tailwind classes
2. **FleetStatusWidget** - Replace status color functions to use CSS variables
3. **EnhancedTripCalendar** - Update status color logic

### Phase 4: Clean Up
1. Update or deprecate old `design-system/tokens/colors.ts`
2. Remove any remaining hardcoded fallback colors

---

## Quick Reference: Tailwind Class Mappings

| Hardcoded | Fire Design System Class |
|-----------|-------------------------|
| `text-[#26282b]` | `text-foreground` |
| `dark:text-[#eaeaea]` | `dark:text-foreground` |
| `text-[#26282b]/70` | `text-foreground-secondary` |
| `text-[#26282b]/60` | `text-foreground-muted` |
| `bg-[#ff555d]` | `bg-primary` |
| `hover:bg-[#ff444c]` | `hover:bg-primary-hover` |
| `bg-[#2f3235]` | `bg-card` (dark mode) |
| `bg-white/25` | `bg-card/25` or keep (glass effect) |
| `border-white/20` | `border-border/20` or keep (glass effect) |

---

## Notes
- The design-system page (`design-system.tsx`) intentionally uses hardcoded values for display purposes - these should NOT be changed
- Glass morphism effects (`bg-white/25`, `border-white/20`) may need to stay as-is for the visual effect
- Some colors like `#ffffff` (white) are standard and should remain hardcoded
- Status colors should use the new Fire-derived CSS variables we created
















