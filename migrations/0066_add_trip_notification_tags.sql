-- ============================================================================
-- ADD TRIP NOTIFICATION TAGS SYSTEM
-- Migration: 0066_add_trip_notification_tags.sql
-- Description: Creates tables for user tagging and notification preferences
-- ============================================================================
-- Created: 2025-12-30
-- 
-- This migration creates:
-- 1. trip_notification_tags - Links users to trips for notifications
-- 2. user_notification_preferences - User preferences for notification types
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE TRIP NOTIFICATION TAGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS trip_notification_tags (
  id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  trip_id VARCHAR(50) NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  created_by VARCHAR(50) NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(trip_id, user_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_trip_notification_tags_trip_id ON trip_notification_tags(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_notification_tags_user_id ON trip_notification_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_notification_tags_created_by ON trip_notification_tags(created_by);

-- Add comments
COMMENT ON TABLE trip_notification_tags IS 'Links users to trips to receive notifications about trip status updates';
COMMENT ON COLUMN trip_notification_tags.trip_id IS 'Trip ID that the user is tagged to receive notifications for';
COMMENT ON COLUMN trip_notification_tags.user_id IS 'User ID who will receive notifications';
COMMENT ON COLUMN trip_notification_tags.created_by IS 'User ID who added this tag';

-- ============================================================================
-- STEP 2: CREATE USER NOTIFICATION PREFERENCES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  trip_status_updates JSONB DEFAULT '{
    "order_confirmed": true,
    "order_declined": true,
    "trip_started": true,
    "client_onboard": false,
    "client_dropoff": false,
    "trip_completed": true,
    "no_show": true,
    "wait_time_started": false,
    "wait_time_stopped": false
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id ON user_notification_preferences(user_id);

-- Add comments
COMMENT ON TABLE user_notification_preferences IS 'User preferences for which trip status updates they want to receive notifications for';
COMMENT ON COLUMN user_notification_preferences.user_id IS 'User ID these preferences belong to';
COMMENT ON COLUMN user_notification_preferences.trip_status_updates IS 'JSONB object with boolean flags for each notification type';

-- ============================================================================
-- STEP 3: ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE trip_notification_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: CREATE BASIC RLS POLICIES
-- ============================================================================

-- Trip notification tags: Users can view tags for trips they have access to
CREATE POLICY "Users can view trip notification tags for accessible trips"
  ON trip_notification_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trips t
      WHERE t.id = trip_notification_tags.trip_id
      -- Add your RLS logic here based on program/corporate client access
    )
  );

-- Trip notification tags: Trip creators can add/remove tags
CREATE POLICY "Trip creators can manage notification tags"
  ON trip_notification_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM trips t
      WHERE t.id = trip_notification_tags.trip_id
      AND t.created_by = auth.uid()::text
    )
  );

-- User notification preferences: Users can manage their own preferences
CREATE POLICY "Users can manage their own notification preferences"
  ON user_notification_preferences FOR ALL
  USING (user_id = auth.uid()::text);

-- ============================================================================
-- STEP 5: VERIFY THE CHANGES
-- ============================================================================
DO $$
DECLARE
    tags_table_exists BOOLEAN;
    preferences_table_exists BOOLEAN;
    tags_index_count INTEGER;
    preferences_index_count INTEGER;
BEGIN
    -- Check if tables exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'trip_notification_tags'
    ) INTO tags_table_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_notification_preferences'
    ) INTO preferences_table_exists;
    
    -- Count indexes
    SELECT COUNT(*) INTO tags_index_count
    FROM pg_indexes
    WHERE tablename = 'trip_notification_tags';
    
    SELECT COUNT(*) INTO preferences_index_count
    FROM pg_indexes
    WHERE tablename = 'user_notification_preferences';
    
    IF tags_table_exists AND preferences_table_exists THEN
        RAISE NOTICE 'SUCCESS: Both notification tables created';
        RAISE NOTICE 'Trip notification tags indexes: %', tags_index_count;
        RAISE NOTICE 'User notification preferences indexes: %', preferences_index_count;
    ELSE
        RAISE EXCEPTION 'ERROR: Tables not created properly';
    END IF;
END $$;

