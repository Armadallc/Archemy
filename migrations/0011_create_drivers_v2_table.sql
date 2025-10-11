-- Create new streamlined drivers table
CREATE TABLE drivers_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  license_number VARCHAR(50) NOT NULL,
  license_expiry DATE,
  vehicle_info TEXT,
  emergency_contact VARCHAR(100),
  emergency_phone VARCHAR(20),
  is_available BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  primary_organization_id VARCHAR(50) NOT NULL REFERENCES organizations(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX idx_drivers_v2_org ON drivers_v2(primary_organization_id);
CREATE INDEX idx_drivers_v2_employee_id ON drivers_v2(employee_id);
CREATE INDEX idx_drivers_v2_email ON drivers_v2(email);

-- Create table for organization access
CREATE TABLE driver_organization_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers_v2(id) ON DELETE CASCADE,
  organization_id VARCHAR(50) NOT NULL REFERENCES organizations(id),
  granted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(driver_id, organization_id)
);

-- Create index for performance
CREATE INDEX idx_driver_org_access_driver ON driver_organization_access(driver_id);
CREATE INDEX idx_driver_org_access_org ON driver_organization_access(organization_id);


