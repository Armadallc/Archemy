-- ============================================================================
-- Prophet Calculator Cloud Storage Migration
-- ============================================================================
-- This migration creates tables for storing Prophet calculator data in Supabase
-- Enables cross-device persistence and user-specific data isolation
-- Created: 2025-01-19
-- Version: 1.0.0
-- ============================================================================

-- ============================================================================
-- TABLE: prophet_scenarios
-- ============================================================================
-- Stores business scenarios created by users
-- Each scenario includes trips, cost structures, and calculations
CREATE TABLE IF NOT EXISTS prophet_scenarios (
    id VARCHAR(50) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    data JSONB NOT NULL, -- Full BusinessScenario object
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_prophet_scenarios_user_id 
    ON prophet_scenarios(user_id);

-- Index for updated_at for efficient sync queries
CREATE INDEX IF NOT EXISTS idx_prophet_scenarios_updated_at 
    ON prophet_scenarios(updated_at DESC);

-- ============================================================================
-- TABLE: prophet_facilities
-- ============================================================================
-- Stores treatment facilities configured by users
CREATE TABLE IF NOT EXISTS prophet_facilities (
    id VARCHAR(50) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    slot INTEGER NOT NULL, -- Facility slot number (1-5)
    data JSONB NOT NULL, -- Full TreatmentFacility object
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, slot) -- One facility per slot per user
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_prophet_facilities_user_id 
    ON prophet_facilities(user_id);

-- Index for updated_at for efficient sync queries
CREATE INDEX IF NOT EXISTS idx_prophet_facilities_updated_at 
    ON prophet_facilities(updated_at DESC);

-- ============================================================================
-- TABLE: prophet_service_codes
-- ============================================================================
-- Stores custom or modified service codes (rate overrides)
-- Only stores codes that differ from the default Colorado Medicaid codes
CREATE TABLE IF NOT EXISTS prophet_service_codes (
    id VARCHAR(50) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL, -- Service code (e.g., 'A0120', 'T2001')
    rate_overrides JSONB NOT NULL, -- Full ServiceCode object with custom rates
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, code) -- One override per code per user
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_prophet_service_codes_user_id 
    ON prophet_service_codes(user_id);

-- Index for code lookups
CREATE INDEX IF NOT EXISTS idx_prophet_service_codes_code 
    ON prophet_service_codes(code);

-- Index for updated_at for efficient sync queries
CREATE INDEX IF NOT EXISTS idx_prophet_service_codes_updated_at 
    ON prophet_service_codes(updated_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- Enable RLS on all tables
ALTER TABLE prophet_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE prophet_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE prophet_service_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own scenarios
CREATE POLICY "Users can view own scenarios"
    ON prophet_scenarios
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own scenarios
CREATE POLICY "Users can insert own scenarios"
    ON prophet_scenarios
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own scenarios
CREATE POLICY "Users can update own scenarios"
    ON prophet_scenarios
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can delete their own scenarios
CREATE POLICY "Users can delete own scenarios"
    ON prophet_scenarios
    FOR DELETE
    USING (auth.uid() = user_id);

-- Policy: Users can only see their own facilities
CREATE POLICY "Users can view own facilities"
    ON prophet_facilities
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own facilities
CREATE POLICY "Users can insert own facilities"
    ON prophet_facilities
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own facilities
CREATE POLICY "Users can update own facilities"
    ON prophet_facilities
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can delete their own facilities
CREATE POLICY "Users can delete own facilities"
    ON prophet_facilities
    FOR DELETE
    USING (auth.uid() = user_id);

-- Policy: Users can only see their own service codes
CREATE POLICY "Users can view own service codes"
    ON prophet_service_codes
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own service codes
CREATE POLICY "Users can insert own service codes"
    ON prophet_service_codes
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own service codes
CREATE POLICY "Users can update own service codes"
    ON prophet_service_codes
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can delete their own service codes
CREATE POLICY "Users can delete own service codes"
    ON prophet_service_codes
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE prophet_scenarios IS 'Stores Prophet calculator business scenarios per user';
COMMENT ON TABLE prophet_facilities IS 'Stores Prophet calculator treatment facilities per user';
COMMENT ON TABLE prophet_service_codes IS 'Stores custom service code rate overrides per user';

