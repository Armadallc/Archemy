/**
 * SIMPLIFIED STORAGE MIGRATION
 * Apply this step by step through Supabase SQL Editor
 */

// Step 1: Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  52428800, -- 50MB
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'photos',
  'photos',
  false,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/heic', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

// Step 2: Create file metadata table
CREATE TABLE IF NOT EXISTS file_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- File identification
  bucket_id TEXT NOT NULL REFERENCES storage.buckets(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  
  -- File categorization
  file_category TEXT NOT NULL CHECK (file_category IN (
    'intake_form', 'trip_photo', 'driver_license', 'facility_contract', 
    'vehicle_maintenance', 'incident_report', 'client_document', 
    'insurance_document', 'inspection_report', 'signature', 'other'
  )),
  
  -- HIPAA compliance
  is_hipaa_protected BOOLEAN DEFAULT false,
  retention_until DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '7 years'),
  
  -- Entity relationships
  program_id VARCHAR(50) REFERENCES programs(id) ON DELETE CASCADE,
  location_id VARCHAR(50) REFERENCES locations(id) ON DELETE CASCADE,
  client_id VARCHAR(50) REFERENCES clients(id) ON DELETE CASCADE,
  trip_id VARCHAR(50) REFERENCES trips(id) ON DELETE CASCADE,
  driver_id VARCHAR(50) REFERENCES drivers(id) ON DELETE CASCADE,
  vehicle_id VARCHAR(50) REFERENCES vehicles(id) ON DELETE CASCADE,
  user_id VARCHAR(50) REFERENCES users(user_id) ON DELETE CASCADE,
  
  -- Upload tracking
  uploaded_by VARCHAR(50) NOT NULL REFERENCES users(user_id),
  upload_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT file_metadata_program_check CHECK (
    (program_id IS NOT NULL) OR 
    (location_id IS NOT NULL) OR 
    (client_id IS NOT NULL) OR 
    (trip_id IS NOT NULL) OR 
    (driver_id IS NOT NULL) OR 
    (vehicle_id IS NOT NULL)
  ),
  
  -- Ensure file path uniqueness within bucket
  CONSTRAINT file_metadata_path_unique UNIQUE (bucket_id, file_path)
);

// Step 3: Create indexes
CREATE INDEX IF NOT EXISTS idx_file_metadata_program_id ON file_metadata(program_id);
CREATE INDEX IF NOT EXISTS idx_file_metadata_location_id ON file_metadata(location_id);
CREATE INDEX IF NOT EXISTS idx_file_metadata_client_id ON file_metadata(client_id);
CREATE INDEX IF NOT EXISTS idx_file_metadata_trip_id ON file_metadata(trip_id);
CREATE INDEX IF NOT EXISTS idx_file_metadata_driver_id ON file_metadata(driver_id);
CREATE INDEX IF NOT EXISTS idx_file_metadata_vehicle_id ON file_metadata(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_file_metadata_user_id ON file_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_file_metadata_uploaded_by ON file_metadata(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_file_metadata_category ON file_metadata(file_category);
CREATE INDEX IF NOT EXISTS idx_file_metadata_hipaa ON file_metadata(is_hipaa_protected);
CREATE INDEX IF NOT EXISTS idx_file_metadata_retention ON file_metadata(retention_until);
CREATE INDEX IF NOT EXISTS idx_file_metadata_created_at ON file_metadata(created_at);

// Step 4: Enable RLS
ALTER TABLE file_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

// Step 5: Create basic RLS policies
CREATE POLICY "Documents bucket access policy" ON storage.buckets
FOR ALL USING (id = 'documents');

CREATE POLICY "Photos bucket access policy" ON storage.buckets
FOR ALL USING (id = 'photos');

-- Basic file metadata read policy (simplified for now)
CREATE POLICY "File metadata read policy" ON file_metadata
FOR SELECT USING (
  -- Super admin can read all files
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.user_id = auth.uid()::text
    AND u.role = 'super_admin'
  )
  OR
  -- Users can read files they uploaded
  uploaded_by = auth.uid()::text
);

-- Basic file metadata insert policy
CREATE POLICY "File metadata insert policy" ON file_metadata
FOR INSERT WITH CHECK (
  uploaded_by = auth.uid()::text
);

-- Basic file metadata update policy
CREATE POLICY "File metadata update policy" ON file_metadata
FOR UPDATE USING (
  uploaded_by = auth.uid()::text
);

-- Basic file metadata delete policy (only super admin)
CREATE POLICY "File metadata delete policy" ON file_metadata
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.user_id = auth.uid()::text
    AND u.role = 'super_admin'
  )
);

// Step 6: Create file access audit table
CREATE TABLE IF NOT EXISTS file_access_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES file_metadata(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('view', 'download', 'upload', 'update', 'delete')),
  ip_address INET,
  user_agent TEXT,
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_file_access_audit_file_id ON file_access_audit(file_id);
CREATE INDEX IF NOT EXISTS idx_file_access_audit_user_id ON file_access_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_file_access_audit_accessed_at ON file_access_audit(accessed_at);

ALTER TABLE file_access_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "File access audit read policy" ON file_access_audit
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.user_id = auth.uid()::text
    AND u.role = 'super_admin'
  )
);

// Step 7: Grant permissions
GRANT SELECT, INSERT, UPDATE ON file_metadata TO authenticated;
GRANT SELECT ON file_access_audit TO authenticated;
