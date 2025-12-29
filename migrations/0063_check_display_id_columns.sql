-- ============================================================================
-- DIAGNOSTIC: Check if display_id columns exist
-- Run this first to verify current schema state
-- ============================================================================

-- Return column existence status as a result set
SELECT 
    'users' as table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'display_id'
        ) THEN 'EXISTS' 
        ELSE 'DOES NOT EXIST' 
    END as display_id_column_status;

SELECT 
    'drivers' as table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'drivers' AND column_name = 'display_id'
        ) THEN 'EXISTS' 
        ELSE 'DOES NOT EXIST' 
    END as display_id_column_status;

SELECT 
    'vehicles' as table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'vehicles' AND column_name = 'display_id'
        ) THEN 'EXISTS' 
        ELSE 'DOES NOT EXIST' 
    END as display_id_column_status;

-- Show row counts (always works, doesn't depend on display_id)
SELECT 
    'users' as table_name,
    COUNT(*) as total_rows
FROM users
UNION ALL
SELECT 
    'drivers' as table_name,
    COUNT(*) as total_rows
FROM drivers
UNION ALL
SELECT 
    'vehicles' as table_name,
    COUNT(*) as total_rows
FROM vehicles;

-- Show display_id stats (only if columns exist - using DO block to check first)
DO $$
DECLARE
    users_has_col BOOLEAN;
    drivers_has_col BOOLEAN;
    vehicles_has_col BOOLEAN;
BEGIN
    -- Check if columns exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'display_id'
    ) INTO users_has_col;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'drivers' AND column_name = 'display_id'
    ) INTO drivers_has_col;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vehicles' AND column_name = 'display_id'
    ) INTO vehicles_has_col;
    
    -- Store results in temp table for retrieval
    CREATE TEMP TABLE IF NOT EXISTS display_id_stats (
        table_name TEXT,
        rows_with_display_id INTEGER,
        rows_with_null_display_id INTEGER
    );
    
    DELETE FROM display_id_stats;
    
    IF users_has_col THEN
        INSERT INTO display_id_stats VALUES (
            'users',
            (SELECT COUNT(display_id) FROM users),
            (SELECT COUNT(*) - COUNT(display_id) FROM users)
        );
    END IF;
    
    IF drivers_has_col THEN
        INSERT INTO display_id_stats VALUES (
            'drivers',
            (SELECT COUNT(display_id) FROM drivers),
            (SELECT COUNT(*) - COUNT(display_id) FROM drivers)
        );
    END IF;
    
    IF vehicles_has_col THEN
        INSERT INTO display_id_stats VALUES (
            'vehicles',
            (SELECT COUNT(display_id) FROM vehicles),
            (SELECT COUNT(*) - COUNT(display_id) FROM vehicles)
        );
    END IF;
END $$;

-- Return the stats
SELECT * FROM display_id_stats;

-- Check for duplicates (only if columns exist)
DO $$
DECLARE
    users_has_col BOOLEAN;
    drivers_has_col BOOLEAN;
    vehicles_has_col BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'display_id'
    ) INTO users_has_col;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'drivers' AND column_name = 'display_id'
    ) INTO drivers_has_col;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vehicles' AND column_name = 'display_id'
    ) INTO vehicles_has_col;
    
    CREATE TEMP TABLE IF NOT EXISTS duplicate_counts (
        table_name TEXT,
        duplicate_groups_count TEXT
    );
    
    DELETE FROM duplicate_counts;
    
    IF users_has_col THEN
        INSERT INTO duplicate_counts VALUES (
            'users',
            (SELECT COUNT(*)::TEXT
             FROM (
                 SELECT display_id, COUNT(*) as cnt
                 FROM users
                 WHERE display_id IS NOT NULL
                 GROUP BY display_id
                 HAVING COUNT(*) > 1
             ) dups)
        );
    ELSE
        INSERT INTO duplicate_counts VALUES ('users', 'Column does not exist');
    END IF;
    
    IF drivers_has_col THEN
        INSERT INTO duplicate_counts VALUES (
            'drivers',
            (SELECT COUNT(*)::TEXT
             FROM (
                 SELECT display_id, COUNT(*) as cnt
                 FROM drivers
                 WHERE display_id IS NOT NULL
                 GROUP BY display_id
                 HAVING COUNT(*) > 1
             ) dups)
        );
    ELSE
        INSERT INTO duplicate_counts VALUES ('drivers', 'Column does not exist');
    END IF;
    
    IF vehicles_has_col THEN
        INSERT INTO duplicate_counts VALUES (
            'vehicles',
            (SELECT COUNT(*)::TEXT
             FROM (
                 SELECT display_id, COUNT(*) as cnt
                 FROM vehicles
                 WHERE display_id IS NOT NULL
                 GROUP BY display_id
                 HAVING COUNT(*) > 1
             ) dups)
        );
    ELSE
        INSERT INTO duplicate_counts VALUES ('vehicles', 'Column does not exist');
    END IF;
END $$;

-- Return duplicate counts
SELECT * FROM duplicate_counts;
