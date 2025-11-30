-- ============================================================================
-- ADD ARCHIVED_AT TO DISCUSSIONS TABLE
-- ============================================================================
-- This migration adds support for archiving discussions (soft delete)
-- ============================================================================

BEGIN;

-- Add archived_at column to discussions
ALTER TABLE discussions
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- Add index for filtering non-archived discussions
CREATE INDEX IF NOT EXISTS idx_discussions_archived_at ON discussions(archived_at) WHERE archived_at IS NULL;

COMMENT ON COLUMN discussions.archived_at IS 'Timestamp when the discussion was archived. NULL means not archived.';

COMMIT;

