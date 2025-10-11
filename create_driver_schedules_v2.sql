-- Create driver_schedules_v2 table
CREATE TABLE IF NOT EXISTS driver_schedules_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers_v2(id) ON DELETE CASCADE,
  organization_id TEXT NOT NULL,
  days_of_week INTEGER[] NOT NULL DEFAULT '{}',
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'available', 'unavailable', 'on_call')),
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_driver_schedules_v2_driver_id ON driver_schedules_v2(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_schedules_v2_organization_id ON driver_schedules_v2(organization_id);
CREATE INDEX IF NOT EXISTS idx_driver_schedules_v2_status ON driver_schedules_v2(status);
CREATE INDEX IF NOT EXISTS idx_driver_schedules_v2_is_active ON driver_schedules_v2(is_active);

-- Enable RLS
ALTER TABLE driver_schedules_v2 ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can access driver schedules for their organization" ON driver_schedules_v2
  FOR ALL USING (
    organization_id IN (
      SELECT uoa.organization_id
      FROM user_organization_access uoa
      JOIN users_v2 u ON u.id = uoa.user_id
      WHERE u.id = auth.uid()
    )
  );
