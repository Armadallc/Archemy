-- Create system_settings table for application-wide branding
CREATE TABLE IF NOT EXISTS system_settings (
  id TEXT PRIMARY KEY DEFAULT 'app_settings',
  app_name TEXT DEFAULT 'Amish Limo Service',
  main_logo_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default settings
INSERT INTO system_settings (id, app_name, main_logo_url) 
VALUES ('app_settings', 'Amish Limo Service', NULL)
ON CONFLICT (id) DO NOTHING;