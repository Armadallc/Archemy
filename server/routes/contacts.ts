import express from "express";
import { 
  requireSupabaseAuth,
  requireSupabaseRole,
  SupabaseAuthenticatedRequest
} from "../supabase-auth";
import { contactsStorage } from "../contacts-storage";
import { handleConstraintError } from "../utils/constraint-errors";

const router = express.Router();

/**
 * GET /api/contacts
 * Get all contacts for the current user (with optional filters)
 * Access: All authenticated users (contacts are personalized per user)
 */
router.get("/", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const ownerUserId = req.user.userId || req.user.user_id;
    
    // Parse filters from query params
    const filters = {
      category_id: req.query.category_id as string | undefined,
      role: req.query.role as string | undefined,
      program_id: req.query.program_id as string | undefined,
      location_id: req.query.location_id as string | undefined,
      search: req.query.search as string | undefined,
      alphabetical: req.query.alphabetical as 'asc' | 'desc' | undefined,
      is_active: req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined,
    };

    const contacts = await contactsStorage.getAllContacts(ownerUserId, filters);
    res.json(contacts);
  } catch (error: any) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({ 
      message: "Failed to fetch contacts",
      error: error.message 
    });
  }
});

/**
 * GET /api/contacts/categories
 * Get all contact categories
 * Access: All authenticated users
 */
router.get("/categories", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const categories = await contactsStorage.getContactCategories();
    res.json(categories);
  } catch (error: any) {
    console.error("Error fetching contact categories:", error);
    res.status(500).json({ 
      message: "Failed to fetch contact categories",
      error: error.message 
    });
  }
});

/**
 * GET /api/contacts/:id
 * Get a single contact by ID
 * Access: Owner of the contact only
 */
router.get("/:id", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { id } = req.params;
    const ownerUserId = req.user.userId || req.user.user_id;

    const contact = await contactsStorage.getContact(id, ownerUserId);
    
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    res.json(contact);
  } catch (error: any) {
    console.error("Error fetching contact:", error);
    res.status(500).json({ 
      message: "Failed to fetch contact",
      error: error.message 
    });
  }
});

/**
 * POST /api/contacts
 * Create a new contact
 * Access: All authenticated users
 */
router.post("/", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const ownerUserId = req.user.userId || req.user.user_id;
    
    // Set owner_user_id from authenticated user
    const contactData = {
      ...req.body,
      owner_user_id: ownerUserId,
    };

    const contact = await contactsStorage.createContact(contactData);
    res.status(201).json(contact);
  } catch (error: any) {
    console.error("Error creating contact:", error);
    
    // Handle constraint violations with user-friendly messages
    if (handleConstraintError(error, res)) {
      return;
    }
    
    res.status(500).json({ 
      message: "Failed to create contact",
      error: error.message 
    });
  }
});

/**
 * PATCH /api/contacts/:id
 * Update an existing contact
 * Access: Owner of the contact only
 */
router.patch("/:id", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { id } = req.params;
    const ownerUserId = req.user.userId || req.user.user_id;

    // Prevent changing owner_user_id
    const updates = { ...req.body };
    delete updates.owner_user_id;

    const contact = await contactsStorage.updateContact(id, ownerUserId, updates);
    res.json(contact);
  } catch (error: any) {
    console.error("Error updating contact:", error);
    
    // Handle constraint violations with user-friendly messages
    if (handleConstraintError(error, res)) {
      return;
    }
    
    if (error.message === 'Contact not found or access denied') {
      return res.status(404).json({ message: error.message });
    }
    
    res.status(500).json({ 
      message: "Failed to update contact",
      error: error.message 
    });
  }
});

/**
 * DELETE /api/contacts/:id
 * Delete a contact (soft delete)
 * Access: Owner of the contact only
 */
router.delete("/:id", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { id } = req.params;
    const ownerUserId = req.user.userId || req.user.user_id;

    await contactsStorage.deleteContact(id, ownerUserId);
    res.json({ message: "Contact deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting contact:", error);
    
    if (error.message === 'Contact not found or access denied') {
      return res.status(404).json({ message: error.message });
    }
    
    res.status(500).json({ 
      message: "Failed to delete contact",
      error: error.message 
    });
  }
});

/**
 * POST /api/contacts/sync-tenant
 * Manually sync tenant users to contacts
 * Access: All authenticated users
 */
router.post("/sync-tenant", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const ownerUserId = req.user.userId || (req.user as any).user_id;
    
    if (!ownerUserId) {
      console.error('❌ [sync-tenant] No user_id found in req.user');
      return res.status(400).json({ 
        message: "User ID not found in authentication token"
      });
    }
    
    const count = await contactsStorage.syncTenantUsersToContacts(ownerUserId);
    
    console.log('✅ [sync-tenant] Sync completed, count:', count);
    res.json({ 
      message: `Successfully synced ${count} tenant users to contacts`,
      synced_count: count
    });
  } catch (error: any) {
    console.error("❌ [sync-tenant] Error syncing tenant users to contacts:", error);
    res.status(500).json({ 
      message: "Failed to sync tenant users to contacts",
      error: error.message || error.toString(),
      details: error.code || error.hint || undefined
    });
  }
});

// ============================================================================
// LEGACY ROUTES (for backward compatibility)
// ============================================================================

/**
 * GET /api/contacts/program/:programId
 * Get contacts (users) by program - LEGACY (returns users, not contacts)
 * Access: super_admin, corporate_admin, program_admin
 * 
 * @deprecated This endpoint returns users, not contacts. Use /api/users/program/:programId instead.
 */
router.get("/program/:programId", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { programId } = req.params;

    // This is a legacy endpoint - redirect to users endpoint
    // For now, we'll return a message suggesting the correct endpoint
    res.status(410).json({ 
      message: "This endpoint is deprecated. Use /api/users/program/:programId for users, or /api/contacts with program_id filter for contacts.",
      deprecated: true
    });
  } catch (error: any) {
    console.error("Error fetching contacts by program:", error);
    res.status(500).json({ 
      message: "Failed to fetch contacts",
      error: error.message 
    });
  }
});

/**
 * GET /api/contacts/corporate-client/:corporateClientId
 * Get contacts (users) by corporate client - LEGACY (returns users, not contacts)
 * Access: super_admin, corporate_admin
 * 
 * @deprecated This endpoint returns users, not contacts. Use /api/users/corporate-client/:corporateClientId instead.
 */
router.get("/corporate-client/:corporateClientId", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { corporateClientId } = req.params;

    // Corporate admin can only see users in their own corporate client
    if (req.user.role === 'corporate_admin' && req.user.corporateClientId !== corporateClientId) {
      return res.status(403).json({ message: "You can only view users in your own corporate client" });
    }

    // This is a legacy endpoint - redirect to users endpoint
    res.status(410).json({ 
      message: "This endpoint is deprecated. Use /api/users/corporate-client/:corporateClientId for users, or /api/contacts for contacts.",
      deprecated: true
    });
  } catch (error: any) {
    console.error("Error fetching contacts by corporate client:", error);
    res.status(500).json({ 
      message: "Failed to fetch contacts",
      error: error.message 
    });
  }
});

export default router;

