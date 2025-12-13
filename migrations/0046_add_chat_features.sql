-- ============================================================================
-- ADD CHAT FEATURES: PINNED, MUTED, REACTIONS
-- ============================================================================
-- This migration adds support for:
-- 1. Pinned discussions (per user)
-- 2. Muted discussions (per user)
-- 3. Message reactions
-- ============================================================================

BEGIN;

-- Add pinned and muted columns to discussion_participants (user-specific)
ALTER TABLE discussion_participants
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT FALSE;

-- Add indexes for pinned and muted
CREATE INDEX IF NOT EXISTS idx_discussion_participants_pinned ON discussion_participants(is_pinned) WHERE is_pinned = TRUE;
CREATE INDEX IF NOT EXISTS idx_discussion_participants_muted ON discussion_participants(is_muted) WHERE is_muted = TRUE;

-- Add reactions column to discussion_messages (JSONB array of reactions)
ALTER TABLE discussion_messages
ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '[]'::jsonb;

-- Add index for reactions (GIN index for JSONB queries)
CREATE INDEX IF NOT EXISTS idx_discussion_messages_reactions ON discussion_messages USING GIN (reactions);

-- Add comment
COMMENT ON COLUMN discussion_participants.is_pinned IS 'If true, this discussion is pinned for this user';
COMMENT ON COLUMN discussion_participants.is_muted IS 'If true, this discussion is muted for this user';
COMMENT ON COLUMN discussion_messages.reactions IS 'Array of reaction objects: [{"emoji": "👍", "user_id": "xxx", "created_at": "..."}]';

COMMIT;











