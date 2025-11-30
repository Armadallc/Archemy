import express from "express";
import { 
  requireSupabaseAuth,
  requireSupabaseRole,
  SupabaseAuthenticatedRequest
} from "../supabase-auth";
import { upload, processAvatar, deleteFile } from "../upload";
import { usersStorage, supabase } from "../minimal-supabase";

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
          )
        `)
        .eq('corporate_client_id', req.user.corporateClientId);
      
      if (error) throw error;
      return res.json(data || []);
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
        )
      `)
      .eq('corporate_client_id', corporateClientId);
    
    if (error) throw error;
    res.json(data || []);
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
    const { userId } = req.params;
    
    // Check authentication
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Check authorization: user can upload their own avatar, super_admin can upload any
    if (req.user.userId !== userId && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: "You can only upload your own avatar" });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    // Get current user to check for existing avatar
    const currentUser = await usersStorage.getUser(userId);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete old avatar if it exists
    if (currentUser.avatar_url) {
      try {
        deleteFile(currentUser.avatar_url);
      } catch (error) {
        console.error('Error deleting old avatar:', error);
        // Continue even if deletion fails
      }
    }

    // Process and save new avatar
    const avatarUrl = await processAvatar(req.file.buffer, userId);

    // Update user record with new avatar URL
    const updatedUser = await usersStorage.updateUser(userId, {
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString()
    });

    res.json({
      success: true,
      avatar_url: avatarUrl,
      user: updatedUser
    });
  } catch (error: any) {
    console.error("Error uploading avatar:", error);
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

    // Delete avatar file if it exists
    if (currentUser.avatar_url) {
      try {
        deleteFile(currentUser.avatar_url);
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

export default router;

