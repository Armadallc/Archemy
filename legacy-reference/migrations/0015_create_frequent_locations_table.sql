-- Create frequent_locations table
CREATE TABLE frequent_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id VARCHAR(50) NOT NULL REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  street_address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(50) NOT NULL,
  zip_code VARCHAR(10),
  full_address TEXT NOT NULL,
  location_type VARCHAR(50) DEFAULT 'other', -- 'service_area', 'hospital', 'court', 'grocery', 'other'
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_frequent_locations_org ON frequent_locations(organization_id);
CREATE INDEX idx_frequent_locations_type ON frequent_locations(location_type);
CREATE INDEX idx_frequent_locations_usage ON frequent_locations(usage_count DESC);
CREATE INDEX idx_frequent_locations_active ON frequent_locations(is_active);

-- Insert sample frequent locations for Monarch organizations
INSERT INTO frequent_locations (organization_id, name, description, street_address, city, state, zip_code, full_address, location_type, usage_count) VALUES
-- Monarch Competency locations
('monarch_competency', 'Lowell North', 'Primary service area location', '1234 Lowell Blvd', 'Denver', 'CO', '80204', '1234 Lowell Blvd, Denver, CO 80204', 'service_area', 50),
('monarch_competency', 'Capitol Hill Mental Health Center', 'Mental health facility', '5678 Capitol Hill Ave', 'Denver', 'CO', '80203', '5678 Capitol Hill Ave, Denver, CO 80203', 'service_area', 30),
('monarch_competency', 'Denver County Court', 'Court appearances', '1437 Bannock St', 'Denver', 'CO', '80202', '1437 Bannock St, Denver, CO 80202', 'court', 25),
('monarch_competency', 'King Soopers Grocery', 'Grocery shopping', '1234 Colfax Ave', 'Denver', 'CO', '80218', '1234 Colfax Ave, Denver, CO 80218', 'grocery', 40),

-- Monarch Mental Health locations
('monarch_mental_health', 'Capitol Hill Mental Health Center', 'Primary mental health facility', '5678 Capitol Hill Ave', 'Denver', 'CO', '80203', '5678 Capitol Hill Ave, Denver, CO 80203', 'service_area', 60),
('monarch_mental_health', 'Denver Health Medical Center', 'Medical appointments', '777 Bannock St', 'Denver', 'CO', '80204', '777 Bannock St, Denver, CO 80204', 'hospital', 35),
('monarch_mental_health', 'Safeway Grocery', 'Grocery shopping', '2345 Broadway', 'Denver', 'CO', '80205', '2345 Broadway, Denver, CO 80205', 'grocery', 20),

-- Monarch Sober Living locations
('monarch_sober_living', 'Sober Living House 1', 'Primary sober living facility', '3456 Park Ave', 'Denver', 'CO', '80206', '3456 Park Ave, Denver, CO 80206', 'service_area', 45),
('monarch_sober_living', 'Sober Living House 2', 'Secondary sober living facility', '4567 Washington St', 'Denver', 'CO', '80207', '4567 Washington St, Denver, CO 80207', 'service_area', 35),
('monarch_sober_living', 'AA Meeting Hall', '12-step meetings', '5678 Lincoln St', 'Denver', 'CO', '80208', '5678 Lincoln St, Denver, CO 80208', 'other', 15),

-- Monarch Launch locations
('monarch_launch', 'Dakota Launch Center', 'Primary launch facility', '6581 E. Dakota Ave', 'Denver', 'CO', '80224', '6581 E. Dakota Ave, Denver, CO 80224', 'service_area', 25),
('monarch_launch', 'Community College', 'Educational programs', '1111 W Colfax Ave', 'Denver', 'CO', '80204', '1111 W Colfax Ave, Denver, CO 80204', 'other', 10);


