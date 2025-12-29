-- ============================================================================
-- MANUAL DUPLICATE FIX SCRIPT
-- Run this BEFORE running the main migration if duplicates exist
-- Or run this if the main migration fails due to duplicates
-- ============================================================================

-- Fix duplicate user display_ids
DO $$
DECLARE
    dup_record RECORD;
    user_id_to_fix VARCHAR(50);
    fixed_count INTEGER := 0;
    total_duplicates INTEGER := 0;
    user_ids_to_clear VARCHAR(50)[];
    still_has_duplicates BOOLEAN;
    iteration INTEGER := 0;
    max_iterations INTEGER := 10;
    new_display_id VARCHAR(20);
    conflict_exists BOOLEAN;
    retry_count INTEGER := 0;
    max_retries INTEGER := 50;
    sequence_key VARCHAR(20);
BEGIN
    RAISE NOTICE '=== FIXING DUPLICATE USER DISPLAY_IDS ===';
    
    LOOP
        iteration := iteration + 1;
        
        -- Check if duplicates exist
        SELECT EXISTS (
            SELECT 1 FROM users
            WHERE display_id IS NOT NULL
            GROUP BY display_id
            HAVING COUNT(*) > 1
        ) INTO still_has_duplicates;
        
        EXIT WHEN NOT still_has_duplicates OR iteration > max_iterations;
        
        RAISE NOTICE 'Iteration %: Checking for duplicates...', iteration;
        
        -- Collect all duplicates
        user_ids_to_clear := ARRAY[]::VARCHAR(50)[];
        total_duplicates := 0;
        
        FOR dup_record IN 
            SELECT display_id, array_agg(user_id ORDER BY created_at) as user_ids
            FROM users
            WHERE display_id IS NOT NULL
            GROUP BY display_id
            HAVING COUNT(*) > 1
        LOOP
            RAISE NOTICE 'Found duplicate: display_id=%, count=%', 
                dup_record.display_id, array_length(dup_record.user_ids, 1);
            
            -- Keep first, regenerate all others
            FOR i IN 2..array_length(dup_record.user_ids, 1) LOOP
                user_ids_to_clear := array_append(user_ids_to_clear, dup_record.user_ids[i]);
                total_duplicates := total_duplicates + 1;
            END LOOP;
        END LOOP;
        
        IF array_length(user_ids_to_clear, 1) IS NULL THEN
            RAISE NOTICE 'No duplicates found in iteration %', iteration;
            EXIT;
        END IF;
        
        RAISE NOTICE 'Clearing % duplicate display_ids...', total_duplicates;
        
        -- Clear all duplicates
        UPDATE users 
        SET display_id = NULL
        WHERE user_id = ANY(user_ids_to_clear);
        
        -- Regenerate with conflict detection
        FOREACH user_id_to_fix IN ARRAY user_ids_to_clear
        LOOP
            retry_count := 0;
            
            LOOP
                -- Generate new display_id
                new_display_id := generate_user_display_id(user_id_to_fix);
                
                -- Check for conflicts
                SELECT EXISTS(
                    SELECT 1 FROM users 
                    WHERE display_id = new_display_id 
                      AND user_id != user_id_to_fix
                ) INTO conflict_exists;
                
                EXIT WHEN NOT conflict_exists;
                
                retry_count := retry_count + 1;
                IF retry_count > max_retries THEN
                    RAISE EXCEPTION 'Failed to generate unique display_id for user % after % retries. Last attempted: %', 
                        user_id_to_fix, max_retries, new_display_id;
                END IF;
                
                -- Increment sequence to skip conflicting value
                sequence_key := SUBSTRING(new_display_id FROM '^([A-Z]{2,5}-[A-Z]{3})');
                
                UPDATE id_sequences
                SET last_value = last_value + 1,
                    updated_at = NOW()
                WHERE entity_type = 'user_display_id'
                  AND program_code = sequence_key
                  AND date_key IS NULL;
            END LOOP;
            
            -- Update user with new display_id
            UPDATE users 
            SET display_id = new_display_id
            WHERE user_id = user_id_to_fix;
            
            fixed_count := fixed_count + 1;
            
            IF fixed_count % 10 = 0 THEN
                RAISE NOTICE 'Fixed %/% display_ids...', fixed_count, total_duplicates;
            END IF;
        END LOOP;
        
        RAISE NOTICE 'Iteration % complete: Fixed % duplicates', iteration, fixed_count;
    END LOOP;
    
    -- Final verification
    IF EXISTS (
        SELECT 1 FROM users
        WHERE display_id IS NOT NULL
        GROUP BY display_id
        HAVING COUNT(*) > 1
    ) THEN
        RAISE WARNING 'Some duplicates may still exist. Listing them:';
        
        FOR dup_record IN 
            SELECT display_id, COUNT(*) as count, array_agg(user_id ORDER BY created_at) as user_ids
            FROM users
            WHERE display_id IS NOT NULL
            GROUP BY display_id
            HAVING COUNT(*) > 1
            LIMIT 20
        LOOP
            RAISE WARNING 'Duplicate: display_id=%, count=%, user_ids=%', 
                dup_record.display_id, dup_record.count, dup_record.user_ids;
        END LOOP;
        
        RAISE EXCEPTION 'Duplicates still exist after % iterations. Please review manually.', iteration;
    ELSE
        RAISE NOTICE '✓ All duplicate user display_ids resolved successfully after % iterations', iteration;
    END IF;
END $$;

-- Fix duplicate driver display_ids
DO $$
DECLARE
    dup_record RECORD;
    driver_id_to_fix VARCHAR(50);
    fixed_count INTEGER := 0;
    driver_ids_to_clear VARCHAR(50)[];
    still_has_duplicates BOOLEAN;
    iteration INTEGER := 0;
    max_iterations INTEGER := 10;
    new_display_id VARCHAR(20);
    conflict_exists BOOLEAN;
    retry_count INTEGER := 0;
    max_retries INTEGER := 50;
    tenant_code VARCHAR(10);
BEGIN
    RAISE NOTICE '=== FIXING DUPLICATE DRIVER DISPLAY_IDS ===';
    
    LOOP
        iteration := iteration + 1;
        
        SELECT EXISTS (
            SELECT 1 FROM drivers
            WHERE display_id IS NOT NULL
            GROUP BY display_id
            HAVING COUNT(*) > 1
        ) INTO still_has_duplicates;
        
        EXIT WHEN NOT still_has_duplicates OR iteration > max_iterations;
        
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
            END LOOP;
        END LOOP;
        
        IF array_length(driver_ids_to_clear, 1) IS NULL THEN
            EXIT;
        END IF;
        
        UPDATE drivers 
        SET display_id = NULL
        WHERE id = ANY(driver_ids_to_clear);
        
        FOREACH driver_id_to_fix IN ARRAY driver_ids_to_clear
        LOOP
            retry_count := 0;
            
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
        END LOOP;
    END LOOP;
    
    IF EXISTS (
        SELECT 1 FROM drivers
        WHERE display_id IS NOT NULL
        GROUP BY display_id
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Driver duplicates still exist after % iterations', iteration;
    ELSE
        RAISE NOTICE '✓ All duplicate driver display_ids resolved';
    END IF;
END $$;

-- Fix duplicate vehicle display_ids
DO $$
DECLARE
    dup_record RECORD;
    vehicle_id_to_fix VARCHAR(50);
    fixed_count INTEGER := 0;
    vehicle_ids_to_clear VARCHAR(50)[];
    still_has_duplicates BOOLEAN;
    iteration INTEGER := 0;
    max_iterations INTEGER := 10;
    new_display_id VARCHAR(20);
    conflict_exists BOOLEAN;
    retry_count INTEGER := 0;
    max_retries INTEGER := 50;
    sequence_key VARCHAR(20);
BEGIN
    RAISE NOTICE '=== FIXING DUPLICATE VEHICLE DISPLAY_IDS ===';
    
    LOOP
        iteration := iteration + 1;
        
        SELECT EXISTS (
            SELECT 1 FROM vehicles
            WHERE display_id IS NOT NULL
            GROUP BY display_id
            HAVING COUNT(*) > 1
        ) INTO still_has_duplicates;
        
        EXIT WHEN NOT still_has_duplicates OR iteration > max_iterations;
        
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
            END LOOP;
        END LOOP;
        
        IF array_length(vehicle_ids_to_clear, 1) IS NULL THEN
            EXIT;
        END IF;
        
        UPDATE vehicles 
        SET display_id = NULL
        WHERE id = ANY(vehicle_ids_to_clear);
        
        FOREACH vehicle_id_to_fix IN ARRAY vehicle_ids_to_clear
        LOOP
            retry_count := 0;
            
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
        END LOOP;
    END LOOP;
    
    IF EXISTS (
        SELECT 1 FROM vehicles
        WHERE display_id IS NOT NULL
        GROUP BY display_id
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Vehicle duplicates still exist after % iterations', iteration;
    ELSE
        RAISE NOTICE '✓ All duplicate vehicle display_ids resolved';
    END IF;
END $$;

DO $$
BEGIN
    RAISE NOTICE '=== DUPLICATE FIX COMPLETE ===';
    RAISE NOTICE 'You can now run the main migration (0063_add_display_id_system.sql)';
END $$;

