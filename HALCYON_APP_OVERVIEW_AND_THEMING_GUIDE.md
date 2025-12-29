# HALCYON - Complete App Overview & Theming Guide

## 📋 Table of Contents
1. [App Purpose & Core Functions](#app-purpose--core-functions)
2. [Tech Stack](#tech-stack)
3. [Architecture Overview](#architecture-overview)
4. [Current Styling System](#current-styling-system)
5. [Streamlined Theming Process](#streamlined-theming-process)
6. [File Locations Reference](#file-locations-reference)
7. [Recent Updates & New Features](#-recent-updates--new-features)

---

## 🎯 App Purpose & Core Functions

### **HALCYON** - Multi-Tenant Transportation Management System

HALCYON is a comprehensive transportation management platform designed for organizations like Monarch Competency. It provides end-to-end trip management, driver coordination, and real-time operational oversight.

### Core Functions

#### 1. **Multi-Tenant Hierarchy Management**
- **Corporate Clients** → **Programs** → **Locations** → **Clients/Drivers/Vehicles**
- Role-based access control (Super Admin, Corporate Admin, Program Admin, Program User, Driver)
- Data isolation and scoping per tenant

#### 2. **Trip Management**
- Create, schedule, and track trips
- Real-time trip status updates (scheduled, in-progress, completed, cancelled, confirmed)
- Driver assignment and vehicle allocation
- Route optimization and frequent locations
- Trip history and analytics

#### 3. **Driver Mobile App**
- Real-time trip assignments and updates
- GPS tracking and navigation
- Emergency tools and notifications
- Profile management with avatar upload
- Chat/messaging system

#### 4. **Dashboard & Analytics**
- Live operations widget (real-time trips and drivers)
- Fleet status monitoring
- Quick stats and metrics
- Interactive map visualization
- Task management (Kanban board)
- Gantt chart for scheduling

#### 5. **Communication System**
- Real-time chat (discussions/messaging)
- @mention support for user tagging
- Message reactions and replies
- Pin/mute/delete conversations
- Activity feed for system-wide events

#### 6. **User & Permission Management**
- Role-based permissions system
- User profiles with avatars
- Corporate client and program management
- Client group management

#### 7. **Calendar & Scheduling**
- Universal calendar system
- Trip scheduling and conflicts
- Recurring trip patterns
- BentoBox calendar with multiple view modes (Month, Agenda, Stage & Calendar)
- Template builder and client group builder
- Library section for reusable templates

#### 8. **Team Management** (NEW)
- **Programs Management** (`/team/programs`)
  - Overview, Census, and Staff tabs
  - **Licensures**: Track program-level licenses with expiry dates and renewal reminders
  - **Certifications**: Manage staff certifications with expiry tracking
  - **Forms**: Document management with file upload support
  - **Tasks**: Task management with status, priority, and assignment tracking
  - **Scheduling**: Driver availability and schedule viewing
  - **Curriculum**: Training curriculum management with document uploads
  - **Onboarding**: Onboarding checklist items with document attachments
- **Locations Management** (`/team/locations`)
  - Overview, Census, and Staff tabs
  - **Room & Bed Assignments**: Complete room/bed inventory management
    - Custom room/bed numbering (e.g., "1A", "6B", "1 top", "2 bottom")
    - Bed types (single, twin, full, queen, king, bunk_top, bunk_bottom, other)
    - Client assignment to specific rooms and beds
    - Visual occupancy indicators and summary statistics
    - Automatic client table updates when assignments change
- **Staff Management** (`/team/staff`)
  - Staff directory and management
- **Client Census** (`/team/client-census`)
  - Comprehensive client census tracking
  - Demographics and statistics
  - Room/bed assignment display

#### 9. **Trip Tracking & Audit Trail**
- `created_by` and `updated_by` fields on trips
- `created_at` and `updated_at` timestamps
- User attribution for trip creation and updates
- Display in expanded trip view

#### 10. **File Upload & Document Management**
- File upload support for program forms, curriculum, and onboarding documents
- Supabase Storage integration
- File metadata tracking
- Document URL management

---

## 🛠 Tech Stack

### **Frontend (Web App)**
- **Framework**: React 18.3.1
- **Build Tool**: Vite 7.2.2
- **Routing**: Wouter 3.3.5
- **State Management**: 
  - React Query (@tanstack/react-query) for server state
  - React Context for auth and theme
- **UI Framework**: 
  - **shadcn/ui** (Radix UI primitives)
  - **Tailwind CSS** 3.4.18 for styling
  - **Tailwind Animate** for animations
- **Forms**: React Hook Form + Zod validation
- **Theme**: next-themes for dark/light mode
- **Icons**: Lucide React
- **Charts**: Chart.js, Recharts
- **Maps**: Leaflet, React Leaflet

### **Backend (API Server)**
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.21.2
- **Database**: 
  - **Supabase** (PostgreSQL)
  - **Drizzle ORM** 0.39.1 for type-safe queries
- **Authentication**: Supabase Auth (JWT-based)
- **Storage**: Supabase Storage (for avatars, documents)
- **Real-time**: WebSockets (ws 8.18.0)
- **File Processing**: Sharp (image resizing/conversion)

### **Mobile App**
- **Framework**: Expo ~54.0.12
- **Runtime**: React Native 0.81.4
- **Routing**: Expo Router 6.0.10
- **State Management**: 
  - React Query for server state
  - React Context for auth and theme
- **Styling**: React Native StyleSheet (with design tokens)
- **Icons**: @expo/vector-icons (Ionicons)
- **Gestures**: react-native-gesture-handler
- **Safe Areas**: react-native-safe-area-context

### **Shared**
- **Type System**: TypeScript 5.6.3
- **Schema**: Drizzle ORM shared schema (`shared/schema.ts`)
- **Design Tokens**: Shared color and typography definitions

### **Development Tools**
- **Testing**: Vitest, Playwright
- **Linting**: TypeScript ESLint
- **Database Migrations**: Drizzle Kit + SQL migrations
- **File Upload**: Multer for multipart/form-data handling

---

## 🏗 Architecture Overview

### **Monorepo Structure**
```
HALCYON/
├── client/              # Web app (React + Vite)
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Route pages
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Utilities
│   │   └── index.css    # CSS variables & global styles
│   └── tailwind.config.js
│
├── server/              # Express API
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic
│   ├── supabase-auth.ts # Auth middleware
│   └── index.ts         # Server entry point
│
├── mobile/              # Expo React Native app
│   ├── app/             # Expo Router pages
│   ├── contexts/        # React Context providers
│   ├── constants/       # Design tokens
│   └── services/        # API client
│
├── shared/              # Shared code
│   ├── schema.ts        # Drizzle schema
│   └── design-tokens/   # Shared design tokens
│
├── migrations/          # SQL database migrations
│   ├── 0060_add_trip_created_by_updated_by.sql
│   ├── 0061_create_program_management_tables.sql
│   └── 0062_add_room_bed_assignment_management.sql
│
└── server/
    ├── file-storage-helpers.ts  # File upload utilities
    └── routes/
        ├── program-management.ts  # Program management API
        └── location-room-beds.ts  # Room/bed assignment API
```

### **Data Flow**
1. **Web App** → API requests → **Express Server** → **Supabase** (PostgreSQL)
2. **Mobile App** → API requests → **Express Server** → **Supabase** (PostgreSQL)
3. **Real-time Updates**: WebSocket connections for live trip/driver status
4. **Authentication**: Supabase Auth (JWT tokens)

---

## 🎨 Current Styling System

### **Design Philosophy: Neumorphic Design**

HALCYON uses a **neumorphic design system** with soft shadows, subtle depth, and a cohesive color palette. The primary accent color is `#a5c8ca` (a soft teal/cyan), which is used throughout the application for interactive elements, icons, and highlights.

### **Neumorphic CSS Classes**

The application uses custom Tailwind classes for neumorphic effects:

- **`card-neu`**: Standard neumorphic card with soft shadow (uses `--shadow-neu-raised`)
- **`card-neu-flat`**: Flatter neumorphic effect for subtle depth (uses `--shadow-neu-flat`)
- **`card-neu-pressed`**: Pressed/inward shadow effect for inputs and active states (uses `--shadow-neu-pressed`)
- **`btn-text-glow`**: Text glow effect for buttons using the accent color (`#a5c8ca`)

These classes are defined in `client/src/index.css` and work with the CSS variable system.

### **Neumorphic Shadow Variables**

The neumorphic design uses specific shadow variables defined in `client/src/index.css`:

- **`--shadow-neu-flat`**: Subtle shadow for flat surfaces
- **`--shadow-neu-raised`**: Standard raised shadow for cards
- **`--shadow-neu-pressed`**: Inward shadow for pressed/active states
- **`--shadow-neu-subtle`**: Very subtle shadow for minimal depth

These shadows create the soft, extruded/inset appearance characteristic of neumorphic design.

### **Accent Color Usage**

The primary accent color `#a5c8ca` (soft teal/cyan) is used throughout the application for:
- Interactive elements (buttons, links)
- Icons and iconography
- Text highlights and emphasis
- Border accents
- Text glow effects on hover
- Status indicators and badges
- Loading spinners and progress indicators

This color is defined as `--color-aqua` in the CSS variables and is consistently applied across all Team Management pages and components.

### **Architecture: CSS Variables + Tailwind + Design Tokens**

HALCYON uses a **three-layer styling architecture**:

1. **CSS Custom Properties (Variables)** - Single source of truth
2. **Tailwind CSS** - Utility classes that reference CSS variables
3. **Design Token Files** - TypeScript definitions for shared values

### **Layer 1: CSS Variables** (`client/src/index.css`)

**Location**: `client/src/index.css`

CSS custom properties are defined in `:root` (light mode) and `.dark` (dark mode):

```css
:root {
  /* Core Colors - Light Mode */
  --background: #f5f5f5;
  --foreground: #131320;
  --primary: #cc33ab;
  --primary-foreground: #ffffff;
  --accent: #33ccad;
  --destructive: #cc5833;
  --border: #e1e5e7;
  --radius: 0.5rem;
  /* ... more variables */
}

.dark {
  /* Core Colors - Dark Mode */
  --background: #17171c;
  --foreground: #eeeff2;
  /* ... same variable names, different values */
}
```

**Key Variables**:
- **Colors**: `--background`, `--foreground`, `--primary`, `--accent`, `--destructive`, `--muted`, `--border`, `--input`, `--ring`
- **Sidebar**: `--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-accent`, `--sidebar-border`
- **Typography**: `--font-sans`, `--font-serif`, `--font-mono`
- **Spacing**: `--radius`, `--spacing`
- **Shadows**: `--shadow-sm`, `--shadow-md`, `--shadow-lg`, etc.
- **Status Colors**: `--scheduled`, `--in-progress`, `--completed`, `--cancelled`, `--confirmed`
- **Driver Colors**: `--driver-color-1` through `--driver-color-6`

### **Layer 2: Tailwind Configuration** (`tailwind.config.ts`)

**Location**: `tailwind.config.ts`

Tailwind maps CSS variables to utility classes:

```typescript
theme: {
  extend: {
    colors: {
      background: "var(--background)",
      foreground: "var(--foreground)",
      primary: {
        DEFAULT: "var(--primary)",
        foreground: "var(--primary-foreground)",
      },
      // ... more color mappings
    },
    borderRadius: {
      lg: "var(--radius)",
      md: "calc(var(--radius) - 2px)",
      sm: "calc(var(--radius) - 4px)",
    },
  },
}
```

**Usage**: Components use Tailwind classes like `bg-background`, `text-foreground`, `border-border`, etc.

### **Layer 3: Design Token Files** (TypeScript)

**Locations**:
- `shared/design-tokens/colors.ts` - Shared color definitions
- `shared/design-tokens/typography.ts` - Shared typography definitions
- `client/src/design-system/tokens/colors.ts` - Web-specific tokens
- `mobile/constants/design-tokens/colors.ts` - Mobile-specific tokens

**Purpose**: Type-safe design tokens for programmatic access (e.g., in React components, theme providers).

### **Theme Providers**

#### **Web App** (`client/src/components/theme-provider.tsx`)
- Uses `next-themes` library
- Toggles between light/dark mode
- Applies `.dark` class to `<html>` element
- CSS variables automatically switch based on class

#### **Mobile App** (`mobile/contexts/ThemeContext.tsx`)
- Custom React Context provider
- Uses `useColorScheme` from React Native
- Provides `theme.colors` object to components
- Stores preference in SecureStore (native) or localStorage (web)

---

## 🔄 Streamlined Theming Process

### **Step-by-Step Guide to Change CSS Variables System-Wide**

#### **Option 1: Direct CSS Variable Update (Recommended for Quick Changes)**

1. **Open** `client/src/index.css`
2. **Locate** the variable you want to change (in `:root` for light mode or `.dark` for dark mode)
3. **Update** the value:
   ```css
   :root {
     --primary: #cc33ab;  /* Change this value */
   }
   ```
4. **Save** - Changes apply immediately (hot reload)
5. **Test** - Check all pages/components that use this variable

**Example**: To change the primary brand color:
```css
:root {
  --primary: #ff6b6b;  /* New red primary */
}
.dark {
  --primary: #ff8787;  /* Lighter red for dark mode */
}
```

#### **Option 2: Update Design Tokens (For Type Safety)**

1. **Update Shared Tokens** (`shared/design-tokens/colors.ts`):
   ```typescript
   export const halcyonColors = {
     primary: '#ff6b6b',  // New color
     // ... other colors
   };
   ```

2. **Update CSS Variables** (`client/src/index.css`):
   ```css
   :root {
     --primary: #ff6b6b;  /* Match the token */
   }
   ```

3. **Update Mobile Tokens** (`mobile/constants/design-tokens/colors.ts`):
   ```typescript
   export const lightTheme = {
     primary: '#ff6b6b',  // Match web
     // ... other colors
   };
   ```

#### **Option 3: Bulk Theme Update (Complete Color Scheme)**

1. **Choose a color palette** (e.g., from Radix Colors: https://www.radix-ui.com/colors)
2. **Map colors to semantic variables**:
   - Background → `--background`
   - Text → `--foreground`
   - Primary action → `--primary`
   - Accent → `--accent`
   - Error → `--destructive`
   - Borders → `--border`

3. **Update `client/src/index.css`**:
   ```css
   :root {
     --background: [light-bg-color];
     --foreground: [light-text-color];
     --primary: [primary-color];
     --accent: [accent-color];
     /* ... continue for all variables */
   }
   
   .dark {
     --background: [dark-bg-color];
     --foreground: [dark-text-color];
     --primary: [primary-color-for-dark];
     /* ... continue for all variables */
   }
   ```

4. **Update Tailwind config** (if adding new color scales):
   ```typescript
   // tailwind.config.ts
   colors: {
     // Existing mappings stay the same
     // Add new scales if needed
   }
   ```

5. **Update design token files** to match:
   - `shared/design-tokens/colors.ts`
   - `mobile/constants/design-tokens/colors.ts`

6. **Test thoroughly**:
   - Light mode
   - Dark mode
   - All pages/components
   - Mobile app (if applicable)

### **Quick Reference: Variable Categories**

#### **Core Colors** (Most Frequently Changed)
- `--background` / `--foreground` - Main background and text
- `--primary` / `--primary-foreground` - Brand color
- `--accent` / `--accent-foreground` - Accent color
- `--destructive` / `--destructive-foreground` - Error/danger color
- `--muted` / `--muted-foreground` - Subtle backgrounds/text
- `--border` / `--input` - Borders and inputs

#### **Component-Specific**
- `--card` / `--card-foreground` - Card backgrounds
- `--popover` / `--popover-foreground` - Popover/dropdown backgrounds
- `--sidebar-*` - Sidebar navigation colors

#### **Status Colors** (Domain-Specific)
- `--scheduled` - Trip status: scheduled
- `--in-progress` - Trip status: in progress
- `--completed` - Trip status: completed
- `--cancelled` - Trip status: cancelled
- `--confirmed` - Trip status: confirmed

#### **Driver Assignment Colors**
- `--driver-color-1` through `--driver-color-6` - Driver visualization colors

### **Best Practices**

1. **Always update both light and dark modes** - Ensure `.dark` class has corresponding values
2. **Maintain contrast ratios** - Use tools like WebAIM Contrast Checker
3. **Test accessibility** - Ensure text is readable on backgrounds
4. **Keep semantic meaning** - Don't swap `--primary` and `--destructive` values
5. **Update all three layers** - CSS variables, Tailwind config (if needed), design tokens
6. **Document changes** - Note why colors were changed in commit messages

### **Common Theming Tasks**

#### **Change Primary Brand Color**
```css
/* client/src/index.css */
:root {
  --primary: #YOUR_COLOR;
  --ring: #YOUR_COLOR;  /* Focus ring should match */
  --sidebar-primary: #YOUR_COLOR;
  --sidebar-ring: #YOUR_COLOR;
}
.dark {
  --primary: #YOUR_COLOR_DARK;
  --ring: #YOUR_COLOR_DARK;
  --sidebar-primary: #YOUR_COLOR_DARK;
  --sidebar-ring: #YOUR_COLOR_DARK;
}
```

#### **Change Background Colors**
```css
:root {
  --background: #YOUR_BG;
  --card: #YOUR_CARD_BG;
  --popover: #YOUR_POPOVER_BG;
}
.dark {
  --background: #YOUR_DARK_BG;
  --card: #YOUR_DARK_CARD_BG;
  --popover: #YOUR_DARK_POPOVER_BG;
}
```

#### **Change Typography**
```css
:root {
  --font-sans: 'YourFont', sans-serif;
}
/* Update font-face declarations in same file */
```

#### **Change Border Radius**
```css
:root {
  --radius: 0.75rem;  /* Increase from 0.5rem */
}
.dark {
  --radius: 0.75rem;  /* Same value */
}
```

---

## 📁 File Locations Reference

### **CSS Variables & Global Styles**
- `client/src/index.css` - **PRIMARY LOCATION** for CSS variables
- `client/tailwind.config.js` - Tailwind config (legacy, may be unused)
- `tailwind.config.ts` - Main Tailwind config

### **Design Tokens (TypeScript)**
- `shared/design-tokens/colors.ts` - Shared color tokens
- `shared/design-tokens/typography.ts` - Shared typography tokens
- `client/src/design-system/tokens/colors.ts` - Web-specific colors
- `mobile/constants/design-tokens/colors.ts` - Mobile-specific colors
- `mobile/constants/design-tokens/typography.ts` - Mobile typography

### **Theme Providers**
- `client/src/components/theme-provider.tsx` - Web theme provider (next-themes)
- `mobile/contexts/ThemeContext.tsx` - Mobile theme provider (custom)

### **Component Styling**
- Components use Tailwind classes: `bg-background`, `text-foreground`, etc.
- Neumorphic classes: `card-neu`, `card-neu-flat`, `card-neu-pressed`, `btn-text-glow`
- Inline styles can use: `style={{ color: 'var(--primary)' }}`
- Mobile uses: `style={{ color: theme.colors.primary }}`

### **Team Management Pages**
- `client/src/pages/team/programs.tsx` - Programs management page
- `client/src/pages/team/locations.tsx` - Locations management page (includes RoomBedAssignmentsTab)
- `client/src/pages/team/staff.tsx` - Staff management page
- `client/src/pages/team/client-census.tsx` - Client census page

### **Program Management Components**
- All tabs are defined within `client/src/pages/team/programs.tsx`:
  - `LicensuresTab` - License tracking
  - `CertificationsTab` - Staff certification tracking
  - `FormsTab` - Form document management with file upload
  - `TasksTab` - Task management
  - `SchedulingTab` - Driver schedule viewing
  - `CurriculumTab` - Training curriculum with file upload
  - `OnboardingTab` - Onboarding checklist with file upload

### **Room/Bed Assignment Component**
- `RoomBedAssignmentsTab` - Defined in `client/src/pages/team/locations.tsx`
- Handles room/bed inventory and client assignments

### **Fonts**
- Font files: `public/fonts/*.woff2`
- Font declarations: `client/src/index.css` (font-face rules)
- Font family variable: `--font-sans: Nohemi, sans-serif`

### **Backend API Routes**
- `server/routes/program-management.ts` - Program management API endpoints
- `server/routes/location-room-beds.ts` - Room/bed assignment API endpoints
- `server/routes/index.ts` - Route registration

### **Storage Functions**
- `server/minimal-supabase.ts` - Contains all storage functions:
  - `programLicensuresStorage` - License CRUD operations
  - `staffCertificationsStorage` - Certification CRUD operations
  - `programFormsStorage` - Form document CRUD operations
  - `programCurriculumStorage` - Curriculum CRUD operations
  - `programOnboardingItemsStorage` - Onboarding item CRUD operations
  - `tasksStorage` - Task CRUD operations
  - `locationRoomBedsStorage` - Room/bed inventory and assignment operations

### **File Storage**
- `server/file-storage-helpers.ts` - File upload utilities
- Supabase Storage buckets:
  - `program-documents` - For program forms, curriculum, and onboarding documents
  - `avatars` - User profile pictures
  - `trip-documents` - Trip-related documents

### **Database Schema**
- `shared/schema.ts` - Drizzle ORM schema definitions:
  - `program_licensures` table
  - `staff_certifications` table
  - `program_forms` table
  - `program_curriculum` table
  - `program_onboarding_items` table
  - `tasks` table
  - `location_room_beds` table
  - Updated `clients` table (room_number, bed_number fields)
  - Updated `trips` table (created_by, updated_by fields)

### **Migrations**
- `migrations/0060_add_trip_created_by_updated_by.sql` - Trip audit trail
- `migrations/0061_create_program_management_tables.sql` - Program management tables
- `migrations/0062_add_room_bed_assignment_management.sql` - Room/bed assignment system

---

## 🎯 Summary

### **To Change Colors System-Wide:**

1. **Edit** `client/src/index.css`
2. **Update** CSS variables in `:root` (light) and `.dark` (dark)
3. **Optionally sync** with design token files for type safety
4. **Test** in both light and dark modes
5. **Verify** all components update correctly

### **Key Principle:**
**CSS variables are the single source of truth.** All styling (Tailwind classes, inline styles, component props) references these variables, so changing them updates the entire application instantly.

---

## 📚 Additional Resources

- **Radix Colors**: https://www.radix-ui.com/colors (Color palette generator)
- **Tailwind Shades**: https://www.tailwindshades.com/ (Color scale generator)
- **WebAIM Contrast Checker**: https://webaim.org/resources/contrastchecker/ (Accessibility)
- **Design System Docs**: `docs/design-system/` (Internal documentation)

---

---

## 🆕 Recent Updates & New Features

### **Team Management System** (2025-01-XX)

#### **Programs Page** (`/team/programs`)
A comprehensive program management interface with multiple tabs:

- **Overview Tab**: Program summary, statistics, and key metrics
- **Census Tab**: Client and staff census data for the program
- **Staff Tab**: Staff directory organized by role
- **Licensures Tab**: 
  - Track program-level licenses (e.g., state licenses, certifications)
  - Expiry date tracking with renewal reminders
  - License number and issuing authority management
  - Notes and documentation
- **Certifications Tab**:
  - Staff certification tracking
  - Expiry date monitoring
  - Certification type and number management
  - Automatic expiry alerts
- **Forms Tab**:
  - Document management for program forms
  - File upload support (PDF, DOC, images)
  - Form versioning and organization
  - Document URL storage in Supabase Storage
- **Tasks Tab**:
  - Task management with status tracking (pending, in-progress, completed, cancelled)
  - Priority levels (low, medium, high, urgent)
  - Assignment to staff members
  - Due date tracking
  - Full CRUD operations
- **Scheduling Tab**:
  - Driver availability viewing
  - Weekly schedule overview
  - Day-by-day breakdown per driver
  - Integration with driver schedules API
- **Curriculum Tab**:
  - Training curriculum management
  - Document uploads for training materials
  - Curriculum organization and versioning
- **Onboarding Tab**:
  - Onboarding checklist items
  - Document attachments for onboarding materials
  - Checklist completion tracking

#### **Locations Page** (`/team/locations`)
Location-specific management with tabs:

- **Overview Tab**: Location summary and statistics
- **Census Tab**: Client and staff census for the location
- **Staff Tab**: Staff assigned to the location's program
- **Room & Bed Assignments Tab** (NEW):
  - **Room/Bed Inventory Management**:
    - Custom room numbering (e.g., "1A", "6B", "Room 10")
    - Flexible bed numbering (e.g., "1", "2", "1 top", "2 bottom", "Bed 1")
    - Bed types: single, twin, full, queen, king, bunk_top, bunk_bottom, other
    - Bed labels (e.g., "Window Side", "Door Side")
    - Notes per bed
  - **Client Assignment**:
    - Assign clients to specific rooms and beds
    - Automatic update of `clients.room_number` and `clients.bed_number`
    - Visual occupancy indicators (available/occupied)
    - Unassign clients from beds
  - **Summary Statistics**:
    - Total rooms count
    - Total beds count
    - Available beds count
    - Occupied beds count
  - **Organization**:
    - Beds grouped by room number
    - Visual cards for each bed with status badges
    - Quick actions (Edit, Assign, Unassign, Delete)

#### **Staff Page** (`/team/staff`)
- Staff directory and management
- Role-based organization
- Search and filtering

#### **Client Census Page** (`/team/client-census`)
- Comprehensive client census tracking
- Demographics and statistics
- Room/bed assignment display
- Client status tracking

### **Database Schema Updates**

#### **Trips Table** (Migration 0060)
- Added `created_by` (VARCHAR, references users.user_id)
- Added `updated_by` (VARCHAR, references users.user_id)
- Automatic tracking of who created/updated trips
- Display in trip views

#### **Program Management Tables** (Migration 0061)
- **`program_licensures`**: Program-level license tracking
- **`staff_certifications`**: Staff certification management
- **`program_forms`**: Form document management
- **`program_curriculum`**: Training curriculum items
- **`program_onboarding_items`**: Onboarding checklist items
- **`tasks`**: Task management (status, priority, assignment, due dates)

#### **Room/Bed Assignment Tables** (Migration 0062)
- **`clients` table updates**:
  - Added `room_number` (VARCHAR(50))
  - Added `bed_number` (VARCHAR(50))
- **`location_room_beds` table** (NEW):
  - `id`, `location_id`, `room_number`, `bed_number`
  - `bed_label`, `bed_type` (enum), `notes`
  - `client_id` (assigned client), `is_occupied`, `is_active`
  - `created_by`, `updated_by`, `created_at`, `updated_at`
  - Unique constraint on (location_id, room_number, bed_number)

### **API Endpoints**

#### **Program Management** (`/api/program-management/*`)
- `GET/POST/PATCH/DELETE /licensures/program/:programId`
- `GET/POST/PATCH/DELETE /certifications/program/:programId`
- `GET/POST/PATCH/DELETE /forms/program/:programId`
- `POST /forms/:id/upload-document` (file upload)
- `GET/POST/PATCH/DELETE /tasks/program/:programId`
- `GET/POST/PATCH/DELETE /curriculum/program/:programId`
- `POST /curriculum/:id/upload-document` (file upload)
- `GET/POST/PATCH/DELETE /onboarding/program/:programId`
- `POST /onboarding/:id/upload-document` (file upload)

#### **Location Room/Beds** (`/api/location-room-beds/*`)
- `GET /location/:locationId` - Get all room/beds for a location
- `GET /:id` - Get single room/bed
- `POST /` - Create new room/bed
- `PATCH /:id` - Update room/bed
- `DELETE /:id` - Delete room/bed
- `POST /:id/assign` - Assign client to bed
- `POST /:id/unassign` - Unassign client from bed
- `GET /location/:locationId/available` - Get available beds
- `GET /location/:locationId/occupied` - Get occupied beds

### **File Upload System**

- **Storage**: Supabase Storage buckets
- **Categories**: 
  - `program_form` → `program-documents` bucket
  - `program_curriculum` → `program-documents` bucket
  - `program_onboarding` → `program-documents` bucket
- **Upload Handler**: `server/file-storage-helpers.ts`
- **File Size Limit**: 50MB per file
- **Supported Formats**: PDF, DOC, DOCX, images (JPEG, PNG, etc.)

### **Styling Updates**

#### **Neumorphic Design System**
- Applied throughout all new Team Management pages
- Consistent use of `#a5c8ca` accent color
- Soft shadows and depth effects
- Text glow effects on interactive elements
- Card-based layouts with neumorphic styling

#### **Component Styling**
- All new components use neumorphic classes
- Consistent button styling with accent color
- Input fields with pressed neumorphic effect
- Dialog and modal styling updated
- Table styling consistent

---

**Last Updated**: 2025-01-28
**Maintained By**: HALCYON Development Team
















