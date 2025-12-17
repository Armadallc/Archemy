-- ============================================================================
-- Migration 013a: Fix Contacts Unique Constraint for ON CONFLICT
-- ============================================================================
-- Purpose: Replace partial unique index with proper unique constraint for ON CONFLICT support
-- Created: 2025-01-17
-- Dependencies: Migration 013 (must be run first)

-- Drop the partial unique index (if it exists)
DROP INDEX IF EXISTS uq_contacts_owner_app_user;

-- Clean up any duplicate app user contacts first (keep the oldest one)
DELETE FROM contacts ct1
USING contacts ct2
WHERE ct1.id > ct2.id
  AND ct1.owner_user_id = ct2.owner_user_id
  AND ct1.user_id = ct2.user_id
  AND ct1.user_id IS NOT NULL
  AND ct2.user_id IS NOT NULL;

-- Create a proper unique constraint that works with ON CONFLICT
-- Note: PostgreSQL unique constraints allow multiple NULLs, so external contacts
-- (user_id IS NULL) can still have duplicates, which is what we want.
-- Only app users (user_id IS NOT NULL) will be constrained.
ALTER TABLE contacts 
ADD CONSTRAINT uq_contacts_owner_app_user 
UNIQUE (owner_user_id, user_id);

COMMENT ON CONSTRAINT uq_contacts_owner_app_user ON contacts IS 
'Ensures each owner can only have one contact per app user. External contacts (user_id IS NULL) can have duplicates since NULL != NULL in unique constraints.';

