# Corporate Admin Role - User Experience Checklist

## User: mike@monarch.com
## Role: corporate_admin
## Corporate Client: monarch

---

## ✅ Authentication & Access

### Login & Session
- [x] User can log in with email and password
- [x] Session persists across browser refresh
- [x] Session expires appropriately
- [x] Logout works correctly
- [ ] Password reset functionality (if implemented)

### Route Access
- [x] Can access `/settings` page
- [x] Can access `/corporate-client/monarch/settings` (hierarchical route)
- [ ] Cannot access super admin only routes (`/analytics`, `/prophet`, `/design-system`)
- [ ] Cannot access other corporate clients' data
- [ ] Can access their own corporate client's data

---

## 📋 Settings Page Access

### Tab Visibility
- [ ] **Corporate Client Tab**: Visible and functional
  - [ ] Can view corporate client details
  - [ ] Can edit corporate client information
  - [ ] Can upload/change corporate client logo
  - [ ] Can toggle active status
  - [ ] Cannot see other corporate clients (only their own)
  
- [ ] **Program Tab**: Visible and functional
  - [ ] Can view programs under their corporate client
  - [ ] Can create new programs
  - [ ] Can add locations to programs
  - [ ] Cannot see programs from other corporate clients
  
- [ ] **Users Tab**: Visible and functional
  - [ ] Can view users in their corporate client
  - [ ] Can create new users (corporate_admin, program_admin, program_user, notification_user)
  - [ ] Can edit users in their corporate client
  - [ ] Can deactivate users (toggle is_active)
  - [ ] Cannot delete users (only super_admin can delete)
  - [ ] Cannot see users from other corporate clients
  - [ ] Users are organized by program within corporate client
  - [ ] Search functionality works
  
- [ ] **Contacts Tab**: Visible and functional
  - [ ] Can view contacts
  - [ ] Can add/edit contacts
  - [ ] Scoped to their corporate client
  
- [ ] **Notifications Tab**: Visible and functional
  - [ ] Can configure notification preferences
  - [ ] Can select theme
  - [ ] Settings are user-specific
  
- [ ] **System Tab**: NOT visible (super_admin only)
- [ ] **Vendors Tab**: Visible (if implemented)

---

## 🎯 Navigation & Sidebar

### Sidebar Visibility
- [ ] Corporate client name displays correctly
- [ ] Corporate client logo displays (if set)
- [ ] Mini calendar is visible
- [ ] PARTNERS drilldown menu is visible
- [ ] Navigation items are filtered by role:
  - [ ] Can see "Clients" (PARTNER MGMT)
  - [ ] Can see "System Settings" (ADMIN)
  - [ ] Can see "BENTOBOX" (DEVELOPMENT)
  - [ ] Cannot see "Analytics" (super_admin only)
  - [ ] Cannot see "PROPHET" (super_admin only)
  - [ ] Cannot see "Design System" (super_admin only)
  - [ ] Cannot see "Role Templates" (super_admin only)

### Hierarchy Navigation
- [ ] Can navigate to corporate client level pages
- [ ] Can navigate to program level pages (within their corporate client)
- [ ] Cannot navigate to other corporate clients' pages
- [ ] URL structure reflects hierarchy: `/corporate-client/monarch/...`

---

## 👥 User Management

### Creating Users
- [ ] "Add User" button is visible in Users tab
- [ ] Create user dialog opens correctly
- [ ] Can create users with roles:
  - [ ] corporate_admin (can create other corporate admins)
  - [ ] program_admin
  - [ ] program_user
  - [ ] notification_user
  - [ ] driver
  - [ ] Cannot create super_admin users
- [ ] Corporate client is auto-assigned (cannot change)
- [ ] Program assignment dropdown shows only programs from their corporate client
- [ ] User creation creates both database user and Supabase Auth user
- [ ] `auth_user_id` is properly saved
- [ ] New user can log in immediately after creation
- [ ] Success notification displays correctly

### Managing Users
- [ ] Can view all users in their corporate client
- [ ] Users are organized by program
- [ ] Can search users by name, email, username, or role
- [ ] Can edit user details (name, email, phone, role)
- [ ] Can toggle user active/inactive status
- [ ] Cannot delete users (delete button not visible)
- [ ] Cannot edit users from other corporate clients
- [ ] Role badges display correctly
- [ ] Status badges (Active/Inactive) display correctly
- [ ] Program information displays correctly (corporate client + program)

---

## 🏢 Corporate Client Management

### Viewing Corporate Client
- [ ] Corporate client card displays:
  - [ ] Corporate client name
  - [ ] Logo (if set)
  - [ ] Number of programs
  - [ ] Number of locations
  - [ ] Total number of clients
- [ ] Card is collapsible
- [ ] Expanded card shows:
  - [ ] Corporate client name and logo
  - [ ] Active status toggle
  - [ ] Census data (programs, locations, clients)
  - [ ] Main contact information
  - [ ] Logo upload functionality

### Programs Management
- [ ] Can view all programs under their corporate client
- [ ] Programs are displayed in accordion format
- [ ] Each program shows:
  - [ ] Program name and logo
  - [ ] Active status
  - [ ] Number of locations
  - [ ] Total number of clients
- [ ] Expanded program shows:
  - [ ] Location addresses
  - [ ] Client count per location
  - [ ] Program admin contact information
  - [ ] QR code generation (if applicable)

---

## 📊 Data Scoping & Permissions

### Data Access
- [ ] Can only see data from their corporate client (monarch)
- [ ] Cannot see data from other corporate clients
- [ ] Can see all programs under their corporate client
- [ ] Can see all locations under their corporate client's programs
- [ ] Can see all clients under their corporate client's programs
- [ ] Can see all trips for their corporate client
- [ ] Can see all drivers assigned to their corporate client
- [ ] Can see all vehicles assigned to their corporate client

### API Endpoints
- [ ] `/api/users` returns only users from their corporate client
- [ ] `/api/programs` returns only programs from their corporate client
- [ ] `/api/locations` returns only locations from their corporate client
- [ ] `/api/clients` returns only clients from their corporate client
- [ ] `/api/trips` returns only trips from their corporate client
- [ ] `/api/drivers` returns only drivers from their corporate client
- [ ] `/api/vehicles` returns only vehicles from their corporate client

---

## 🎨 UI/UX Elements

### Headers
- [ ] All page headers have consistent styling (150px height, rounded corners, border, shadow)
- [ ] Headers use Nohemi font, 110px, lowercase with period
- [ ] Page titles are correct for each page

### Theme & Styling
- [ ] Theme selector works in Notifications tab
- [ ] Theme mode (light/dark) persists across sessions
- [ ] Selected theme applies correctly
- [ ] Colors and styling are consistent

### Notifications
- [ ] Success notifications display with correct styling (cyan glow)
- [ ] Error notifications display correctly
- [ ] Toast notifications appear and dismiss properly

---

## 🔒 Security & Permissions

### Role-Based Access Control
- [ ] Cannot access super_admin only features
- [ ] Cannot modify system settings
- [ ] Cannot delete users (only deactivate)
- [ ] Cannot access other corporate clients' data
- [ ] Cannot create super_admin users
- [ ] Cannot assign users to other corporate clients

### Data Isolation
- [ ] Corporate client data is properly isolated
- [ ] API responses are filtered by corporate_client_id
- [ ] Database queries include corporate_client_id filter
- [ ] No data leakage between corporate clients

---

## 🐛 Known Issues to Test

### User Creation Issues
- [ ] Verify new users can log in immediately after creation
- [ ] Check that `auth_user_id` is saved correctly
- [ ] Verify password is set correctly in Supabase Auth
- [ ] Test creating user with duplicate email (should fail gracefully)
- [ ] Test creating user with invalid password (should validate)

### Route Issues
- [ ] `/corporate-client/monarch/settings` loads correctly
- [ ] All hierarchical routes work: `/corporate-client/monarch/trips`, etc.
- [ ] Flat routes redirect appropriately if needed

### Data Loading Issues
- [ ] All data loads without errors
- [ ] Loading states display correctly
- [ ] Empty states display when no data
- [ ] Error states display when API calls fail

---

## 📝 Testing Checklist

### Initial Setup
1. [ ] Log in as mike@monarch.com
2. [ ] Verify user role is `corporate_admin`
3. [ ] Verify corporate_client_id is `monarch`
4. [ ] Check that all expected navigation items are visible

### Settings Page
1. [ ] Navigate to `/settings`
2. [ ] Verify all expected tabs are visible
3. [ ] Test each tab functionality
4. [ ] Navigate to `/corporate-client/monarch/settings`
5. [ ] Verify it loads correctly

### User Management
1. [ ] Create a new program_admin user
2. [ ] Verify user can log in immediately
3. [ ] Edit the user
4. [ ] Deactivate the user
5. [ ] Reactivate the user
6. [ ] Search for users
7. [ ] Verify users are organized correctly

### Data Scoping
1. [ ] Verify only monarch data is visible
2. [ ] Attempt to access other corporate clients' data (should fail/redirect)
3. [ ] Verify API calls include corporate_client_id filter

---

## 🎯 Success Criteria

A corporate_admin user should:
- ✅ Have full access to manage their corporate client
- ✅ Be able to create and manage users within their corporate client
- ✅ Be able to create and manage programs and locations
- ✅ Have no access to other corporate clients' data
- ✅ Have no access to system-level settings
- ✅ Have a consistent, role-appropriate user experience

---

## Notes

- Corporate admins can create other corporate admins (this may need to be restricted)
- Corporate admins cannot delete users, only deactivate them
- All data is scoped to their corporate_client_id
- Settings page should reflect their role and permissions



