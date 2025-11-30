-- Create provider_information table for Super Admin Backoffice
CREATE TABLE IF NOT EXISTS provider_information (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id VARCHAR(50) UNIQUE NOT NULL,
  npi VARCHAR(10) UNIQUE NOT NULL,
  taxonomy_codes TEXT[],
  organization_name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  enrollment_status VARCHAR(50) DEFAULT 'active',
  effective_date DATE,
  termination_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_provider_information_provider_id ON provider_information(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_information_npi ON provider_information(npi);
CREATE INDEX IF NOT EXISTS idx_provider_information_organization_name ON provider_information(organization_name);
CREATE INDEX IF NOT EXISTS idx_provider_information_enrollment_status ON provider_information(enrollment_status);

-- Add comments for documentation
COMMENT ON TABLE provider_information IS 'Stores provider information for Super Admin Backoffice management';
COMMENT ON COLUMN provider_information.provider_id IS 'Unique provider identifier';
COMMENT ON COLUMN provider_information.npi IS 'National Provider Identifier (10 digits)';
COMMENT ON COLUMN provider_information.taxonomy_codes IS 'Array of healthcare taxonomy codes';
COMMENT ON COLUMN provider_information.organization_name IS 'Name of the healthcare organization';
COMMENT ON COLUMN provider_information.enrollment_status IS 'Current enrollment status (active, suspended, terminated, pending)';
