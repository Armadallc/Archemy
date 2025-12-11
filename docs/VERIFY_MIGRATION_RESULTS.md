# Verify Migration Results

## Step 1: Check if Tables/Columns Were Created

```sql
-- Check tenant_roles table exists
SELECT COUNT(*) FROM tenant_roles;

-- Check columns were added to users table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('tenant_role_id', 'active_tenant_id');

-- Check role_type column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'role_permissions' 
AND column_name = 'role_type';
```

## Step 2: Check Why No Tenant Roles Were Created

The migration only creates tenant roles for **active corporate clients**. Check:

```sql
-- Check if you have any active corporate clients
SELECT id, name, is_active 
FROM corporate_clients 
WHERE is_active = true;

-- If no results, check all corporate clients
SELECT id, name, is_active 
FROM corporate_clients;
```

## Step 3: Manually Create Tenant Roles (If Needed)

If you have corporate clients but no tenant roles were created, you can manually trigger the seeding:

```sql
-- Replace 'monarch' with your actual corporate_client_id
DO $$
DECLARE
    corp_client RECORD;
    system_role VARCHAR(50);
    tenant_role_id_var VARCHAR(50);
    perm RECORD;
BEGIN
    FOR corp_client IN 
        SELECT id, name FROM corporate_clients WHERE is_active = true
    LOOP
        FOR system_role IN 
            SELECT unnest(ARRAY['corporate_admin', 'program_admin', 'program_user', 'driver']::VARCHAR[])
        LOOP
            INSERT INTO tenant_roles (
                id,
                corporate_client_id, 
                name, 
                description,
                is_active
            ) VALUES (
                gen_random_uuid()::text,
                corp_client.id,
                system_role || '_' || corp_client.id,
                'Default tenant role for ' || system_role || ' in ' || corp_client.name,
                true
            )
            ON CONFLICT (corporate_client_id, name) DO NOTHING
            RETURNING id INTO tenant_role_id_var;

            IF tenant_role_id_var IS NOT NULL THEN
                FOR perm IN 
                    SELECT permission, resource, program_id, corporate_client_id
                    FROM role_permissions
                    WHERE role = system_role
                    AND role_type = 'system'
                    AND (corporate_client_id IS NULL OR corporate_client_id = corp_client.id)
                LOOP
                    INSERT INTO role_permissions (
                        role,
                        role_type,
                        permission,
                        resource,
                        program_id,
                        corporate_client_id
                    )
                    SELECT 
                        tenant_role_id_var,
                        'tenant',
                        perm.permission,
                        perm.resource,
                        perm.program_id,
                        COALESCE(perm.corporate_client_id, corp_client.id)
                    WHERE NOT EXISTS (
                        SELECT 1 FROM role_permissions rp
                        WHERE rp.role = tenant_role_id_var
                        AND rp.role_type = 'tenant'
                        AND rp.permission = perm.permission
                        AND rp.resource = perm.resource
                        AND COALESCE(rp.program_id, '') = COALESCE(perm.program_id, '')
                        AND COALESCE(rp.corporate_client_id, '') = COALESCE(perm.corporate_client_id, corp_client.id, '')
                    );
                END LOOP;
            END IF;
        END LOOP;
    END LOOP;
END $$;
```

## Step 4: Verify Everything Works

```sql
-- Should show tenant roles now
SELECT corporate_client_id, name, is_active 
FROM tenant_roles 
ORDER BY corporate_client_id, name;

-- Should show tenant permissions
SELECT role_type, COUNT(*) 
FROM role_permissions 
GROUP BY role_type;

-- Check a specific tenant role's permissions
SELECT tr.name, rp.permission, rp.resource
FROM tenant_roles tr
JOIN role_permissions rp ON rp.role = tr.id
WHERE rp.role_type = 'tenant'
LIMIT 10;
```

