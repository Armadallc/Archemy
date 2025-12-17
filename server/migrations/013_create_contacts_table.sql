-- ============================================================================
-- Migration 013: Create Contacts Table
-- ============================================================================
-- Purpose: Create table for user contacts (personal phone book)
-- Created: 2025-01-17
-- Dependencies: Migration 012 (contact_categories), users, programs, locations tables

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    owner_user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Link to app user (if this contact is an app user)
    user_id VARCHAR(50) REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Contact information
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    organization VARCHAR(255), -- For external contacts
    role VARCHAR(100), -- Role description (may differ from app user role)
    
    -- Category
    category_id VARCHAR(50) REFERENCES contact_categories(id),
    category_custom_text VARCHAR(255), -- Custom text for "Other" category
    
    -- Program/Location context (for filtering)
    program_id VARCHAR(50) REFERENCES programs(id) ON DELETE SET NULL,
    location_id VARCHAR(50) REFERENCES locations(id) ON DELETE SET NULL,
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    is_app_user BOOLEAN DEFAULT false, -- True if linked to users table
    notes TEXT, -- Personal notes about the contact
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_contacts_owner_user_id ON contacts(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_category_id ON contacts(category_id);
CREATE INDEX IF NOT EXISTS idx_contacts_program_id ON contacts(program_id);
CREATE INDEX IF NOT EXISTS idx_contacts_location_id ON contacts(location_id);
CREATE INDEX IF NOT EXISTS idx_contacts_is_active ON contacts(is_active);
CREATE INDEX IF NOT EXISTS idx_contacts_is_app_user ON contacts(is_app_user);

-- Unique constraint: prevent duplicate app user contacts for same owner
CREATE UNIQUE INDEX IF NOT EXISTS uq_contacts_owner_app_user 
    ON contacts(owner_user_id, user_id) 
    WHERE user_id IS NOT NULL;

-- Add comments
COMMENT ON TABLE contacts IS 'User contacts - personal phone book. Can be app users (auto-populated) or external contacts (manually added).';
COMMENT ON COLUMN contacts.owner_user_id IS 'User who owns this contact (personalized per user)';
COMMENT ON COLUMN contacts.user_id IS 'Link to users table if this contact is an app user';
COMMENT ON COLUMN contacts.is_app_user IS 'True if this contact is linked to an app user, false if external contact';
COMMENT ON COLUMN contacts.category_custom_text IS 'Custom text for "Other" category (only used when category_id is "other")';
