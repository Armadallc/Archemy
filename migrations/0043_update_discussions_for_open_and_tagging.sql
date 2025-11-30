-- ============================================================================
-- UPDATE DISCUSSIONS TABLE FOR OPEN DISCUSSIONS AND TAGGING
-- ============================================================================
-- This migration adds support for:
-- 1. Open/public discussions that anyone can join
-- 2. User and role tagging in discussions
-- ============================================================================

BEGIN;

-- Add is_open column to discussions
ALTER TABLE discussions 
ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT FALSE;

-- Add tagged_user_ids JSONB column for storing array of user IDs
ALTER TABLE discussions 
ADD COLUMN IF NOT EXISTS tagged_user_ids JSONB DEFAULT '[]'::jsonb;

-- Add tagged_roles JSONB column for storing array of role names
ALTER TABLE discussions 
ADD COLUMN IF NOT EXISTS tagged_roles JSONB DEFAULT '[]'::jsonb;

-- Update discussion_type constraint to include 'open' if needed
-- (Actually, we'll use is_open flag instead of a new type)

-- Add index for open discussions
CREATE INDEX IF NOT EXISTS idx_discussions_is_open ON discussions(is_open) WHERE is_open = TRUE;

-- Add index for tagged users (GIN index for JSONB array queries)
CREATE INDEX IF NOT EXISTS idx_discussions_tagged_users ON discussions USING GIN (tagged_user_ids);

-- Add index for tagged roles (GIN index for JSONB array queries)
CREATE INDEX IF NOT EXISTS idx_discussions_tagged_roles ON discussions USING GIN (tagged_roles);

COMMENT ON COLUMN discussions.is_open IS 'If true, this discussion is open and anyone in the scope can join';
COMMENT ON COLUMN discussions.tagged_user_ids IS 'Array of user IDs who are explicitly tagged/mentioned in this discussion';
COMMENT ON COLUMN discussions.tagged_roles IS 'Array of role names that are tagged (e.g., ["program_admin", "driver"])';

COMMIT;

