-- Create new streamlined trips table
CREATE TABLE trips_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_number VARCHAR(50) UNIQUE NOT NULL,
  organization_id VARCHAR(50) NOT NULL REFERENCES organizations(id),
  client_id UUID NOT NULL REFERENCES clients_v2(id),
  driver_id UUID REFERENCES drivers_v2(id),
  service_area_id VARCHAR(50) REFERENCES service_areas(id),

  -- Trip details
  trip_type VARCHAR(20) NOT NULL DEFAULT 'one_way',
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled',

  -- Addresses
  pickup_address TEXT NOT NULL,
  dropoff_address TEXT NOT NULL,
  pickup_coordinates POINT,
  dropoff_coordinates POINT,

  -- Scheduling
  scheduled_pickup_time TIMESTAMP NOT NULL,
  scheduled_dropoff_time TIMESTAMP,
  scheduled_return_time TIMESTAMP,

  -- Actual times
  actual_pickup_time TIMESTAMP,
  actual_dropoff_time TIMESTAMP,
  actual_return_time TIMESTAMP,

  -- Trip details
  passenger_count INTEGER DEFAULT 1,
  special_requirements TEXT,
  notes TEXT,

  -- Status tracking
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern VARCHAR(50), -- 'daily', 'weekly', 'monthly'
  recurrence_end_date DATE,

  -- Metadata
  created_by VARCHAR(50) REFERENCES users(user_id),
  updated_by VARCHAR(50) REFERENCES users(user_id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_trips_v2_org ON trips_v2(organization_id);
CREATE INDEX idx_trips_v2_client ON trips_v2(client_id);
CREATE INDEX idx_trips_v2_driver ON trips_v2(driver_id);
CREATE INDEX idx_trips_v2_service_area ON trips_v2(service_area_id);
CREATE INDEX idx_trips_v2_trip_number ON trips_v2(trip_number);
CREATE INDEX idx_trips_v2_status ON trips_v2(status);
CREATE INDEX idx_trips_v2_scheduled_pickup ON trips_v2(scheduled_pickup_time);
CREATE INDEX idx_trips_v2_created_at ON trips_v2(created_at);
CREATE INDEX idx_trips_v2_active ON trips_v2(is_active);

-- Create composite indexes for common queries
CREATE INDEX idx_trips_v2_org_status ON trips_v2(organization_id, status);
CREATE INDEX idx_trips_v2_driver_status ON trips_v2(driver_id, status);
CREATE INDEX idx_trips_v2_client_org ON trips_v2(client_id, organization_id);
CREATE INDEX idx_trips_v2_scheduled_date ON trips_v2(scheduled_pickup_time, status);

-- Create spatial index for coordinates (if PostGIS is available)
-- CREATE INDEX idx_trips_v2_pickup_coords ON trips_v2 USING GIST (pickup_coordinates);
-- CREATE INDEX idx_trips_v2_dropoff_coords ON trips_v2 USING GIST (dropoff_coordinates);


