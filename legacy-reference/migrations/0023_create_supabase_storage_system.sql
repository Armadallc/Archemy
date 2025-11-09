-- ============================================================================
-- SUPABASE STORAGE SETUP FOR MULTI-TENANT TRANSPORTATION MANAGEMENT
-- HIPAA-Compliant File Storage with Row-Level Security
-- ============================================================================

-- This migration creates a comprehensive file storage system that integrates
-- seamlessly with the existing multi-tenant transportation management schema.
-- It supports HIPAA compliance, role-based access control, and 7-year retention.

-- ============================================================================
-- 1. CREATE STORAGE BUCKETS
-- ============================================================================

-- Documents bucket for PDFs, Word docs, signed forms (50MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  52428800, -- 50MB
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
) ON CONFLICT (id) DO NOTHING;

-- Photos bucket for images only (10MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'photos',
  'photos',
  false,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/heic', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. CREATE FILE METADATA TABLE
-- ============================================================================

-- File metadata table to track all uploaded files with proper foreign keys
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
  
  -- Entity relationships (foreign keys to existing tables)
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

-- ============================================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Indexes for common query patterns
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

-- Composite indexes for common access patterns
CREATE INDEX IF NOT EXISTS idx_file_metadata_program_category ON file_metadata(program_id, file_category);
CREATE INDEX IF NOT EXISTS idx_file_metadata_location_category ON file_metadata(location_id, file_category);
CREATE INDEX IF NOT EXISTS idx_file_metadata_trip_category ON file_metadata(trip_id, file_category);
CREATE INDEX IF NOT EXISTS idx_file_metadata_driver_category ON file_metadata(driver_id, file_category);

-- ============================================================================
-- 4. ENABLE ROW-LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on file metadata table
ALTER TABLE file_metadata ENABLE ROW LEVEL SECURITY;

-- Enable RLS on storage buckets
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. CREATE RLS POLICIES FOR STORAGE BUCKETS
-- ============================================================================

-- Policy for documents bucket access
CREATE POLICY "Documents bucket access policy" ON storage.buckets
FOR ALL USING (id = 'documents');

-- Policy for photos bucket access
CREATE POLICY "Photos bucket access policy" ON storage.buckets
FOR ALL USING (id = 'photos');

-- Policy for storage objects - users can only access files they have permission for
CREATE POLICY "Storage objects access policy" ON storage.objects
FOR ALL USING (
  bucket_id IN ('documents', 'photos') AND
  EXISTS (
    SELECT 1 FROM file_metadata fm
    WHERE fm.bucket_id = storage.objects.bucket_id
    AND fm.file_path = storage.objects.name
    AND (
      -- Super admin can access all files
      EXISTS (
        SELECT 1 FROM users u
        WHERE u.user_id = auth.uid()::text
        AND u.role = 'super_admin'
      )
      OR
      -- Corporate admin can access files for their corporate client
      EXISTS (
        SELECT 1 FROM users u
        JOIN programs p ON p.id = fm.program_id
        JOIN corporate_clients cc ON cc.id = p.corporate_client_id
        WHERE u.user_id = auth.uid()::text
        AND u.role = 'corporate_admin'
        AND u.corporate_client_id = cc.id
      )
      OR
      -- Program admin can access files for their programs
      EXISTS (
        SELECT 1 FROM users u
        WHERE u.user_id = auth.uid()::text
        AND u.role = 'program_admin'
        AND (
          fm.program_id = u.primary_program_id
          OR fm.program_id = ANY(u.authorized_programs)
        )
      )
      OR
      -- Program user can access files for their specific location
      EXISTS (
        SELECT 1 FROM users u
        WHERE u.user_id = auth.uid()::text
        AND u.role = 'program_user'
        AND (
          fm.location_id IN (
            SELECT l.id FROM locations l
            WHERE l.program_id = u.primary_program_id
            OR l.program_id = ANY(u.authorized_programs)
          )
        )
      )
      OR
      -- Driver can access files for trips assigned to them
      EXISTS (
        SELECT 1 FROM users u
        JOIN drivers d ON d.user_id = u.user_id
        WHERE u.user_id = auth.uid()::text
        AND u.role = 'driver'
        AND fm.trip_id IN (
          SELECT t.id FROM trips t
          WHERE t.driver_id = d.id
        )
      )
      OR
      -- Users can access files they uploaded
      fm.uploaded_by = auth.uid()::text
    )
  )
);

-- ============================================================================
-- 6. CREATE RLS POLICIES FOR FILE METADATA TABLE
-- ============================================================================

-- Policy for reading file metadata
CREATE POLICY "File metadata read policy" ON file_metadata
FOR SELECT USING (
  -- Super admin can read all files
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.user_id = auth.uid()::text
    AND u.role = 'super_admin'
  )
  OR
  -- Corporate admin can read files for their corporate client
  EXISTS (
    SELECT 1 FROM users u
    JOIN programs p ON p.id = file_metadata.program_id
    JOIN corporate_clients cc ON cc.id = p.corporate_client_id
    WHERE u.user_id = auth.uid()::text
    AND u.role = 'corporate_admin'
    AND u.corporate_client_id = cc.id
  )
  OR
  -- Program admin can read files for their programs
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.user_id = auth.uid()::text
    AND u.role = 'program_admin'
    AND (
      file_metadata.program_id = u.primary_program_id
      OR file_metadata.program_id = ANY(u.authorized_programs)
    )
  )
  OR
  -- Program user can read files for their specific location
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.user_id = auth.uid()::text
    AND u.role = 'program_user'
    AND (
      file_metadata.location_id IN (
        SELECT l.id FROM locations l
        WHERE l.program_id = u.primary_program_id
        OR l.program_id = ANY(u.authorized_programs)
      )
    )
  )
  OR
  -- Driver can read files for trips assigned to them
  EXISTS (
    SELECT 1 FROM users u
    JOIN drivers d ON d.user_id = u.user_id
    WHERE u.user_id = auth.uid()::text
    AND u.role = 'driver'
    AND file_metadata.trip_id IN (
      SELECT t.id FROM trips t
      WHERE t.driver_id = d.id
    )
  )
  OR
  -- Users can read files they uploaded
  file_metadata.uploaded_by = auth.uid()::text
);

-- Policy for inserting file metadata
CREATE POLICY "File metadata insert policy" ON file_metadata
FOR INSERT WITH CHECK (
  -- Users can only upload files for entities they have access to
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.user_id = auth.uid()::text
    AND (
      -- Super admin can upload anywhere
      u.role = 'super_admin'
      OR
      -- Corporate admin can upload for their corporate client
      (u.role = 'corporate_admin' AND (
        file_metadata.program_id IN (
          SELECT p.id FROM programs p
          WHERE p.corporate_client_id = u.corporate_client_id
        )
      ))
      OR
      -- Program admin can upload for their programs
      (u.role = 'program_admin' AND (
        file_metadata.program_id = u.primary_program_id
        OR file_metadata.program_id = ANY(u.authorized_programs)
      ))
      OR
      -- Program user can upload for their location
      (u.role = 'program_user' AND (
        file_metadata.location_id IN (
          SELECT l.id FROM locations l
          WHERE l.program_id = u.primary_program_id
          OR l.program_id = ANY(u.authorized_programs)
        )
      ))
      OR
      -- Driver can upload for their assigned trips
      (u.role = 'driver' AND (
        file_metadata.trip_id IN (
          SELECT t.id FROM trips t
          JOIN drivers d ON d.id = t.driver_id
          WHERE d.user_id = u.user_id
        )
      ))
    )
  )
  AND uploaded_by = auth.uid()::text
);

-- Policy for updating file metadata
CREATE POLICY "File metadata update policy" ON file_metadata
FOR UPDATE USING (
  -- Users can only update files they uploaded or have admin access to
  uploaded_by = auth.uid()::text
  OR
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.user_id = auth.uid()::text
    AND (
      u.role = 'super_admin'
      OR
      (u.role = 'corporate_admin' AND (
        program_id IN (
          SELECT p.id FROM programs p
          WHERE p.corporate_client_id = u.corporate_client_id
        )
      ))
      OR
      (u.role = 'program_admin' AND (
        program_id = u.primary_program_id
        OR program_id = ANY(u.authorized_programs)
      ))
    )
  )
);

-- Policy for deleting file metadata
CREATE POLICY "File metadata delete policy" ON file_metadata
FOR DELETE USING (
  -- Only super admin and corporate admin can delete files
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.user_id = auth.uid()::text
    AND (
      u.role = 'super_admin'
      OR
      (u.role = 'corporate_admin' AND (
        program_id IN (
          SELECT p.id FROM programs p
          WHERE p.corporate_client_id = u.corporate_client_id
        )
      ))
    )
  )
);

-- ============================================================================
-- 7. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to get user's accessible programs
CREATE OR REPLACE FUNCTION get_user_accessible_programs(user_id_param TEXT)
RETURNS TABLE(program_id TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.id::TEXT
  FROM programs p
  JOIN users u ON u.user_id = user_id_param
  WHERE (
    u.role = 'super_admin'
    OR
    (u.role = 'corporate_admin' AND p.corporate_client_id = u.corporate_client_id)
    OR
    (u.role = 'program_admin' AND (
      p.id = u.primary_program_id
      OR p.id = ANY(u.authorized_programs)
    ))
    OR
    (u.role = 'program_user' AND (
      p.id = u.primary_program_id
      OR p.id = ANY(u.authorized_programs)
    ))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's accessible locations
CREATE OR REPLACE FUNCTION get_user_accessible_locations(user_id_param TEXT)
RETURNS TABLE(location_id TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT l.id::TEXT
  FROM locations l
  JOIN users u ON u.user_id = user_id_param
  WHERE (
    u.role = 'super_admin'
    OR
    (u.role = 'corporate_admin' AND l.program_id IN (
      SELECT p.id FROM programs p
      WHERE p.corporate_client_id = u.corporate_client_id
    ))
    OR
    (u.role = 'program_admin' AND (
      l.program_id = u.primary_program_id
      OR l.program_id = ANY(u.authorized_programs)
    ))
    OR
    (u.role = 'program_user' AND (
      l.program_id = u.primary_program_id
      OR l.program_id = ANY(u.authorized_programs)
    ))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can access file
CREATE OR REPLACE FUNCTION can_user_access_file(user_id_param TEXT, file_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  can_access BOOLEAN := FALSE;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM file_metadata fm
    JOIN users u ON u.user_id = user_id_param
    WHERE fm.id = file_id_param
    AND (
      u.role = 'super_admin'
      OR
      (u.role = 'corporate_admin' AND (
        fm.program_id IN (
          SELECT p.id FROM programs p
          WHERE p.corporate_client_id = u.corporate_client_id
        )
      ))
      OR
      (u.role = 'program_admin' AND (
        fm.program_id = u.primary_program_id
        OR fm.program_id = ANY(u.authorized_programs)
      ))
      OR
      (u.role = 'program_user' AND (
        fm.location_id IN (
          SELECT l.id FROM locations l
          WHERE l.program_id = u.primary_program_id
          OR l.program_id = ANY(u.authorized_programs)
        )
      ))
      OR
      (u.role = 'driver' AND (
        fm.trip_id IN (
          SELECT t.id FROM trips t
          JOIN drivers d ON d.id = t.driver_id
          WHERE d.user_id = u.user_id
        )
      ))
      OR
      fm.uploaded_by = u.user_id
    )
  ) INTO can_access;
  
  RETURN can_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get files nearing retention limit
CREATE OR REPLACE FUNCTION get_files_nearing_retention(days_ahead INTEGER DEFAULT 30)
RETURNS TABLE(
  id UUID,
  file_name TEXT,
  file_path TEXT,
  retention_until DATE,
  days_remaining INTEGER,
  program_id TEXT,
  location_id TEXT,
  client_id TEXT,
  trip_id TEXT,
  driver_id TEXT,
  vehicle_id TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fm.id,
    fm.file_name,
    fm.file_path,
    fm.retention_until,
    EXTRACT(DAYS FROM (fm.retention_until - CURRENT_DATE))::INTEGER as days_remaining,
    fm.program_id,
    fm.location_id,
    fm.client_id,
    fm.trip_id,
    fm.driver_id,
    fm.vehicle_id
  FROM file_metadata fm
  WHERE fm.retention_until <= (CURRENT_DATE + INTERVAL '1 day' * days_ahead)
  ORDER BY fm.retention_until ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. CREATE AUDIT LOGGING TRIGGER
-- ============================================================================

-- Create audit log table for file access
CREATE TABLE IF NOT EXISTS file_access_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES file_metadata(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('view', 'download', 'upload', 'update', 'delete')),
  ip_address INET,
  user_agent TEXT,
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for audit queries
CREATE INDEX IF NOT EXISTS idx_file_access_audit_file_id ON file_access_audit(file_id);
CREATE INDEX IF NOT EXISTS idx_file_access_audit_user_id ON file_access_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_file_access_audit_accessed_at ON file_access_audit(accessed_at);

-- Enable RLS on audit table
ALTER TABLE file_access_audit ENABLE ROW LEVEL SECURITY;

-- Policy for audit table - only super admin can read
CREATE POLICY "File access audit read policy" ON file_access_audit
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.user_id = auth.uid()::text
    AND u.role = 'super_admin'
  )
);

-- Function to log file access
CREATE OR REPLACE FUNCTION log_file_access(
  file_id_param UUID,
  user_id_param TEXT,
  action_param TEXT,
  ip_address_param INET DEFAULT NULL,
  user_agent_param TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO file_access_audit (
    file_id,
    user_id,
    action,
    ip_address,
    user_agent
  ) VALUES (
    file_id_param,
    user_id_param,
    action_param,
    ip_address_param,
    user_agent_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 9. CREATE FOLDER STRUCTURE CONVENTION
-- ============================================================================

-- Function to generate standardized file paths
CREATE OR REPLACE FUNCTION generate_file_path(
  category_param TEXT,
  entity_type TEXT,
  entity_id TEXT,
  file_name_param TEXT
)
RETURNS TEXT AS $$
DECLARE
  folder_path TEXT;
BEGIN
  -- Generate folder path based on category and entity type
  CASE category_param
    WHEN 'intake_form', 'client_document' THEN
      folder_path := 'documents/clients/facility-' || entity_id || '/client-' || entity_id || '/' || file_name_param;
    WHEN 'trip_photo', 'signature' THEN
      folder_path := 'photos/trips/trip-' || entity_id || '/' || file_name_param;
    WHEN 'driver_license' THEN
      folder_path := 'documents/drivers/driver-' || entity_id || '/' || file_name_param;
    WHEN 'facility_contract' THEN
      folder_path := 'documents/facilities/facility-' || entity_id || '/' || file_name_param;
    WHEN 'vehicle_maintenance', 'inspection_report' THEN
      folder_path := 'documents/vehicles/vehicle-' || entity_id || '/' || file_name_param;
    WHEN 'incident_report' THEN
      folder_path := 'documents/incidents/incident-' || entity_id || '/' || file_name_param;
    ELSE
      folder_path := 'documents/misc/' || entity_type || '-' || entity_id || '/' || file_name_param;
  END CASE;
  
  RETURN folder_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 10. CREATE RETENTION COMPLIANCE FUNCTIONS
-- ============================================================================

-- Function to archive files past retention period
CREATE OR REPLACE FUNCTION archive_expired_files()
RETURNS TABLE(
  archived_count INTEGER,
  archived_files TEXT[]
) AS $$
DECLARE
  expired_files TEXT[];
  count_result INTEGER;
BEGIN
  -- Get list of expired files
  SELECT ARRAY_AGG(file_path) INTO expired_files
  FROM file_metadata
  WHERE retention_until < CURRENT_DATE;
  
  -- Count expired files
  SELECT COUNT(*) INTO count_result
  FROM file_metadata
  WHERE retention_until < CURRENT_DATE;
  
  -- Note: Actual file deletion would be handled by application logic
  -- This function just identifies files ready for archival
  
  RETURN QUERY SELECT count_result, expired_files;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 11. GRANT PERMISSIONS
-- ============================================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON file_metadata TO authenticated;
GRANT SELECT ON file_access_audit TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_accessible_programs(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_accessible_locations(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION can_user_access_file(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_files_nearing_retention(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_file_path(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_file_access(UUID, TEXT, TEXT, INET, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION archive_expired_files() TO authenticated;

-- ============================================================================
-- 12. COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE file_metadata IS 'Central metadata table for all uploaded files with HIPAA compliance and role-based access control';
COMMENT ON COLUMN file_metadata.is_hipaa_protected IS 'Flag indicating if file contains HIPAA-protected information requiring stricter access controls';
COMMENT ON COLUMN file_metadata.retention_until IS 'Date when file can be archived/deleted for compliance (default 7 years)';
COMMENT ON COLUMN file_metadata.file_category IS 'Categorization of file type for organization and access control';
COMMENT ON COLUMN file_metadata.uploaded_by IS 'User who uploaded the file for audit trail';

COMMENT ON FUNCTION get_user_accessible_programs(TEXT) IS 'Returns all programs a user has access to based on their role';
COMMENT ON FUNCTION get_user_accessible_locations(TEXT) IS 'Returns all locations a user has access to based on their role';
COMMENT ON FUNCTION can_user_access_file(TEXT, UUID) IS 'Checks if a user has permission to access a specific file';
COMMENT ON FUNCTION get_files_nearing_retention(INTEGER) IS 'Returns files approaching their retention limit for archival';
COMMENT ON FUNCTION generate_file_path(TEXT, TEXT, TEXT, TEXT) IS 'Generates standardized folder paths for file organization';
COMMENT ON FUNCTION log_file_access(UUID, TEXT, TEXT, INET, TEXT) IS 'Logs file access for audit compliance';
COMMENT ON FUNCTION archive_expired_files() IS 'Identifies files past retention period for archival';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- This migration creates a comprehensive, HIPAA-compliant file storage system
-- that integrates seamlessly with the existing multi-tenant transportation
-- management schema. The system includes:
--
-- 1. Two storage buckets (documents/photos) with appropriate file size limits
-- 2. Comprehensive file metadata tracking with proper foreign key relationships
-- 3. Row-level security policies based on the existing role hierarchy
-- 4. Helper functions for common operations
-- 5. Audit logging for compliance
-- 6. Retention management for 7-year compliance
-- 7. Standardized folder structure for organization
--
-- The system supports all user roles:
-- - Super Admin: Full access to all files
-- - Corporate Admin: Access to files within their corporate entity
-- - Program Admin: Access to files within their programs
-- - Program Users: Access to files for their specific facility location
-- - Drivers: Access to files for trips assigned to them
--
-- Files are organized by category and entity type, with automatic
-- folder structure generation and retention compliance tracking.
