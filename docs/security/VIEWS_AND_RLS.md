# Views and Row Level Security (RLS)

## Important Note

**RLS cannot be enabled directly on VIEWS.** Row Level Security applies to the underlying tables that views query, not to the views themselves.

## Views in the System

### `program_hierarchy`
- **Type:** VIEW
- **Status:** ✅ SECURE - All underlying tables have RLS enabled (verify with query)
- **Underlying Tables:** 
  - `programs` ✅ RLS ENABLED
  - `corporate_clients` ✅ RLS ENABLED
  - `locations` ✅ RLS ENABLED
- **Access Control:** The view automatically respects RLS policies on the underlying tables

### `trip_statistics`
- **Type:** VIEW
- **Status:** ✅ SECURE - All underlying tables have RLS enabled
- **Underlying Tables:**
  - `trips` ✅ RLS ENABLED
  - `programs` ✅ RLS ENABLED
- **Access Control:** The view automatically respects RLS policies on the underlying tables

## How RLS Works with Views

1. When a user queries a view, PostgreSQL executes the view's underlying query
2. The query accesses the underlying tables
3. RLS policies on those tables are applied automatically
4. The view returns only the rows the user is allowed to see

## Verification

To check if a relation is a view or table:

```sql
SELECT 
    table_name,
    table_type,
    CASE 
        WHEN table_type = 'VIEW' THEN '⚠️ VIEW - RLS applies to underlying tables'
        WHEN table_type = 'BASE TABLE' THEN '✅ TABLE - RLS can be enabled'
    END as rls_status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('program_hierarchy', 'trip_statistics');
```

## Best Practices

1. **For Views:** Ensure all underlying tables have RLS enabled
2. **For Tables:** Enable RLS directly on the table
3. **Documentation:** Document which relations are views vs tables
4. **Testing:** Test view access with different user roles to ensure RLS is working correctly

