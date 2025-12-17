-- ============================================================================
-- Delete Test Clients (HD-0001 and MC-0001)
-- ============================================================================
-- This script deletes the two test clients to free up their SCIDs
-- Created: 2024-12-16

-- Delete Test HD1 client (HD-0001)
DELETE FROM clients 
WHERE id = 'e823c667-944c-4fe0-96ed-8110feed38fc'
  AND scid = 'HD-0001';

-- Delete John Doe client (MC-0001)
DELETE FROM clients 
WHERE id = 'eb4b10c5-f3fa-4507-ade3-5e1d040ec6b1'
  AND scid = 'MC-0001';

-- Verify deletion
SELECT 
    'Clients deleted' as status,
    COUNT(*) FILTER (WHERE id = 'e823c667-944c-4fe0-96ed-8110feed38fc') as hd1_exists,
    COUNT(*) FILTER (WHERE id = 'eb4b10c5-f3fa-4507-ade3-5e1d040ec6b1') as john_doe_exists
FROM clients
WHERE id IN ('e823c667-944c-4fe0-96ed-8110feed38fc', 'eb4b10c5-f3fa-4507-ade3-5e1d040ec6b1');

-- Expected: Both should be 0 (clients deleted)




