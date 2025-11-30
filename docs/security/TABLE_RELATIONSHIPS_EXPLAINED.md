# Table Relationships Explained

## Mobility & Special Requirements Tables

### Lookup Tables (Master Lists)
These tables store the **available options** that can be selected:

- **`mobility_requirements`** - Master list of available mobility requirements (e.g., "Wheelchair", "Walker", "Cane")
- **`special_requirements`** - Master list of available special requirements (e.g., "Medical Equipment", "Oxygen Tank")
- **`communication_needs`** - Master list of available communication needs (e.g., "Sign Language", "Hearing Aid")

### Junction Tables (Client-Specific Assignments)
These tables **link clients to specific requirements** from the lookup tables:

- **`client_mobility_requirements`** - Links clients to their specific mobility requirements (many-to-many relationship)
- **`client_special_requirements`** - Links clients to their specific special requirements (many-to-many relationship)
- **`client_communication_needs`** - Links clients to their specific communication needs (many-to-many relationship)

### Why Both Are Needed

1. **Lookup Tables** provide a standardized list that can be managed by admins
2. **Junction Tables** allow multiple requirements to be assigned to each client
3. This design allows for:
   - Easy addition of new requirement types (add to lookup table)
   - Multiple requirements per client (multiple rows in junction table)
   - Custom notes per requirement (stored in junction table)

## Example Usage

```sql
-- Get all available mobility requirements (lookup)
SELECT * FROM mobility_requirements WHERE is_active = true;

-- Get mobility requirements for a specific client (junction)
SELECT 
    cmr.*,
    mr.name as requirement_name
FROM client_mobility_requirements cmr
JOIN mobility_requirements mr ON mr.id = cmr.mobility_requirement_id
WHERE cmr.client_id = 'client-uuid';
```

## Tables with Typos

- **`mobility_requirenents`** - Typo in table name (missing 'm' - should be `mobility_requirements`). This appears to be a duplicate or old version of `mobility_requirements`. Consider:
  1. Dropping this table if it's not in use
  2. Migrating data to `mobility_requirements` if needed
  3. Renaming the table to fix the typo

## Backup Tables

The following backup tables exist and should either:
1. Be dropped if no longer needed
2. Have RLS enabled (only super_admin access) if kept for recovery purposes

- `client_groups_backup`
- `client_group_memberships_backup`
- `clients_backup`
- `trips_backup`

## Other Tables Needing RLS

- **`client_opt_ins`** - Client opt-in preferences (e.g., email notifications, SMS)
- **`program_hierarchy`** - Program organizational structure
- **`program_qr_codes`** - QR codes associated with programs
- **`push_subscriptions`** - Push notification subscriptions for users
- **`trip_statistics`** - Aggregated trip statistics (likely read-only for most users)

