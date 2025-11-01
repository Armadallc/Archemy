-- ============================================================================
-- SUPABASE STORAGE DATABASE FUNCTIONS
-- Multi-Tenant Transportation Management System
-- 
-- This migration creates all required database functions for the file storage
-- system with HIPAA compliance and role-based access control.
-- ============================================================================

-- ============================================================================
-- 1. GENERATE FILE PATH FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_file_path(
  category_param TEXT,
  entity_type TEXT,
  entity_id TEXT,
  file_name_param TEXT
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  file_path TEXT;
  sanitized_file_name TEXT;
BEGIN
  -- Sanitize file name to prevent path traversal
  sanitized_file_name := regexp_replace(file_name_param, '[^a-zA-Z0-9._-]', '_', 'g');
  
  -- Generate path based on category and entity type
  CASE category_param
    WHEN 'intake_form', 'facility_contract', 'client_document' THEN
      -- Documents go to documents bucket
      CASE entity_type
        WHEN 'client' THEN
          file_path := 'documents/clients/facility-' || entity_id || '/client-' || entity_id || '/' || sanitized_file_name;
        WHEN 'facility' THEN
          file_path := 'documents/facilities/facility-' || entity_id || '/' || sanitized_file_name;
        WHEN 'program' THEN
          file_path := 'documents/programs/program-' || entity_id || '/' || sanitized_file_name;
        WHEN 'corporate' THEN
          file_path := 'documents/corporate/corporate-' || entity_id || '/' || sanitized_file_name;
        ELSE
          file_path := 'documents/other/' || sanitized_file_name;
      END CASE;
      
    WHEN 'trip_photo', 'driver_photo', 'vehicle_photo' THEN
      -- Photos go to photos bucket
      CASE entity_type
        WHEN 'trip' THEN
          file_path := 'photos/trips/trip-' || entity_id || '/' || sanitized_file_name;
        WHEN 'driver' THEN
          file_path := 'photos/drivers/driver-' || entity_id || '/' || sanitized_file_name;
        WHEN 'vehicle' THEN
          file_path := 'photos/vehicles/vehicle-' || entity_id || '/' || sanitized_file_name;
        WHEN 'facility' THEN
          file_path := 'photos/facilities/facility-' || entity_id || '/' || sanitized_file_name;
        ELSE
          file_path := 'photos/other/' || sanitized_file_name;
      END CASE;
      
    WHEN 'driver_license', 'vehicle_registration', 'insurance_document' THEN
      -- Driver/vehicle documents
      CASE entity_type
        WHEN 'driver' THEN
          file_path := 'documents/drivers/driver-' || entity_id || '/' || sanitized_file_name;
        WHEN 'vehicle' THEN
          file_path := 'documents/vehicles/vehicle-' || entity_id || '/' || sanitized_file_name;
        ELSE
          file_path := 'documents/other/' || sanitized_file_name;
      END CASE;
      
    ELSE
      -- Default path for unknown categories
      file_path := 'documents/other/' || sanitized_file_name;
  END CASE;
  
  RETURN file_path;
END;
$$;

-- ============================================================================
-- 2. CAN USER ACCESS FILE FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION can_user_access_file(
  user_id_param TEXT,
  file_id_param TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
  user_corporate_id TEXT;
  user_program_id TEXT;
  file_program_id TEXT;
  file_location_id TEXT;
  file_client_id TEXT;
  file_driver_id TEXT;
  has_access BOOLEAN := FALSE;
BEGIN
  -- Get user information
  SELECT role, corporate_client_id, primary_program_id
  INTO user_role, user_corporate_id, user_program_id
  FROM users
  WHERE auth_user_id = user_id_param::uuid
  AND is_active = true;
  
  -- Get file metadata
  SELECT program_id, location_id, client_id, driver_id
  INTO file_program_id, file_location_id, file_client_id, file_driver_id
  FROM file_metadata
  WHERE id = file_id_param;
  
  -- Check access based on user role
  CASE user_role
    WHEN 'super_admin' THEN
      has_access := TRUE;
      
    WHEN 'corporate_admin' THEN
      -- Can access files from their corporate client
      has_access := EXISTS (
        SELECT 1 FROM programs p
        JOIN corporate_clients cc ON cc.id = p.corporate_client_id
        WHERE p.id = file_program_id
        AND cc.id = user_corporate_id
      );
      
    WHEN 'program_admin' THEN
      -- Can access files from their program
      has_access := file_program_id = user_program_id;
      
    WHEN 'program_user' THEN
      -- Can access files from their program
      has_access := file_program_id = user_program_id;
      
    WHEN 'driver' THEN
      -- Can only access files for trips assigned to them
      has_access := EXISTS (
        SELECT 1 FROM drivers d
        WHERE d.user_id = user_id_param::uuid
        AND d.id = file_driver_id
      );
      
    ELSE
      has_access := FALSE;
  END CASE;
  
  RETURN has_access;
END;
$$;

-- ============================================================================
-- 3. LOG FILE ACCESS FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION log_file_access(
  file_id_param TEXT,
  user_id_param TEXT,
  action_param TEXT,
  ip_address_param TEXT DEFAULT NULL,
  user_agent_param TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert audit log entry
  INSERT INTO file_access_audit (
    file_id,
    user_id,
    action,
    ip_address,
    user_agent,
    accessed_at
  ) VALUES (
    file_id_param,
    user_id_param,
    action_param,
    ip_address_param,
    user_agent_param,
    NOW()
  );
END;
$$;

-- ============================================================================
-- 4. GET FILES NEARING RETENTION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_files_nearing_retention(
  days_ahead INTEGER DEFAULT 30
) RETURNS TABLE(
  id TEXT,
  file_name TEXT,
  file_category TEXT,
  retention_until TIMESTAMP WITH TIME ZONE,
  days_until_expiry INTEGER,
  program_id TEXT,
  location_id TEXT,
  client_id TEXT,
  trip_id TEXT,
  driver_id TEXT,
  vehicle_id TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fm.id,
    fm.file_name,
    fm.file_category,
    fm.retention_until,
    EXTRACT(DAY FROM (fm.retention_until - NOW()))::INTEGER as days_until_expiry,
    fm.program_id,
    fm.location_id,
    fm.client_id,
    fm.trip_id,
    fm.driver_id,
    fm.vehicle_id
  FROM file_metadata fm
  WHERE fm.retention_until <= NOW() + INTERVAL '1 day' * days_ahead
  AND fm.retention_until > NOW()
  ORDER BY fm.retention_until ASC;
END;
$$;

-- ============================================================================
-- 5. ARCHIVE EXPIRED FILES FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION archive_expired_files()
RETURNS TABLE(
  archived_count INTEGER,
  archived_files TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  expired_files TEXT[];
  file_count INTEGER := 0;
BEGIN
  -- Get list of expired files
  SELECT ARRAY_AGG(id)
  INTO expired_files
  FROM file_metadata
  WHERE retention_until < NOW();
  
  -- Count files
  file_count := COALESCE(array_length(expired_files, 1), 0);
  
  -- Soft delete expired files (mark as archived)
  UPDATE file_metadata
  SET 
    is_archived = true,
    archived_at = NOW(),
    updated_at = NOW()
  WHERE retention_until < NOW();
  
  -- Return results
  RETURN QUERY SELECT file_count, expired_files;
END;
$$;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION generate_file_path(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION can_user_access_file(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_file_access(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_files_nearing_retention(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION archive_expired_files() TO authenticated;

-- Grant execute permissions to service role
GRANT EXECUTE ON FUNCTION generate_file_path(TEXT, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION can_user_access_file(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION log_file_access(TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION get_files_nearing_retention(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION archive_expired_files() TO service_role;
