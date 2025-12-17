-- Migration: Create themes system tables
-- Purpose: Store shared themes (created by super admins) and user theme selections
-- Date: 2025-01-10

BEGIN;

-- ============================================================================
-- THEMES TABLE (Shared themes created by super admins)
-- ============================================================================

CREATE TABLE IF NOT EXISTS themes (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    light_mode_tokens JSONB NOT NULL, -- Design tokens for light mode
    dark_mode_tokens JSONB NOT NULL, -- Design tokens for dark mode
    is_active BOOLEAN DEFAULT true,
    created_by VARCHAR(50) REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_themes_is_active ON themes(is_active);
CREATE INDEX IF NOT EXISTS idx_themes_created_by ON themes(created_by);

-- ============================================================================
-- USER THEME SELECTIONS TABLE (User's selected theme and mode preference)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_theme_selections (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    theme_id VARCHAR(50) NOT NULL REFERENCES themes(id) ON DELETE RESTRICT,
    theme_mode VARCHAR(10) NOT NULL DEFAULT 'light' CHECK (theme_mode IN ('light', 'dark')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_theme_selections_user_id ON user_theme_selections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_theme_selections_theme_id ON user_theme_selections(theme_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp for themes
CREATE OR REPLACE FUNCTION update_themes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp for user_theme_selections
CREATE OR REPLACE FUNCTION update_user_theme_selections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger for themes updated_at
CREATE TRIGGER themes_updated_at
    BEFORE UPDATE ON themes
    FOR EACH ROW
    EXECUTE FUNCTION update_themes_updated_at();

-- Trigger for user_theme_selections updated_at
CREATE TRIGGER user_theme_selections_updated_at
    BEFORE UPDATE ON user_theme_selections
    FOR EACH ROW
    EXECUTE FUNCTION update_user_theme_selections_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on themes table
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view active themes
CREATE POLICY "Users can view active themes"
    ON themes
    FOR SELECT
    USING (
        is_active = true AND
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_user_id::text = auth.uid()::text
        )
    );

-- Policy: Super admins can view all themes (including inactive)
CREATE POLICY "Super admins can view all themes"
    ON themes
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_user_id::text = auth.uid()::text
            AND users.role = 'super_admin'
        )
    );

-- Policy: Only super admins can insert themes
CREATE POLICY "Super admins can create themes"
    ON themes
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_user_id::text = auth.uid()::text
            AND users.role = 'super_admin'
        )
    );

-- Policy: Only super admins can update themes
CREATE POLICY "Super admins can update themes"
    ON themes
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_user_id::text = auth.uid()::text
            AND users.role = 'super_admin'
        )
    );

-- Policy: Only super admins can delete themes
CREATE POLICY "Super admins can delete themes"
    ON themes
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_user_id::text = auth.uid()::text
            AND users.role = 'super_admin'
        )
    );

-- Enable RLS on user_theme_selections table
ALTER TABLE user_theme_selections ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own theme selection
CREATE POLICY "Users can view own theme selection"
    ON user_theme_selections
    FOR SELECT
    USING (
        auth.uid()::text = (SELECT auth_user_id::text FROM users WHERE user_id = user_theme_selections.user_id)
    );

-- Policy: Users can insert their own theme selection
CREATE POLICY "Users can insert own theme selection"
    ON user_theme_selections
    FOR INSERT
    WITH CHECK (
        auth.uid()::text = (SELECT auth_user_id::text FROM users WHERE user_id = user_theme_selections.user_id)
    );

-- Policy: Users can update their own theme selection
CREATE POLICY "Users can update own theme selection"
    ON user_theme_selections
    FOR UPDATE
    USING (
        auth.uid()::text = (SELECT auth_user_id::text FROM users WHERE user_id = user_theme_selections.user_id)
    );

-- Policy: Users can delete their own theme selection
CREATE POLICY "Users can delete own theme selection"
    ON user_theme_selections
    FOR DELETE
    USING (
        auth.uid()::text = (SELECT auth_user_id::text FROM users WHERE user_id = user_theme_selections.user_id)
    );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE themes IS 'Shared theme templates created by super admins. Maximum 4 active themes allowed.';
COMMENT ON COLUMN themes.light_mode_tokens IS 'JSON object containing design tokens for light mode theme';
COMMENT ON COLUMN themes.dark_mode_tokens IS 'JSON object containing design tokens for dark mode theme';
COMMENT ON TABLE user_theme_selections IS 'Stores each user''s selected theme and their light/dark mode preference';
COMMENT ON COLUMN user_theme_selections.theme_mode IS 'User''s preference for light or dark mode';

COMMIT;

