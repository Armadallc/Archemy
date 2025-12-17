# Settings Page Role-Based Access Mapping

**Last Updated:** December 2024  
**Purpose:** Quick reference for what settings tabs and features each role can access

---

## Tab Visibility by Role

### Super Admin
**Access:** All tabs
- ✅ Corporate Client
- ✅ Program
- ✅ Vendors
- ✅ Users
- ✅ Contacts
- ✅ Notifications
- ✅ System

### Corporate Admin
**Access:** All tabs except System
- ✅ Corporate Client (their own)
- ✅ Program (their corporate client's programs)
- ✅ Vendors
- ✅ Users (within their corporate client)
- ✅ Contacts (within their corporate client)
- ✅ Notifications
- ❌ System (super admin only)

### Program Admin
**Access:** All tabs except System
- ✅ Corporate Client (read-only, their parent)
- ✅ Program (their own program)
- ✅ Vendors
- ✅ Users (within their program)
- ✅ Contacts (within their program)
- ✅ Notifications
- ❌ System (super admin only)

### Program User
**Access:** Limited tabs
- ❌ Corporate Client
- ❌ Program
- ❌ Vendors
- ❌ Users
- ✅ Contacts (view only)
- ✅ Notifications

### Driver
**Access:** Limited tabs
- ❌ Corporate Client
- ❌ Program
- ❌ Vendors
- ❌ Users
- ✅ Contacts (view only)
- ✅ Notifications

---

## Feature Access by Role

### Corporate Client Management
- **Super Admin:** Full CRUD on all corporate clients
- **Corporate Admin:** View/edit their own corporate client (read-only parent info)
- **Program Admin:** View parent corporate client (read-only)
- **Program User/Driver:** No access

### Program Management
- **Super Admin:** Full CRUD on all programs
- **Corporate Admin:** Full CRUD on programs within their corporate client
- **Program Admin:** View/edit their own program
- **Program User/Driver:** No access

### User Management
- **Super Admin:** 
  - View all users across all corporate clients
  - Create users with any role
  - Edit/delete any user
  - Organize by corporate client hierarchy
- **Corporate Admin:**
  - View users within their corporate client
  - Create users (based on feature flags): Corporate Admins, Program Admins, Program Users, Notification Users
  - Edit/delete users within their scope
  - Organize by program hierarchy
- **Program Admin:**
  - View users within their program
  - Create users: Program Users, Notification Users
  - Edit/delete users within their program
- **Program User/Driver:** No access

### System Settings
- **Super Admin:** Full access to system-wide settings
  - Application name, logo, branding
  - Support contact information
  - Timezone, language
  - Global feature flags
  - System health monitoring
- **Corporate Admin/Program Admin/Program User/Driver:** No access

---

## Navigation Changes

### Removed
- ❌ `/users` page navigation item (old User Management page)
- ✅ User management now centralized in `/settings?tab=users`

### Current Navigation
- ✅ `/settings` - System Settings (for super_admin, corporate_admin, program_admin)
  - Contains all user management functionality in the Users tab
  - Role-appropriate tabs are automatically shown/hidden

---

## Implementation Notes

1. **Tab Filtering:** The `getVisibleTabs()` function in `settings.tsx` automatically filters tabs based on user role
2. **User Management:** The `UsersManagement` component handles role-based user fetching and organization
3. **Redirects:** Super admins accessing `/users` are automatically redirected to `/settings?tab=users`
4. **Access Control:** Each tab content checks user role before rendering sensitive components












