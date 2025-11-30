-- ============================================================================
-- Migration 0034: Client Notification System (QR Codes + Web Push)
-- ============================================================================
-- This migration adds support for client notification opt-ins via QR codes
-- and web push notifications. Includes:
-- 1. Program-based QR codes (one per program)
-- 2. Client opt-ins with PIN verification
-- 3. Push subscription storage
-- 4. Notification-only user support
-- ============================================================================

-- ============================================================================
-- 1. UPDATE USERS TABLE
-- ============================================================================
-- Add 'client_user' role to existing CHECK constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('super_admin', 'corporate_admin', 'program_admin', 'program_user', 'driver', 'client_user'));

-- Add fields for client notification users
-- Note: clients.id is UUID type, so client_id must also be UUID
ALTER TABLE users ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_notification_only BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- 2. UPDATE CLIENTS TABLE
-- ============================================================================
-- Add PIN hash field (4-digit PIN assigned by case manager, hashed with bcrypt)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS pin_hash VARCHAR(255);

-- Add notification preference fields
ALTER TABLE clients ADD COLUMN IF NOT EXISTS push_notifications_enabled BOOLEAN DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS notification_user_id VARCHAR(50) REFERENCES users(user_id) ON DELETE SET NULL;

-- ============================================================================
-- 3. PROGRAM QR CODES TABLE
-- ============================================================================
-- One QR code per program (not per location, since clients move between locations)
CREATE TABLE IF NOT EXISTS program_qr_codes (
    id VARCHAR(50) PRIMARY KEY,
    program_id VARCHAR(50) NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    qr_token VARCHAR(64) UNIQUE NOT NULL, -- Secure token embedded in QR code
    qr_image_url TEXT, -- URL or data URL of QR code image
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(program_id, is_active) -- Only one active QR code per program
);

CREATE INDEX IF NOT EXISTS idx_program_qr_codes_token ON program_qr_codes(qr_token);
CREATE INDEX IF NOT EXISTS idx_program_qr_codes_program ON program_qr_codes(program_id);

-- ============================================================================
-- 4. CLIENT OPT-INS TABLE
-- ============================================================================
-- Track client opt-ins for notifications (per program, not per location)
CREATE TABLE IF NOT EXISTS client_opt_ins (
    id VARCHAR(50) PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE, -- clients.id is UUID
    program_id VARCHAR(50) NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    user_id VARCHAR(50) REFERENCES users(user_id) ON DELETE SET NULL, -- Links to notification user after opt-in
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- When client verified their info
    opt_in_method VARCHAR(20) DEFAULT 'qr_code' CHECK (opt_in_method IN ('qr_code', 'email_invite')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_id, program_id, is_active) -- One active opt-in per client per program
);

CREATE INDEX IF NOT EXISTS idx_client_opt_ins_client ON client_opt_ins(client_id);
CREATE INDEX IF NOT EXISTS idx_client_opt_ins_program ON client_opt_ins(program_id);
CREATE INDEX IF NOT EXISTS idx_client_opt_ins_user ON client_opt_ins(user_id);

-- ============================================================================
-- 5. PUSH SUBSCRIPTIONS TABLE
-- ============================================================================
-- Store web push notification subscriptions for clients
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL, -- Web Push subscription endpoint
    p256dh_key TEXT NOT NULL, -- Public key for encryption
    auth_key TEXT NOT NULL, -- Auth secret for encryption
    user_agent TEXT,
    device_info JSONB, -- Browser, OS, etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, endpoint) -- One subscription per user/device
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(is_active);

-- ============================================================================
-- 6. COMMENTS
-- ============================================================================
COMMENT ON TABLE program_qr_codes IS 'QR codes for programs - clients scan to opt-in for notifications';
COMMENT ON TABLE client_opt_ins IS 'Tracks client opt-ins for push notifications per program';
COMMENT ON TABLE push_subscriptions IS 'Web push notification subscriptions for notification-only users';
COMMENT ON COLUMN clients.pin_hash IS 'Hashed 4-digit PIN assigned by case manager during client creation';
COMMENT ON COLUMN users.is_notification_only IS 'True for client users who only receive notifications (no app login)';

