-- ============================================================================
-- Migration 0067: Add read and read_at columns to notifications table
-- ============================================================================
-- This migration adds read tracking to notifications for the mobile app
-- ============================================================================

-- Add read column (defaults to false for existing notifications)
ALTER TABLE notifications 
  ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false NOT NULL;

-- Add read_at timestamp column
ALTER TABLE notifications 
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- Add index for performance when querying unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read 
  ON notifications(user_id, read);

-- Add index for performance when querying by user and created_at
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at 
  ON notifications(user_id, created_at DESC);

-- Add comment
COMMENT ON COLUMN notifications.read IS 'Whether the notification has been read by the user';
COMMENT ON COLUMN notifications.read_at IS 'Timestamp when the notification was marked as read';

