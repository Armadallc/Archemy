import express from "express";
import { 
  requireSupabaseAuth, 
  requireSupabaseRole,
  SupabaseAuthenticatedRequest
} from "../supabase-auth";
import { requirePermission } from "../auth";
import { PERMISSIONS } from "../permissions";
import { programsStorage, corporateClientsStorage } from "../minimal-supabase";
import { upload, processProgramLogoToSupabase, deleteFileFromSupabase } from "../upload";

const router = express.Router();

// Get all programs
router.get("/", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_PROGRAMS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const programs = await programsStorage.getAllPrograms();
    // Add caching headers (5 minutes - programs don't change often)
    res.set('Cache-Control', 'private, max-age=300');
    res.json(programs);
  } catch (error) {
    console.error("Error fetching programs:", error);
    res.status(500).json({ message: "Failed to fetch programs" });
  }
});

// Get programs by corporate client
router.get("/corporate-client/:corporateClientId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_PROGRAMS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { corporateClientId } = req.params;
    const programs = await programsStorage.getProgramsByCorporateClient(corporateClientId);
    // Add caching headers (5 minutes - programs don't change often)
    res.set('Cache-Control', 'private, max-age=300');
    res.json(programs);
  } catch (error) {
    console.error("Error fetching programs:", error);
    res.status(500).json({ message: "Failed to fetch programs" });
  }
});

// Get single program by ID
router.get("/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_PROGRAMS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const program = await programsStorage.getProgramById(id);
    if (!program) {
      return res.status(404).json({ message: "Program not found" });
    }
    res.json(program);
  } catch (error) {
    console.error("Error fetching program:", error);
    res.status(500).json({ message: "Failed to fetch program" });
  }
});

// Create program
router.post("/", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const program = await programsStorage.createProgram(req.body);
    res.status(201).json(program);
  } catch (error) {
    console.error("Error creating program:", error);
    res.status(500).json({ message: "Failed to create program" });
  }
});

// Update program
router.patch("/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const program = await programsStorage.updateProgram(id, req.body);
    res.json(program);
  } catch (error) {
    console.error("Error updating program:", error);
    res.status(500).json({ message: "Failed to update program" });
  }
});

// Delete program
router.delete("/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    await programsStorage.deleteProgram(id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting program:", error);
    res.status(500).json({ message: "Failed to delete program" });
  }
});

// ============================================================================
// PROGRAM LOGO ROUTES
// ============================================================================

/**
 * POST /api/programs/:id/logo
 * Upload program logo
 * Access: super_admin can upload any, corporate_admin can upload logos for programs in their corporate client
 */
router.post("/:id/logo", requireSupabaseAuth, upload.single('logo'), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    // Check authentication
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Get program to check corporate client
    const program = await programsStorage.getProgram(id);
    if (!program) {
      return res.status(404).json({ message: "Program not found" });
    }

    // Check authorization: super_admin can upload any, corporate_admin can upload for programs in their corporate client
    if (req.user.role === 'corporate_admin') {
      if (req.user.corporateClientId !== program.corporate_client_id) {
        return res.status(403).json({ message: "You can only upload logos for programs in your corporate client" });
      }
    } else if (req.user.role !== 'super_admin') {
      return res.status(403).json({ message: "You do not have permission to upload program logos" });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    // Delete old logo if it exists
    if (program.logo_url) {
      try {
        await deleteFileFromSupabase(program.logo_url);
      } catch (error) {
        console.error('Error deleting old logo:', error);
        // Continue even if deletion fails
      }
    }

    // Process and upload new logo to Supabase Storage
    const logoUrl = await processProgramLogoToSupabase(req.file.buffer, id);

    // Update program record with new logo URL
    const updatedProgram = await programsStorage.updateProgram(id, {
      logo_url: logoUrl,
      updated_at: new Date().toISOString()
    });

    res.json({
      success: true,
      logo_url: logoUrl,
      program: updatedProgram
    });
  } catch (error: any) {
    console.error("Error uploading program logo:", error);
    res.status(500).json({ 
      message: "Failed to upload logo",
      error: error.message 
    });
  }
});

/**
 * DELETE /api/programs/:id/logo
 * Delete program logo
 * Access: super_admin can delete any, corporate_admin can delete logos for programs in their corporate client
 */
router.delete("/:id/logo", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    // Check authentication
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Get program to check corporate client
    const program = await programsStorage.getProgram(id);
    if (!program) {
      return res.status(404).json({ message: "Program not found" });
    }

    // Check authorization: super_admin can delete any, corporate_admin can delete for programs in their corporate client
    if (req.user.role === 'corporate_admin') {
      if (req.user.corporateClientId !== program.corporate_client_id) {
        return res.status(403).json({ message: "You can only delete logos for programs in your corporate client" });
      }
    } else if (req.user.role !== 'super_admin') {
      return res.status(403).json({ message: "You do not have permission to delete program logos" });
    }

    // Delete logo from Supabase Storage if it exists
    if (program.logo_url) {
      try {
        await deleteFileFromSupabase(program.logo_url);
      } catch (error) {
        console.error('Error deleting logo file:', error);
        // Continue even if file deletion fails
      }
    }

    // Update program record to remove logo URL
    const updatedProgram = await programsStorage.updateProgram(id, {
      logo_url: null,
      updated_at: new Date().toISOString()
    });

    res.json({
      success: true,
      logo_url: null,
      program: updatedProgram
    });
  } catch (error: any) {
    console.error("Error deleting program logo:", error);
    res.status(500).json({ 
      message: "Failed to delete logo",
      error: error.message 
    });
  }
});

export default router;

