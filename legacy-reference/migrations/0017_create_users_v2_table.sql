-- Create new streamlined users table
CREATE TABLE users_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  user_name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  primary_organization_id VARCHAR(50) NOT NULL REFERENCES organizations(id),
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create table for user organization access (many-to-many relationship)
CREATE TABLE user_organization_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users_v2(id) ON DELETE CASCADE,
  organization_id VARCHAR(50) NOT NULL REFERENCES organizations(id),
  granted_at TIMESTAMP DEFAULT NOW(),
  granted_by VARCHAR(100),
  UNIQUE(user_id, organization_id)
);

-- Create indexes for performance
CREATE INDEX idx_users_v2_user_id ON users_v2(user_id);
CREATE INDEX idx_users_v2_email ON users_v2(email);
CREATE INDEX idx_users_v2_role ON users_v2(role);
CREATE INDEX idx_users_v2_primary_org ON users_v2(primary_organization_id);
CREATE INDEX idx_users_v2_active ON users_v2(is_active);
CREATE INDEX idx_users_v2_last_login ON users_v2(last_login);

-- Create indexes for user organization access
CREATE INDEX idx_user_org_access_user ON user_organization_access(user_id);
CREATE INDEX idx_user_org_access_org ON user_organization_access(organization_id);
CREATE INDEX idx_user_org_access_granted ON user_organization_access(granted_at);

-- Create composite indexes for common queries
CREATE INDEX idx_users_v2_org_active ON users_v2(primary_organization_id, is_active);
CREATE INDEX idx_users_v2_role_active ON users_v2(role, is_active);

