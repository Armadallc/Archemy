-- Create new streamlined clients table
CREATE TABLE clients_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_number VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  emergency_contact VARCHAR(100),
  emergency_phone VARCHAR(20),
  medical_notes TEXT,
  mobility_requirements TEXT,
  is_active BOOLEAN DEFAULT true,
  organization_id VARCHAR(50) NOT NULL REFERENCES organizations(id),
  service_area_id VARCHAR(50) NOT NULL REFERENCES service_areas(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_clients_v2_org ON clients_v2(organization_id);
CREATE INDEX idx_clients_v2_service_area ON clients_v2(service_area_id);
CREATE INDEX idx_clients_v2_client_number ON clients_v2(client_number);
CREATE INDEX idx_clients_v2_name ON clients_v2(first_name, last_name);
CREATE INDEX idx_clients_v2_email ON clients_v2(email);
CREATE INDEX idx_clients_v2_active ON clients_v2(is_active);


