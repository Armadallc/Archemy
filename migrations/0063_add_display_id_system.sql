-- ============================================================================
-- DISPLAY ID SYSTEM MIGRATION
-- Implements parallel display IDs for Users, Drivers, and Vehicles
-- Similar to SCID system for clients
-- ============================================================================
-- Created: 2024-12-29
-- Version: 1.0.0
-- 
-- This migration adds human-readable display IDs while preserving UUIDs as primary keys.
-- Format Examples:
--   Users: MON-CAD-001 (Monarch Corporate Admin #1)
--   Users: APN-PAD-002 (Apollo Program Admin #2)
--   Users: HAL-SAD-001 (HALCYON Super Admin #1)
--   Drivers: DRV-MON-001 (Driver affiliated with Monarch)
--   Vehicles: MON-BUS-001 (Monarch Bus #1)
--   Vehicles: APN-VAN-002 (Apollo Van #2)
-- ============================================================================

-- ============================================================================
-- PHASE 1: ADD DISPLAY_ID COLUMNS (Safe Addition - Nullable Initially)
-- ============================================================================

ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS display_id VARCHAR(20);

ALTER TABLE drivers 
    ADD COLUMN IF NOT EXISTS display_id VARCHAR(20);

ALTER TABLE vehicles 
    ADD COLUMN IF NOT EXISTS display_id VARCHAR(20);

-- Add comments
COMMENT ON COLUMN users.display_id IS 'Human-readable display ID for UI and operational communication. Format: [TENANT]-[ROLE]-[SEQ] (e.g., MON-CAD-001)';
COMMENT ON COLUMN drivers.display_id IS 'Human-readable display ID for UI and operational communication. Format: DRV-[TENANT]-[SEQ] (e.g., DRV-MON-001)';
COMMENT ON COLUMN vehicles.display_id IS 'Human-readable display ID for UI and operational communication. Format: [TENANT]-[TYPE]-[SEQ] (e.g., MON-BUS-001)';

-- ============================================================================
-- PHASE 2: HELPER FUNCTIONS
-- ============================================================================

-- Helper: Get tenant code for a user (handles all possible tenant links)
CREATE OR REPLACE FUNCTION get_tenant_code_for_user(p_user_id VARCHAR)
RETURNS VARCHAR(10) AS $$
DECLARE
    v_tenant_code VARCHAR(10);
    v_user_record RECORD;
BEGIN
    -- Get user with all possible tenant links
    SELECT 
        u.corporate_client_id,
        u.primary_program_id,
        u.tenant_role_id,
        u.role,
        tr.corporate_client_id as role_corp_id,
        p.corporate_client_id as prog_corp_id
    INTO v_user_record
    FROM users u
    LEFT JOIN tenant_roles tr ON u.tenant_role_id = tr.id
    LEFT JOIN programs p ON u.primary_program_id = p.id
    WHERE u.user_id = p_user_id;
    
    -- Priority: 1) Direct corporate_client_id, 2) Via tenant_role, 3) Via program, 4) Super admin default
    IF v_user_record.corporate_client_id IS NOT NULL THEN
        SELECT code INTO v_tenant_code 
        FROM corporate_clients 
        WHERE id = v_user_record.corporate_client_id;
    ELSIF v_user_record.role_corp_id IS NOT NULL THEN
        SELECT code INTO v_tenant_code 
        FROM corporate_clients 
        WHERE id = v_user_record.role_corp_id;
    ELSIF v_user_record.prog_corp_id IS NOT NULL THEN
        SELECT cc.code INTO v_tenant_code
        FROM programs p
        JOIN corporate_clients cc ON p.corporate_client_id = cc.id
        WHERE p.id = v_user_record.primary_program_id;
    ELSIF v_user_record.role = 'super_admin' THEN
        v_tenant_code := 'HAL';  -- HALCYON system-level
    END IF;
    
    RETURN COALESCE(v_tenant_code, 'HAL');
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_tenant_code_for_user(VARCHAR) IS 'Determines tenant code for a user by checking corporate_client_id, tenant_role, primary_program, or defaulting to HAL for super admins';

-- Helper: Get tenant code for a driver
CREATE OR REPLACE FUNCTION get_tenant_code_for_driver(p_driver_id VARCHAR)
RETURNS VARCHAR(10) AS $$
DECLARE
    v_tenant_code VARCHAR(10);
    v_driver_record RECORD;
BEGIN
    -- Get driver with program and user context
    SELECT 
        d.program_id,
        u.corporate_client_id as user_corp_id,
        u.primary_program_id as user_prog_id,
        u.role as user_role
    INTO v_driver_record
    FROM drivers d
    JOIN users u ON d.user_id = u.user_id
    WHERE d.id = p_driver_id;
    
    -- Priority: 1) Driver's program, 2) User's corporate, 3) User's program, 4) Default
    IF v_driver_record.program_id IS NOT NULL THEN
        SELECT cc.code INTO v_tenant_code
        FROM programs p
        JOIN corporate_clients cc ON p.corporate_client_id = cc.id
        WHERE p.id = v_driver_record.program_id;
    ELSIF v_driver_record.user_corp_id IS NOT NULL THEN
        SELECT code INTO v_tenant_code
        FROM corporate_clients
        WHERE id = v_driver_record.user_corp_id;
    ELSIF v_driver_record.user_prog_id IS NOT NULL THEN
        SELECT cc.code INTO v_tenant_code
        FROM programs p
        JOIN corporate_clients cc ON p.corporate_client_id = cc.id
        WHERE p.id = v_driver_record.user_prog_id;
    END IF;
    
    RETURN COALESCE(v_tenant_code, 'HAL');
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_tenant_code_for_driver(VARCHAR) IS 'Determines tenant code for a driver by checking program_id, user corporate_client_id, or defaulting to HAL';

-- Helper: Get tenant code for a vehicle
CREATE OR REPLACE FUNCTION get_tenant_code_for_vehicle(p_vehicle_id VARCHAR)
RETURNS VARCHAR(10) AS $$
DECLARE
    v_tenant_code VARCHAR(10);
BEGIN
    -- Get tenant code from vehicle's program
    SELECT cc.code INTO v_tenant_code
    FROM vehicles v
    JOIN programs p ON v.program_id = p.id
    JOIN corporate_clients cc ON p.corporate_client_id = cc.id
    WHERE v.id = p_vehicle_id;
    
    RETURN COALESCE(v_tenant_code, 'HAL');
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_tenant_code_for_vehicle(VARCHAR) IS 'Determines tenant code for a vehicle from its program';

-- ============================================================================
-- PHASE 3: GENERATION FUNCTIONS
-- ============================================================================

-- Generate User Display ID
CREATE OR REPLACE FUNCTION generate_user_display_id(p_user_id VARCHAR)
RETURNS VARCHAR(20) AS $$
DECLARE
    v_user_record RECORD;
    v_tenant_code VARCHAR(10);
    v_role_code VARCHAR(3);
    v_next_seq INTEGER;
    v_display_id VARCHAR(20);
    v_sequence_key VARCHAR(20);
BEGIN
    -- Get user details with tenant and role info
    SELECT 
        u.corporate_client_id,
        u.primary_program_id,
        u.tenant_role_id,
        u.role,
        tr.name as role_name,
        tr.corporate_client_id as role_corp_id
    INTO v_user_record
    FROM users u
    LEFT JOIN tenant_roles tr ON u.tenant_role_id = tr.id
    WHERE u.user_id = p_user_id;
    
    -- Determine tenant code
    v_tenant_code := get_tenant_code_for_user(p_user_id);
    
    -- Extract role code: Check tenant_role.name pattern first, then users.role enum
    v_role_code := CASE 
        -- Check tenant_role.name pattern (e.g., 'corporate_admin_monarch')
        WHEN v_user_record.role_name LIKE 'corporate_admin_%' THEN 'CAD'
        WHEN v_user_record.role_name LIKE 'program_admin_%' THEN 'PAD'
        WHEN v_user_record.role_name LIKE 'program_user_%' THEN 'PUS'
        WHEN v_user_record.role_name LIKE 'driver_%' THEN 'DRV'
        -- Fallback to users.role enum
        WHEN v_user_record.role = 'super_admin' THEN 'SAD'
        WHEN v_user_record.role = 'corporate_admin' THEN 'CAD'
        WHEN v_user_record.role = 'program_admin' THEN 'PAD'
        WHEN v_user_record.role = 'program_user' THEN 'PUS'
        WHEN v_user_record.role = 'driver' THEN 'DRV'
        ELSE 'USR'
    END;
    
    -- Create sequence key: tenant-role (e.g., 'MON-CAD')
    v_sequence_key := v_tenant_code || '-' || v_role_code;
    
    -- Get next sequence for this tenant-role combo
    INSERT INTO id_sequences (entity_type, program_code, date_key, last_value)
    VALUES ('user_display_id', v_sequence_key, NULL, 1)
    ON CONFLICT (entity_type, program_code, date_key)
    DO UPDATE SET 
        last_value = id_sequences.last_value + 1,
        updated_at = NOW()
    RETURNING last_value INTO v_next_seq;
    
    -- If INSERT didn't return value (conflict occurred), fetch it
    IF v_next_seq IS NULL THEN
        SELECT last_value INTO v_next_seq
        FROM id_sequences
        WHERE entity_type = 'user_display_id' 
          AND program_code = v_sequence_key 
          AND date_key IS NULL;
    END IF;
    
    -- Format: TENANT-ROLE-SEQ (e.g., MON-CAD-001)
    v_display_id := v_tenant_code || '-' || v_role_code || '-' || LPAD(v_next_seq::TEXT, 3, '0');
    
    RETURN v_display_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_user_display_id(VARCHAR) IS 'Generates a user display ID. Format: [TENANT]-[ROLE]-[SEQ] (e.g., MON-CAD-001)';

-- Generate Driver Display ID
CREATE OR REPLACE FUNCTION generate_driver_display_id(p_driver_id VARCHAR)
RETURNS VARCHAR(20) AS $$
DECLARE
    v_tenant_code VARCHAR(10);
    v_next_seq INTEGER;
    v_display_id VARCHAR(20);
BEGIN
    -- Determine tenant code
    v_tenant_code := get_tenant_code_for_driver(p_driver_id);
    
    -- Get next sequence for this tenant's drivers
    INSERT INTO id_sequences (entity_type, program_code, date_key, last_value)
    VALUES ('driver_display_id', v_tenant_code, NULL, 1)
    ON CONFLICT (entity_type, program_code, date_key)
    DO UPDATE SET 
        last_value = id_sequences.last_value + 1,
        updated_at = NOW()
    RETURNING last_value INTO v_next_seq;
    
    -- If INSERT didn't return value, fetch it
    IF v_next_seq IS NULL THEN
        SELECT last_value INTO v_next_seq
        FROM id_sequences
        WHERE entity_type = 'driver_display_id' 
          AND program_code = v_tenant_code 
          AND date_key IS NULL;
    END IF;
    
    -- Format: DRV-TENANT-SEQ (e.g., DRV-MON-001)
    v_display_id := 'DRV-' || v_tenant_code || '-' || LPAD(v_next_seq::TEXT, 3, '0');
    
    RETURN v_display_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_driver_display_id(VARCHAR) IS 'Generates a driver display ID. Format: DRV-[TENANT]-[SEQ] (e.g., DRV-MON-001)';

-- Generate Vehicle Display ID
CREATE OR REPLACE FUNCTION generate_vehicle_display_id(p_vehicle_id VARCHAR)
RETURNS VARCHAR(20) AS $$
DECLARE
    v_vehicle_record RECORD;
    v_tenant_code VARCHAR(10);
    v_type_code VARCHAR(3);
    v_next_seq INTEGER;
    v_display_id VARCHAR(20);
    v_sequence_key VARCHAR(20);
BEGIN
    -- Get vehicle details
    SELECT 
        v.program_id,
        v.vehicle_type,
        COALESCE(v.make, 'UNK') as make
    INTO v_vehicle_record
    FROM vehicles v
    WHERE v.id = p_vehicle_id;
    
    -- Determine tenant code
    v_tenant_code := get_tenant_code_for_vehicle(p_vehicle_id);
    
    -- Determine type code with comprehensive mapping
    v_type_code := UPPER(COALESCE(
        -- Try to match common vehicle types
        CASE 
            WHEN LOWER(v_vehicle_record.vehicle_type) LIKE '%van%' THEN 'VAN'
            WHEN LOWER(v_vehicle_record.vehicle_type) LIKE '%bus%' THEN 'BUS'
            WHEN LOWER(v_vehicle_record.vehicle_type) LIKE '%car%' OR 
                 LOWER(v_vehicle_record.vehicle_type) LIKE '%sedan%' THEN 'CAR'
            WHEN LOWER(v_vehicle_record.vehicle_type) LIKE '%suv%' THEN 'SUV'
            WHEN LOWER(v_vehicle_record.vehicle_type) LIKE '%truck%' THEN 'TRK'
            WHEN LOWER(v_vehicle_record.vehicle_type) LIKE '%ambulance%' THEN 'AMB'
            WHEN LOWER(v_vehicle_record.vehicle_type) LIKE '%wheelchair%' OR
                 LOWER(v_vehicle_record.vehicle_type) LIKE '%accessible%' THEN 'WAV'
            ELSE NULL
        END,
        -- Fallback to first 3 chars of vehicle_type (uppercase, letters only)
        UPPER(SUBSTRING(REGEXP_REPLACE(COALESCE(v_vehicle_record.vehicle_type, ''), '[^A-Za-z]', '', 'g') FROM 1 FOR 3)),
        -- Fallback to first 3 chars of make
        UPPER(SUBSTRING(REGEXP_REPLACE(v_vehicle_record.make, '[^A-Za-z]', '', 'g') FROM 1 FOR 3)),
        'VHC'  -- Ultimate fallback
    ));
    
    -- Ensure type code is exactly 3 characters
    IF LENGTH(v_type_code) < 3 THEN
        v_type_code := RPAD(v_type_code, 3, 'X');
    ELSIF LENGTH(v_type_code) > 3 THEN
        v_type_code := SUBSTRING(v_type_code FROM 1 FOR 3);
    END IF;
    
    -- Create sequence key: tenant-type (e.g., 'MON-BUS')
    v_sequence_key := v_tenant_code || '-' || v_type_code;
    
    -- Get next sequence for this tenant-type combo
    INSERT INTO id_sequences (entity_type, program_code, date_key, last_value)
    VALUES ('vehicle_display_id', v_sequence_key, NULL, 1)
    ON CONFLICT (entity_type, program_code, date_key)
    DO UPDATE SET 
        last_value = id_sequences.last_value + 1,
        updated_at = NOW()
    RETURNING last_value INTO v_next_seq;
    
    -- If INSERT didn't return value, fetch it
    IF v_next_seq IS NULL THEN
        SELECT last_value INTO v_next_seq
        FROM id_sequences
        WHERE entity_type = 'vehicle_display_id' 
          AND program_code = v_sequence_key 
          AND date_key IS NULL;
    END IF;
    
    -- Format: TENANT-TYPE-SEQ (e.g., MON-BUS-001)
    v_display_id := v_tenant_code || '-' || v_type_code || '-' || LPAD(v_next_seq::TEXT, 3, '0');
    
    RETURN v_display_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_vehicle_display_id(VARCHAR) IS 'Generates a vehicle display ID. Format: [TENANT]-[TYPE]-[SEQ] (e.g., MON-BUS-001)';

-- ============================================================================
-- PHASE 4: SYNC SEQUENCES WITH EXISTING DISPLAY_IDS (If Any)
-- ============================================================================

-- Sync user display_id sequences based on existing values
DO $$
DECLARE
    seq_record RECORD;
    max_seq INTEGER;
    sequence_key VARCHAR(20);
BEGIN
    RAISE NOTICE 'Syncing user display_id sequences...';
    
    -- For each unique tenant-role combination that has existing display_ids
    FOR seq_record IN
        SELECT 
            SUBSTRING(display_id FROM '^([A-Z]{2,5}-[A-Z]{3})') as tenant_role_prefix,
            MAX(CAST(SUBSTRING(display_id FROM '-([0-9]{3})$') AS INTEGER)) as max_seq
        FROM users
        WHERE display_id IS NOT NULL
          AND display_id ~ '^[A-Z]{2,5}-[A-Z]{3}-[0-9]{3}$'
        GROUP BY SUBSTRING(display_id FROM '^([A-Z]{2,5}-[A-Z]{3})')
    LOOP
        sequence_key := seq_record.tenant_role_prefix;
        max_seq := seq_record.max_seq;
        
        -- Update or insert sequence to start from max + 1
        INSERT INTO id_sequences (entity_type, program_code, date_key, last_value)
        VALUES ('user_display_id', sequence_key, NULL, max_seq)
        ON CONFLICT (entity_type, program_code, date_key)
        DO UPDATE SET 
            last_value = GREATEST(id_sequences.last_value, max_seq),
            updated_at = NOW();
    END LOOP;
    
    RAISE NOTICE 'User sequences synced';
END $$;

-- Sync driver display_id sequences
DO $$
DECLARE
    seq_record RECORD;
    max_seq INTEGER;
    tenant_code VARCHAR(10);
BEGIN
    RAISE NOTICE 'Syncing driver display_id sequences...';
    
    FOR seq_record IN
        SELECT 
            SUBSTRING(display_id FROM '^DRV-([A-Z]{2,5})') as tenant_code_val,
            MAX(CAST(SUBSTRING(display_id FROM '-([0-9]{3})$') AS INTEGER)) as max_seq
        FROM drivers
        WHERE display_id IS NOT NULL
          AND display_id ~ '^DRV-[A-Z]{2,5}-[0-9]{3}$'
        GROUP BY SUBSTRING(display_id FROM '^DRV-([A-Z]{2,5})')
    LOOP
        tenant_code := seq_record.tenant_code_val;
        max_seq := seq_record.max_seq;
        
        INSERT INTO id_sequences (entity_type, program_code, date_key, last_value)
        VALUES ('driver_display_id', tenant_code, NULL, max_seq)
        ON CONFLICT (entity_type, program_code, date_key)
        DO UPDATE SET 
            last_value = GREATEST(id_sequences.last_value, max_seq),
            updated_at = NOW();
    END LOOP;
    
    RAISE NOTICE 'Driver sequences synced';
END $$;

-- Sync vehicle display_id sequences
DO $$
DECLARE
    seq_record RECORD;
    max_seq INTEGER;
    sequence_key VARCHAR(20);
BEGIN
    RAISE NOTICE 'Syncing vehicle display_id sequences...';
    
    FOR seq_record IN
        SELECT 
            SUBSTRING(display_id FROM '^([A-Z]{2,5}-[A-Z]{3})') as tenant_type_prefix,
            MAX(CAST(SUBSTRING(display_id FROM '-([0-9]{3})$') AS INTEGER)) as max_seq
        FROM vehicles
        WHERE display_id IS NOT NULL
          AND display_id ~ '^[A-Z]{2,5}-[A-Z]{3}-[0-9]{3}$'
        GROUP BY SUBSTRING(display_id FROM '^([A-Z]{2,5}-[A-Z]{3})')
    LOOP
        sequence_key := seq_record.tenant_type_prefix;
        max_seq := seq_record.max_seq;
        
        INSERT INTO id_sequences (entity_type, program_code, date_key, last_value)
        VALUES ('vehicle_display_id', sequence_key, NULL, max_seq)
        ON CONFLICT (entity_type, program_code, date_key)
        DO UPDATE SET 
            last_value = GREATEST(id_sequences.last_value, max_seq),
            updated_at = NOW();
    END LOOP;
    
    RAISE NOTICE 'Vehicle sequences synced';
END $$;

-- ============================================================================
-- PHASE 5: BACKFILL EXISTING RECORDS (Idempotent & Safe)
-- ============================================================================

-- Backfill users (in batches with error handling)
DO $$
DECLARE
    user_record RECORD;
    batch_count INTEGER := 0;
    total_updated INTEGER := 0;
    error_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting user display_id backfill...';
    
    FOR user_record IN 
        SELECT user_id FROM users WHERE display_id IS NULL
        ORDER BY created_at
    LOOP
        BEGIN
            UPDATE users 
            SET display_id = generate_user_display_id(user_record.user_id)
            WHERE user_id = user_record.user_id;
            
            total_updated := total_updated + 1;
            batch_count := batch_count + 1;
            
            -- Log progress every 100 records
            IF batch_count >= 100 THEN
                RAISE NOTICE 'Backfilled % users...', total_updated;
                batch_count := 0;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            RAISE WARNING 'Failed to generate display_id for user %: %', 
                user_record.user_id, SQLERRM;
            -- Continue with next record
        END;
    END LOOP;
    
    RAISE NOTICE 'User backfill complete: % updated, % errors', total_updated, error_count;
END $$;

-- Backfill drivers
DO $$
DECLARE
    driver_record RECORD;
    batch_count INTEGER := 0;
    total_updated INTEGER := 0;
    error_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting driver display_id backfill...';
    
    FOR driver_record IN 
        SELECT id FROM drivers WHERE display_id IS NULL
        ORDER BY created_at
    LOOP
        BEGIN
            UPDATE drivers
            SET display_id = generate_driver_display_id(driver_record.id)
            WHERE id = driver_record.id;
            
            total_updated := total_updated + 1;
            batch_count := batch_count + 1;
            
            IF batch_count >= 100 THEN
                RAISE NOTICE 'Backfilled % drivers...', total_updated;
                batch_count := 0;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            RAISE WARNING 'Failed to generate display_id for driver %: %', 
                driver_record.id, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Driver backfill complete: % updated, % errors', total_updated, error_count;
END $$;

-- Backfill vehicles
DO $$
DECLARE
    vehicle_record RECORD;
    batch_count INTEGER := 0;
    total_updated INTEGER := 0;
    error_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting vehicle display_id backfill...';
    
    FOR vehicle_record IN 
        SELECT id FROM vehicles WHERE display_id IS NULL
        ORDER BY created_at
    LOOP
        BEGIN
            UPDATE vehicles
            SET display_id = generate_vehicle_display_id(vehicle_record.id)
            WHERE id = vehicle_record.id;
            
            total_updated := total_updated + 1;
            batch_count := batch_count + 1;
            
            IF batch_count >= 100 THEN
                RAISE NOTICE 'Backfilled % vehicles...', total_updated;
                batch_count := 0;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            RAISE WARNING 'Failed to generate display_id for vehicle %: %', 
                vehicle_record.id, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Vehicle backfill complete: % updated, % errors', total_updated, error_count;
END $$;

-- ============================================================================
-- PHASE 6: DETECT AND FIX DUPLICATES (Before Adding Constraints)
-- ============================================================================

-- Diagnostic: Report duplicate user display_ids
DO $$
DECLARE
    dup_record RECORD;
    dup_count INTEGER := 0;
BEGIN
    RAISE NOTICE '=== DIAGNOSTIC: Checking for duplicate user display_ids ===';
    
    FOR dup_record IN 
        SELECT display_id, COUNT(*) as cnt, array_agg(user_id ORDER BY created_at) as user_ids
        FROM users
        WHERE display_id IS NOT NULL
        GROUP BY display_id
        HAVING COUNT(*) > 1
        ORDER BY cnt DESC
    LOOP
        dup_count := dup_count + 1;
        RAISE NOTICE 'Duplicate found: display_id=%, count=%, user_ids=%', 
            dup_record.display_id, dup_record.cnt, dup_record.user_ids;
    END LOOP;
    
    IF dup_count = 0 THEN
        RAISE NOTICE 'No duplicate user display_ids found';
    ELSE
        RAISE NOTICE 'Total duplicate groups: %', dup_count;
    END IF;
END $$;

-- Fix duplicate user display_ids by clearing all duplicates and regenerating
DO $$
DECLARE
    dup_record RECORD;
    user_id_to_fix VARCHAR(50);
    fixed_count INTEGER := 0;
    total_duplicates INTEGER := 0;
    user_ids_to_clear VARCHAR(50)[];
BEGIN
    RAISE NOTICE '=== FIXING: Duplicate user display_ids ===';
    
    -- First, collect all user_ids that need to be regenerated (all but first in each duplicate group)
    user_ids_to_clear := ARRAY[]::VARCHAR(50)[];
    
    FOR dup_record IN 
        SELECT display_id, array_agg(user_id ORDER BY created_at) as user_ids
        FROM users
        WHERE display_id IS NOT NULL
        GROUP BY display_id
        HAVING COUNT(*) > 1
    LOOP
        -- Add all but the first user_id to the array (keep first, regenerate others)
        FOR i IN 2..array_length(dup_record.user_ids, 1) LOOP
            user_ids_to_clear := array_append(user_ids_to_clear, dup_record.user_ids[i]);
            total_duplicates := total_duplicates + 1;
        END LOOP;
    END LOOP;
    
    IF array_length(user_ids_to_clear, 1) IS NULL THEN
        RAISE NOTICE 'No duplicate user display_ids found';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found % duplicate user display_ids to fix', total_duplicates;
    
    -- Clear all duplicate display_ids at once
    UPDATE users 
    SET display_id = NULL
    WHERE user_id = ANY(user_ids_to_clear);
    
    RAISE NOTICE 'Cleared % duplicate display_ids', total_duplicates;
    
    -- Now regenerate them one by one in order (this ensures sequence increments properly)
    -- Check for conflicts and retry if needed
    FOREACH user_id_to_fix IN ARRAY user_ids_to_clear
    LOOP
        DECLARE
            new_display_id VARCHAR(20);
            conflict_exists BOOLEAN;
            retry_count INTEGER := 0;
            max_retries INTEGER := 10;
            sequence_key VARCHAR(20);
        BEGIN
            LOOP
                -- Generate new display_id
                new_display_id := generate_user_display_id(user_id_to_fix);
                
                -- Check if this display_id already exists (excluding the current user)
                SELECT EXISTS(
                    SELECT 1 FROM users 
                    WHERE display_id = new_display_id 
                      AND user_id != user_id_to_fix
                ) INTO conflict_exists;
                
                -- If no conflict, use it
                EXIT WHEN NOT conflict_exists;
                
                -- If conflict, manually increment sequence and retry
                retry_count := retry_count + 1;
                IF retry_count > max_retries THEN
                    RAISE EXCEPTION 'Failed to generate unique display_id for user % after % retries', 
                        user_id_to_fix, max_retries;
                END IF;
                
                -- Extract tenant-role prefix from the display_id to find the sequence
                sequence_key := SUBSTRING(new_display_id FROM '^([A-Z]{2,5}-[A-Z]{3})');
                
                -- Manually increment the sequence to skip the conflicting value
                UPDATE id_sequences
                SET last_value = last_value + 1,
                    updated_at = NOW()
                WHERE entity_type = 'user_display_id'
                  AND program_code = sequence_key
                  AND date_key IS NULL;
            END LOOP;
            
            -- Update the user with the new display_id
            UPDATE users 
            SET display_id = new_display_id
            WHERE user_id = user_id_to_fix;
            
            fixed_count := fixed_count + 1;
            
            IF fixed_count % 10 = 0 THEN
                RAISE NOTICE 'Regenerated %/% display_ids...', fixed_count, total_duplicates;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to regenerate display_id for user %: %', 
                user_id_to_fix, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Fixed % duplicate user display_ids', fixed_count;
    
    -- Final check: verify no duplicates remain - if they do, run another iteration
    DECLARE
        still_has_duplicates BOOLEAN;
        iteration INTEGER := 0;
        max_iterations INTEGER := 5;
        second_pass_user_ids VARCHAR(50)[];
        second_pass_user_id VARCHAR(50);
    BEGIN
        LOOP
            iteration := iteration + 1;
            
            -- Check if duplicates still exist
            SELECT EXISTS (
                SELECT 1 FROM users
                WHERE display_id IS NOT NULL
                GROUP BY display_id
                HAVING COUNT(*) > 1
            ) INTO still_has_duplicates;
            
            EXIT WHEN NOT still_has_duplicates OR iteration > max_iterations;
            
            RAISE NOTICE 'Iteration %: Duplicates still found, running another fix pass...', iteration;
            
            -- Collect remaining duplicates
            second_pass_user_ids := ARRAY[]::VARCHAR(50)[];
            
            FOR dup_record IN 
                SELECT display_id, array_agg(user_id ORDER BY created_at) as user_ids
                FROM users
                WHERE display_id IS NOT NULL
                GROUP BY display_id
                HAVING COUNT(*) > 1
            LOOP
                FOR i IN 2..array_length(dup_record.user_ids, 1) LOOP
                    second_pass_user_ids := array_append(second_pass_user_ids, dup_record.user_ids[i]);
                END LOOP;
            END LOOP;
            
            IF array_length(second_pass_user_ids, 1) IS NULL THEN
                EXIT;
            END IF;
            
            -- Clear and regenerate
            UPDATE users 
            SET display_id = NULL
            WHERE user_id = ANY(second_pass_user_ids);
            
            FOREACH second_pass_user_id IN ARRAY second_pass_user_ids
            LOOP
                DECLARE
                    new_display_id VARCHAR(20);
                    conflict_exists BOOLEAN;
                    retry_count INTEGER := 0;
                    max_retries INTEGER := 20;
                    sequence_key VARCHAR(20);
                BEGIN
                    LOOP
                        new_display_id := generate_user_display_id(second_pass_user_id);
                        
                        SELECT EXISTS(
                            SELECT 1 FROM users 
                            WHERE display_id = new_display_id 
                              AND user_id != second_pass_user_id
                        ) INTO conflict_exists;
                        
                        EXIT WHEN NOT conflict_exists;
                        
                        retry_count := retry_count + 1;
                        IF retry_count > max_retries THEN
                            RAISE EXCEPTION 'Failed to generate unique display_id for user % after % retries', 
                                second_pass_user_id, max_retries;
                        END IF;
                        
                        sequence_key := SUBSTRING(new_display_id FROM '^([A-Z]{2,5}-[A-Z]{3})');
                        
                        UPDATE id_sequences
                        SET last_value = last_value + 1,
                            updated_at = NOW()
                        WHERE entity_type = 'user_display_id'
                          AND program_code = sequence_key
                          AND date_key IS NULL;
                    END LOOP;
                    
                    UPDATE users 
                    SET display_id = new_display_id
                    WHERE user_id = second_pass_user_id;
                EXCEPTION WHEN OTHERS THEN
                    RAISE WARNING 'Failed to regenerate display_id for user %: %', 
                        second_pass_user_id, SQLERRM;
                END;
            END LOOP;
        END LOOP;
        
        -- Final verification
        IF EXISTS (
            SELECT 1 FROM users
            WHERE display_id IS NOT NULL
            GROUP BY display_id
            HAVING COUNT(*) > 1
        ) THEN
            -- List the duplicates for debugging
            FOR dup_record IN 
                SELECT display_id, COUNT(*) as count, array_agg(user_id ORDER BY created_at) as user_ids
                FROM users
                WHERE display_id IS NOT NULL
                GROUP BY display_id
                HAVING COUNT(*) > 1
                LIMIT 10
            LOOP
                RAISE WARNING 'Duplicate display_id % found with % occurrences. User IDs: %', 
                    dup_record.display_id, dup_record.count, dup_record.user_ids;
            END LOOP;
            
            RAISE EXCEPTION 'Duplicate user display_ids still exist after % fix iterations. Migration cannot continue.', iteration;
        ELSE
            RAISE NOTICE 'All duplicate user display_ids resolved successfully after % iterations', iteration;
        END IF;
    END;
END $$;

-- Fix duplicate driver display_ids
DO $$
DECLARE
    dup_record RECORD;
    driver_id_to_fix VARCHAR(50);
    fixed_count INTEGER := 0;
    total_duplicates INTEGER := 0;
    driver_ids_to_clear VARCHAR(50)[];
BEGIN
    RAISE NOTICE 'Checking for duplicate driver display_ids...';
    
    driver_ids_to_clear := ARRAY[]::VARCHAR(50)[];
    
    FOR dup_record IN 
        SELECT display_id, array_agg(id ORDER BY created_at) as driver_ids
        FROM drivers
        WHERE display_id IS NOT NULL
        GROUP BY display_id
        HAVING COUNT(*) > 1
    LOOP
        FOR i IN 2..array_length(dup_record.driver_ids, 1) LOOP
            driver_ids_to_clear := array_append(driver_ids_to_clear, dup_record.driver_ids[i]);
            total_duplicates := total_duplicates + 1;
        END LOOP;
    END LOOP;
    
    IF array_length(driver_ids_to_clear, 1) IS NULL THEN
        RAISE NOTICE 'No duplicate driver display_ids found';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found % duplicate driver display_ids to fix', total_duplicates;
    
    UPDATE drivers 
    SET display_id = NULL
    WHERE id = ANY(driver_ids_to_clear);
    
    RAISE NOTICE 'Cleared % duplicate display_ids', total_duplicates;
    
    FOREACH driver_id_to_fix IN ARRAY driver_ids_to_clear
    LOOP
        DECLARE
            new_display_id VARCHAR(20);
            conflict_exists BOOLEAN;
            retry_count INTEGER := 0;
            max_retries INTEGER := 10;
            tenant_code VARCHAR(10);
        BEGIN
            LOOP
                new_display_id := generate_driver_display_id(driver_id_to_fix);
                
                SELECT EXISTS(
                    SELECT 1 FROM drivers 
                    WHERE display_id = new_display_id 
                      AND id != driver_id_to_fix
                ) INTO conflict_exists;
                
                EXIT WHEN NOT conflict_exists;
                
                retry_count := retry_count + 1;
                IF retry_count > max_retries THEN
                    RAISE EXCEPTION 'Failed to generate unique display_id for driver % after % retries', 
                        driver_id_to_fix, max_retries;
                END IF;
                
                tenant_code := SUBSTRING(new_display_id FROM '^DRV-([A-Z]{2,5})');
                
                UPDATE id_sequences
                SET last_value = last_value + 1,
                    updated_at = NOW()
                WHERE entity_type = 'driver_display_id'
                  AND program_code = tenant_code
                  AND date_key IS NULL;
            END LOOP;
            
            UPDATE drivers 
            SET display_id = new_display_id
            WHERE id = driver_id_to_fix;
            
            fixed_count := fixed_count + 1;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to regenerate display_id for driver %: %', 
                driver_id_to_fix, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Fixed % duplicate driver display_ids', fixed_count;
    
    IF EXISTS (
        SELECT 1 FROM drivers
        WHERE display_id IS NOT NULL
        GROUP BY display_id
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Duplicate driver display_ids still exist after fix attempt.';
    END IF;
END $$;

-- Diagnostic: Report duplicate vehicle display_ids
DO $$
DECLARE
    dup_record RECORD;
    dup_count INTEGER := 0;
BEGIN
    RAISE NOTICE '=== DIAGNOSTIC: Checking for duplicate vehicle display_ids ===';
    
    FOR dup_record IN 
        SELECT display_id, COUNT(*) as cnt, array_agg(id ORDER BY created_at) as vehicle_ids
        FROM vehicles
        WHERE display_id IS NOT NULL
        GROUP BY display_id
        HAVING COUNT(*) > 1
        ORDER BY cnt DESC
    LOOP
        dup_count := dup_count + 1;
        RAISE NOTICE 'Duplicate found: display_id=%, count=%, vehicle_ids=%', 
            dup_record.display_id, dup_record.cnt, dup_record.vehicle_ids;
    END LOOP;
    
    IF dup_count = 0 THEN
        RAISE NOTICE 'No duplicate vehicle display_ids found';
    ELSE
        RAISE NOTICE 'Total duplicate groups: %', dup_count;
    END IF;
END $$;

-- Fix duplicate vehicle display_ids
DO $$
DECLARE
    dup_record RECORD;
    vehicle_id_to_fix VARCHAR(50);
    fixed_count INTEGER := 0;
    total_duplicates INTEGER := 0;
    vehicle_ids_to_clear VARCHAR(50)[];
BEGIN
    RAISE NOTICE '=== FIXING: Duplicate vehicle display_ids ===';
    
    vehicle_ids_to_clear := ARRAY[]::VARCHAR(50)[];
    
    FOR dup_record IN 
        SELECT display_id, array_agg(id ORDER BY created_at) as vehicle_ids
        FROM vehicles
        WHERE display_id IS NOT NULL
        GROUP BY display_id
        HAVING COUNT(*) > 1
    LOOP
        FOR i IN 2..array_length(dup_record.vehicle_ids, 1) LOOP
            vehicle_ids_to_clear := array_append(vehicle_ids_to_clear, dup_record.vehicle_ids[i]);
            total_duplicates := total_duplicates + 1;
        END LOOP;
    END LOOP;
    
    IF array_length(vehicle_ids_to_clear, 1) IS NULL THEN
        RAISE NOTICE 'No duplicate vehicle display_ids found';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found % duplicate vehicle display_ids to fix', total_duplicates;
    
    UPDATE vehicles 
    SET display_id = NULL
    WHERE id = ANY(vehicle_ids_to_clear);
    
    RAISE NOTICE 'Cleared % duplicate display_ids', total_duplicates;
    
    FOREACH vehicle_id_to_fix IN ARRAY vehicle_ids_to_clear
    LOOP
        DECLARE
            new_display_id VARCHAR(20);
            conflict_exists BOOLEAN;
            retry_count INTEGER := 0;
            max_retries INTEGER := 10;
            sequence_key VARCHAR(20);
        BEGIN
            LOOP
                new_display_id := generate_vehicle_display_id(vehicle_id_to_fix);
                
                SELECT EXISTS(
                    SELECT 1 FROM vehicles 
                    WHERE display_id = new_display_id 
                      AND id != vehicle_id_to_fix
                ) INTO conflict_exists;
                
                EXIT WHEN NOT conflict_exists;
                
                retry_count := retry_count + 1;
                IF retry_count > max_retries THEN
                    RAISE EXCEPTION 'Failed to generate unique display_id for vehicle % after % retries', 
                        vehicle_id_to_fix, max_retries;
                END IF;
                
                sequence_key := SUBSTRING(new_display_id FROM '^([A-Z]{2,5}-[A-Z]{3})');
                
                UPDATE id_sequences
                SET last_value = last_value + 1,
                    updated_at = NOW()
                WHERE entity_type = 'vehicle_display_id'
                  AND program_code = sequence_key
                  AND date_key IS NULL;
            END LOOP;
            
            UPDATE vehicles 
            SET display_id = new_display_id
            WHERE id = vehicle_id_to_fix;
            
            fixed_count := fixed_count + 1;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to regenerate display_id for vehicle %: %', 
                vehicle_id_to_fix, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Fixed % duplicate vehicle display_ids', fixed_count;
    
    IF EXISTS (
        SELECT 1 FROM vehicles
        WHERE display_id IS NOT NULL
        GROUP BY display_id
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Duplicate vehicle display_ids still exist after fix attempt.';
    END IF;
END $$;

-- ============================================================================
-- PHASE 7: FINAL BACKFILL (Ensure ALL records have display_id)
-- ============================================================================

-- Final backfill for users (catch any that might have been missed)
DO $$
DECLARE
    user_record RECORD;
    total_updated INTEGER := 0;
    error_count INTEGER := 0;
    new_display_id VARCHAR(20);
    conflict_exists BOOLEAN;
    retry_count INTEGER := 0;
    max_retries INTEGER := 20;
    sequence_key VARCHAR(20);
BEGIN
    RAISE NOTICE 'Final backfill: Ensuring all users have display_id...';
    
    FOR user_record IN 
        SELECT user_id FROM users WHERE display_id IS NULL
        ORDER BY created_at
    LOOP
        BEGIN
            retry_count := 0;
            
            LOOP
                new_display_id := generate_user_display_id(user_record.user_id);
                
                -- Check for conflicts
                SELECT EXISTS(
                    SELECT 1 FROM users 
                    WHERE display_id = new_display_id 
                      AND user_id != user_record.user_id
                ) INTO conflict_exists;
                
                EXIT WHEN NOT conflict_exists;
                
                retry_count := retry_count + 1;
                IF retry_count > max_retries THEN
                    RAISE EXCEPTION 'Failed to generate unique display_id for user % after % retries', 
                        user_record.user_id, max_retries;
                END IF;
                
                sequence_key := SUBSTRING(new_display_id FROM '^([A-Z]{2,5}-[A-Z]{3})');
                
                UPDATE id_sequences
                SET last_value = last_value + 1,
                    updated_at = NOW()
                WHERE entity_type = 'user_display_id'
                  AND program_code = sequence_key
                  AND date_key IS NULL;
            END LOOP;
            
            UPDATE users
            SET display_id = new_display_id
            WHERE user_id = user_record.user_id;
            
            total_updated := total_updated + 1;
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            RAISE WARNING 'Failed to generate display_id for user %: %', 
                user_record.user_id, SQLERRM;
        END;
    END LOOP;
    
    IF total_updated > 0 THEN
        RAISE NOTICE 'Final user backfill: % updated, % errors', total_updated, error_count;
    ELSE
        RAISE NOTICE 'All users already have display_id';
    END IF;
END $$;

-- Fallback: Handle any remaining NULLs with diagnostic information
DO $$
DECLARE
    null_count INTEGER;
    null_user RECORD;
    fallback_display_id VARCHAR(20);
    max_fallback_seq INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count FROM users WHERE display_id IS NULL;
    
    IF null_count > 0 THEN
        RAISE WARNING 'Found % users with NULL display_id after backfill. Attempting fallback generation...', null_count;
        
        -- Get max sequence for fallback format
        SELECT COALESCE(MAX(CAST(SUBSTRING(display_id FROM '-([0-9]{3})$') AS INTEGER)), 0) INTO max_fallback_seq
        FROM users 
        WHERE display_id ~ '^HAL-USR-[0-9]{3}$';
        
        -- Try to generate display_ids for remaining NULLs with fallback logic
        FOR null_user IN 
            SELECT user_id, email, user_name, role, corporate_client_id, primary_program_id
            FROM users 
            WHERE display_id IS NULL
            ORDER BY created_at
        LOOP
            BEGIN
                -- Try normal generation first
                fallback_display_id := generate_user_display_id(null_user.user_id);
                
                -- Check for conflicts
                IF EXISTS (
                    SELECT 1 FROM users 
                    WHERE display_id = fallback_display_id 
                      AND user_id != null_user.user_id
                ) THEN
                    -- If conflict, use a fallback format: HAL-USR-XXX
                    max_fallback_seq := max_fallback_seq + 1;
                    fallback_display_id := 'HAL-USR-' || LPAD(max_fallback_seq::TEXT, 3, '0');
                END IF;
                
                UPDATE users
                SET display_id = fallback_display_id
                WHERE user_id = null_user.user_id;
                
                RAISE NOTICE 'Generated fallback display_id % for user %', fallback_display_id, null_user.user_id;
            EXCEPTION WHEN OTHERS THEN
                RAISE WARNING 'Failed to generate fallback display_id for user % (email: %): %', 
                    null_user.user_id, null_user.email, SQLERRM;
            END;
        END LOOP;
        
        -- Check again
        SELECT COUNT(*) INTO null_count FROM users WHERE display_id IS NULL;
        
        IF null_count > 0 THEN
            RAISE WARNING 'Still have % users with NULL display_id. Listing them:', null_count;
            
            FOR null_user IN 
                SELECT user_id, email, user_name, role, corporate_client_id, primary_program_id
                FROM users 
                WHERE display_id IS NULL
                LIMIT 10
            LOOP
                RAISE WARNING 'User: id=%, email=%, name=%, role=%, corp_id=%, prog_id=%', 
                    null_user.user_id, null_user.email, null_user.user_name, 
                    null_user.role, null_user.corporate_client_id, null_user.primary_program_id;
            END LOOP;
            
            RAISE EXCEPTION 'Cannot proceed: % users still have NULL display_id after all attempts. Please review these users manually.', null_count;
        ELSE
            RAISE NOTICE '✓ All users now have display_id after fallback generation';
        END IF;
    ELSE
        RAISE NOTICE '✓ All users have display_id';
    END IF;
END $$;

-- Final backfill for drivers
DO $$
DECLARE
    driver_record RECORD;
    total_updated INTEGER := 0;
    error_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Final backfill: Ensuring all drivers have display_id...';
    
    FOR driver_record IN 
        SELECT id FROM drivers WHERE display_id IS NULL
        ORDER BY created_at
    LOOP
        BEGIN
            UPDATE drivers
            SET display_id = generate_driver_display_id(driver_record.id)
            WHERE id = driver_record.id;
            
            total_updated := total_updated + 1;
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            RAISE WARNING 'Failed to generate display_id for driver %: %', 
                driver_record.id, SQLERRM;
        END;
    END LOOP;
    
    IF total_updated > 0 THEN
        RAISE NOTICE 'Final driver backfill: % updated, % errors', total_updated, error_count;
    ELSE
        RAISE NOTICE 'All drivers already have display_id';
    END IF;
    
    IF EXISTS (SELECT 1 FROM drivers WHERE display_id IS NULL) THEN
        RAISE EXCEPTION 'Some drivers still have NULL display_id after final backfill. Cannot proceed.';
    END IF;
END $$;

-- Final backfill for vehicles
DO $$
DECLARE
    vehicle_record RECORD;
    total_updated INTEGER := 0;
    error_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Final backfill: Ensuring all vehicles have display_id...';
    
    FOR vehicle_record IN 
        SELECT id FROM vehicles WHERE display_id IS NULL
        ORDER BY created_at
    LOOP
        BEGIN
            UPDATE vehicles
            SET display_id = generate_vehicle_display_id(vehicle_record.id)
            WHERE id = vehicle_record.id;
            
            total_updated := total_updated + 1;
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            RAISE WARNING 'Failed to generate display_id for vehicle %: %', 
                vehicle_record.id, SQLERRM;
        END;
    END LOOP;
    
    IF total_updated > 0 THEN
        RAISE NOTICE 'Final vehicle backfill: % updated, % errors', total_updated, error_count;
    ELSE
        RAISE NOTICE 'All vehicles already have display_id';
    END IF;
    
    IF EXISTS (SELECT 1 FROM vehicles WHERE display_id IS NULL) THEN
        RAISE EXCEPTION 'Some vehicles still have NULL display_id after final backfill. Cannot proceed.';
    END IF;
END $$;

-- ============================================================================
-- PHASE 8: ADD CONSTRAINTS (After Final Backfill and Duplicate Fix)
-- ============================================================================

-- Add UNIQUE constraints (with existence check)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'uq_users_display_id'
        AND conrelid = 'users'::regclass
    ) THEN
        ALTER TABLE users 
            ADD CONSTRAINT uq_users_display_id UNIQUE (display_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'uq_drivers_display_id'
        AND conrelid = 'drivers'::regclass
    ) THEN
        ALTER TABLE drivers
            ADD CONSTRAINT uq_drivers_display_id UNIQUE (display_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'uq_vehicles_display_id'
        AND conrelid = 'vehicles'::regclass
    ) THEN
        ALTER TABLE vehicles
            ADD CONSTRAINT uq_vehicles_display_id UNIQUE (display_id);
    END IF;
END $$;

-- Add NOT NULL constraints (only after backfill is complete and verified)
DO $$
DECLARE
    null_count INTEGER;
BEGIN
    -- Verify no NULLs in users
    SELECT COUNT(*) INTO null_count FROM users WHERE display_id IS NULL;
    IF null_count > 0 THEN
        RAISE EXCEPTION 'Cannot add NOT NULL constraint: % users still have NULL display_id. Run final backfill first.', null_count;
    END IF;
    
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_display_id_not_null'
        AND conrelid = 'users'::regclass
    ) THEN
        ALTER TABLE users 
            ALTER COLUMN display_id SET NOT NULL;
        RAISE NOTICE 'Added NOT NULL constraint to users.display_id';
    ELSE
        RAISE NOTICE 'NOT NULL constraint on users.display_id already exists';
    END IF;
END $$;

DO $$
DECLARE
    null_count INTEGER;
BEGIN
    -- Verify no NULLs in drivers
    SELECT COUNT(*) INTO null_count FROM drivers WHERE display_id IS NULL;
    IF null_count > 0 THEN
        RAISE EXCEPTION 'Cannot add NOT NULL constraint: % drivers still have NULL display_id. Run final backfill first.', null_count;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'drivers_display_id_not_null'
        AND conrelid = 'drivers'::regclass
    ) THEN
        ALTER TABLE drivers
            ALTER COLUMN display_id SET NOT NULL;
        RAISE NOTICE 'Added NOT NULL constraint to drivers.display_id';
    ELSE
        RAISE NOTICE 'NOT NULL constraint on drivers.display_id already exists';
    END IF;
END $$;

DO $$
DECLARE
    null_count INTEGER;
BEGIN
    -- Verify no NULLs in vehicles
    SELECT COUNT(*) INTO null_count FROM vehicles WHERE display_id IS NULL;
    IF null_count > 0 THEN
        RAISE EXCEPTION 'Cannot add NOT NULL constraint: % vehicles still have NULL display_id. Run final backfill first.', null_count;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'vehicles_display_id_not_null'
        AND conrelid = 'vehicles'::regclass
    ) THEN
        ALTER TABLE vehicles
            ALTER COLUMN display_id SET NOT NULL;
        RAISE NOTICE 'Added NOT NULL constraint to vehicles.display_id';
    ELSE
        RAISE NOTICE 'NOT NULL constraint on vehicles.display_id already exists';
    END IF;
END $$;

-- Add format CHECK constraints (with existence check)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chk_users_display_id_format'
        AND conrelid = 'users'::regclass
    ) THEN
        ALTER TABLE users 
            ADD CONSTRAINT chk_users_display_id_format 
            CHECK (display_id ~ '^[A-Z]{2,5}-[A-Z]{3}-[0-9]{3}$');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chk_drivers_display_id_format'
        AND conrelid = 'drivers'::regclass
    ) THEN
        ALTER TABLE drivers 
            ADD CONSTRAINT chk_drivers_display_id_format 
            CHECK (display_id ~ '^DRV-[A-Z]{2,5}-[0-9]{3}$');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chk_vehicles_display_id_format'
        AND conrelid = 'vehicles'::regclass
    ) THEN
        ALTER TABLE vehicles 
            ADD CONSTRAINT chk_vehicles_display_id_format 
            CHECK (display_id ~ '^[A-Z]{2,5}-[A-Z]{3}-[0-9]{3}$');
    END IF;
END $$;

-- ============================================================================
-- PHASE 7: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_display_id ON users(display_id);
CREATE INDEX IF NOT EXISTS idx_drivers_display_id ON drivers(display_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_display_id ON vehicles(display_id);

-- ============================================================================
-- PHASE 8: AUTOMATION TRIGGERS (For New Records)
-- ============================================================================

-- Trigger function for users
CREATE OR REPLACE FUNCTION set_user_display_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.display_id IS NULL THEN
        NEW.display_id := generate_user_display_id(NEW.user_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_display_id
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_user_display_id();

-- Trigger function for drivers
CREATE OR REPLACE FUNCTION set_driver_display_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.display_id IS NULL THEN
        NEW.display_id := generate_driver_display_id(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_drivers_display_id
    BEFORE INSERT ON drivers
    FOR EACH ROW
    EXECUTE FUNCTION set_driver_display_id();

-- Trigger function for vehicles
CREATE OR REPLACE FUNCTION set_vehicle_display_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.display_id IS NULL THEN
        NEW.display_id := generate_vehicle_display_id(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_vehicles_display_id
    BEFORE INSERT ON vehicles
    FOR EACH ROW
    EXECUTE FUNCTION set_vehicle_display_id();

-- ============================================================================
-- VERIFICATION QUERIES (Run these to verify the migration)
-- ============================================================================

-- Check for any NULL display_ids (should return 0 after backfill)
-- SELECT COUNT(*) as null_users FROM users WHERE display_id IS NULL;
-- SELECT COUNT(*) as null_drivers FROM drivers WHERE display_id IS NULL;
-- SELECT COUNT(*) as null_vehicles FROM vehicles WHERE display_id IS NULL;

-- Sample display_ids by type
-- SELECT display_id, role, corporate_client_id FROM users ORDER BY created_at LIMIT 10;
-- SELECT display_id, program_id FROM drivers ORDER BY created_at LIMIT 10;
-- SELECT display_id, vehicle_type, program_id FROM vehicles ORDER BY created_at LIMIT 10;

-- ============================================================================
-- ROLLBACK SCRIPT (If needed)
-- ============================================================================
-- To rollback this migration:
-- 
-- DROP TRIGGER IF EXISTS trg_vehicles_display_id ON vehicles;
-- DROP TRIGGER IF EXISTS trg_drivers_display_id ON drivers;
-- DROP TRIGGER IF EXISTS trg_users_display_id ON users;
-- 
-- DROP FUNCTION IF EXISTS set_vehicle_display_id();
-- DROP FUNCTION IF EXISTS set_driver_display_id();
-- DROP FUNCTION IF EXISTS set_user_display_id();
-- 
-- ALTER TABLE vehicles DROP COLUMN IF EXISTS display_id;
-- ALTER TABLE drivers DROP COLUMN IF EXISTS display_id;
-- ALTER TABLE users DROP COLUMN IF EXISTS display_id;
-- 
-- DROP FUNCTION IF EXISTS generate_vehicle_display_id(VARCHAR);
-- DROP FUNCTION IF EXISTS generate_driver_display_id(VARCHAR);
-- DROP FUNCTION IF EXISTS generate_user_display_id(VARCHAR);
-- 
-- DROP FUNCTION IF EXISTS get_tenant_code_for_vehicle(VARCHAR);
-- DROP FUNCTION IF EXISTS get_tenant_code_for_driver(VARCHAR);
-- DROP FUNCTION IF EXISTS get_tenant_code_for_user(VARCHAR);
-- 
-- DELETE FROM id_sequences WHERE entity_type IN ('user_display_id', 'driver_display_id', 'vehicle_display_id');

