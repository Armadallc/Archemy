# Settings Page Hierarchy by User Role

**Last Updated:** December 2024  
**Purpose:** Reference document for settings page structure, permissions, and workflows by user role

---

## Overview

The Settings page (`/settings`) is a centralized management interface that adapts based on user role and permissions. This document outlines the complete hierarchy, available tabs, and functionality for each role.

---

## 1. Super Admin (Service Provider)

**Purpose:** Backoffice management for the service provider to manage all corporate clients, programs, users, and system-wide settings.

### Settings Page Structure

```
Settings Page (Super Admin)
├── Corporate Client Tab
│   ├── List of ALL corporate clients (collapsible cards)
│   ├── Each card structure:
│   │   ├── Collapsed View:
│   │   │   ├── Corporate Client Name
│   │   │   ├── Logo
│   │   │   ├── # of Programs
│   │   │   ├── # of Locations
│   │   │   └── # Total Clients
│   │   └── Expanded View:
│   │       ├── Header Section:
│   │       │   ├── Corporate Client Name
│   │       │   ├── Logo (with upload)
│   │       │   ├── Active Status Toggle
│   │       │   └── Census Summary (# programs, # locations, # clients)
│   │       ├── Contact Information Section:
│   │       │   ├── Avatar/Logo Upload
│   │       │   ├── Contact Name
│   │       │   ├── Email
│   │       │   ├── Phone
│   │       │   └── Address
│   │       └── Programs Accordion:
│   │           └── Each Program:
│   │               ├── Collapsed:
│   │               │   ├── Program Name
│   │               │   ├── Logo
│   │               │   ├── Active Status
│   │               │   ├── # of Locations
│   │               │   └── # of Clients
│   │               └── Expanded:
│   │                   ├── Program Name, Logo, Active Toggle
│   │                   ├── Main Contact (Program Admin):
│   │                   │   ├── First Name, Last Name
│   │                   │   ├── Phone
│   │                   │   ├── Email
│   │                   │   └── Address
│   │                   └── Locations List:
│   │                       └── Each Location:
│   │                           ├── Address
│   │                           └── Client Population Count
│   ├── Feature Flags & Permissions (per corporate client)
│   └── Actions: Create, Edit, Delete Corporate Client
│
├── Users Tab
│   ├── Organized by Corporate Client (alphabetically)
│   ├── Sorted by: Alphabetical + Active Status
│   ├── Hierarchy within each Corporate Client:
│   │   ├── Corporate Admins
│   │   ├── Program Admins
│   │   ├── Program Users
│   │   └── Notification Users (Clients)
│   ├── User Management Features:
│   │   ├── Create Users
│   │   ├── Edit Users
│   │   ├── Deactivate/Activate Users
│   │   ├── Assign Roles
│   │   └── Manage Permissions
│   └── Bulk Actions
│
├── Programs Tab
│   ├── List of ALL programs across all corporate clients
│   ├── Each program card:
│   │   ├── Program Name
│   │   ├── Corporate Client (parent)
│   │   ├── Logo
│   │   ├── Active Status
│   │   ├── Census: # Locations, # Clients
│   │   └── Feature Flags & Permissions (per program)
│   └── Actions: Create, Edit, Delete Program
│
├── Vendors Tab
│   ├── Vendor Management
│   ├── Contracts
│   └── Vendor Relationships
│
├── Contacts Tab
│   ├── Directory of all users
│   └── Contact information by hierarchy level
│
├── Notifications Tab
│   ├── System-wide notification settings
│   └── Notification templates
│
└── System Tab
    ├── System-wide Settings:
    │   ├── Application Name
    │   ├── Main Logo Upload
    │   ├── Support Email
    │   ├── Support Phone
    │   ├── Timezone
    │   └── Language
    ├── Feature Flags (global)
    ├── System Health
    └── Backend Configuration
```

### Permissions & Capabilities
- ✅ View all corporate clients
- ✅ Create/Edit/Delete corporate clients
- ✅ Manage feature flags per corporate client
- ✅ View all users across all corporate clients
- ✅ Create/Edit/Delete users
- ✅ Assign roles and permissions
- ✅ View all programs
- ✅ Create/Edit/Delete programs
- ✅ Manage system-wide settings
- ✅ Access system health and monitoring

---

## 2. Corporate Admin

**Purpose:** Manage their corporate client's programs, users, and corporate-level settings.

### Settings Page Structure

```
Settings Page (Corporate Admin)
├── Corporate Client Overview Tab
│   ├── List of THEIR corporate client's programs (collapsible cards)
│   ├── Each card structure:
│   │   ├── Collapsed View:
│   │   │   ├── Program Name
│   │   │   ├── Logo
│   │   │   ├── # of Locations
│   │   │   └── # of Clients
│   │   └── Expanded View:
│   │       ├── Header Section:
│   │       │   ├── Program Name
│   │       │   ├── Logo (with upload)
│   │       │   ├── Active Status Toggle
│   │       │   └── Census Summary (# locations, # clients)
│   │       ├── Program Information:
│   │       │   ├── Description
│   │       │   ├── Address
│   │       │   └── Corporate Client (read-only)
│   │       └── Available Feature Flags/Permissions:
│   │           ├── Permissions available to Corporate Admins
│   │           ├── Settings for their users:
│   │           │   ├── Can create Corporate Admins (toggle)
│   │           │   ├── Can create Program Admins (toggle)
│   │           │   ├── Can create Program Users (toggle)
│   │           │   └── Can create Notification Users (toggle)
│   │           └── Program-specific feature flags
│   └── Corporate Client Information (read-only):
│       ├── Corporate Client Name
│       ├── Logo
│       ├── Contact Information
│       └── Active Status
│
├── Users Tab
│   ├── Organized by their available programs (alphabetically)
│   ├── Sorted by: Alphabetical + Active Status
│   ├── Hierarchy within each Program:
│   │   ├── Corporate Admins (their level)
│   │   ├── Program Admins
│   │   ├── Program Users
│   │   └── Notification Users (Clients)
│   ├── User Management Features:
│   │   ├── Create Users (based on permissions)
│   │   ├── Edit Users (within their scope)
│   │   ├── Deactivate/Activate Users
│   │   └── Assign Roles (based on permissions)
│   └── Bulk Actions (limited scope)
│
├── Programs Tab
│   ├── List of programs within their corporate client
│   ├── Each program card:
│   │   ├── Program Name
│   │   ├── Logo
│   │   ├── Active Status
│   │   ├── Census: # Locations, # Clients
│   │   └── Feature Flags & Permissions (per program)
│   └── Actions: Create, Edit, Delete Program (if permitted)
│
├── Contacts Tab
│   ├── Directory of users within their corporate client
│   └── Contact information by program
│
├── Notifications Tab
│   ├── Corporate-level notification settings
│   └── Notification preferences
│
└── Application Tab (or System Tab - limited)
    ├── Application-wide settings (limited):
    │   ├── Timezone (for their corporate client)
    │   ├── Language preferences
    │   └── Display preferences
    └── Corporate Client Branding (if permitted)
```

### Permissions & Capabilities
- ✅ View their corporate client's programs
- ✅ Create/Edit/Delete programs (if permitted by super admin)
- ✅ Manage feature flags for their programs (as allowed by super admin)
- ✅ View users within their corporate client
- ✅ Create users (based on permissions set by super admin):
  - Can create Corporate Admins (if feature flag enabled)
  - Can create Program Admins (if feature flag enabled)
  - Can create Program Users (if feature flag enabled)
  - Can create Notification Users (if feature flag enabled)
- ✅ Edit users within their scope
- ✅ Manage corporate-level settings (limited)
- ❌ Cannot view other corporate clients
- ❌ Cannot access system-wide settings
- ❌ Cannot manage super admin users

---

## 3. Program Admin

**Purpose:** Manage their specific program's users, locations, and program-level settings.

### Settings Page Structure

```
Settings Page (Program Admin)
├── Program Overview Tab
│   ├── Program Information:
│   │   ├── Program Name (read-only or editable based on permissions)
│   │   ├── Logo (with upload)
│   │   ├── Description
│   │   ├── Address
│   │   ├── Active Status Toggle
│   │   └── Corporate Client (read-only)
│   ├── Census Summary:
│   │   ├── # of Locations
│   │   └── # of Clients
│   └── Program Settings (if permitted)
│
├── Users Tab
│   ├── List of users within their program
│   ├── Sorted by: Alphabetical + Active Status
│   ├── Hierarchy:
│   │   ├── Program Admins (their level)
│   │   ├── Program Users
│   │   └── Notification Users (Clients)
│   ├── User Management Features:
│   │   ├── Create Users (Program Users, Notification Users)
│   │   ├── Edit Users (within their program)
│   │   ├── Deactivate/Activate Users
│   │   └── Assign Roles (limited to Program Users, Notification Users)
│   └── Bulk Actions (limited scope)
│
├── Locations Tab
│   ├── List of locations within their program
│   ├── Location Management:
│   │   ├── Create Locations
│   │   ├── Edit Locations
│   │   └── View Client Population per Location
│   └── Location Settings
│
├── Contacts Tab
│   ├── Directory of users within their program
│   └── Contact information
│
└── Notifications Tab
    ├── Program-level notification settings
    └── Notification preferences
```

### Permissions & Capabilities
- ✅ View their program information
- ✅ Edit program details (if permitted)
- ✅ View users within their program
- ✅ Create Program Users and Notification Users
- ✅ Edit users within their program
- ✅ Manage locations within their program
- ✅ View program-level census data
- ❌ Cannot view other programs
- ❌ Cannot create Program Admins or Corporate Admins
- ❌ Cannot access corporate-level or system settings

---

## 4. Program User

**Purpose:** View their own profile and program information (read-only access).

### Settings Page Structure

```
Settings Page (Program User)
├── Profile Tab
│   ├── Personal Information:
│   │   ├── First Name
│   │   ├── Last Name
│   │   ├── Email
│   │   ├── Phone
│   │   └── Avatar Upload
│   └── Account Settings:
│       ├── Change Password
│       └── Preferences
│
├── Program Information Tab (read-only)
│   ├── Program Name
│   ├── Logo
│   ├── Description
│   ├── Contact Information
│   └── Program Details
│
└── Notifications Tab
    ├── Personal notification preferences
    └── Notification settings
```

### Permissions & Capabilities
- ✅ View and edit own profile
- ✅ View program information (read-only)
- ✅ Manage personal notification preferences
- ❌ Cannot view other users
- ❌ Cannot access program management
- ❌ Cannot access corporate or system settings

---

## 5. Notification User (Client)

**Purpose:** View their own profile and relevant program information (read-only access).

### Settings Page Structure

```
Settings Page (Notification User / Client)
├── Profile Tab
│   ├── Personal Information:
│   │   ├── First Name
│   │   ├── Last Name
│   │   ├── Email
│   │   ├── Phone
│   │   └── Address
│   └── Account Settings:
│       ├── Change Password
│       └── Preferences
│
├── Program Information Tab (read-only)
│   ├── Program Name
│   ├── Logo
│   ├── Description
│   └── Contact Information
│
└── Notifications Tab
    ├── Personal notification preferences
    └── Trip notification settings
```

### Permissions & Capabilities
- ✅ View and edit own profile
- ✅ View program information (read-only)
- ✅ Manage personal notification preferences
- ❌ Cannot view other users
- ❌ Cannot access any management features
- ❌ Cannot access program, corporate, or system settings

---

## 6. Driver

**Purpose:** View their own profile and driver-specific settings.

### Settings Page Structure

```
Settings Page (Driver)
├── Profile Tab
│   ├── Personal Information:
│   │   ├── First Name
│   │   ├── Last Name
│   │   ├── Email
│   │   ├── Phone
│   │   └── Avatar Upload
│   ├── Driver Information:
│   │   ├── License Number
│   │   ├── License Expiration
│   │   └── Vehicle Assignment
│   └── Account Settings:
│       ├── Change Password
│       └── Preferences
│
└── Notifications Tab
    ├── Personal notification preferences
    └── Trip notification settings
```

### Permissions & Capabilities
- ✅ View and edit own profile
- ✅ Manage driver-specific information
- ✅ Manage personal notification preferences
- ❌ Cannot view other users
- ❌ Cannot access any management features
- ❌ Cannot access program, corporate, or system settings

---

## Implementation Notes

### Tab Visibility Logic

The `getVisibleTabs()` function in `settings.tsx` should be updated to reflect this hierarchy:

```typescript
function getVisibleTabs(userRole?: string) {
  switch (userRole) {
    case 'super_admin':
      return [
        'corporate-client',
        'users',
        'programs',
        'vendors',
        'contacts',
        'notifications',
        'system'
      ];
    
    case 'corporate_admin':
      return [
        'corporate-client-overview',
        'users',
        'programs',
        'contacts',
        'notifications',
        'application'
      ];
    
    case 'program_admin':
      return [
        'program-overview',
        'users',
        'locations',
        'contacts',
        'notifications'
      ];
    
    case 'program_user':
    case 'notification_user':
    case 'driver':
      return [
        'profile',
        'program-information',
        'notifications'
      ];
    
    default:
      return ['profile', 'notifications'];
  }
}
```

### Data Fetching Strategy

1. **Super Admin:**
   - Fetch all corporate clients on page load
   - Lazy-load detailed census data when cards expand
   - Fetch all users organized by corporate client

2. **Corporate Admin:**
   - Fetch their corporate client's programs on page load
   - Lazy-load program details when cards expand
   - Fetch users within their corporate client scope

3. **Program Admin:**
   - Fetch their program information on page load
   - Fetch users within their program scope

4. **Program User / Notification User / Driver:**
   - Fetch only their own profile data
   - Fetch read-only program information

### Feature Flags & Permissions System

**Future Implementation:**
- Database tables: `corporate_client_permissions`, `program_permissions`, `user_permissions`
- API endpoints for managing permissions
- UI controls in settings page for super admins and corporate admins
- Permission checks throughout the application

---

## Migration Plan

### Phase 1: Super Admin Corporate Client Cards (Current)
- Implement collapsible corporate client cards
- Add census data display
- Implement programs accordion
- Lazy-load detailed data

### Phase 2: User Management Migration
- Move user list to Settings → Users tab
- Organize by corporate client hierarchy
- Implement sorting and filtering
- Update routing

### Phase 3: Corporate Admin Settings
- Implement corporate admin settings structure
- Add program management for corporate admins
- Implement permission controls

### Phase 4: Feature Flags & Permissions
- Design database schema
- Create API endpoints
- Implement UI controls
- Add permission checks

---

## Questions & Considerations

1. **Vendors Tab:** Should this be super admin only, or also available to corporate admins?
2. **Contracts & Paperwork:** Where should these be managed? Separate tab or within corporate client cards?
3. **Issues/Tickets:** Should there be a dedicated tab for tracking issues per corporate client?
4. **Audit Logs:** Should there be an audit log tab for super admins to track changes?
5. **Billing/Invoicing:** Should financial information be in settings or a separate module?

---

**Document Status:** Draft - Ready for Review and Implementation



