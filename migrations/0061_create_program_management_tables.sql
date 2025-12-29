-- ============================================================================
-- PROGRAM MANAGEMENT TABLES
-- Migration: 0061_create_program_management_tables.sql
-- Description: Creates tables for program licensures, staff certifications, 
--              forms, curriculum, and onboarding items
-- ============================================================================

-- ============================================================================
-- 1. PROGRAM LICENSURES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS program_licensures (
  id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  
  -- Hierarchy relationships
  program_id VARCHAR(50) NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  corporate_client_id VARCHAR(50) REFERENCES corporate_clients(id) ON DELETE CASCADE,
  
  -- License details
  license_type VARCHAR(255) NOT NULL,
  license_number VARCHAR(255) NOT NULL,
  issuing_authority VARCHAR(255),
  issue_date DATE,
  expiry_date DATE NOT NULL,
  renewal_reminder_days INTEGER DEFAULT 30,
  notes TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(50) REFERENCES users(user_id) ON DELETE SET NULL,
  updated_by VARCHAR(50) REFERENCES users(user_id) ON DELETE SET NULL,
  
  CONSTRAINT fk_program_licensures_program FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
  CONSTRAINT fk_program_licensures_corporate_client FOREIGN KEY (corporate_client_id) REFERENCES corporate_clients(id) ON DELETE CASCADE
);

-- Indexes for program_licensures
CREATE INDEX IF NOT EXISTS idx_program_licensures_program_id ON program_licensures(program_id);
CREATE INDEX IF NOT EXISTS idx_program_licensures_corporate_client_id ON program_licensures(corporate_client_id);
CREATE INDEX IF NOT EXISTS idx_program_licensures_expiry_date ON program_licensures(expiry_date);
CREATE INDEX IF NOT EXISTS idx_program_licensures_is_active ON program_licensures(is_active);

-- ============================================================================
-- 2. STAFF CERTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS staff_certifications (
  id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  
  -- Hierarchy relationships
  program_id VARCHAR(50) NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  corporate_client_id VARCHAR(50) REFERENCES corporate_clients(id) ON DELETE CASCADE,
  
  -- Staff member
  staff_member_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  
  -- Certification details
  certification_type VARCHAR(100) NOT NULL, -- cpr, first_aid, medication, behavioral, other
  certification_name VARCHAR(255) NOT NULL,
  issuing_organization VARCHAR(255),
  certificate_number VARCHAR(255),
  issue_date DATE,
  expiry_date DATE NOT NULL,
  notes TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(50) REFERENCES users(user_id) ON DELETE SET NULL,
  updated_by VARCHAR(50) REFERENCES users(user_id) ON DELETE SET NULL,
  
  CONSTRAINT fk_staff_certifications_program FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
  CONSTRAINT fk_staff_certifications_corporate_client FOREIGN KEY (corporate_client_id) REFERENCES corporate_clients(id) ON DELETE CASCADE,
  CONSTRAINT fk_staff_certifications_staff_member FOREIGN KEY (staff_member_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Indexes for staff_certifications
CREATE INDEX IF NOT EXISTS idx_staff_certifications_program_id ON staff_certifications(program_id);
CREATE INDEX IF NOT EXISTS idx_staff_certifications_corporate_client_id ON staff_certifications(corporate_client_id);
CREATE INDEX IF NOT EXISTS idx_staff_certifications_staff_member_id ON staff_certifications(staff_member_id);
CREATE INDEX IF NOT EXISTS idx_staff_certifications_expiry_date ON staff_certifications(expiry_date);
CREATE INDEX IF NOT EXISTS idx_staff_certifications_is_active ON staff_certifications(is_active);

-- ============================================================================
-- 3. PROGRAM FORMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS program_forms (
  id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  
  -- Hierarchy relationships
  program_id VARCHAR(50) NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  corporate_client_id VARCHAR(50) REFERENCES corporate_clients(id) ON DELETE CASCADE,
  
  -- Form details
  form_name VARCHAR(255) NOT NULL,
  form_type VARCHAR(100) NOT NULL, -- intake, assessment, treatment_plan, progress_note, discharge, other
  description TEXT,
  version VARCHAR(50) DEFAULT '1.0',
  document_url TEXT,
  file_path TEXT, -- For uploaded files
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(50) REFERENCES users(user_id) ON DELETE SET NULL,
  updated_by VARCHAR(50) REFERENCES users(user_id) ON DELETE SET NULL,
  
  CONSTRAINT fk_program_forms_program FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
  CONSTRAINT fk_program_forms_corporate_client FOREIGN KEY (corporate_client_id) REFERENCES corporate_clients(id) ON DELETE CASCADE
);

-- Indexes for program_forms
CREATE INDEX IF NOT EXISTS idx_program_forms_program_id ON program_forms(program_id);
CREATE INDEX IF NOT EXISTS idx_program_forms_corporate_client_id ON program_forms(corporate_client_id);
CREATE INDEX IF NOT EXISTS idx_program_forms_form_type ON program_forms(form_type);
CREATE INDEX IF NOT EXISTS idx_program_forms_is_active ON program_forms(is_active);

-- ============================================================================
-- 4. PROGRAM CURRICULUM TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS program_curriculum (
  id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  
  -- Hierarchy relationships
  program_id VARCHAR(50) NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  corporate_client_id VARCHAR(50) REFERENCES corporate_clients(id) ON DELETE CASCADE,
  
  -- Curriculum details
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL, -- treatment, assessment, documentation, training, policy, other
  description TEXT,
  document_url TEXT,
  file_path TEXT, -- For uploaded files
  version VARCHAR(50) DEFAULT '1.0',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(50) REFERENCES users(user_id) ON DELETE SET NULL,
  updated_by VARCHAR(50) REFERENCES users(user_id) ON DELETE SET NULL,
  
  CONSTRAINT fk_program_curriculum_program FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
  CONSTRAINT fk_program_curriculum_corporate_client FOREIGN KEY (corporate_client_id) REFERENCES corporate_clients(id) ON DELETE CASCADE
);

-- Indexes for program_curriculum
CREATE INDEX IF NOT EXISTS idx_program_curriculum_program_id ON program_curriculum(program_id);
CREATE INDEX IF NOT EXISTS idx_program_curriculum_corporate_client_id ON program_curriculum(corporate_client_id);
CREATE INDEX IF NOT EXISTS idx_program_curriculum_category ON program_curriculum(category);
CREATE INDEX IF NOT EXISTS idx_program_curriculum_is_active ON program_curriculum(is_active);

-- ============================================================================
-- 5. PROGRAM ONBOARDING ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS program_onboarding_items (
  id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  
  -- Hierarchy relationships
  program_id VARCHAR(50) NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  corporate_client_id VARCHAR(50) REFERENCES corporate_clients(id) ON DELETE CASCADE,
  
  -- Onboarding item details
  item_type VARCHAR(100) NOT NULL, -- document, form, video, checklist, training, other
  title VARCHAR(255) NOT NULL,
  description TEXT,
  document_url TEXT,
  file_path TEXT, -- For uploaded files
  target_audience VARCHAR(50) NOT NULL DEFAULT 'both', -- staff, client, both
  is_required BOOLEAN DEFAULT true,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(50) REFERENCES users(user_id) ON DELETE SET NULL,
  updated_by VARCHAR(50) REFERENCES users(user_id) ON DELETE SET NULL,
  
  CONSTRAINT fk_program_onboarding_items_program FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
  CONSTRAINT fk_program_onboarding_items_corporate_client FOREIGN KEY (corporate_client_id) REFERENCES corporate_clients(id) ON DELETE CASCADE,
  CONSTRAINT chk_program_onboarding_items_target_audience CHECK (target_audience IN ('staff', 'client', 'both'))
);

-- Indexes for program_onboarding_items
CREATE INDEX IF NOT EXISTS idx_program_onboarding_items_program_id ON program_onboarding_items(program_id);
CREATE INDEX IF NOT EXISTS idx_program_onboarding_items_corporate_client_id ON program_onboarding_items(corporate_client_id);
CREATE INDEX IF NOT EXISTS idx_program_onboarding_items_item_type ON program_onboarding_items(item_type);
CREATE INDEX IF NOT EXISTS idx_program_onboarding_items_target_audience ON program_onboarding_items(target_audience);
CREATE INDEX IF NOT EXISTS idx_program_onboarding_items_is_active ON program_onboarding_items(is_active);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================
COMMENT ON TABLE program_licensures IS 'Tracks program licensures with expiry dates and renewal reminders';
COMMENT ON TABLE staff_certifications IS 'Tracks staff certifications and renewal dates by program';
COMMENT ON TABLE program_forms IS 'Manages program forms and document templates';
COMMENT ON TABLE program_curriculum IS 'Reference materials and curriculum documentation for programs';
COMMENT ON TABLE program_onboarding_items IS 'Onboarding workflows and documentation for staff and clients';

