import express from "express";
import multer from "multer";
import { 
  requireSupabaseAuth, 
  requireSupabaseRole,
  SupabaseAuthenticatedRequest
} from "../supabase-auth";
import { 
  programLicensuresStorage,
  staffCertificationsStorage,
  programFormsStorage,
  programCurriculumStorage,
  programOnboardingItemsStorage,
  tasksStorage
} from "../minimal-supabase";
import { uploadFile, FileCategory } from "../file-storage-helpers";

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// ============================================================================
// PROGRAM LICENSURES ROUTES
// ============================================================================

// Get all licensures for a program
router.get("/licensures/program/:programId", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { programId } = req.params;
    const licensures = await programLicensuresStorage.getLicensuresByProgram(programId);
    res.json(licensures);
  } catch (error: any) {
    console.error("Error fetching licensures:", error);
    res.status(500).json({ message: "Failed to fetch licensures", error: error.message });
  }
});

// Get single licensure
router.get("/licensures/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const licensure = await programLicensuresStorage.getLicensure(id);
    if (!licensure) {
      return res.status(404).json({ message: "Licensure not found" });
    }
    res.json(licensure);
  } catch (error: any) {
    console.error("Error fetching licensure:", error);
    res.status(500).json({ message: "Failed to fetch licensure", error: error.message });
  }
});

// Create licensure
router.post("/licensures", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "User ID not found in session" });
    }
    const licensure = await programLicensuresStorage.createLicensure(req.body, req.user.userId);
    res.status(201).json(licensure);
  } catch (error: any) {
    console.error("Error creating licensure:", error);
    res.status(500).json({ message: "Failed to create licensure", error: error.message });
  }
});

// Update licensure
router.patch("/licensures/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "User ID not found in session" });
    }
    const { id } = req.params;
    const licensure = await programLicensuresStorage.updateLicensure(id, req.body, req.user.userId);
    res.json(licensure);
  } catch (error: any) {
    console.error("Error updating licensure:", error);
    res.status(500).json({ message: "Failed to update licensure", error: error.message });
  }
});

// Delete licensure
router.delete("/licensures/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    await programLicensuresStorage.deleteLicensure(id);
    res.status(204).send();
  } catch (error: any) {
    console.error("Error deleting licensure:", error);
    res.status(500).json({ message: "Failed to delete licensure", error: error.message });
  }
});

// ============================================================================
// STAFF CERTIFICATIONS ROUTES
// ============================================================================

// Get all certifications for a program
router.get("/certifications/program/:programId", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { programId } = req.params;
    const certifications = await staffCertificationsStorage.getCertificationsByProgram(programId);
    res.json(certifications);
  } catch (error: any) {
    console.error("Error fetching certifications:", error);
    res.status(500).json({ message: "Failed to fetch certifications", error: error.message });
  }
});

// Get single certification
router.get("/certifications/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const certification = await staffCertificationsStorage.getCertification(id);
    if (!certification) {
      return res.status(404).json({ message: "Certification not found" });
    }
    res.json(certification);
  } catch (error: any) {
    console.error("Error fetching certification:", error);
    res.status(500).json({ message: "Failed to fetch certification", error: error.message });
  }
});

// Create certification
router.post("/certifications", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "User ID not found in session" });
    }
    const certification = await staffCertificationsStorage.createCertification(req.body, req.user.userId);
    res.status(201).json(certification);
  } catch (error: any) {
    console.error("Error creating certification:", error);
    res.status(500).json({ message: "Failed to create certification", error: error.message });
  }
});

// Update certification
router.patch("/certifications/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "User ID not found in session" });
    }
    const { id } = req.params;
    const certification = await staffCertificationsStorage.updateCertification(id, req.body, req.user.userId);
    res.json(certification);
  } catch (error: any) {
    console.error("Error updating certification:", error);
    res.status(500).json({ message: "Failed to update certification", error: error.message });
  }
});

// Delete certification
router.delete("/certifications/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    await staffCertificationsStorage.deleteCertification(id);
    res.status(204).send();
  } catch (error: any) {
    console.error("Error deleting certification:", error);
    res.status(500).json({ message: "Failed to delete certification", error: error.message });
  }
});

// ============================================================================
// PROGRAM FORMS ROUTES
// ============================================================================

// Get all forms for a program
router.get("/forms/program/:programId", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin', 'program_user']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { programId } = req.params;
    const forms = await programFormsStorage.getFormsByProgram(programId);
    res.json(forms);
  } catch (error: any) {
    console.error("Error fetching forms:", error);
    res.status(500).json({ message: "Failed to fetch forms", error: error.message });
  }
});

// Get single form
router.get("/forms/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin', 'program_user']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const form = await programFormsStorage.getForm(id);
    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }
    res.json(form);
  } catch (error: any) {
    console.error("Error fetching form:", error);
    res.status(500).json({ message: "Failed to fetch form", error: error.message });
  }
});

// Create form
router.post("/forms", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "User ID not found in session" });
    }
    const form = await programFormsStorage.createForm(req.body, req.user.userId);
    res.status(201).json(form);
  } catch (error: any) {
    console.error("Error creating form:", error);
    res.status(500).json({ message: "Failed to create form", error: error.message });
  }
});

// Update form
router.patch("/forms/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "User ID not found in session" });
    }
    const { id } = req.params;
    const form = await programFormsStorage.updateForm(id, req.body, req.user.userId);
    res.json(form);
  } catch (error: any) {
    console.error("Error updating form:", error);
    res.status(500).json({ message: "Failed to update form", error: error.message });
  }
});

// Delete form
router.delete("/forms/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    await programFormsStorage.deleteForm(id);
    res.status(204).send();
  } catch (error: any) {
    console.error("Error deleting form:", error);
    res.status(500).json({ message: "Failed to delete form", error: error.message });
  }
});

// ============================================================================
// PROGRAM CURRICULUM ROUTES
// ============================================================================

// Get all curriculum items for a program
router.get("/curriculum/program/:programId", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin', 'program_user']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { programId } = req.params;
    const curriculum = await programCurriculumStorage.getCurriculumByProgram(programId);
    res.json(curriculum);
  } catch (error: any) {
    console.error("Error fetching curriculum:", error);
    res.status(500).json({ message: "Failed to fetch curriculum", error: error.message });
  }
});

// Get single curriculum item
router.get("/curriculum/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin', 'program_user']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const item = await programCurriculumStorage.getCurriculumItem(id);
    if (!item) {
      return res.status(404).json({ message: "Curriculum item not found" });
    }
    res.json(item);
  } catch (error: any) {
    console.error("Error fetching curriculum item:", error);
    res.status(500).json({ message: "Failed to fetch curriculum item", error: error.message });
  }
});

// Create curriculum item
router.post("/curriculum", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "User ID not found in session" });
    }
    const item = await programCurriculumStorage.createCurriculumItem(req.body, req.user.userId);
    res.status(201).json(item);
  } catch (error: any) {
    console.error("Error creating curriculum item:", error);
    res.status(500).json({ message: "Failed to create curriculum item", error: error.message });
  }
});

// Update curriculum item
router.patch("/curriculum/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "User ID not found in session" });
    }
    const { id } = req.params;
    const item = await programCurriculumStorage.updateCurriculumItem(id, req.body, req.user.userId);
    res.json(item);
  } catch (error: any) {
    console.error("Error updating curriculum item:", error);
    res.status(500).json({ message: "Failed to update curriculum item", error: error.message });
  }
});

// Delete curriculum item
router.delete("/curriculum/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    await programCurriculumStorage.deleteCurriculumItem(id);
    res.status(204).send();
  } catch (error: any) {
    console.error("Error deleting curriculum item:", error);
    res.status(500).json({ message: "Failed to delete curriculum item", error: error.message });
  }
});

// ============================================================================
// PROGRAM ONBOARDING ITEMS ROUTES
// ============================================================================

// Get all onboarding items for a program
router.get("/onboarding/program/:programId", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin', 'program_user']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { programId } = req.params;
    const items = await programOnboardingItemsStorage.getOnboardingItemsByProgram(programId);
    res.json(items);
  } catch (error: any) {
    console.error("Error fetching onboarding items:", error);
    res.status(500).json({ message: "Failed to fetch onboarding items", error: error.message });
  }
});

// Get single onboarding item
router.get("/onboarding/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin', 'program_user']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const item = await programOnboardingItemsStorage.getOnboardingItem(id);
    if (!item) {
      return res.status(404).json({ message: "Onboarding item not found" });
    }
    res.json(item);
  } catch (error: any) {
    console.error("Error fetching onboarding item:", error);
    res.status(500).json({ message: "Failed to fetch onboarding item", error: error.message });
  }
});

// Create onboarding item
router.post("/onboarding", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "User ID not found in session" });
    }
    const item = await programOnboardingItemsStorage.createOnboardingItem(req.body, req.user.userId);
    res.status(201).json(item);
  } catch (error: any) {
    console.error("Error creating onboarding item:", error);
    res.status(500).json({ message: "Failed to create onboarding item", error: error.message });
  }
});

// Update onboarding item
router.patch("/onboarding/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "User ID not found in session" });
    }
    const { id } = req.params;
    const item = await programOnboardingItemsStorage.updateOnboardingItem(id, req.body, req.user.userId);
    res.json(item);
  } catch (error: any) {
    console.error("Error updating onboarding item:", error);
    res.status(500).json({ message: "Failed to update onboarding item", error: error.message });
  }
});

// Delete onboarding item
router.delete("/onboarding/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    await programOnboardingItemsStorage.deleteOnboardingItem(id);
    res.status(204).send();
  } catch (error: any) {
    console.error("Error deleting onboarding item:", error);
    res.status(500).json({ message: "Failed to delete onboarding item", error: error.message });
  }
});

// ============================================================================
// FILE UPLOAD ROUTES FOR PROGRAM MANAGEMENT
// ============================================================================

// Upload file for program form
router.post("/forms/:id/upload", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), upload.single('file'), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }
    if (!req.user?.userId) {
      return res.status(401).json({ message: "User ID not found in session" });
    }

    const { id } = req.params;
    const form = await programFormsStorage.getForm(id);
    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    // Convert buffer to File object
    const file = new File([req.file.buffer], req.file.originalname, { type: req.file.mimetype });

    // Upload file
    const result = await uploadFile({
      file,
      category: 'program_form' as FileCategory,
      programId: form.program_id,
      uploadReason: `Upload document for form: ${form.form_name}`,
      isHipaaProtected: false
    }, req.user);

    if (!result.success || !result.fileMetadata) {
      return res.status(500).json({ message: result.error || "Failed to upload file" });
    }

    // Get public URL from Supabase storage
    const { supabase } = await import("../minimal-supabase");
    const { data: urlData } = supabase.storage
      .from(result.fileMetadata.bucket_id)
      .getPublicUrl(result.fileMetadata.file_path);

    // Update form with document URL
    const updatedForm = await programFormsStorage.updateForm(id, {
      document_url: urlData.publicUrl
    }, req.user.userId);

    res.json({ success: true, form: updatedForm, fileUrl: urlData.publicUrl });
  } catch (error: any) {
    console.error("Error uploading form file:", error);
    res.status(500).json({ message: "Failed to upload file", error: error.message });
  }
});

// Upload file for curriculum item
router.post("/curriculum/:id/upload", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), upload.single('file'), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }
    if (!req.user?.userId) {
      return res.status(401).json({ message: "User ID not found in session" });
    }

    const { id } = req.params;
    const item = await programCurriculumStorage.getCurriculumItem(id);
    if (!item) {
      return res.status(404).json({ message: "Curriculum item not found" });
    }

    // Convert buffer to File object
    const file = new File([req.file.buffer], req.file.originalname, { type: req.file.mimetype });

    // Upload file
    const result = await uploadFile({
      file,
      category: 'program_curriculum' as FileCategory,
      programId: item.program_id,
      uploadReason: `Upload document for curriculum: ${item.title}`,
      isHipaaProtected: false
    }, req.user);

    if (!result.success || !result.fileMetadata) {
      return res.status(500).json({ message: result.error || "Failed to upload file" });
    }

    // Get public URL from Supabase storage
    const { supabase } = await import("../minimal-supabase");
    const { data: urlData } = supabase.storage
      .from(result.fileMetadata.bucket_id)
      .getPublicUrl(result.fileMetadata.file_path);

    // Update curriculum item with document URL
    const updatedItem = await programCurriculumStorage.updateCurriculumItem(id, {
      document_url: urlData.publicUrl
    }, req.user.userId);

    res.json({ success: true, item: updatedItem, fileUrl: urlData.publicUrl });
  } catch (error: any) {
    console.error("Error uploading curriculum file:", error);
    res.status(500).json({ message: "Failed to upload file", error: error.message });
  }
});

// Upload file for onboarding item
router.post("/onboarding/:id/upload", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), upload.single('file'), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }
    if (!req.user?.userId) {
      return res.status(401).json({ message: "User ID not found in session" });
    }

    const { id } = req.params;
    const item = await programOnboardingItemsStorage.getOnboardingItem(id);
    if (!item) {
      return res.status(404).json({ message: "Onboarding item not found" });
    }

    // Convert buffer to File object
    const file = new File([req.file.buffer], req.file.originalname, { type: req.file.mimetype });

    // Upload file
    const result = await uploadFile({
      file,
      category: 'program_onboarding' as FileCategory,
      programId: item.program_id,
      uploadReason: `Upload document for onboarding: ${item.title}`,
      isHipaaProtected: false
    }, req.user);

    if (!result.success || !result.fileMetadata) {
      return res.status(500).json({ message: result.error || "Failed to upload file" });
    }

    // Get public URL from Supabase storage
    const { supabase } = await import("../minimal-supabase");
    const { data: urlData } = supabase.storage
      .from(result.fileMetadata.bucket_id)
      .getPublicUrl(result.fileMetadata.file_path);

    // Update onboarding item with document URL
    const updatedItem = await programOnboardingItemsStorage.updateOnboardingItem(id, {
      document_url: urlData.publicUrl
    }, req.user.userId);

    res.json({ success: true, item: updatedItem, fileUrl: urlData.publicUrl });
  } catch (error: any) {
    console.error("Error uploading onboarding file:", error);
    res.status(500).json({ message: "Failed to upload file", error: error.message });
  }
});

// ============================================================================
// TASKS ROUTES
// ============================================================================

// Get all tasks for a program
router.get("/tasks/program/:programId", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin', 'program_user']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { programId } = req.params;
    const { status, priority } = req.query;
    const filters: any = {};
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    const tasks = await tasksStorage.getTasksByProgram(programId, filters);
    res.json(tasks);
  } catch (error: any) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ message: "Failed to fetch tasks", error: error.message });
  }
});

// Get single task
router.get("/tasks/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin', 'program_user']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const task = await tasksStorage.getTask(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json(task);
  } catch (error: any) {
    console.error("Error fetching task:", error);
    res.status(500).json({ message: "Failed to fetch task", error: error.message });
  }
});

// Create task
router.post("/tasks", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin', 'program_user']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "User ID not found in session" });
    }
    const task = await tasksStorage.createTask(req.body, req.user.userId);
    res.status(201).json(task);
  } catch (error: any) {
    console.error("Error creating task:", error);
    res.status(500).json({ message: "Failed to create task", error: error.message });
  }
});

// Update task
router.patch("/tasks/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin', 'program_user']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const task = await tasksStorage.updateTask(id, req.body);
    res.json(task);
  } catch (error: any) {
    console.error("Error updating task:", error);
    res.status(500).json({ message: "Failed to update task", error: error.message });
  }
});

// Delete task
router.delete("/tasks/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    await tasksStorage.deleteTask(id);
    res.status(204).send();
  } catch (error: any) {
    console.error("Error deleting task:", error);
    res.status(500).json({ message: "Failed to delete task", error: error.message });
  }
});

export default router;

