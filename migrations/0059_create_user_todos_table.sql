-- ============================================================================
-- PERSONAL TODO LIST
-- Migration: 0059_create_user_todos_table.sql
-- Description: Creates table for personal user todos
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_todos (
  id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT false,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date TIMESTAMP WITH TIME ZONE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_todos_user_id ON user_todos(user_id);
CREATE INDEX IF NOT EXISTS idx_user_todos_user_id_completed ON user_todos(user_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_user_todos_user_id_due_date ON user_todos(user_id, due_date);

-- RLS Policies
ALTER TABLE user_todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own todos"
  ON user_todos FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own todos"
  ON user_todos FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own todos"
  ON user_todos FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own todos"
  ON user_todos FOR DELETE
  USING (auth.uid()::text = user_id);

-- Add comment for documentation
COMMENT ON TABLE user_todos IS 'Personal todo list items for individual users';
COMMENT ON COLUMN user_todos.user_id IS 'Owner of the todo item';
COMMENT ON COLUMN user_todos.is_completed IS 'Whether the todo is completed';
COMMENT ON COLUMN user_todos.priority IS 'Priority level: low, medium, or high';
COMMENT ON COLUMN user_todos.position IS 'Ordering position for drag-and-drop';



