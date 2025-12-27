-- Migration: Fix duplicate addresses in database
-- Date: 2025-12-22
-- Purpose: Remove duplicate city/state/zip from addresses like "5335 Newton St, Denver, CO 80221, Denver, CO 80221"

-- Fix addresses in frequent_locations table (uses full_address column)
UPDATE frequent_locations
SET full_address = REGEXP_REPLACE(
  full_address,
  ',\s*Denver,\s*CO\s*80221,\s*Denver,\s*CO\s*80221$',
  ', Denver, CO 80221',
  'g'
)
WHERE full_address LIKE '%Denver, CO 80221, Denver, CO 80221%';

-- Fix addresses in trips table (pickup_address, dropoff_address, and stops array)
UPDATE trips
SET pickup_address = REGEXP_REPLACE(
  pickup_address,
  ',\s*Denver,\s*CO\s*80221,\s*Denver,\s*CO\s*80221$',
  ', Denver, CO 80221',
  'g'
)
WHERE pickup_address LIKE '%Denver, CO 80221, Denver, CO 80221%';

UPDATE trips
SET dropoff_address = REGEXP_REPLACE(
  dropoff_address,
  ',\s*Denver,\s*CO\s*80221,\s*Denver,\s*CO\s*80221$',
  ', Denver, CO 80221',
  'g'
)
WHERE dropoff_address LIKE '%Denver, CO 80221, Denver, CO 80221%';

-- Fix addresses in stops array (JSONB array)
UPDATE trips
SET stops = (
  SELECT jsonb_agg(
    REGEXP_REPLACE(
      stop::text,
      ',\s*Denver,\s*CO\s*80221,\s*Denver,\s*CO\s*80221$',
      ', Denver, CO 80221',
      'g'
    )::text
  )
  FROM jsonb_array_elements_text(stops) AS stop
)
WHERE stops IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements_text(stops) AS stop
    WHERE stop::text LIKE '%Denver, CO 80221, Denver, CO 80221%'
  );

-- Fix addresses in locations table
UPDATE locations
SET address = REGEXP_REPLACE(
  address,
  ',\s*Denver,\s*CO\s*80221,\s*Denver,\s*CO\s*80221$',
  ', Denver, CO 80221',
  'g'
)
WHERE address LIKE '%Denver, CO 80221, Denver, CO 80221%';

-- Fix addresses in clients table
UPDATE clients
SET address = REGEXP_REPLACE(
  address,
  ',\s*Denver,\s*CO\s*80221,\s*Denver,\s*CO\s*80221$',
  ', Denver, CO 80221',
  'g'
)
WHERE address LIKE '%Denver, CO 80221, Denver, CO 80221%';

-- General fix for any address pattern with duplicate city/state/zip
-- This handles cases like "Address, City, State ZIP, City, State ZIP"
UPDATE frequent_locations
SET full_address = REGEXP_REPLACE(
  full_address,
  ',\s*([^,]+),\s*([A-Z]{2})\s*(\d{5}),\s*\1,\s*\2\s*\3$',
  ', \1, \2 \3',
  'g'
)
WHERE full_address ~ ',\s*[^,]+\s*,\s*[A-Z]{2}\s*\d{5},\s*[^,]+\s*,\s*[A-Z]{2}\s*\d{5}$';

UPDATE trips
SET pickup_address = REGEXP_REPLACE(
  pickup_address,
  ',\s*([^,]+),\s*([A-Z]{2})\s*(\d{5}),\s*\1,\s*\2\s*\3$',
  ', \1, \2 \3',
  'g'
)
WHERE pickup_address ~ ',\s*[^,]+\s*,\s*[A-Z]{2}\s*\d{5},\s*[^,]+\s*,\s*[A-Z]{2}\s*\d{5}$';

UPDATE trips
SET dropoff_address = REGEXP_REPLACE(
  dropoff_address,
  ',\s*([^,]+),\s*([A-Z]{2})\s*(\d{5}),\s*\1,\s*\2\s*\3$',
  ', \1, \2 \3',
  'g'
)
WHERE dropoff_address ~ ',\s*[^,]+\s*,\s*[A-Z]{2}\s*\d{5},\s*[^,]+\s*,\s*[A-Z]{2}\s*\d{5}$';

UPDATE locations
SET address = REGEXP_REPLACE(
  address,
  ',\s*([^,]+),\s*([A-Z]{2})\s*(\d{5}),\s*\1,\s*\2\s*\3$',
  ', \1, \2 \3',
  'g'
)
WHERE address ~ ',\s*[^,]+\s*,\s*[A-Z]{2}\s*\d{5},\s*[^,]+\s*,\s*[A-Z]{2}\s*\d{5}$';

UPDATE clients
SET address = REGEXP_REPLACE(
  address,
  ',\s*([^,]+),\s*([A-Z]{2})\s*(\d{5}),\s*\1,\s*\2\s*\3$',
  ', \1, \2 \3',
  'g'
)
WHERE address ~ ',\s*[^,]+\s*,\s*[A-Z]{2}\s*\d{5},\s*[^,]+\s*,\s*[A-Z]{2}\s*\d{5}$';

-- Show summary of fixes
DO $$
DECLARE
  frequent_count INTEGER;
  trips_pickup_count INTEGER;
  trips_dropoff_count INTEGER;
  locations_count INTEGER;
  clients_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO frequent_count
  FROM frequent_locations
  WHERE full_address LIKE '%Denver, CO 80221, Denver, CO 80221%';
  
  SELECT COUNT(*) INTO trips_pickup_count
  FROM trips
  WHERE pickup_address LIKE '%Denver, CO 80221, Denver, CO 80221%';
  
  SELECT COUNT(*) INTO trips_dropoff_count
  FROM trips
  WHERE dropoff_address LIKE '%Denver, CO 80221, Denver, CO 80221%';
  
  SELECT COUNT(*) INTO locations_count
  FROM locations
  WHERE address LIKE '%Denver, CO 80221, Denver, CO 80221%';
  
  SELECT COUNT(*) INTO clients_count
  FROM clients
  WHERE address LIKE '%Denver, CO 80221, Denver, CO 80221%';
  
  RAISE NOTICE 'Addresses with duplicates remaining:';
  RAISE NOTICE '  frequent_locations: %', frequent_count;
  RAISE NOTICE '  trips (pickup): %', trips_pickup_count;
  RAISE NOTICE '  trips (dropoff): %', trips_dropoff_count;
  RAISE NOTICE '  locations: %', locations_count;
  RAISE NOTICE '  clients: %', clients_count;
END $$;

