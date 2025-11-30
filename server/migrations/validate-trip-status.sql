-- Trip Status Validation Function
-- Prevents invalid status transitions and ensures data integrity

CREATE OR REPLACE FUNCTION validate_trip_status() 
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent invalid status transitions
  IF OLD.status = 'completed' AND NEW.status != 'completed' THEN
    RAISE EXCEPTION 'Cannot modify completed trips';
  END IF;
  
  -- Prevent changing cancelled trips back to active
  IF OLD.status = 'cancelled' AND NEW.status NOT IN ('cancelled', 'completed') THEN
    RAISE EXCEPTION 'Cannot reactivate cancelled trips';
  END IF;
  
  -- Ensure required fields for in_progress trips
  IF NEW.status = 'in_progress' AND NEW.actual_pickup_time IS NULL THEN
    RAISE EXCEPTION 'actual_pickup_time required when starting trip';
  END IF;
  
  -- Ensure required fields for completed trips
  IF NEW.status = 'completed' AND NEW.actual_dropoff_time IS NULL THEN
    RAISE EXCEPTION 'actual_dropoff_time required when completing trip';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS trip_status_validation ON trips;
CREATE TRIGGER trip_status_validation
  BEFORE UPDATE ON trips
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION validate_trip_status();

-- Add comment
COMMENT ON FUNCTION validate_trip_status() IS 'Validates trip status transitions and required fields';

