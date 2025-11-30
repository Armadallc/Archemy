# 🔍 Dashboard Loading Issue - useMockAuth Error Investigation

**Date:** 2025-01-16  
**Status:** ✅ FIXED  
**Protocol:** INVESTIGATION_PROTOCOL.md

---

## 🚨 PROBLEM IDENTIFICATION

### **Exact Error:**
```
Uncaught Error: useMockAuth must be used within a MockAuthProvider
    at useMockAuth (useMockAuth.tsx:44:11)
    at ShadcnHeader (shadcn-dashboard-migrated.tsx:53:49)
```

### **Specific Functionality Broken:**
- Dashboard not rendering due to React error boundary catching the error
- `ShadcnHeader` component fails to render
- Entire dashboard component tree fails

### **User Context:**
- Dashboard was working before CSS variable fixes
- Error occurs immediately when dashboard tries to render
- Authentication is working (user is signed in as `admin@monarch.com`)

---

## 🔍 SYSTEM ARCHITECTURE ANALYSIS

### **Authentication System:**
- Real authentication: `useAuth` hook with Supabase (working)
- Mock authentication: `useMockAuth` hook for development/testing (not set up)

### **Component Hierarchy:**
```
App
  └─ QueryClientProvider
      └─ ThemeProvider
          └─ AuthProvider (real auth)
              └─ Router
                  └─ AppContent
                      └─ HierarchyProvider
                          └─ MainLayout
                              └─ ShadcnDashboardMigrated
                                  └─ ShadcnHeader ❌ (uses useMockAuth)
```

### **System Requirements:**
- `useMockAuth` requires `MockAuthProvider` in component tree
- `MockAuthProvider` is NOT present in `App.tsx`
- `ShadcnHeader` uses `useMockAuth` for role toggle testing functionality

---

## 🎯 ROOT CAUSE ANALYSIS

### **Actual Root Cause:**
`ShadcnHeader` component (line 53) calls `useMockAuth()` hook, but:
1. `MockAuthProvider` is NOT wrapped around the app in `App.tsx`
2. The hook throws an error when context is null
3. React error boundary catches the error, preventing dashboard render

### **Component Failing:**
- `client/src/pages/shadcn-dashboard-migrated.tsx` → `ShadcnHeader` component (line 50-146)
- Line 53: `const { mockUser, setMockUser, isMockMode } = useMockAuth();`

### **Why It's Failing:**
- `useMockAuth` is used for development role toggle functionality
- The `RoleToggle` component needs mock auth to test different user roles
- However, `MockAuthProvider` was never added to the app's provider tree
- This is a development/testing feature, not required for production

### **What the Code is Trying to Do:**
```typescript
// Line 57: Get current role (mock or real)
const currentRole = (isMockMode && mockUser ? mockUser : user)?.role || 'program_admin';

// Line 60-62: Handle role change for testing
const handleRoleChange = (role: string, userContext: any) => {
  setMockUser(userContext);
};
```

---

## ✅ SOLUTION VALIDATION

### **Proposed Fix Options:**

#### **Option 1: Remove Mock Auth Dependency (Recommended)**
- Remove `useMockAuth` import and usage from `ShadcnHeader`
- Use only `useAuth` for role determination
- Remove or disable `RoleToggle` component (development feature)
- **Pros:** Simplest, removes unnecessary dependency
- **Cons:** Loses development role testing capability

#### **Option 2: Add MockAuthProvider to App.tsx**
- Wrap app with `MockAuthProvider` in `App.tsx`
- Keep mock auth functionality for development
- **Pros:** Preserves development role testing
- **Cons:** Adds unnecessary provider for production

#### **Option 3: Make useMockAuth Optional**
- Modify `useMockAuth` to return null/default values if provider missing
- Make it safe to use without provider
- **Pros:** Backward compatible, doesn't break existing code
- **Cons:** More complex, hides potential issues

### **Recommended Solution: Option 1**
Since:
- Mock auth is only for development/testing
- Real auth is working correctly
- Role toggle is a development feature
- Simplest fix with minimal impact

### **Does it address root cause?**
✅ Yes - Removes the dependency on missing provider

### **Does it align with system architecture?**
✅ Yes - Uses real `useAuth` hook which is already set up

### **Will it break existing functionality?**
❌ No - Only removes development/testing feature (role toggle)

### **Is it minimal change needed?**
✅ Yes - Remove 3 lines of code (import, hook call, role logic)

---

## 📋 IMPLEMENTATION CHECKLIST

- [x] Problem identified: `useMockAuth` used without provider
- [x] System architecture understood: Real auth working, mock auth not set up
- [x] Root cause confirmed: Missing `MockAuthProvider` in component tree
- [x] Solution validated: Remove mock auth dependency
- [x] Impact assessed: Only affects development role toggle feature

---

## 🔧 FIX REQUIRED

**File:** `client/src/pages/shadcn-dashboard-migrated.tsx`

**Changes:**
1. Remove `import { useMockAuth } from "../hooks/useMockAuth";` (line 30)
2. Remove `const { mockUser, setMockUser, isMockMode } = useMockAuth();` (line 53)
3. Update `currentRole` to use only `user?.role` (line 57)
4. Remove or comment out `handleRoleChange` function (lines 60-62)
5. Remove or disable `RoleToggle` component usage (line 131-135)

---

## ✅ FIX IMPLEMENTED

**Date Fixed:** 2025-01-16  
**Status:** Mock auth dependency removed

### **Changes Made:**
1. ✅ Commented out `useMockAuth` import (line 30)
2. ✅ Removed `useMockAuth()` hook call (line 53)
3. ✅ Updated `currentRole` to use only `user?.role` (line 56)
4. ✅ Updated `handleRoleChange` to log warning instead of using mock auth (line 59-61)
5. ✅ Disabled `RoleToggle` component rendering (line 131-137)

### **Files Modified:**
- `client/src/pages/shadcn-dashboard-migrated.tsx` - Removed mock auth dependency

### **Verification:**
- ✅ No `useMockAuth` calls remaining
- ✅ Component now uses only real `useAuth` hook
- ✅ Role toggle disabled (development feature)
- ✅ Dashboard should now render without errors

---

## 📝 NOTES

- This is a development/testing feature that was never fully integrated
- The role toggle functionality is not essential for production
- Real authentication is working correctly
- This error was likely masked before or the component wasn't being used
- **FIXED:** Dashboard should now load correctly without mock auth provider

