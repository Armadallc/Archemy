-- ============================================================================
-- Migration 012: Create Contact Categories Table
-- ============================================================================
-- Purpose: Create table for predefined contact categories
-- Created: 2025-01-17
-- Dependencies: None

-- Create contact_categories table
CREATE TABLE IF NOT EXISTS contact_categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    allows_custom_text BOOLEAN DEFAULT false, -- For "Other" category
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert predefined categories (8 categories)
INSERT INTO contact_categories (id, name, allows_custom_text) VALUES
    ('recovery', 'Recovery', false),
    ('comp_rest', 'Comp/Rest', false),
    ('liaison', 'Liaison', false),
    ('case_management', 'Case Management', false),
    ('referrals', 'Referrals', false),
    ('clinical', 'Clinical', false),
    ('cma', 'CMA', false),
    ('other', 'Other', true) -- Allows custom text input
ON CONFLICT (id) DO NOTHING;

-- Add comment to table
COMMENT ON TABLE contact_categories IS 'Predefined categories for contacts. The "other" category allows custom text input.';

