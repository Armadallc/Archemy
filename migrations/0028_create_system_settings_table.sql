-- ============================================================================
-- CREATE SYSTEM SETTINGS TABLE
-- Multi-Tenant Transportation Management System
-- ============================================================================

BEGIN;

-- Create system_settings table for application-wide settings
CREATE TABLE IF NOT EXISTS system_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'system',
    app_name VARCHAR(255) NOT NULL DEFAULT 'HALCYON Transportation Management',
    main_logo_url TEXT,
    support_email VARCHAR(255) NOT NULL DEFAULT 'support@halcyon.com',
    support_phone VARCHAR(50) NOT NULL DEFAULT '+1 (555) 123-4567',
    timezone VARCHAR(50) NOT NULL DEFAULT 'America/New_York',
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT single_system_settings CHECK (id = 'system')
);

-- Insert default settings if none exist
INSERT INTO system_settings (id, app_name, main_logo_url, support_email, support_phone, timezone, language)
VALUES ('system', 'HALCYON Transportation Management', NULL, 'support@halcyon.com', '+1 (555) 123-4567', 'America/New_York', 'en')
ON CONFLICT (id) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER system_settings_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_system_settings_updated_at();

-- Enable Row Level Security
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Only super_admin can access system settings
CREATE POLICY "system_settings_super_admin_only" ON system_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.user_id = auth.uid()::text
            AND u.role = 'super_admin'
        )
    );

COMMIT;

