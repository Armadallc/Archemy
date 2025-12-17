-- ============================================================================
-- Migration 015: Backfill Existing Contacts
-- ============================================================================
-- Purpose: Initial sync of tenant users to contacts for all existing users
-- Created: 2025-01-17
-- Dependencies: Migration 013 (contacts table), Migration 014 (sync function)

-- This migration will populate contacts for all existing users
-- by syncing their tenant users to their personal contacts

DO $$
DECLARE
    user_record RECORD;
    synced_count INTEGER;
    total_synced INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting contact backfill for existing users...';
    
    -- Loop through all active users
    FOR user_record IN 
        SELECT user_id, corporate_client_id
        FROM users
        WHERE is_active = true
          AND corporate_client_id IS NOT NULL
    LOOP
        BEGIN
            -- Call the sync function for each user
            SELECT sync_tenant_users_to_contacts(user_record.user_id) INTO synced_count;
            total_synced := total_synced + synced_count;
            
            RAISE NOTICE 'Synced % contacts for user %', synced_count, user_record.user_id;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING 'Failed to sync contacts for user %: %', user_record.user_id, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Backfill complete. Total contacts synced: %', total_synced;
END $$;

-- Verify the sync
SELECT 
    COUNT(*) as total_contacts,
    COUNT(DISTINCT owner_user_id) as users_with_contacts,
    COUNT(*) FILTER (WHERE is_app_user = true) as app_user_contacts,
    COUNT(*) FILTER (WHERE is_app_user = false) as external_contacts
FROM contacts;

