# Vehicles Table Setup for Supabase

**EXECUTE THIS SQL**
```sql
-- Create vehicles table
CREATE TABLE vehicles (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    year INTEGER NOT NULL,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    color TEXT NOT NULL,
    license_plate TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create driver_vehicle_assignments table
CREATE TABLE driver_vehicle_assignments (
    id TEXT PRIMARY KEY,
    driver_id TEXT NOT NULL,
    vehicle_id TEXT NOT NULL,
    assigned_date DATE NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(driver_id, vehicle_id)
);

-- Insert sample vehicles
INSERT INTO vehicles (id, organization_id, year, make, model, color, license_plate, is_active) VALUES
('vehicle_001', 'monarch_competency', 2020, 'Honda', 'Pilot', 'White', 'MC-001', true),
('vehicle_002', 'monarch_competency', 2019, 'Toyota', 'Sienna', 'Silver', 'MC-002', true),
('vehicle_003', 'monarch_competency', 2021, 'Ford', 'Transit', 'Blue', 'MC-003', true),
('vehicle_004', 'monarch_competency', 2018, 'Chevrolet', 'Express', 'Gray', 'MC-004', true),
('vehicle_005', 'monarch_mental_health', 2022, 'Honda', 'Odyssey', 'Black', 'MMH-001', true),
('vehicle_006', 'monarch_mental_health', 2020, 'Toyota', 'Highlander', 'Red', 'MMH-002', true),
('vehicle_007', 'monarch_mental_health', 2019, 'Nissan', 'NV200', 'White', 'MMH-003', true),
('vehicle_008', 'monarch_sober_living', 2021, 'Ford', 'Transit Connect', 'Blue', 'MSL-001', true),
('vehicle_009', 'monarch_sober_living', 2020, 'Honda', 'Ridgeline', 'Green', 'MSL-002', true),
('vehicle_010', 'monarch_sober_living', 2018, 'Toyota', 'Prius', 'Silver', 'MSL-003', true),
('vehicle_011', 'monarch_launch', 2022, 'Tesla', 'Model Y', 'White', 'ML-001', true),
('vehicle_012', 'monarch_launch', 2021, 'BMW', 'X3', 'Black', 'ML-002', true),
('vehicle_013', 'monarch_launch', 2020, 'Audi', 'Q5', 'Gray', 'ML-003', true);
```
