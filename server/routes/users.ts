import express from "express";
import { 
  requireSupabaseAuth,
  requireSupabaseRole,
  SupabaseAuthenticatedRequest
} from "../supabase-auth";
import { upload, processAvatarToSupabase, deleteFileFromSupabase } from "../upload";
import { usersStorage, supabase } from "../minimal-supabase";
import { findUsers, getUserById } from "../services/userSearchService";

const router = express.Router();

// ============================================================================
// USER LISTING ROUTES
// ============================================================================

/**
 * GET /api/users
 * Get all users (filtered by hierarchy if applicable)
 * Access: super_admin, corporate_admin
 */
router.get("/", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Super admin can see all users
    // Corporate admin can only see users in their corporate client
    if (req.user.role === 'super_admin') {
      const users = await usersStorage.getAllUsers();
      return res.json(users);
    } else if (req.user.role === 'corporate_admin' && req.user.corporateClientId) {
      // Filter users by corporate client
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          programs:primary_program_id (
            id,
            name,
            corporate_clients:corporate_client_id (
              id,
              name
            )
          ),
          corporate_clients!corporate_client_id (
            id,
            name
          )
        `)
        .eq('corporate_client_id', req.user.corporateClientId);
      
      if (error) throw error;
      
      // Enrich data with corporate client names if relationship didn't work
      const enrichedData = await Promise.all((data || []).map(async (user: any) => {
        if (user.corporate_client_id && !user.corporate_clients) {
          try {
            const { data: corpClient } = await supabase
              .from('corporate_clients')
              .select('id, name')
              .eq('id', user.corporate_client_id)
              .single();
            if (corpClient) {
              user.corporate_clients = corpClient;
            }
          } catch (err) {
            console.warn(`Could not fetch corporate client for user ${user.user_id}:`, err);
          }
        }
        return user;
      }));
      
      return res.json(enrichedData);
    } else {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
  } catch (error: any) {
    console.error("Error fetching users:", error);
    res.status(500).json({ 
      message: "Failed to fetch users",
      error: error.message 
    });
  }
});

/**
 * GET /api/users/program/:programId
 * Get users by program
 * Access: super_admin, corporate_admin, program_admin
 */
router.get("/program/:programId", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { programId } = req.params;
    const users = await usersStorage.getUsersByProgram(programId);
    res.json(users);
  } catch (error: any) {
    console.error("Error fetching users by program:", error);
    res.status(500).json({ 
      message: "Failed to fetch users",
      error: error.message 
    });
  }
});

/**
 * GET /api/users/corporate-client/:corporateClientId
 * Get users by corporate client
 * Access: super_admin, corporate_admin
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

    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        programs:primary_program_id (
          id,
          name,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        ),
        corporate_clients:corporate_client_id (
          id,
          name
        )
      `)
      .eq('corporate_client_id', corporateClientId);
    
    if (error) throw error;
    
    // Enrich data with corporate client names if relationship didn't work
    const enrichedData = await Promise.all((data || []).map(async (user: any) => {
      if (user.corporate_client_id && !user.corporate_clients) {
        try {
          const { data: corpClient } = await supabase
            .from('corporate_clients')
            .select('id, name')
            .eq('id', user.corporate_client_id)
            .single();
          if (corpClient) {
            user.corporate_clients = corpClient;
          }
        } catch (err) {
          console.warn(`Could not fetch corporate client for user ${user.user_id}:`, err);
        }
      }
      return user;
    }));
    
    res.json(enrichedData);
  } catch (error: any) {
    console.error("Error fetching users by corporate client:", error);
    res.status(500).json({ 
      message: "Failed to fetch users",
      error: error.message 
    });
  }
});

// ============================================================================
// USER AVATAR ROUTES
// ============================================================================

/**
 * POST /api/users/:userId/avatar
 * Upload user avatar
 * Access: User can upload their own avatar, super_admin can upload any user's avatar
 */
router.post("/:userId/avatar", requireSupabaseAuth, upload.single('avatar'), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    console.log('📤 Avatar upload request received');
    const { userId } = req.params;
    console.log('👤 User ID:', userId);
    console.log('📁 File received:', req.file ? {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : 'NO FILE');
    
    // Check authentication
    if (!req.user) {
      console.error('❌ No user in request');
      return res.status(401).json({ message: "Authentication required" });
    }

    console.log('✅ Authenticated user:', req.user.userId, req.user.role);

    // Check authorization: user can upload their own avatar, super_admin can upload any
    if (req.user.userId !== userId && req.user.role !== 'super_admin') {
      console.error('❌ Authorization failed:', { requestUserId: userId, authUserId: req.user.userId, role: req.user.role });
      return res.status(403).json({ message: "You can only upload your own avatar" });
    }

    // Check if file was uploaded
    if (!req.file) {
      console.error('❌ No file in request');
      return res.status(400).json({ message: "No file provided" });
    }

    console.log('📥 Processing file...');

    // Get current user to check for existing avatar
    const currentUser = await usersStorage.getUser(userId);
    if (!currentUser) {
      console.error('❌ User not found:', userId);
      return res.status(404).json({ message: "User not found" });
    }

    console.log('👤 Current user found:', currentUser.user_name);
    console.log('🖼️ Current avatar URL:', currentUser.avatar_url);

    // Delete old avatar if it exists (from Supabase Storage)
    if (currentUser.avatar_url) {
      try {
        console.log('🗑️ Deleting old avatar...');
        await deleteFileFromSupabase(currentUser.avatar_url);
        console.log('✅ Old avatar deleted');
      } catch (error) {
        console.error('⚠️ Error deleting old avatar (continuing):', error);
        // Continue even if deletion fails
      }
    }

    // Process and upload new avatar to Supabase Storage
    console.log('🔄 Processing and uploading avatar to Supabase...');
    const avatarUrl = await processAvatarToSupabase(req.file.buffer, userId);
    console.log('✅ Avatar uploaded to Supabase:', avatarUrl);

    // Update user record with new avatar URL
    console.log('💾 Updating user record...');
    const updatedUser = await usersStorage.updateUser(userId, {
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString()
    });
    console.log('✅ User record updated');

    res.json({
      success: true,
      avatar_url: avatarUrl,
      user: updatedUser
    });
  } catch (error: any) {
    console.error("❌ Error uploading avatar:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ 
      message: "Failed to upload avatar",
      error: error.message 
    });
  }
});

/**
 * DELETE /api/users/:userId/avatar
 * Delete user avatar
 * Access: User can delete their own avatar, super_admin can delete any user's avatar
 */
router.delete("/:userId/avatar", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    
    // Check authentication
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Check authorization: user can delete their own avatar, super_admin can delete any
    if (req.user.userId !== userId && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: "You can only delete your own avatar" });
    }

    // Get current user
    const currentUser = await usersStorage.getUser(userId);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete avatar file from Supabase Storage if it exists
    if (currentUser.avatar_url) {
      try {
        await deleteFileFromSupabase(currentUser.avatar_url);
      } catch (error) {
        console.error('Error deleting avatar file:', error);
        // Continue even if file deletion fails
      }
    }

    // Update user record to remove avatar URL
    const updatedUser = await usersStorage.updateUser(userId, {
      avatar_url: null,
      updated_at: new Date().toISOString()
    });

    res.json({
      success: true,
      avatar_url: null,
      user: updatedUser
    });
  } catch (error: any) {
    console.error("Error deleting avatar:", error);
    res.status(500).json({ 
      message: "Failed to delete avatar",
      error: error.message 
    });
  }
});

// ============================================================================
// USER UPDATE ROUTES
// ============================================================================

/**
 * PATCH /api/users/:userId
 * Update user information
 * Access: super_admin can update any user, corporate_admin can update users in their corporate client,
 *         program_admin can update users in their program, users can update themselves
 */
router.patch("/:userId", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { userId } = req.params;
    const updates = req.body;

    // Get the user being updated
    const targetUser = await usersStorage.getUser(userId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Authorization checks
    const isSuperAdmin = req.user.role === 'super_admin';
    const isUpdatingSelf = req.user.userId === userId;
    const isCorporateAdmin = req.user.role === 'corporate_admin';
    const isProgramAdmin = req.user.role === 'program_admin';

    // Super admin can update anyone
    if (!isSuperAdmin && !isUpdatingSelf) {
      // Corporate admin can only update users in their corporate client
      if (isCorporateAdmin) {
        if (req.user.corporateClientId !== targetUser.corporate_client_id) {
          return res.status(403).json({ message: "You can only update users in your corporate client" });
        }
      }
      // Program admin can only update users in their program
      else if (isProgramAdmin) {
        if (req.user.primaryProgramId !== targetUser.primary_program_id) {
          return res.status(403).json({ message: "You can only update users in your program" });
        }
      }
      // Regular users can only update themselves
      else if (!isUpdatingSelf) {
        return res.status(403).json({ message: "You can only update your own profile" });
      }
    }

    // Prepare update data - handle both camelCase and snake_case field names
    const updateData: any = { ...updates };
    
    // Normalize field names (camelCase to snake_case)
    if (updateData.firstName !== undefined) {
      updateData.first_name = updateData.firstName;
      delete updateData.firstName;
    }
    if (updateData.lastName !== undefined) {
      updateData.last_name = updateData.lastName;
      delete updateData.lastName;
    }
    if (updateData.userName !== undefined) {
      updateData.user_name = updateData.userName;
      delete updateData.userName;
    }
    if (updateData.primaryProgramId !== undefined) {
      updateData.primary_program_id = updateData.primaryProgramId;
      delete updateData.primaryProgramId;
    }
    if (updateData.corporateClientId !== undefined) {
      updateData.corporate_client_id = updateData.corporateClientId;
      delete updateData.corporateClientId;
    }
    if (updateData.authorizedPrograms !== undefined) {
      updateData.authorized_programs = updateData.authorizedPrograms;
      delete updateData.authorizedPrograms;
    }
    
    // Handle password update (hash it)
    if (updateData.password) {
      const bcrypt = await import('bcrypt');
      updateData.password_hash = await bcrypt.hash(updateData.password, 12);
      delete updateData.password;
    }

    // Prevent updating certain fields unless super admin
    if (!isSuperAdmin) {
      // Non-super admins cannot change role, corporate_client_id, or primary_program_id
      delete updateData.role;
      delete updateData.corporate_client_id;
      delete updateData.primary_program_id;
      delete updateData.authorized_programs;
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    // Update the user
    const updatedUser = await usersStorage.updateUser(userId, updateData);

    res.json({
      success: true,
      user: updatedUser
    });
  } catch (error: any) {
    console.error("Error updating user:", error);
    res.status(500).json({ 
      message: "Failed to update user",
      error: error.message 
    });
  }
});

/**
 * DELETE /api/users/:userId
 * Delete (deactivate) user
 * Access: super_admin, corporate_admin (for users in their corporate client)
 */
router.delete("/:userId", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { userId } = req.params;

    // Get the user being deleted
    const targetUser = await usersStorage.getUser(userId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Corporate admin can only deactivate users in their corporate client
    if (req.user.role === 'corporate_admin' && req.user.corporateClientId !== targetUser.corporate_client_id) {
      return res.status(403).json({ message: "You can only deactivate users in your corporate client" });
    }

    // Soft delete: set is_active to false
    const updatedUser = await usersStorage.updateUser(userId, {
      is_active: false,
      updated_at: new Date().toISOString()
    });

    res.json({
      success: true,
      user: updatedUser
    });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    res.status(500).json({ 
      message: "Failed to delete user",
      error: error.message 
    });
  }
});

// ============================================================================
// USER SEARCH ROUTES (Universal Tagging System)
// ============================================================================

/**
 * GET /api/users/search
 * Search for users with multi-tenant scoping
 * Access: All authenticated users (scoped by role)
 */
router.get("/search", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const query = req.query.q as string || '';
    const scope = req.query.scope as 'organization' | 'program' | 'all' | undefined;
    const allowedRolesParam = req.query.roles as string | undefined;
    const excludeUsersParam = req.query.exclude as string | undefined;
    const limit = parseInt(req.query.limit as string || '50', 10);

    const allowedRoles = allowedRolesParam 
      ? allowedRolesParam.split(',').filter(r => 
          ['super_admin', 'corporate_admin', 'program_admin', 'program_user', 'driver'].includes(r)
        ) as Array<'super_admin' | 'corporate_admin' | 'program_admin' | 'program_user' | 'driver'>
      : undefined;

    const excludeUsers = excludeUsersParam 
      ? excludeUsersParam.split(',').filter(id => id.trim().length > 0)
      : [];

    const results = await findUsers(query, {
      currentUserId: req.user.userId,
      scope: scope || 'all',
      allowedRoles,
      excludeUsers,
      limit: Math.min(limit, 100), // Cap at 100
    });

    res.json(results);
  } catch (error: any) {
    console.error("Error searching users:", error);
    res.status(500).json({ 
      message: "Failed to search users",
      error: error.message 
    });
  }
});

/**
 * GET /api/users/:userId/details
 * Get user details with scope validation
 * Access: All authenticated users (scoped by role)
 * NOTE: This route must come before the general /:userId routes to avoid route conflicts
 */
router.get("/:userId/details", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { userId } = req.params;
    const user = await getUserById(userId, req.user.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found or access denied" });
    }

    res.json(user);
  } catch (error: any) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ 
      message: "Failed to fetch user details",
      error: error.message 
    });
  }
});

export default router;

