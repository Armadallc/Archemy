-- Add billing module tables
-- Migration: 0008_add_billing_module.sql

-- Billing codes table (T2003, T2004, A0120, etc.)
CREATE TABLE IF NOT EXISTS billing_codes (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    category TEXT NOT NULL, -- 'transport', 'waiver', 'modifier'
    rate_colorado TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Billing modifiers table (U1, U2, QM, TK, etc.)
CREATE TABLE IF NOT EXISTS billing_modifiers (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    applies_to_codes TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Client billing information (PHI protected)
CREATE TABLE IF NOT EXISTS client_billing_info (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES clients(id),
    organization_id TEXT NOT NULL REFERENCES organizations(id),
    
    -- Insurance information
    insurance_type TEXT NOT NULL, -- 'medicaid', 'medicare', 'private'
    medicaid_id TEXT,
    medicare_id TEXT,
    group_number TEXT,
    
    -- Waiver information
    waiver_type TEXT, -- 'HCBS', 'CMHS', etc.
    waiver_id TEXT,
    prior_authorization_number TEXT,
    authorization_expiry TIMESTAMP,
    
    -- Billing provider
    billing_provider_npi TEXT,
    billing_provider_name TEXT,
    billing_provider_taxonomy TEXT,
    
    -- Compliance
    hipaa_authorization_date TIMESTAMP,
    billing_consent_date TIMESTAMP,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Billing claims table
CREATE TABLE IF NOT EXISTS billing_claims (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id),
    client_id TEXT NOT NULL REFERENCES clients(id),
    trip_id TEXT NOT NULL REFERENCES trips(id),
    
    -- Claim details
    claim_number TEXT UNIQUE,
    service_date TIMESTAMP NOT NULL,
    billing_code TEXT NOT NULL REFERENCES billing_codes(code),
    modifiers TEXT[],
    units INTEGER DEFAULT 1,
    rate TEXT,
    total_amount TEXT,
    
    -- Submission details
    status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'submitted', 'paid', 'denied', 'resubmitted'
    submission_date TIMESTAMP,
    payment_date TIMESTAMP,
    paid_amount TEXT,
    denial_reason TEXT,
    
    -- Generated form data
    cms_1500_data JSONB,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Billing batches table
CREATE TABLE IF NOT EXISTS billing_batches (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id),
    
    name TEXT NOT NULL,
    description TEXT,
    claim_ids TEXT[],
    total_claims INTEGER DEFAULT 0,
    total_amount TEXT,
    
    status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'submitted', 'processed'
    created_by TEXT NOT NULL REFERENCES users(user_id),
    submitted_date TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default billing codes
INSERT INTO billing_codes (id, code, description, category, rate_colorado, is_active) VALUES
('t2003', 'T2003', 'Non-emergency transportation', 'transport', '15.00', TRUE),
('t2004', 'T2004', 'Non-emergency transportation; wait time', 'transport', '25.00', TRUE),
('a0120', 'A0120', 'Non-emergency transportation: mini-bus, mountain area transports', 'transport', '20.00', TRUE),
('t2001', 'T2001', 'Non-emergency transportation; patient attendant/escort', 'transport', '35.00', TRUE),
('a0080', 'A0080', 'Non-emergency transportation, per mile - vehicle provided by volunteer', 'transport', '0.65', TRUE),
('a0090', 'A0090', 'Non-emergency transportation, per mile - vehicle provided by individual', 'transport', '0.65', TRUE);

-- Insert default modifiers
INSERT INTO billing_modifiers (id, code, description, applies_to_codes, is_active) VALUES
('u1', 'U1', 'One way trip', ARRAY['T2003', 'T2004', 'A0120'], TRUE),
('u2', 'U2', 'Two way trip', ARRAY['T2003', 'T2004', 'A0120'], TRUE),
('u3', 'U3', 'Three way trip', ARRAY['T2003', 'T2004', 'A0120'], TRUE),
('u4', 'U4', 'Four way trip', ARRAY['T2003', 'T2004', 'A0120'], TRUE),
('u5', 'U5', 'Five way trip', ARRAY['T2003', 'T2004', 'A0120'], TRUE),
('u6', 'U6', 'Six way trip', ARRAY['T2003', 'T2004', 'A0120'], TRUE),
('u7', 'U7', 'Seven way trip', ARRAY['T2003', 'T2004', 'A0120'], TRUE),
('u8', 'U8', 'Eight way trip', ARRAY['T2003', 'T2004', 'A0120'], TRUE),
('u9', 'U9', 'Nine way trip', ARRAY['T2003', 'T2004', 'A0120'], TRUE),
('qm', 'QM', 'Ambulatory patient', ARRAY['T2003', 'T2004', 'A0120'], TRUE),
('tk', 'TK', 'Actual charge', ARRAY['T2003', 'T2004', 'A0120'], TRUE),
('gk', 'GK', 'Actual charge for item/service furnished', ARRAY['T2003', 'T2004', 'A0120'], TRUE),
('gn', 'GN', 'Services delivered under an outpatient speech-language pathology plan', ARRAY['T2003', 'T2004'], TRUE),
('go', 'GO', 'Services delivered under an outpatient occupational therapy plan', ARRAY['T2003', 'T2004'], TRUE),
('gp', 'GP', 'Services delivered under an outpatient physical therapy plan', ARRAY['T2003', 'T2004'], TRUE);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_billing_info_client_id ON client_billing_info(client_id);
CREATE INDEX IF NOT EXISTS idx_client_billing_info_organization_id ON client_billing_info(organization_id);
CREATE INDEX IF NOT EXISTS idx_billing_claims_organization_id ON billing_claims(organization_id);
CREATE INDEX IF NOT EXISTS idx_billing_claims_client_id ON billing_claims(client_id);
CREATE INDEX IF NOT EXISTS idx_billing_claims_trip_id ON billing_claims(trip_id);
CREATE INDEX IF NOT EXISTS idx_billing_claims_service_date ON billing_claims(service_date);
CREATE INDEX IF NOT EXISTS idx_billing_claims_status ON billing_claims(status);
CREATE INDEX IF NOT EXISTS idx_billing_batches_organization_id ON billing_batches(organization_id);
CREATE INDEX IF NOT EXISTS idx_billing_batches_created_by ON billing_batches(created_by);