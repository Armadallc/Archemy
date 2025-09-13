import { supabase } from './db.js';

async function updateCrossOrgAccess() {
  try {
    console.log('🔄 Creating organization_user account with cross-organizational access...');
    
    // First, create a booking kiosk user with cross-org access
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        id: 'booking_kiosk_001',
        email: 'booking@monarchtransport.com',
        password_hash: '$2b$10$YourHashedPasswordHere',
        first_name: 'Booking',
        last_name: 'Kiosk',
        role: 'organization_user',
        primary_organization_id: 'monarch_competency',
        authorized_organizations: ['monarch_competency', 'monarch_mental_health', 'monarch_sober_living', 'monarch_launch'],
        is_active: true
      })
      .select()
      .single();

    if (createError) {
      console.log('User might already exist, trying to update...');
      
      // Try to update existing organization_user accounts
      const { data, error } = await supabase
        .from('users')
        .update({
          authorized_organizations: ['monarch_competency', 'monarch_mental_health', 'monarch_sober_living', 'monarch_launch']
        })
        .eq('role', 'organization_user')
        .select();

      if (error) {
        console.error('❌ Error updating organization_user accounts:', error);
        return;
      }

      console.log(`✅ Updated ${data?.length || 0} organization_user accounts with cross-org access`);
      console.log('Updated users:', data?.map(u => ({ email: u.email, authorizedOrgs: u.authorized_organizations })));
    } else {
      console.log('✅ Created new booking kiosk user with cross-org access:', newUser.email);
    }

  } catch (error) {
    console.error('❌ Failed to update cross-org access:', error);
  }
}

updateCrossOrgAccess();