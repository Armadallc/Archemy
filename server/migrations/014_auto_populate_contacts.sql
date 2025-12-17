-- ============================================================================
-- Migration 014: Auto-Populate Contacts Function
-- ============================================================================
-- Purpose: Function to auto-populate contacts from tenant users
-- Created: 2025-01-17
-- Dependencies: Migration 013 (contacts table)

-- Function to auto-populate contacts from tenant users
-- This function can be called manually or via trigger
CREATE OR REPLACE FUNCTION auto_populate_tenant_contacts()
RETURNS TRIGGER AS $$
BEGIN
    -- When a new user is created, add them as contacts to all users in their tenant
    -- This will be called via trigger or manual sync
    INSERT INTO contacts (
        owner_user_id,
        user_id,
        first_name,
        last_name,
        email,
        phone,
        role,
        is_app_user,
        program_id,
        location_id,
        is_active
    )
    SELECT 
        u.user_id as owner_user_id,
        NEW.user_id as user_id,
        COALESCE(NEW.first_name, '') as first_name,
        COALESCE(NEW.last_name, '') as last_name,
        NEW.email,
        NEW.phone,
        NEW.role,
        true as is_app_user,
        NEW.primary_program_id as program_id,
        NULL as location_id, -- Can be enhanced later
        NEW.is_active
    FROM users u
    WHERE u.corporate_client_id = NEW.corporate_client_id
      AND u.user_id != NEW.user_id
      AND u.is_active = true
    ON CONFLICT ON CONSTRAINT uq_contacts_owner_app_user DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to sync all tenant users to a specific user's contacts
-- This can be called manually via API endpoint
CREATE OR REPLACE FUNCTION sync_tenant_users_to_contacts(p_owner_user_id VARCHAR(50))
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_corporate_client_id VARCHAR(50);
    v_inserted_count INTEGER := 0;
BEGIN
    -- Get the owner user's corporate client
    SELECT corporate_client_id INTO v_corporate_client_id
    FROM users
    WHERE user_id = p_owner_user_id;
    
    IF v_corporate_client_id IS NULL THEN
        RAISE EXCEPTION 'User % not found or has no corporate client', p_owner_user_id;
    END IF;
    
    -- Insert all users from the same tenant as contacts
    INSERT INTO contacts (
        owner_user_id,
        user_id,
        first_name,
        last_name,
        email,
        phone,
        role,
        is_app_user,
        program_id,
        location_id,
        is_active
    )
    SELECT 
        p_owner_user_id as owner_user_id,
        u.user_id as user_id,
        COALESCE(u.first_name, '') as first_name,
        COALESCE(u.last_name, '') as last_name,
        u.email,
        u.phone,
        u.role,
        true as is_app_user,
        u.primary_program_id as program_id,
        NULL as location_id,
        u.is_active
    FROM users u
    WHERE u.corporate_client_id = v_corporate_client_id
      AND u.user_id != p_owner_user_id
      AND u.is_active = true
    ON CONFLICT ON CONSTRAINT uq_contacts_owner_app_user DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        role = EXCLUDED.role,
        program_id = EXCLUDED.program_id,
        is_active = EXCLUDED.is_active,
        updated_at = NOW();
    
    GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
    
    RETURN v_inserted_count;
END;
$$ LANGUAGE plpgsql;

-- Note: Trigger is commented out - we'll use manual sync via API instead
-- This gives more control and allows users to sync on-demand
-- CREATE TRIGGER trigger_auto_populate_contacts
--     AFTER INSERT ON users
--     FOR EACH ROW
--     EXECUTE FUNCTION auto_populate_tenant_contacts();

-- Grant execute permission to authenticated users and service_role
-- This allows the function to be called via Supabase RPC
GRANT EXECUTE ON FUNCTION sync_tenant_users_to_contacts(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_tenant_users_to_contacts(VARCHAR) TO service_role;

COMMENT ON FUNCTION auto_populate_tenant_contacts() IS 'Trigger function to auto-populate contacts when a new user is created (currently not used - manual sync preferred)';
COMMENT ON FUNCTION sync_tenant_users_to_contacts(VARCHAR) IS 'Manually sync all tenant users to a specific user''s contacts. Returns count of contacts created/updated.';
