# System Settings - RLS Security

**Status:** ✅ RLS Enabled - Super Admin Only  
**Date:** 2025-01-27

---

## 🔒 Security Configuration

The `system_settings` table has **Row Level Security (RLS) enabled** with a policy that restricts access to **super_admin users only**.

### RLS Policy

```sql
-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Only super_admin can access
CREATE POLICY "system_settings_super_admin_only" ON system_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.user_id = auth.uid()::text
            AND u.role = 'super_admin'
        )
    );
```

### What This Means

- ✅ **Super Admin:** Can SELECT, UPDATE system settings
- ❌ **Corporate Admin:** Cannot access (blocked by RLS)
- ❌ **Program Admin:** Cannot access (blocked by RLS)
- ❌ **Program User:** Cannot access (blocked by RLS)
- ❌ **Driver:** Cannot access (blocked by RLS)
- ❌ **Unauthenticated:** Cannot access (blocked by RLS)

### API-Level Protection

In addition to RLS, the backend API routes also enforce access control:

```typescript
// server/routes/system-settings.ts
router.get("/", requireSupabaseAuth, requireSupabaseRole(['super_admin']), ...)
router.put("/", requireSupabaseAuth, requireSupabaseRole(['super_admin']), ...)
```

This provides **double protection**:
1. **Database level:** RLS policies prevent unauthorized access
2. **API level:** Middleware checks role before processing requests

---

## 🔍 Testing RLS

### Test 1: Super Admin Access

```sql
-- As super_admin user
SELECT * FROM system_settings;
-- ✅ Should return the settings row
```

### Test 2: Non-Super-Admin Access

```sql
-- As corporate_admin or other role
SELECT * FROM system_settings;
-- ❌ Should return empty result (RLS blocks access)
```

### Test 3: Unauthenticated Access

```sql
-- Without authentication
SELECT * FROM system_settings;
-- ❌ Should return empty result (RLS blocks access)
```

---

## 📝 Migration Status

The RLS policy is included in `migrations/0028_create_system_settings_table.sql` and will be applied when you run the migration.

If you've already run the migration without RLS, you can add it manually:

```sql
-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "system_settings_super_admin_only" ON system_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.user_id = auth.uid()::text
            AND u.role = 'super_admin'
        )
    );
```

---

## ✅ Security Checklist

- [x] RLS enabled on `system_settings` table
- [x] Policy restricts access to super_admin only
- [x] API routes enforce super_admin role check
- [x] No INSERT policy (only one row allowed via constraint)
- [x] No DELETE policy (only one row allowed via constraint)
- [x] UPDATE allowed for super_admin (via RLS policy)

---

**The table is secure!** Both database-level (RLS) and API-level (middleware) protections are in place.

