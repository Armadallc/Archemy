-- Add CMS-1500 form storage tables
-- Migration: 0009_add_cms1500_forms.sql

-- CMS-1500 forms table - integrates with existing billing system
CREATE TABLE cms1500_forms (
    id TEXT PRIMARY KEY DEFAULT 'cms1500_' || gen_random_uuid(),
    organization_id TEXT NOT NULL REFERENCES organizations(id),
    client_id TEXT REFERENCES clients(id),
    trip_id TEXT REFERENCES trips(id),
    billing_claim_id TEXT REFERENCES billing_claims(id), -- Link to existing billing claim
    form_number TEXT UNIQUE NOT NULL,
    
    -- Box 1: Insurance Type
    insurance_type TEXT NOT NULL CHECK (insurance_type IN ('medicare', 'medicaid', 'champus', 'champva', 'group_health', 'feca', 'other')),
    
    -- Box 1a: Insured's ID Number
    insured_id TEXT NOT NULL,
    
    -- Box 2: Patient Information
    patient_last_name TEXT NOT NULL,
    patient_first_name TEXT NOT NULL,
    patient_middle_initial TEXT,
    
    -- Box 3: Patient Birth Date & Sex
    patient_birth_date DATE NOT NULL,
    patient_sex TEXT NOT NULL CHECK (patient_sex IN ('M', 'F')),
    
    -- Box 4: Insured's Name
    insured_last_name TEXT NOT NULL,
    insured_first_name TEXT NOT NULL,
    insured_middle_initial TEXT,
    
    -- Box 5: Patient's Address
    patient_address TEXT NOT NULL,
    patient_city TEXT NOT NULL,
    patient_state TEXT NOT NULL,
    patient_zip TEXT NOT NULL,
    patient_phone TEXT,
    
    -- Box 6: Patient Relationship to Insured
    patient_relationship TEXT NOT NULL CHECK (patient_relationship IN ('self', 'spouse', 'child', 'other')),
    
    -- Box 7: Insured's Address
    insured_address TEXT NOT NULL,
    insured_city TEXT NOT NULL,
    insured_state TEXT NOT NULL,
    insured_zip TEXT NOT NULL,
    insured_phone TEXT,
    
    -- Box 9: Other Insured Information
    other_insured_name TEXT,
    other_insured_policy TEXT,
    other_insurance_plan TEXT,
    
    -- Box 10: Condition Related To
    related_employment BOOLEAN DEFAULT false,
    related_auto_accident BOOLEAN DEFAULT false,
    related_other_accident BOOLEAN DEFAULT false,
    accident_state TEXT,
    claim_codes TEXT,
    
    -- Box 11: Insured's Group Information
    insured_group_number TEXT,
    insured_birth_date DATE,
    insured_sex TEXT CHECK (insured_sex IN ('M', 'F')),
    other_claim_id TEXT,
    insurance_plan_name TEXT,
    has_other_health_plan BOOLEAN DEFAULT false,
    
    -- Box 12-13: Signatures
    patient_signature TEXT DEFAULT 'Signature on File',
    patient_signature_date DATE,
    insured_signature TEXT DEFAULT 'Signature on File',
    
    -- Box 14-20: Additional Information
    illness_date DATE,
    other_date DATE,
    unable_to_work_from DATE,
    unable_to_work_to DATE,
    referring_provider TEXT,
    referring_provider_npi TEXT,
    hospitalization_from DATE,
    hospitalization_to DATE,
    additional_info TEXT,
    outside_lab BOOLEAN DEFAULT false,
    outside_lab_charges DECIMAL(10,2),
    
    -- Box 21: Diagnosis
    diagnosis_1 TEXT,
    diagnosis_2 TEXT,
    diagnosis_3 TEXT,
    diagnosis_4 TEXT,
    
    -- Box 22-23: Resubmission & Prior Auth
    resubmission_code TEXT,
    original_ref TEXT,
    prior_auth_number TEXT,
    
    -- Box 25-30: Billing Information
    federal_tax_id TEXT NOT NULL,
    ssn_ein TEXT NOT NULL CHECK (ssn_ein IN ('SSN', 'EIN')) DEFAULT 'EIN',
    patient_account_number TEXT,
    accept_assignment BOOLEAN DEFAULT true,
    total_charge DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) DEFAULT 0.00,
    
    -- Box 31: Provider Signature
    provider_signature TEXT DEFAULT 'Signature on File',
    provider_signature_date DATE,
    
    -- Box 32: Service Facility
    service_facility_name TEXT,
    service_facility_address TEXT,
    service_facility_npi TEXT,
    
    -- Box 33: Billing Provider
    billing_provider_name TEXT NOT NULL,
    billing_provider_address TEXT NOT NULL,
    billing_provider_npi TEXT NOT NULL,
    billing_provider_phone TEXT,
    
    -- Form status and metadata (sync with billing_claims status)
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'paid', 'rejected', 'pending')),
    submission_date TIMESTAMP,
    payment_date TIMESTAMP,
    rejection_reason TEXT,
    
    -- PDF/Export tracking
    pdf_generated BOOLEAN DEFAULT FALSE,
    pdf_url TEXT,
    exported_at TIMESTAMP,
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT NOT NULL REFERENCES users(user_id),
    updated_by TEXT NOT NULL REFERENCES users(user_id)
);

-- CMS-1500 service lines table (Box 24)
CREATE TABLE cms1500_service_lines (
    id TEXT PRIMARY KEY DEFAULT 'cms1500_line_' || gen_random_uuid(),
    form_id TEXT NOT NULL REFERENCES cms1500_forms(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL CHECK (line_number BETWEEN 1 AND 6),
    
    -- Service dates
    date_from DATE,
    date_to DATE,
    
    -- Service details
    place_of_service TEXT,
    procedure_code TEXT,
    modifier_1 TEXT,
    modifier_2 TEXT,
    modifier_3 TEXT,
    modifier_4 TEXT,
    
    -- Diagnosis pointer
    diagnosis_pointer TEXT,
    
    -- Charges and units
    charges DECIMAL(10,2),
    days_or_units INTEGER,
    
    -- Additional codes
    epsdt_family_plan TEXT,
    emergency_indicator TEXT,
    coordination_of_benefits TEXT,
    
    -- Rendering provider
    rendering_provider_npi TEXT,
    rendering_provider_name TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(form_id, line_number)
);

-- Indexes for performance
CREATE INDEX idx_cms1500_forms_organization_id ON cms1500_forms(organization_id);
CREATE INDEX idx_cms1500_forms_client_id ON cms1500_forms(client_id);
CREATE INDEX idx_cms1500_forms_trip_id ON cms1500_forms(trip_id);
CREATE INDEX idx_cms1500_forms_status ON cms1500_forms(status);
CREATE INDEX idx_cms1500_forms_created_at ON cms1500_forms(created_at);
CREATE INDEX idx_cms1500_forms_form_number ON cms1500_forms(form_number);
CREATE INDEX idx_cms1500_service_lines_form_id ON cms1500_service_lines(form_id);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_cms1500_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cms1500_forms_updated_at
    BEFORE UPDATE ON cms1500_forms
    FOR EACH ROW
    EXECUTE FUNCTION update_cms1500_updated_at();

CREATE TRIGGER cms1500_service_lines_updated_at
    BEFORE UPDATE ON cms1500_service_lines
    FOR EACH ROW
    EXECUTE FUNCTION update_cms1500_updated_at();

-- Row Level Security
ALTER TABLE cms1500_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms1500_service_lines ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cms1500_forms
CREATE POLICY "Users can view CMS-1500 forms from their organizations"
    ON cms1500_forms FOR SELECT
    USING (
        organization_id IN (
            SELECT unnest(authorized_organizations) 
            FROM users 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create CMS-1500 forms in their organizations"
    ON cms1500_forms FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT unnest(authorized_organizations) 
            FROM users 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update CMS-1500 forms in their organizations"
    ON cms1500_forms FOR UPDATE
    USING (
        organization_id IN (
            SELECT unnest(authorized_organizations) 
            FROM users 
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for cms1500_service_lines
CREATE POLICY "Users can view service lines from their organizations"
    ON cms1500_service_lines FOR SELECT
    USING (
        form_id IN (
            SELECT id FROM cms1500_forms
            WHERE organization_id IN (
                SELECT unnest(authorized_organizations) 
                FROM users 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can create service lines for their organization forms"
    ON cms1500_service_lines FOR INSERT
    WITH CHECK (
        form_id IN (
            SELECT id FROM cms1500_forms
            WHERE organization_id IN (
                SELECT unnest(authorized_organizations) 
                FROM users 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update service lines for their organization forms"
    ON cms1500_service_lines FOR UPDATE
    USING (
        form_id IN (
            SELECT id FROM cms1500_forms
            WHERE organization_id IN (
                SELECT unnest(authorized_organizations) 
                FROM users 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Functions to synchronize CMS-1500 forms with billing system
CREATE OR REPLACE FUNCTION sync_cms1500_with_billing_claim()
RETURNS TRIGGER AS $$
BEGIN
    -- Update billing claim when CMS-1500 form is updated
    IF TG_OP = 'UPDATE' AND NEW.billing_claim_id IS NOT NULL THEN
        UPDATE billing_claims 
        SET 
            status = NEW.status,
            submission_date = NEW.submission_date,
            payment_date = NEW.payment_date,
            denial_reason = NEW.rejection_reason,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.billing_claim_id;
    END IF;
    
    -- Create billing claim if CMS-1500 form is created without one
    IF TG_OP = 'INSERT' AND NEW.billing_claim_id IS NULL AND NEW.trip_id IS NOT NULL THEN
        INSERT INTO billing_claims (
            organization_id,
            client_id,
            trip_id,
            service_date,
            billing_code,
            total_amount,
            status,
            created_at,
            updated_at
        ) VALUES (
            NEW.organization_id,
            NEW.client_id,
            NEW.trip_id,
            COALESCE(
                (SELECT date_from FROM cms1500_service_lines WHERE form_id = NEW.id ORDER BY line_number LIMIT 1),
                CURRENT_DATE
            ),
            COALESCE(
                (SELECT procedure_code FROM cms1500_service_lines WHERE form_id = NEW.id ORDER BY line_number LIMIT 1),
                'T2003'
            ),
            NEW.total_charge::text,
            NEW.status,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );
        
        -- Update the CMS-1500 form with the new billing claim ID
        UPDATE cms1500_forms 
        SET billing_claim_id = (SELECT id FROM billing_claims WHERE trip_id = NEW.trip_id ORDER BY created_at DESC LIMIT 1)
        WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to sync CMS-1500 forms with billing claims
CREATE TRIGGER sync_cms1500_billing_trigger
    AFTER INSERT OR UPDATE ON cms1500_forms
    FOR EACH ROW
    EXECUTE FUNCTION sync_cms1500_with_billing_claim();

-- Function to auto-populate CMS-1500 from client and trip data
CREATE OR REPLACE FUNCTION populate_cms1500_from_client_trip(
    p_organization_id TEXT,
    p_client_id TEXT,
    p_trip_id TEXT,
    p_created_by TEXT
) RETURNS TEXT AS $$
DECLARE
    v_form_id TEXT;
    v_client_record RECORD;
    v_trip_record RECORD;
    v_billing_info RECORD;
    v_form_number TEXT;
BEGIN
    -- Get client information
    SELECT * INTO v_client_record FROM clients WHERE id = p_client_id;
    
    -- Get trip information
    SELECT * INTO v_trip_record FROM trips WHERE id = p_trip_id;
    
    -- Get client billing information
    SELECT * INTO v_billing_info FROM client_billing_info WHERE client_id = p_client_id;
    
    -- Generate form number
    v_form_number := 'CMS-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || 
                     LPAD(EXTRACT(DOY FROM CURRENT_DATE)::TEXT, 3, '0') || '-' ||
                     LPAD(EXTRACT(HOUR FROM CURRENT_TIME)::TEXT, 2, '0') ||
                     LPAD(EXTRACT(MINUTE FROM CURRENT_TIME)::TEXT, 2, '0');
    
    -- Create CMS-1500 form with populated data
    INSERT INTO cms1500_forms (
        organization_id,
        client_id,
        trip_id,
        form_number,
        insurance_type,
        insured_id,
        patient_last_name,
        patient_first_name,
        patient_birth_date,
        patient_sex,
        insured_last_name,
        insured_first_name,
        patient_address,
        patient_city,
        patient_state,
        patient_zip,
        patient_phone,
        patient_relationship,
        insured_address,
        insured_city,
        insured_state,
        insured_zip,
        federal_tax_id,
        total_charge,
        billing_provider_name,
        billing_provider_address,
        billing_provider_npi,
        created_by,
        updated_by
    ) VALUES (
        p_organization_id,
        p_client_id,
        p_trip_id,
        v_form_number,
        COALESCE(v_billing_info.insurance_type, 'medicaid'),
        COALESCE(v_billing_info.medicaid_id, v_billing_info.medicare_id, 'PENDING'),
        v_client_record.last_name,
        v_client_record.first_name,
        CURRENT_DATE - INTERVAL '30 years', -- Default birth date, should be updated
        'M', -- Default sex, should be updated
        v_client_record.last_name,
        v_client_record.first_name,
        v_client_record.address,
        'Denver', -- Default city, should be parsed from address
        'CO', -- Default state for Colorado
        '80201', -- Default ZIP, should be parsed from address
        v_client_record.phone,
        'self',
        v_client_record.address,
        'Denver',
        'CO',
        '80201',
        '12-3456789', -- Default, should be organization specific
        30.00, -- Default transport rate
        'Monarch Competency Transport',
        '5245 Lowell Blvd, Denver, CO 80221',
        COALESCE(v_billing_info.billing_provider_npi, '1234567890'),
        p_created_by,
        p_created_by
    ) RETURNING id INTO v_form_id;
    
    -- Create service line
    INSERT INTO cms1500_service_lines (
        form_id,
        line_number,
        date_from,
        date_to,
        place_of_service,
        procedure_code,
        modifier_1,
        charges,
        days_or_units,
        diagnosis_pointer
    ) VALUES (
        v_form_id,
        1,
        v_trip_record.scheduled_pickup_time::DATE,
        v_trip_record.scheduled_pickup_time::DATE,
        '41', -- Ambulance - Land
        'T2003', -- Non-emergency transport
        'U2', -- Default modifier
        30.00,
        1,
        'A'
    );
    
    RETURN v_form_id;
END;
$$ LANGUAGE plpgsql;