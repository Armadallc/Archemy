# HALCYON - Complete App Overview & Theming Guide

## 📋 Table of Contents
1. [App Purpose & Core Functions](#app-purpose--core-functions)
2. [Tech Stack](#tech-stack)
3. [Architecture Overview](#architecture-overview)
4. [Current Styling System](#current-styling-system)
5. [Streamlined Theming Process](#streamlined-theming-process)
6. [File Locations Reference](#file-locations-reference)

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
└── migrations/          # SQL database migrations
```

### **Data Flow**
1. **Web App** → API requests → **Express Server** → **Supabase** (PostgreSQL)
2. **Mobile App** → API requests → **Express Server** → **Supabase** (PostgreSQL)
3. **Real-time Updates**: WebSocket connections for live trip/driver status
4. **Authentication**: Supabase Auth (JWT tokens)

---

## 🎨 Current Styling System

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
- Inline styles can use: `style={{ color: 'var(--primary)' }}`
- Mobile uses: `style={{ color: theme.colors.primary }}`

### **Fonts**
- Font files: `public/fonts/*.woff2`
- Font declarations: `client/src/index.css` (font-face rules)
- Font family variable: `--font-sans: Nohemi, sans-serif`

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

**Last Updated**: 2025-01-18
**Maintained By**: HALCYON Development Team
















