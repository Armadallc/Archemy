# Legacy Reference Archive

This folder contains files from the previous system architecture that are no longer actively used but are preserved for reference and troubleshooting purposes.

## Purpose

The current HALCYON system was built from a legacy system. This archive serves as a historical reference to help understand:

- **Architectural decisions** made during the transition
- **Data migration patterns** used when moving from old to new system
- **Legacy code patterns** that might provide insights for current issues
- **Database schema evolution** from organizations → corporate clients/programs

## Folder Structure

```
legacy-reference/
├── README.md                           # This file
├── schema-old.ts                       # Old TypeScript schema (organizations-based)
├── LEGACY_FILES_REFERENCE.md          # Documentation of legacy file changes
├── ARCHITECTURAL_REFERENCE.md         # Old architectural documentation
├── NAMING_CONVENTIONS.md              # Legacy naming conventions
├── DATABASE_CODING_STANDARDS.md       # Old database standards
├── halcyon_database_dump.sql          # Legacy database dump
└── migrations/                         # Old migration files
    ├── 0000_snapshot.json
    ├── 0001_snapshot.json
    ├── 0008_add_billing_module.sql
    ├── 0009_add_cms1500_forms.sql
    ├── 0011_create_drivers_v2_table.sql
    ├── 0012_create_clients_v2_table.sql
    ├── 0013_create_trips_v2_table.sql
    ├── 0015_create_service_areas_v2_table.sql
    ├── 0015_create_frequent_locations_table.sql
    ├── 0016_create_vehicles_v2_table.sql
    ├── 0017_create_users_v2_table.sql
    └── meta/
        ├── 0000_snapshot.json
        └── 0001_snapshot.json
```

## Key Architectural Changes

### Database Schema Evolution
- **Old**: `organizations` → **New**: `corporate_clients` + `programs`
- **Old**: `service_areas` → **New**: `locations`
- **Old**: `primary_organization_id` → **New**: `primary_program_id`
- **Old**: `authorized_organizations` → **New**: `authorized_programs`

### Role System Evolution
- **Old**: Basic role system → **New**: 5-tier hierarchy
  - `super_admin`
  - `corporate_admin`
  - `program_admin`
  - `program_user`
  - `driver`

### File Organization
- **Old**: Organization-based context → **New**: Program-based context
- **Old**: `useOrganization` hook → **New**: `useHierarchy` hook

## When to Reference This Archive

1. **Troubleshooting**: When current system behavior doesn't match expectations
2. **Data Migration**: When migrating data from external systems
3. **Feature Development**: When implementing features that existed in the old system
4. **Bug Investigation**: When trying to understand the root cause of issues
5. **Architecture Decisions**: When making changes that might affect the overall system design

## Important Notes

- ⚠️ **DO NOT** use these files in the current system
- ⚠️ **DO NOT** import from files in this folder
- ✅ **DO** reference them for understanding and troubleshooting
- ✅ **DO** use them to understand data relationships and patterns

## Current System Files

The current system uses:
- `shared/schema.ts` - Current TypeScript schema
- `server/create-complete-schema.sql` - Current database schema
- `client/src/hooks/useHierarchy.tsx` - Current hierarchy management
- `client/src/hooks/useAuth.tsx` - Current authentication

---

*This archive was created during the schema migration on 2025-01-12 to preserve legacy system knowledge for future reference.*





