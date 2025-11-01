-- Add logo_url to organizations table
ALTER TABLE organizations ADD COLUMN logo_url TEXT;

-- Add avatar_url to users table  
ALTER TABLE users ADD COLUMN avatar_url TEXT;