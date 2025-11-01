-- Create new streamlined vehicles table
CREATE TABLE vehicles_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_number VARCHAR(50) UNIQUE NOT NULL,
  organization_id VARCHAR(50) NOT NULL REFERENCES organizations(id),
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  color VARCHAR(50),
  license_plate VARCHAR(20) UNIQUE,
  vin VARCHAR(17),
  registration_expiry DATE,
  insurance_expiry DATE,
  capacity INTEGER DEFAULT 8,
  vehicle_type VARCHAR(50) DEFAULT 'van',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_vehicles_v2_org ON vehicles_v2(organization_id);
CREATE INDEX idx_vehicles_v2_vehicle_number ON vehicles_v2(vehicle_number);
CREATE INDEX idx_vehicles_v2_license_plate ON vehicles_v2(license_plate);
CREATE INDEX idx_vehicles_v2_make_model ON vehicles_v2(make, model);
CREATE INDEX idx_vehicles_v2_active ON vehicles_v2(is_active);
CREATE INDEX idx_vehicles_v2_type ON vehicles_v2(vehicle_type);

-- Create composite indexes for common queries
CREATE INDEX idx_vehicles_v2_org_active ON vehicles_v2(organization_id, is_active);
CREATE INDEX idx_vehicles_v2_org_type ON vehicles_v2(organization_id, vehicle_type);

