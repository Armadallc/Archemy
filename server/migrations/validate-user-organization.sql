-- User Organization Validation Function
-- Ensures users belong to appropriate organizations based on role

CREATE OR REPLACE FUNCTION validate_user_organization()
RETURNS TRIGGER AS $$
BEGIN
  -- Super admins don't need organization
  IF NEW.role = 'super_admin' THEN
    RETURN NEW;
  END IF;
  
  -- All other roles must have an organization/program
  IF NEW.role IN ('corporate_admin', 'program_admin', 'program_user') THEN
    IF NEW.primary_program_id IS NULL AND NEW.corporate_client_id IS NULL THEN
      RAISE EXCEPTION 'Organization or program required for role: %', NEW.role;
    END IF;
  END IF;
  
  -- Drivers must have a program
  IF NEW.role = 'driver' AND NEW.primary_program_id IS NULL THEN
    RAISE EXCEPTION 'Program required for driver role';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS user_organization_validation ON users;
CREATE TRIGGER user_organization_validation
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION validate_user_organization();

-- Add comment
COMMENT ON FUNCTION validate_user_organization() IS 'Validates user organization assignments based on role';

