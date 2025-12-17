/**
 * CONTACTS STORAGE LAYER
 * 
 * Manages user contacts (personal phone book)
 * Supports both app users (auto-populated) and external contacts (manually added)
 */

import { supabase } from './minimal-supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface Contact {
  id: string;
  owner_user_id: string;
  user_id?: string | null;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  organization?: string | null;
  role?: string | null;
  category_id?: string | null;
  category_custom_text?: string | null;
  program_id?: string | null;
  location_id?: string | null;
  is_active: boolean;
  is_app_user: boolean;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ContactFilters {
  category_id?: string;
  role?: string;
  program_id?: string;
  location_id?: string;
  search?: string;
  alphabetical?: 'asc' | 'desc';
  is_active?: boolean;
}

export interface EnrichedContact extends Contact {
  // Enriched fields from joins
  category_name?: string;
  program_name?: string;
  location_name?: string;
  corporate_client_name?: string;
  avatar_url?: string | null; // From users table if app user
  user_email?: string | null; // From users table if app user
  user_phone?: string | null; // From users table if app user
}

// ============================================================================
// CONTACTS STORAGE
// ============================================================================

export const contactsStorage = {
  /**
   * Get all contacts for a user with optional filters
   */
  async getAllContacts(ownerUserId: string, filters: ContactFilters = {}): Promise<EnrichedContact[]> {
    let query = supabase
      .from('contacts')
      .select(`
        *,
        contact_categories:category_id (
          id,
          name
        ),
        programs:program_id (
          id,
          name,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        ),
        locations:location_id (
          id,
          name
        ),
        users:user_id (
          user_id,
          email,
          phone,
          avatar_url,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        )
      `)
      .eq('owner_user_id', ownerUserId);

    // Apply filters
    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id);
    }

    if (filters.role) {
      query = query.eq('role', filters.role);
    }

    if (filters.program_id) {
      query = query.eq('program_id', filters.program_id);
    }

    if (filters.location_id) {
      query = query.eq('location_id', filters.location_id);
    }

    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    } else {
      // Default to active contacts only
      query = query.eq('is_active', true);
    }

    // Search filter (name, email, phone, organization)
    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      query = query.or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm},organization.ilike.${searchTerm}`);
    }

    // Alphabetical sorting
    if (filters.alphabetical === 'asc') {
      query = query.order('last_name', { ascending: true }).order('first_name', { ascending: true });
    } else if (filters.alphabetical === 'desc') {
      query = query.order('last_name', { ascending: false }).order('first_name', { ascending: false });
    } else {
      // Default: order by created_at desc (newest first)
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;
    if (error) throw error;

    // Enrich data
    const enrichedContacts: EnrichedContact[] = (data || []).map((contact: any) => {
      const enriched: EnrichedContact = {
        ...contact,
        category_name: contact.contact_categories?.name || null,
        program_name: contact.programs?.name || null,
        location_name: contact.locations?.name || null,
        corporate_client_name: contact.programs?.corporate_clients?.name || contact.users?.corporate_clients?.name || null,
        avatar_url: contact.users?.avatar_url || null,
        user_email: contact.users?.email || null,
        user_phone: contact.users?.phone || null,
      };

      // Remove nested objects
      delete (enriched as any).contact_categories;
      delete (enriched as any).programs;
      delete (enriched as any).locations;
      delete (enriched as any).users;

      return enriched;
    });

    return enrichedContacts;
  },

  /**
   * Get a single contact by ID
   */
  async getContact(id: string, ownerUserId: string): Promise<EnrichedContact | null> {
    const { data, error } = await supabase
      .from('contacts')
      .select(`
        *,
        contact_categories:category_id (
          id,
          name
        ),
        programs:program_id (
          id,
          name,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        ),
        locations:location_id (
          id,
          name
        ),
        users:user_id (
          user_id,
          email,
          phone,
          avatar_url,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        )
      `)
      .eq('id', id)
      .eq('owner_user_id', ownerUserId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;

    // Enrich data
    const enriched: EnrichedContact = {
      ...data,
      category_name: data.contact_categories?.name || null,
      program_name: data.programs?.name || null,
      location_name: data.locations?.name || null,
      corporate_client_name: data.programs?.corporate_clients?.name || data.users?.corporate_clients?.name || null,
      avatar_url: data.users?.avatar_url || null,
      user_email: data.users?.email || null,
      user_phone: data.users?.phone || null,
    };

    // Remove nested objects
    delete (enriched as any).contact_categories;
    delete (enriched as any).programs;
    delete (enriched as any).locations;
    delete (enriched as any).users;

    return enriched;
  },

  /**
   * Create a new contact
   */
  async createContact(contactData: Omit<Contact, 'id' | 'created_at' | 'updated_at'>): Promise<Contact> {
    // Validate required fields
    if (!contactData.owner_user_id) {
      throw new Error('owner_user_id is required');
    }
    if (!contactData.first_name || !contactData.last_name) {
      throw new Error('first_name and last_name are required');
    }

    // If category is "other", ensure category_custom_text is provided
    if (contactData.category_id === 'other' && !contactData.category_custom_text) {
      // Allow empty but warn
      console.warn('⚠️ [createContact] "Other" category selected but no custom text provided');
    }

    // If category is not "other", clear category_custom_text
    if (contactData.category_id !== 'other') {
      contactData.category_custom_text = null;
    }

    // Set is_app_user based on user_id presence
    if (contactData.user_id) {
      contactData.is_app_user = true;
    } else {
      contactData.is_app_user = false;
    }

    const { data, error } = await supabase
      .from('contacts')
      .insert(contactData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update an existing contact
   */
  async updateContact(id: string, ownerUserId: string, updates: Partial<Contact>): Promise<Contact> {
    // Ensure user owns this contact
    const existing = await this.getContact(id, ownerUserId);
    if (!existing) {
      throw new Error('Contact not found or access denied');
    }

    // If category is "other", ensure category_custom_text is provided
    if (updates.category_id === 'other' && !updates.category_custom_text && !existing.category_custom_text) {
      console.warn('⚠️ [updateContact] "Other" category selected but no custom text provided');
    }

    // If category is not "other", clear category_custom_text
    if (updates.category_id && updates.category_id !== 'other') {
      updates.category_custom_text = null;
    }

    // Update is_app_user if user_id changes
    if (updates.user_id !== undefined) {
      updates.is_app_user = !!updates.user_id;
    }

    // Add updated_at timestamp
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('contacts')
      .update(updates)
      .eq('id', id)
      .eq('owner_user_id', ownerUserId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a contact (soft delete by setting is_active to false)
   */
  async deleteContact(id: string, ownerUserId: string): Promise<void> {
    // Ensure user owns this contact
    const existing = await this.getContact(id, ownerUserId);
    if (!existing) {
      throw new Error('Contact not found or access denied');
    }

    const { error } = await supabase
      .from('contacts')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('owner_user_id', ownerUserId);

    if (error) throw error;
  },

  /**
   * Sync tenant users to contacts (auto-populate)
   * Uses the PostgreSQL function created in migration 014
   * Uses the RPC wrapper created in migration 014a for better Supabase compatibility
   */
  async syncTenantUsersToContacts(ownerUserId: string): Promise<number> {
    // Try the RPC wrapper first (created in migration 014a)
    let { data, error } = await supabase.rpc('sync_tenant_users_to_contacts_rpc', {
      p_owner_user_id: ownerUserId
    });

    // If RPC wrapper fails, try direct function call
    if (error) {
      console.warn('⚠️ [syncTenantUsersToContacts] RPC wrapper failed, trying direct function call:', error.message);
      
      const fallbackResult = await supabase.rpc('sync_tenant_users_to_contacts', {
        p_owner_user_id: ownerUserId
      });
      
      if (fallbackResult.error) {
        console.error('❌ [syncTenantUsersToContacts] Sync failed:', fallbackResult.error);
        throw new Error(
          `Failed to sync tenant users: ${fallbackResult.error.message || JSON.stringify(fallbackResult.error)}`
        );
      }
      
      data = fallbackResult.data;
      error = null;
    }

    if (error) {
      console.error('❌ [syncTenantUsersToContacts] Sync failed:', error);
      throw new Error(`Failed to sync tenant users: ${error.message || JSON.stringify(error)}`);
    }
    
    return data || 0;
  },

  /**
   * Get all contact categories
   */
  async getContactCategories() {
    const { data, error } = await supabase
      .from('contact_categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },
};

