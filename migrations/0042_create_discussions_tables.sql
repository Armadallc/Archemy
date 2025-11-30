-- ============================================================================
-- CREATE DISCUSSIONS MODULE TABLES
-- Multi-Tenant Transportation Management System
-- Chat/Discussions Module
-- ============================================================================
-- This migration creates tables for:
-- 1. discussions - Chat threads/conversations (personal and group)
-- 2. discussion_messages - Individual messages within discussions
-- 3. discussion_participants - Many-to-many relationship for group chats
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. DISCUSSIONS TABLE
-- ============================================================================
-- Chat threads/conversations (1-on-1 or group)
-- Note: last_message_id foreign key will be added after discussion_messages table is created
CREATE TABLE IF NOT EXISTS discussions (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title VARCHAR(255), -- Optional title for group chats
    discussion_type VARCHAR(20) NOT NULL DEFAULT 'personal' CHECK (discussion_type IN ('personal', 'group')),
    
    -- For personal chats, we can derive participants from discussion_participants
    -- For group chats, title is recommended
    
    -- Multi-tenant scoping
    corporate_client_id VARCHAR(50) REFERENCES corporate_clients(id) ON DELETE CASCADE,
    program_id VARCHAR(50) REFERENCES programs(id) ON DELETE CASCADE,
    
    -- Created by
    created_by VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Last message tracking (for sorting) - foreign key added later
    last_message_id VARCHAR(50),
    last_message_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_discussions_created_by FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Indexes for discussions
CREATE INDEX IF NOT EXISTS idx_discussions_type ON discussions(discussion_type);
CREATE INDEX IF NOT EXISTS idx_discussions_corporate_client ON discussions(corporate_client_id);
CREATE INDEX IF NOT EXISTS idx_discussions_program ON discussions(program_id);
CREATE INDEX IF NOT EXISTS idx_discussions_created_by ON discussions(created_by);
CREATE INDEX IF NOT EXISTS idx_discussions_last_message_at ON discussions(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussions_created_at ON discussions(created_at DESC);

-- ============================================================================
-- 2. DISCUSSION_MESSAGES TABLE
-- ============================================================================
-- Individual messages within discussions
CREATE TABLE IF NOT EXISTS discussion_messages (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    discussion_id VARCHAR(50) NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
    
    -- Message content
    content TEXT NOT NULL,
    
    -- Parent message for threading (flat structure with parent references)
    parent_message_id VARCHAR(50) REFERENCES discussion_messages(id) ON DELETE CASCADE,
    
    -- Author
    created_by VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Read tracking (optional - can be enhanced later)
    read_by JSONB DEFAULT '[]'::jsonb, -- Array of user_ids who have read this message
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete support
    
    CONSTRAINT fk_discussion_messages_discussion FOREIGN KEY (discussion_id) REFERENCES discussions(id) ON DELETE CASCADE,
    CONSTRAINT fk_discussion_messages_created_by FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_discussion_messages_parent FOREIGN KEY (parent_message_id) REFERENCES discussion_messages(id) ON DELETE CASCADE
);

-- Indexes for discussion_messages
CREATE INDEX IF NOT EXISTS idx_discussion_messages_discussion_id ON discussion_messages(discussion_id);
CREATE INDEX IF NOT EXISTS idx_discussion_messages_created_by ON discussion_messages(created_by);
CREATE INDEX IF NOT EXISTS idx_discussion_messages_parent ON discussion_messages(parent_message_id);
CREATE INDEX IF NOT EXISTS idx_discussion_messages_created_at ON discussion_messages(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_discussion_messages_deleted_at ON discussion_messages(deleted_at) WHERE deleted_at IS NULL;

-- ============================================================================
-- 3. DISCUSSION_PARTICIPANTS TABLE
-- ============================================================================
-- Many-to-many relationship: users participating in discussions
CREATE TABLE IF NOT EXISTS discussion_participants (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    discussion_id VARCHAR(50) NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
    user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Optional: role in the discussion (for group chats)
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    
    -- Optional: last read message tracking
    last_read_message_id VARCHAR(50) REFERENCES discussion_messages(id) ON DELETE SET NULL,
    last_read_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE, -- For tracking when user left (soft leave)
    
    -- Unique constraint: user can only be in a discussion once
    CONSTRAINT uq_discussion_participants UNIQUE (discussion_id, user_id),
    CONSTRAINT fk_discussion_participants_discussion FOREIGN KEY (discussion_id) REFERENCES discussions(id) ON DELETE CASCADE,
    CONSTRAINT fk_discussion_participants_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Indexes for discussion_participants
CREATE INDEX IF NOT EXISTS idx_discussion_participants_discussion_id ON discussion_participants(discussion_id);
CREATE INDEX IF NOT EXISTS idx_discussion_participants_user_id ON discussion_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_discussion_participants_left_at ON discussion_participants(left_at) WHERE left_at IS NULL;

-- ============================================================================
-- ADD FOREIGN KEY CONSTRAINTS (after all tables exist)
-- ============================================================================

-- Add foreign key for discussions.last_message_id
ALTER TABLE discussions 
ADD CONSTRAINT fk_discussions_last_message 
FOREIGN KEY (last_message_id) REFERENCES discussion_messages(id) ON DELETE SET NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE discussions IS 'Chat threads/conversations (personal 1-on-1 or group chats)';
COMMENT ON TABLE discussion_messages IS 'Individual messages within discussions';
COMMENT ON TABLE discussion_participants IS 'Many-to-many relationship for users participating in discussions';

COMMIT;

