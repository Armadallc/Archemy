-- Migration: Create user_theme_preferences table
-- Purpose: Store user-specific theme customizations for both light and dark modes
-- Date: 2024

-- User Theme Preferences Table
CREATE TABLE IF NOT EXISTS user_theme_preferences (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    light_mode_tokens JSONB, -- Design tokens for light mode
    dark_mode_tokens JSONB, -- Design tokens for dark mode
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_theme_preferences_user_id ON user_theme_preferences(user_id);

-- RLS Policies
ALTER TABLE user_theme_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own theme preferences
CREATE POLICY "Users can view own theme preferences"
    ON user_theme_preferences
    FOR SELECT
    USING (auth.uid()::text = (SELECT auth_user_id::text FROM users WHERE user_id = user_theme_preferences.user_id));

-- Policy: Users can insert their own theme preferences
CREATE POLICY "Users can insert own theme preferences"
    ON user_theme_preferences
    FOR INSERT
    WITH CHECK (auth.uid()::text = (SELECT auth_user_id::text FROM users WHERE user_id = user_theme_preferences.user_id));

-- Policy: Users can update their own theme preferences
CREATE POLICY "Users can update own theme preferences"
    ON user_theme_preferences
    FOR UPDATE
    USING (auth.uid()::text = (SELECT auth_user_id::text FROM users WHERE user_id = user_theme_preferences.user_id));

-- Policy: Users can delete their own theme preferences
CREATE POLICY "Users can delete own theme preferences"
    ON user_theme_preferences
    FOR DELETE
    USING (auth.uid()::text = (SELECT auth_user_id::text FROM users WHERE user_id = user_theme_preferences.user_id));

-- Policy: Super admins can view all theme preferences
CREATE POLICY "Super admins can view all theme preferences"
    ON user_theme_preferences
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.user_id = user_theme_preferences.user_id
            AND users.role = 'super_admin'
            AND users.auth_user_id::text = auth.uid()::text
        )
    );

COMMENT ON TABLE user_theme_preferences IS 'Stores user-specific theme customizations for light and dark modes';
COMMENT ON COLUMN user_theme_preferences.light_mode_tokens IS 'JSON object containing design tokens for light mode theme';
COMMENT ON COLUMN user_theme_preferences.dark_mode_tokens IS 'JSON object containing design tokens for dark mode theme';

