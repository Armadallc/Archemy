-- Create new streamlined service areas table
CREATE TABLE service_areas_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_area_number VARCHAR(50) UNIQUE NOT NULL,
  organization_id VARCHAR(50) NOT NULL REFERENCES organizations(id),
  nickname VARCHAR(100) NOT NULL,
  description TEXT,

  -- Address fields
  street_address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(10),
  full_address TEXT,

  -- Geographic data
  boundary_coordinates JSONB, -- Store as JSON for flexibility
  center_coordinates POINT, -- PostGIS point for center

  -- Operational data
  capacity INTEGER DEFAULT 0,
  current_occupancy INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  -- Contact information
  contact_phone VARCHAR(20),
  contact_email VARCHAR(255),
  emergency_contact VARCHAR(100),
  emergency_phone VARCHAR(20),

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_service_areas_v2_org ON service_areas_v2(organization_id);
CREATE INDEX idx_service_areas_v2_number ON service_areas_v2(service_area_number);
CREATE INDEX idx_service_areas_v2_nickname ON service_areas_v2(nickname);
CREATE INDEX idx_service_areas_v2_active ON service_areas_v2(is_active);
CREATE INDEX idx_service_areas_v2_city_state ON service_areas_v2(city, state);
CREATE INDEX idx_service_areas_v2_center_coords ON service_areas_v2 USING GIST(center_coordinates);

-- Create composite indexes for common queries
CREATE INDEX idx_service_areas_v2_org_active ON service_areas_v2(organization_id, is_active);
CREATE INDEX idx_service_areas_v2_location ON service_areas_v2(city, state, zip_code);


