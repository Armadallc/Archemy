-- ============================================================================
-- ENABLE RLS ON DISCUSSIONS AND KANBAN TABLES
-- Multi-Tenant Transportation Management System
-- Security Phase 1: RLS Verification & Enhancement
-- ============================================================================
-- This migration enables Row Level Security (RLS) on:
-- 1. discussions - Chat threads/conversations
-- 2. discussion_messages - Individual messages
-- 3. discussion_participants - User participation tracking
-- 4. kanban_boards - Kanban board containers
-- 5. kanban_columns - Columns within boards
-- 6. kanban_cards - Cards within columns
-- ============================================================================

BEGIN;

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_cards ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES FOR DISCUSSIONS
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "discussions_select_policy" ON discussions;
DROP POLICY IF EXISTS "discussions_insert_policy" ON discussions;
DROP POLICY IF EXISTS "discussions_update_policy" ON discussions;
DROP POLICY IF EXISTS "discussions_delete_policy" ON discussions;

-- Select: Users can see discussions they are participants in, or open discussions within their scope
CREATE POLICY "discussions_select_policy" ON discussions
    FOR SELECT USING (
        auth.uid() IN (
            SELECT auth_user_id FROM users u
            WHERE (
                -- Super admin can see all
                u.role = 'super_admin'
                OR (
                    -- User is a participant in the discussion
                    EXISTS (
                        SELECT 1 FROM discussion_participants dp
                        WHERE dp.discussion_id = discussions.id
                        AND dp.user_id = u.user_id
                        AND dp.left_at IS NULL
                    )
                )
                OR (
                    -- Open discussions within user's scope
                    discussions.discussion_type = 'open'
                    AND (
                        -- Super admin can see all open discussions
                        u.role = 'super_admin'
                        OR (
                            -- Corporate admin can see open discussions in their corporate client
                            u.role = 'corporate_admin'
                            AND (
                                discussions.corporate_client_id = u.corporate_client_id
                                OR discussions.corporate_client_id IS NULL
                            )
                        )
                        OR (
                            -- Program admin/user can see open discussions in their programs
                            u.role IN ('program_admin', 'program_user')
                            AND (
                                discussions.program_id = u.primary_program_id
                                OR discussions.program_id = ANY(COALESCE(u.authorized_programs, ARRAY[]::text[]))
                                OR (
                                    discussions.corporate_client_id = u.corporate_client_id
                                    AND discussions.program_id IS NULL
                                )
                            )
                        )
                    )
                )
            )
        )
    );

-- Insert: Users can create discussions within their scope
CREATE POLICY "discussions_insert_policy" ON discussions
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT auth_user_id FROM users u
            WHERE u.user_id = discussions.created_by
            AND (
                u.role = 'super_admin'
                OR (
                    u.role = 'corporate_admin'
                    AND (
                        discussions.corporate_client_id = u.corporate_client_id
                        OR discussions.corporate_client_id IS NULL
                    )
                )
                OR (
                    u.role IN ('program_admin', 'program_user')
                    AND (
                        discussions.program_id = u.primary_program_id
                        OR discussions.program_id = ANY(COALESCE(u.authorized_programs, ARRAY[]::text[]))
                        OR (
                            discussions.corporate_client_id = u.corporate_client_id
                            AND discussions.program_id IS NULL
                        )
                    )
                )
            )
        )
    );

-- Update: Users can update discussions they created, or are admins of group discussions
CREATE POLICY "discussions_update_policy" ON discussions
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT auth_user_id FROM users u
            WHERE (
                u.user_id = discussions.created_by
                OR u.role = 'super_admin'
                OR (
                    -- Admins of group discussions can update
                    discussions.discussion_type = 'group'
                    AND EXISTS (
                        SELECT 1 FROM discussion_participants dp
                        WHERE dp.discussion_id = discussions.id
                        AND dp.user_id = u.user_id
                        AND dp.role = 'admin'
                        AND dp.left_at IS NULL
                    )
                )
            )
        )
    );

-- Delete: Only creators or super_admin can delete discussions
CREATE POLICY "discussions_delete_policy" ON discussions
    FOR DELETE USING (
        auth.uid() IN (
            SELECT auth_user_id FROM users u
            WHERE u.user_id = discussions.created_by
            OR u.role = 'super_admin'
        )
    );

-- ============================================================================
-- RLS POLICIES FOR DISCUSSION_MESSAGES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "discussion_messages_select_policy" ON discussion_messages;
DROP POLICY IF EXISTS "discussion_messages_insert_policy" ON discussion_messages;
DROP POLICY IF EXISTS "discussion_messages_update_policy" ON discussion_messages;
DROP POLICY IF EXISTS "discussion_messages_delete_policy" ON discussion_messages;

-- Select: Users can see messages in discussions they have access to
CREATE POLICY "discussion_messages_select_policy" ON discussion_messages
    FOR SELECT USING (
        deleted_at IS NULL
        AND (
            auth.uid() IN (
                SELECT auth_user_id FROM users u
                WHERE (
                    -- Super admin can see all
                    u.role = 'super_admin'
                    OR (
                        -- User is a participant in the discussion
                        EXISTS (
                            SELECT 1 FROM discussion_participants dp
                            JOIN discussions d ON d.id = dp.discussion_id
                            WHERE dp.discussion_id = discussion_messages.discussion_id
                            AND dp.user_id = u.user_id
                            AND dp.left_at IS NULL
                        )
                    )
                    OR (
                        -- Open discussions within user's scope
                        EXISTS (
                            SELECT 1 FROM discussions d
                            WHERE d.id = discussion_messages.discussion_id
                            AND d.discussion_type = 'open'
                            AND (
                                u.role = 'super_admin'
                                OR (
                                    u.role = 'corporate_admin'
                                    AND (
                                        d.corporate_client_id = u.corporate_client_id
                                        OR d.corporate_client_id IS NULL
                                    )
                                )
                                OR (
                                    u.role IN ('program_admin', 'program_user')
                                    AND (
                                        d.program_id = u.primary_program_id
                                        OR d.program_id = ANY(COALESCE(u.authorized_programs, ARRAY[]::text[]))
                                        OR (
                                            d.corporate_client_id = u.corporate_client_id
                                            AND d.program_id IS NULL
                                        )
                                    )
                                )
                            )
                        )
                    )
                )
            )
        )
    );

-- Insert: Users can create messages in discussions they have access to
CREATE POLICY "discussion_messages_insert_policy" ON discussion_messages
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT auth_user_id FROM users u
            WHERE u.user_id = discussion_messages.created_by
            AND (
                -- Super admin can create messages in any discussion
                u.role = 'super_admin'
                OR (
                    -- User is a participant in the discussion
                    EXISTS (
                        SELECT 1 FROM discussion_participants dp
                        WHERE dp.discussion_id = discussion_messages.discussion_id
                        AND dp.user_id = u.user_id
                        AND dp.left_at IS NULL
                    )
                )
                OR (
                    -- Open discussions within user's scope
                    EXISTS (
                        SELECT 1 FROM discussions d
                        WHERE d.id = discussion_messages.discussion_id
                        AND d.discussion_type = 'open'
                        AND (
                            u.role = 'super_admin'
                            OR (
                                u.role = 'corporate_admin'
                                AND (
                                    d.corporate_client_id = u.corporate_client_id
                                    OR d.corporate_client_id IS NULL
                                )
                            )
                            OR (
                                u.role IN ('program_admin', 'program_user')
                                AND (
                                    d.program_id = u.primary_program_id
                                    OR d.program_id = ANY(COALESCE(u.authorized_programs, ARRAY[]::text[]))
                                    OR (
                                        d.corporate_client_id = u.corporate_client_id
                                        AND d.program_id IS NULL
                                    )
                                )
                            )
                        )
                    )
                )
            )
        )
    );

-- Update: Users can update their own messages
CREATE POLICY "discussion_messages_update_policy" ON discussion_messages
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT auth_user_id FROM users u
            WHERE u.user_id = discussion_messages.created_by
            OR u.role = 'super_admin'
        )
    );

-- Delete: Users can soft-delete their own messages, super_admin can hard delete
CREATE POLICY "discussion_messages_delete_policy" ON discussion_messages
    FOR DELETE USING (
        auth.uid() IN (
            SELECT auth_user_id FROM users u
            WHERE u.user_id = discussion_messages.created_by
            OR u.role = 'super_admin'
        )
    );

-- ============================================================================
-- RLS POLICIES FOR DISCUSSION_PARTICIPANTS
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "discussion_participants_select_policy" ON discussion_participants;
DROP POLICY IF EXISTS "discussion_participants_insert_policy" ON discussion_participants;
DROP POLICY IF EXISTS "discussion_participants_update_policy" ON discussion_participants;
DROP POLICY IF EXISTS "discussion_participants_delete_policy" ON discussion_participants;

-- Select: Users can see participants in discussions they have access to
CREATE POLICY "discussion_participants_select_policy" ON discussion_participants
    FOR SELECT USING (
        auth.uid() IN (
            SELECT auth_user_id FROM users u
            WHERE (
                -- Super admin can see all
                u.role = 'super_admin'
                OR (
                    -- User is a participant in the discussion
                    EXISTS (
                        SELECT 1 FROM discussion_participants dp2
                        WHERE dp2.discussion_id = discussion_participants.discussion_id
                        AND dp2.user_id = u.user_id
                        AND dp2.left_at IS NULL
                    )
                )
                OR (
                    -- Open discussions within user's scope
                    EXISTS (
                        SELECT 1 FROM discussions d
                        WHERE d.id = discussion_participants.discussion_id
                        AND d.discussion_type = 'open'
                        AND (
                            u.role = 'super_admin'
                            OR (
                                u.role = 'corporate_admin'
                                AND (
                                    d.corporate_client_id = u.corporate_client_id
                                    OR d.corporate_client_id IS NULL
                                )
                            )
                            OR (
                                u.role IN ('program_admin', 'program_user')
                                AND (
                                    d.program_id = u.primary_program_id
                                    OR d.program_id = ANY(COALESCE(u.authorized_programs, ARRAY[]::text[]))
                                    OR (
                                        d.corporate_client_id = u.corporate_client_id
                                        AND d.program_id IS NULL
                                    )
                                )
                            )
                        )
                    )
                )
            )
        )
    );

-- Insert: Users can add themselves or be added by discussion admins
CREATE POLICY "discussion_participants_insert_policy" ON discussion_participants
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT auth_user_id FROM users u
            WHERE (
                -- Super admin can add anyone
                u.role = 'super_admin'
                OR (
                    -- User is adding themselves
                    u.user_id = discussion_participants.user_id
                    AND EXISTS (
                        SELECT 1 FROM discussions d
                        WHERE d.id = discussion_participants.discussion_id
                        AND (
                            -- Open discussions can be joined by users in scope
                            d.discussion_type = 'open'
                            AND (
                                u.role = 'super_admin'
                                OR (
                                    u.role = 'corporate_admin'
                                    AND (
                                        d.corporate_client_id = u.corporate_client_id
                                        OR d.corporate_client_id IS NULL
                                    )
                                )
                                OR (
                                    u.role IN ('program_admin', 'program_user')
                                    AND (
                                        d.program_id = u.primary_program_id
                                        OR d.program_id = ANY(COALESCE(u.authorized_programs, ARRAY[]::text[]))
                                        OR (
                                            d.corporate_client_id = u.corporate_client_id
                                            AND d.program_id IS NULL
                                        )
                                    )
                                )
                            )
                        )
                    )
                )
                OR (
                    -- Discussion creator or admin can add participants
                    EXISTS (
                        SELECT 1 FROM discussions d
                        WHERE d.id = discussion_participants.discussion_id
                        AND (
                            d.created_by = u.user_id
                            OR EXISTS (
                                SELECT 1 FROM discussion_participants dp
                                WHERE dp.discussion_id = d.id
                                AND dp.user_id = u.user_id
                                AND dp.role = 'admin'
                                AND dp.left_at IS NULL
                            )
                        )
                    )
                )
            )
        )
    );

-- Update: Users can update their own participation, admins can update any
CREATE POLICY "discussion_participants_update_policy" ON discussion_participants
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT auth_user_id FROM users u
            WHERE (
                u.user_id = discussion_participants.user_id
                OR u.role = 'super_admin'
                OR EXISTS (
                    SELECT 1 FROM discussions d
                    WHERE d.id = discussion_participants.discussion_id
                    AND (
                        d.created_by = u.user_id
                        OR EXISTS (
                            SELECT 1 FROM discussion_participants dp
                            WHERE dp.discussion_id = d.id
                            AND dp.user_id = u.user_id
                            AND dp.role = 'admin'
                            AND dp.left_at IS NULL
                        )
                    )
                )
            )
        )
    );

-- Delete: Users can remove themselves, admins can remove anyone
CREATE POLICY "discussion_participants_delete_policy" ON discussion_participants
    FOR DELETE USING (
        auth.uid() IN (
            SELECT auth_user_id FROM users u
            WHERE (
                u.user_id = discussion_participants.user_id
                OR u.role = 'super_admin'
                OR EXISTS (
                    SELECT 1 FROM discussions d
                    WHERE d.id = discussion_participants.discussion_id
                    AND (
                        d.created_by = u.user_id
                        OR EXISTS (
                            SELECT 1 FROM discussion_participants dp
                            WHERE dp.discussion_id = d.id
                            AND dp.user_id = u.user_id
                            AND dp.role = 'admin'
                            AND dp.left_at IS NULL
                        )
                    )
                )
            )
        )
    );

-- ============================================================================
-- RLS POLICIES FOR KANBAN_BOARDS
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "kanban_boards_select_policy" ON kanban_boards;
DROP POLICY IF EXISTS "kanban_boards_insert_policy" ON kanban_boards;
DROP POLICY IF EXISTS "kanban_boards_update_policy" ON kanban_boards;
DROP POLICY IF EXISTS "kanban_boards_delete_policy" ON kanban_boards;

-- Select: Users can see boards within their scope
CREATE POLICY "kanban_boards_select_policy" ON kanban_boards
    FOR SELECT USING (
        auth.uid() IN (
            SELECT auth_user_id FROM users u
            WHERE (
                -- Super admin can see all
                u.role = 'super_admin'
                OR (
                    -- Corporate admin can see boards in their corporate client
                    u.role = 'corporate_admin'
                    AND (
                        kanban_boards.corporate_client_id = u.corporate_client_id
                        OR kanban_boards.corporate_client_id IS NULL
                    )
                )
                OR (
                    -- Program admin/user can see boards in their programs
                    u.role IN ('program_admin', 'program_user')
                    AND (
                        kanban_boards.program_id = u.primary_program_id
                        OR kanban_boards.program_id = ANY(COALESCE(u.authorized_programs, ARRAY[]::text[]))
                        OR (
                            kanban_boards.corporate_client_id = u.corporate_client_id
                            AND kanban_boards.program_id IS NULL
                        )
                    )
                )
            )
        )
    );

-- Insert: Users can create boards within their scope
CREATE POLICY "kanban_boards_insert_policy" ON kanban_boards
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT auth_user_id FROM users u
            WHERE u.user_id = kanban_boards.created_by
            AND (
                u.role = 'super_admin'
                OR (
                    u.role = 'corporate_admin'
                    AND (
                        kanban_boards.corporate_client_id = u.corporate_client_id
                        OR kanban_boards.corporate_client_id IS NULL
                    )
                )
                OR (
                    u.role IN ('program_admin', 'program_user')
                    AND (
                        kanban_boards.program_id = u.primary_program_id
                        OR kanban_boards.program_id = ANY(COALESCE(u.authorized_programs, ARRAY[]::text[]))
                        OR (
                            kanban_boards.corporate_client_id = u.corporate_client_id
                            AND kanban_boards.program_id IS NULL
                        )
                    )
                )
            )
        )
    );

-- Update: Users can update boards they created, or within their scope
CREATE POLICY "kanban_boards_update_policy" ON kanban_boards
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT auth_user_id FROM users u
            WHERE (
                u.user_id = kanban_boards.created_by
                OR u.role = 'super_admin'
                OR (
                    u.role = 'corporate_admin'
                    AND (
                        kanban_boards.corporate_client_id = u.corporate_client_id
                        OR kanban_boards.corporate_client_id IS NULL
                    )
                )
                OR (
                    u.role IN ('program_admin', 'program_user')
                    AND (
                        kanban_boards.program_id = u.primary_program_id
                        OR kanban_boards.program_id = ANY(COALESCE(u.authorized_programs, ARRAY[]::text[]))
                    )
                )
            )
        )
    );

-- Delete: Only creators or super_admin can delete boards
CREATE POLICY "kanban_boards_delete_policy" ON kanban_boards
    FOR DELETE USING (
        auth.uid() IN (
            SELECT auth_user_id FROM users u
            WHERE u.user_id = kanban_boards.created_by
            OR u.role = 'super_admin'
        )
    );

-- ============================================================================
-- RLS POLICIES FOR KANBAN_COLUMNS
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "kanban_columns_select_policy" ON kanban_columns;
DROP POLICY IF EXISTS "kanban_columns_insert_policy" ON kanban_columns;
DROP POLICY IF EXISTS "kanban_columns_update_policy" ON kanban_columns;
DROP POLICY IF EXISTS "kanban_columns_delete_policy" ON kanban_columns;

-- Select: Users can see columns in boards they have access to
CREATE POLICY "kanban_columns_select_policy" ON kanban_columns
    FOR SELECT USING (
        auth.uid() IN (
            SELECT auth_user_id FROM users u
            WHERE (
                -- Super admin can see all
                u.role = 'super_admin'
                OR EXISTS (
                    SELECT 1 FROM kanban_boards kb
                    WHERE kb.id = kanban_columns.board_id
                    AND (
                        u.role = 'super_admin'
                        OR (
                            u.role = 'corporate_admin'
                            AND (
                                kb.corporate_client_id = u.corporate_client_id
                                OR kb.corporate_client_id IS NULL
                            )
                        )
                        OR (
                            u.role IN ('program_admin', 'program_user')
                            AND (
                                kb.program_id = u.primary_program_id
                                OR kb.program_id = ANY(COALESCE(u.authorized_programs, ARRAY[]::text[]))
                                OR (
                                    kb.corporate_client_id = u.corporate_client_id
                                    AND kb.program_id IS NULL
                                )
                            )
                        )
                    )
                )
            )
        )
    );

-- Insert: Users can create columns in boards they have access to
CREATE POLICY "kanban_columns_insert_policy" ON kanban_columns
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT auth_user_id FROM users u
            WHERE EXISTS (
                SELECT 1 FROM kanban_boards kb
                WHERE kb.id = kanban_columns.board_id
                AND (
                    u.role = 'super_admin'
                    OR (
                        u.role = 'corporate_admin'
                        AND (
                            kb.corporate_client_id = u.corporate_client_id
                            OR kb.corporate_client_id IS NULL
                        )
                    )
                    OR (
                        u.role IN ('program_admin', 'program_user')
                        AND (
                            kb.program_id = u.primary_program_id
                            OR kb.program_id = ANY(COALESCE(u.authorized_programs, ARRAY[]::text[]))
                            OR (
                                kb.corporate_client_id = u.corporate_client_id
                                AND kb.program_id IS NULL
                            )
                        )
                    )
                )
            )
        )
    );

-- Update: Users can update columns in boards they have access to
CREATE POLICY "kanban_columns_update_policy" ON kanban_columns
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT auth_user_id FROM users u
            WHERE (
                u.role = 'super_admin'
                OR EXISTS (
                    SELECT 1 FROM kanban_boards kb
                    WHERE kb.id = kanban_columns.board_id
                    AND (
                        u.role = 'super_admin'
                        OR (
                            u.role = 'corporate_admin'
                            AND (
                                kb.corporate_client_id = u.corporate_client_id
                                OR kb.corporate_client_id IS NULL
                            )
                        )
                        OR (
                            u.role IN ('program_admin', 'program_user')
                            AND (
                                kb.program_id = u.primary_program_id
                                OR kb.program_id = ANY(COALESCE(u.authorized_programs, ARRAY[]::text[]))
                            )
                        )
                    )
                )
            )
        )
    );

-- Delete: Users can delete columns in boards they have access to
CREATE POLICY "kanban_columns_delete_policy" ON kanban_columns
    FOR DELETE USING (
        auth.uid() IN (
            SELECT auth_user_id FROM users u
            WHERE (
                u.role = 'super_admin'
                OR EXISTS (
                    SELECT 1 FROM kanban_boards kb
                    WHERE kb.id = kanban_columns.board_id
                    AND (
                        u.role = 'super_admin'
                        OR (
                            u.role = 'corporate_admin'
                            AND (
                                kb.corporate_client_id = u.corporate_client_id
                                OR kb.corporate_client_id IS NULL
                            )
                        )
                        OR (
                            u.role IN ('program_admin', 'program_user')
                            AND (
                                kb.program_id = u.primary_program_id
                                OR kb.program_id = ANY(COALESCE(u.authorized_programs, ARRAY[]::text[]))
                            )
                        )
                    )
                )
            )
        )
    );

-- ============================================================================
-- RLS POLICIES FOR KANBAN_CARDS
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "kanban_cards_select_policy" ON kanban_cards;
DROP POLICY IF EXISTS "kanban_cards_insert_policy" ON kanban_cards;
DROP POLICY IF EXISTS "kanban_cards_update_policy" ON kanban_cards;
DROP POLICY IF EXISTS "kanban_cards_delete_policy" ON kanban_cards;

-- Select: Users can see cards in boards they have access to
CREATE POLICY "kanban_cards_select_policy" ON kanban_cards
    FOR SELECT USING (
        auth.uid() IN (
            SELECT auth_user_id FROM users u
            WHERE (
                -- Super admin can see all
                u.role = 'super_admin'
                OR (
                    -- User is assigned to the card
                    u.user_id = kanban_cards.assigned_to
                )
                OR (
                    -- User created the card
                    u.user_id = kanban_cards.created_by
                )
                OR EXISTS (
                    SELECT 1 FROM kanban_boards kb
                    WHERE kb.id = kanban_cards.board_id
                    AND (
                        u.role = 'super_admin'
                        OR (
                            u.role = 'corporate_admin'
                            AND (
                                kb.corporate_client_id = u.corporate_client_id
                                OR kb.corporate_client_id IS NULL
                            )
                        )
                        OR (
                            u.role IN ('program_admin', 'program_user')
                            AND (
                                kb.program_id = u.primary_program_id
                                OR kb.program_id = ANY(COALESCE(u.authorized_programs, ARRAY[]::text[]))
                                OR (
                                    kb.corporate_client_id = u.corporate_client_id
                                    AND kb.program_id IS NULL
                                )
                            )
                        )
                    )
                )
            )
        )
    );

-- Insert: Users can create cards in boards they have access to
CREATE POLICY "kanban_cards_insert_policy" ON kanban_cards
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT auth_user_id FROM users u
            WHERE u.user_id = kanban_cards.created_by
            AND (
                u.role = 'super_admin'
                OR EXISTS (
                    SELECT 1 FROM kanban_boards kb
                    WHERE kb.id = kanban_cards.board_id
                    AND (
                        u.role = 'super_admin'
                        OR (
                            u.role = 'corporate_admin'
                            AND (
                                kb.corporate_client_id = u.corporate_client_id
                                OR kb.corporate_client_id IS NULL
                            )
                        )
                        OR (
                            u.role IN ('program_admin', 'program_user')
                            AND (
                                kb.program_id = u.primary_program_id
                                OR kb.program_id = ANY(COALESCE(u.authorized_programs, ARRAY[]::text[]))
                                OR (
                                    kb.corporate_client_id = u.corporate_client_id
                                    AND kb.program_id IS NULL
                                )
                            )
                        )
                    )
                )
            )
        )
    );

-- Update: Users can update cards they created, are assigned to, or in boards they have access to
CREATE POLICY "kanban_cards_update_policy" ON kanban_cards
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT auth_user_id FROM users u
            WHERE (
                u.user_id = kanban_cards.created_by
                OR u.user_id = kanban_cards.assigned_to
                OR u.role = 'super_admin'
                OR EXISTS (
                    SELECT 1 FROM kanban_boards kb
                    WHERE kb.id = kanban_cards.board_id
                    AND (
                        u.role = 'super_admin'
                        OR (
                            u.role = 'corporate_admin'
                            AND (
                                kb.corporate_client_id = u.corporate_client_id
                                OR kb.corporate_client_id IS NULL
                            )
                        )
                        OR (
                            u.role IN ('program_admin', 'program_user')
                            AND (
                                kb.program_id = u.primary_program_id
                                OR kb.program_id = ANY(COALESCE(u.authorized_programs, ARRAY[]::text[]))
                            )
                        )
                    )
                )
            )
        )
    );

-- Delete: Users can delete cards they created, super_admin can delete any
CREATE POLICY "kanban_cards_delete_policy" ON kanban_cards
    FOR DELETE USING (
        auth.uid() IN (
            SELECT auth_user_id FROM users u
            WHERE (
                u.user_id = kanban_cards.created_by
                OR u.role = 'super_admin'
                OR EXISTS (
                    SELECT 1 FROM kanban_boards kb
                    WHERE kb.id = kanban_cards.board_id
                    AND kb.created_by = u.user_id
                )
            )
        )
    );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE discussions IS 'RLS enabled: Users can see discussions they participate in or open discussions within their scope';
COMMENT ON TABLE discussion_messages IS 'RLS enabled: Users can see messages in discussions they have access to';
COMMENT ON TABLE discussion_participants IS 'RLS enabled: Users can see participants in discussions they have access to';
COMMENT ON TABLE kanban_boards IS 'RLS enabled: Users can see boards within their corporate client/program scope';
COMMENT ON TABLE kanban_columns IS 'RLS enabled: Users can see columns in boards they have access to';
COMMENT ON TABLE kanban_cards IS 'RLS enabled: Users can see cards they created, are assigned to, or in boards they have access to';

COMMIT;

