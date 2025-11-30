# Frontend Permission Integration - Implementation Guide

**Date:** 2025-01-27  
**Status:** In Progress  
**Phase:** Frontend Permission Integration

---

## ✅ Completed

### 1. Permission Hooks (`client/src/hooks/use-permissions.ts`)

#### `usePermission(permission: string)`
Hook to check if current user has a specific permission.

```typescript
const { hasPermission, isLoading } = usePermission("view_trips");
```

#### `useEffectivePermissions()`
Hook to get all effective permissions with helper functions.

```typescript
const { 
  permissions,           // Array of permission objects
  permissionNames,      // Array of permission strings
  hasPermission,        // Function: (permission: string) => boolean
  hasAnyPermission,     // Function: (permissions: string[]) => boolean
  hasAllPermissions,    // Function: (permissions: string[]) => boolean
  isLoading 
} = useEffectivePermissions();
```

**Features:**
- ✅ Fetches permissions from `/api/permissions/effective` endpoint
- ✅ Respects hierarchy level (corporate/client/program)
- ✅ Case-insensitive permission matching
- ✅ Caching (5-10 minutes)
- ✅ Helper functions for common checks

### 2. PermissionGuard Component (`client/src/components/PermissionGuard.tsx`)

Component for conditionally rendering UI based on permissions.

**Usage Examples:**

```tsx
// Single permission
<PermissionGuard permission="create_trips">
  <Button>Create Trip</Button>
</PermissionGuard>

// Any permission (OR logic)
<PermissionGuard anyPermission={["create_trips", "manage_trips"]}>
  <Button>Create Trip</Button>
</PermissionGuard>

// All permissions (AND logic)
<PermissionGuard allPermissions={["view_trips", "create_trips"]}>
  <Button>Create Trip</Button>
</PermissionGuard>

// With fallback
<PermissionGuard 
  permission="manage_trips"
  fallback={<div>You don't have permission</div>}
>
  <Button>Create Trip</Button>
</PermissionGuard>

// With loading state
<PermissionGuard 
  permission="view_trips"
  loadingFallback={<Spinner />}
>
  <Button>View Trips</Button>
</PermissionGuard>
```

### 3. Sidebar Navigation (`client/src/components/layout/sidebar.tsx`)

**Permission Mapping:**
```typescript
const navigationItemPermissions: Record<string, string | string[]> = {
  "/": "view_calendar",
  "/trips": "view_trips",
  "/calendar": "view_calendar",
  "/drivers": "view_drivers",
  "/vehicles": "view_vehicles",
  "/frequent-locations": "view_locations",
  "/corporate-clients": "view_corporate_clients",
  "/programs": "view_programs",
  "/locations": "view_locations",
  "/clients": "view_clients",
  "/settings": ["view_users", "manage_users"], // Any permission
  "/users": "view_users",
  "/billing": "view_reports",
  "/role-templates": "manage_users",
  // ...
};
```

**Features:**
- ✅ Filters navigation items based on permissions
- ✅ Falls back to role-based check if no permission mapping exists
- ✅ Shows items while permissions are loading (prevents flicker)
- ✅ Supports single permission or array (OR logic)

---

## 📋 Next Steps

### 1. Update Action Buttons

**Priority: HIGH**

Update buttons that perform actions to check permissions:

#### Create Trip Button
**Files:**
- `client/src/components/HierarchicalTripsPage.tsx` (line ~244)
- `client/src/pages/calendar.tsx` (line ~269)

**Before:**
```tsx
<Button onClick={() => setLocation("/trips/new")}>
  <Plus className="h-4 w-4" />
  New Trip
</Button>
```

**After:**
```tsx
<PermissionGuard permission="create_trips">
  <Button onClick={() => setLocation("/trips/new")}>
    <Plus className="h-4 w-4" />
    New Trip
  </Button>
</PermissionGuard>
```

#### Update Trip Status Buttons
**Files:**
- `client/src/components/TripHoverCard.tsx`
- `client/src/components/TripStatusManager.tsx`
- `mobile/app/(tabs)/trips.tsx`

**Before:**
```tsx
<Button onClick={() => handleStatusUpdate('in_progress')}>
  Start Trip
</Button>
```

**After:**
```tsx
<PermissionGuard permission="update_trip_status">
  <Button onClick={() => handleStatusUpdate('in_progress')}>
    Start Trip
  </Button>
</PermissionGuard>
```

#### Edit/Delete Trip Buttons
**Files:**
- `client/src/components/TripHoverCard.tsx`
- `client/src/components/HierarchicalTripsPage.tsx`

**Before:**
```tsx
<Button onClick={() => handleEdit(trip)}>
  Edit Trip
</Button>
```

**After:**
```tsx
<PermissionGuard permission="manage_trips">
  <Button onClick={() => handleEdit(trip)}>
    Edit Trip
  </Button>
</PermissionGuard>
```

### 2. Update Page-Level Access

**Priority: MEDIUM**

Add permission checks to page components to redirect unauthorized users.

**Example:**
```tsx
// In page component
export default function TripsPage() {
  const { hasPermission, isLoading } = useEffectivePermissions();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !hasPermission("view_trips")) {
      setLocation("/"); // Redirect to dashboard
      toast({
        title: "Access Denied",
        description: "You don't have permission to view trips.",
        variant: "destructive"
      });
    }
  }, [hasPermission, isLoading, setLocation]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!hasPermission("view_trips")) {
    return null; // Or show access denied message
  }

  // ... rest of component
}
```

**Pages to Update:**
- `/trips` → `view_trips`
- `/drivers` → `view_drivers`
- `/vehicles` → `view_vehicles`
- `/clients` → `view_clients`
- `/programs` → `view_programs`
- `/corporate-clients` → `view_corporate_clients`
- `/users` → `view_users`
- `/settings` → `view_users` or `manage_users`
- `/calendar` → `view_calendar`

### 3. Update Form Fields

**Priority: LOW**

Hide form fields based on permissions (e.g., hide "Assign Driver" if user can't manage trips).

**Example:**
```tsx
<PermissionGuard permission="manage_trips">
  <FormField>
    <Label>Assign Driver</Label>
    <Select>
      {/* Driver options */}
    </Select>
  </FormField>
</PermissionGuard>
```

### 4. Update Bulk Actions

**Priority: LOW**

Hide bulk action buttons (e.g., "Delete Selected", "Bulk Update Status") based on permissions.

**Example:**
```tsx
<PermissionGuard permission="manage_trips">
  <Button onClick={handleBulkDelete}>
    Delete Selected ({selectedCount})
  </Button>
</PermissionGuard>
```

---

## 🎯 Permission Mapping Reference

### Navigation Items
| Path | Required Permission(s) |
|------|----------------------|
| `/` | `view_calendar` |
| `/trips` | `view_trips` |
| `/calendar` | `view_calendar` |
| `/drivers` | `view_drivers` |
| `/vehicles` | `view_vehicles` |
| `/frequent-locations` | `view_locations` |
| `/corporate-clients` | `view_corporate_clients` |
| `/programs` | `view_programs` |
| `/locations` | `view_locations` |
| `/clients` | `view_clients` |
| `/settings` | `view_users` OR `manage_users` |
| `/users` | `view_users` |
| `/billing` | `view_reports` |
| `/role-templates` | `manage_users` |

### Actions
| Action | Required Permission |
|--------|-------------------|
| Create Trip | `create_trips` |
| Edit Trip | `manage_trips` |
| Delete Trip | `manage_trips` |
| Update Trip Status | `update_trip_status` |
| View Trips | `view_trips` |
| Manage Drivers | `manage_drivers` |
| View Drivers | `view_drivers` |
| Manage Clients | `manage_clients` |
| View Clients | `view_clients` |
| Manage Users | `manage_users` |
| View Users | `view_users` |

---

## 🧪 Testing Checklist

- [ ] Navigation items hide/show based on permissions
- [ ] "Create Trip" button only shows with `create_trips` permission
- [ ] "Edit Trip" button only shows with `manage_trips` permission
- [ ] "Update Status" buttons only show with `update_trip_status` permission
- [ ] Pages redirect unauthorized users
- [ ] Permission checks work at all hierarchy levels
- [ ] Loading states work correctly
- [ ] No console errors
- [ ] Permissions persist after page refresh

---

## 📝 Notes

### Backward Compatibility
- Navigation items without permission mappings fall back to role-based checks
- This ensures existing functionality continues to work while we migrate

### Performance
- Permissions are cached for 5-10 minutes
- Multiple components can use the same hook without duplicate requests
- React Query handles caching and deduplication

### Hierarchy Support
- Permissions are automatically filtered based on current hierarchy level
- Corporate-level permissions apply to all programs/clients
- Program-level permissions only apply within that program

---

## 🚀 Quick Start

1. **Import PermissionGuard:**
```tsx
import { PermissionGuard } from '../components/PermissionGuard';
```

2. **Wrap protected UI:**
```tsx
<PermissionGuard permission="create_trips">
  <Button>Create Trip</Button>
</PermissionGuard>
```

3. **Use hook directly:**
```tsx
const { hasPermission } = useEffectivePermissions();
if (hasPermission("view_trips")) {
  // Show trips
}
```

---

**Status:** Phase 1 Complete ✅  
**Next:** Update action buttons and page-level access

