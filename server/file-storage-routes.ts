/**
 * FILE STORAGE API ROUTES
 * Multi-Tenant Transportation Management System
 * 
 * This module provides API endpoints for file upload, retrieval, and management
 * with HIPAA compliance and role-based access control.
 */

import * as express from 'express';
import multer from 'multer';
import { fileStorageHelpers, FileCategory, UploadFileParams } from './file-storage-helpers';
import { requireSupabaseAuth, SupabaseAuthenticatedRequest } from './supabase-auth';

const router = express.Router();

console.log('🔍 File storage routes module loaded');
console.log('🔍 File storage routes will be available at /api/files/*');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Basic file type validation
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/heic',
      'image/webp',
      'text/plain'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

// ============================================================================
// TEST ENDPOINTS
// ============================================================================

/**
 * GET /api/files/test-auth
 * Test authentication without file upload
 */
router.get('/test-auth', requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res: express.Response) => {
  console.log('🔍 Test auth route called');
  console.log('🔍 User from middleware:', req.user);
  
  res.json({
    success: true,
    message: 'Authentication test successful',
    user: req.user
  });
});

// ============================================================================
// FILE UPLOAD ENDPOINTS
// ============================================================================

/**
 * POST /api/files/upload
 * Upload a single file
 */
router.post('/upload', requireSupabaseAuth, upload.single('file'), async (req: SupabaseAuthenticatedRequest, res: express.Response) => {
  try {
    console.log('🔍 File upload route called');
    console.log('🔍 User from middleware:', req.user);
    console.log('🔍 File received:', req.file ? 'Yes' : 'No');
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const {
      category,
      programId,
      locationId,
      clientId,
      tripId,
      driverId,
      vehicleId,
      userId,
      uploadReason,
      isHipaaProtected
    } = req.body;

    if (!category) {
      return res.status(400).json({ error: 'File category is required' });
    }

    // Convert file buffer to File object
    const file = new File([req.file.buffer], req.file.originalname, {
      type: req.file.mimetype
    });

    const uploadParams: UploadFileParams = {
      file,
      category: category as FileCategory,
      programId,
      locationId,
      clientId,
      tripId,
      driverId,
      vehicleId,
      userId,
      uploadReason,
      isHipaaProtected: isHipaaProtected === 'true'
    };

    const result = await fileStorageHelpers.uploadFile(uploadParams, req.user);

    if (result.success) {
      res.status(201).json({
        success: true,
        fileMetadata: result.fileMetadata
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/files/upload-multiple
 * Upload multiple files
 */
router.post('/upload-multiple', requireSupabaseAuth, upload.array('files', 10), async (req: SupabaseAuthenticatedRequest, res: express.Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    const {
      category,
      programId,
      locationId,
      clientId,
      tripId,
      driverId,
      vehicleId,
      userId,
      uploadReason,
      isHipaaProtected
    } = req.body;

    if (!category) {
      return res.status(400).json({ error: 'File category is required' });
    }

    const uploadParams: UploadFileParams[] = files.map(file => ({
      file: new File([file.buffer], file.originalname, { type: file.mimetype }),
      category: category as FileCategory,
      programId,
      locationId,
      clientId,
      tripId,
      driverId,
      vehicleId,
      userId,
      uploadReason,
      isHipaaProtected: isHipaaProtected === 'true'
    }));

    const result = await fileStorageHelpers.uploadFiles(uploadParams, req.user);

    res.status(201).json(result);
  } catch (error) {
    console.error('Multiple file upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ============================================================================
// FILE RETRIEVAL ENDPOINTS
// ============================================================================

/**
 * GET /api/files/:fileId/download
 * Get download URL for a file
 */
router.get('/:fileId/download', requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res: express.Response) => {
  try {
    const { fileId } = req.params;
    
    const result = await fileStorageHelpers.getFileDownloadUrl(fileId);

    if (result.success) {
      res.json({
        success: true,
        downloadUrl: result.url
      });
    } else {
      res.status(403).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/files/entity/:entityType/:entityId
 * Get files for a specific entity
 */
router.get('/entity/:entityType/:entityId', requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res: express.Response) => {
  try {
    const { entityType, entityId } = req.params;
    const { category, limit = '50', offset = '0' } = req.query;

    let params: any = {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    };

    // Set the appropriate entity ID based on entity type
    switch (entityType) {
      case 'program':
        params.programId = entityId;
        break;
      case 'location':
        params.locationId = entityId;
        break;
      case 'client':
        params.clientId = entityId;
        break;
      case 'trip':
        params.tripId = entityId;
        break;
      case 'driver':
        params.driverId = entityId;
        break;
      case 'vehicle':
        params.vehicleId = entityId;
        break;
      case 'user':
        params.userId = entityId;
        break;
      default:
        return res.status(400).json({ error: 'Invalid entity type' });
    }

    if (category) {
      params.category = category as FileCategory;
    }

    const result = await fileStorageHelpers.getFilesForEntity(params);

    if (result.success) {
      res.json({
        success: true,
        files: result.files
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Get files for entity error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/files/category/:category
 * Get files by category
 */
router.get('/category/:category', requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res: express.Response) => {
  try {
    const { category } = req.params;

    const result = await fileStorageHelpers.getFilesByCategory(category as FileCategory);

    if (result.success) {
      res.json({
        success: true,
        files: result.files
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Get files by category error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ============================================================================
// FILE MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * PUT /api/files/:fileId
 * Update file metadata
 */
router.put('/:fileId', requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res: express.Response) => {
  try {
    const { fileId } = req.params;
    const updates = req.body;

    const result = await fileStorageHelpers.updateFileMetadata(fileId, updates);

    if (result.success) {
      res.json({
        success: true,
        fileMetadata: result.fileMetadata
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Update file metadata error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * DELETE /api/files/:fileId
 * Delete a file
 */
router.delete('/:fileId', requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res: express.Response) => {
  try {
    const { fileId } = req.params;

    const result = await fileStorageHelpers.deleteFile(fileId);

    if (result.success) {
      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } else {
      res.status(403).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ============================================================================
// RETENTION AND COMPLIANCE ENDPOINTS
// ============================================================================

/**
 * GET /api/files/retention/nearing-expiry
 * Get files nearing retention limit
 */
router.get('/retention/nearing-expiry', requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res: express.Response) => {
  try {
    const { daysAhead = '30' } = req.query;

    const result = await fileStorageHelpers.getFilesNearingRetention(parseInt(daysAhead as string));

    if (result.success) {
      res.json({
        success: true,
        files: result.files
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Get files nearing retention error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/files/retention/archive-expired
 * Archive expired files
 */
router.post('/retention/archive-expired', requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res: express.Response) => {
  try {
    const result = await fileStorageHelpers.archiveExpiredFiles();

    if (result.success) {
      res.json({
        success: true,
        archivedCount: result.archivedCount,
        archivedFiles: result.archivedFiles
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Archive expired files error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ============================================================================
// AUDIT AND LOGGING ENDPOINTS
// ============================================================================

/**
 * GET /api/files/:fileId/audit-log
 * Get file access audit log
 */
router.get('/:fileId/audit-log', requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res: express.Response) => {
  try {
    const { fileId } = req.params;

    const result = await fileStorageHelpers.getFileAccessLog(fileId);

    if (result.success) {
      res.json({
        success: true,
        logs: result.logs
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Get file audit log error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ============================================================================
// UTILITY ENDPOINTS
// ============================================================================

/**
 * GET /api/files/user/accessible-programs
 * Get user's accessible programs
 */
router.get('/user/accessible-programs', requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res: express.Response) => {
  try {
    const programs = await fileStorageHelpers.getUserAccessiblePrograms();

    res.json({
      success: true,
      programs
    });
  } catch (error) {
    console.error('Get accessible programs error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/files/user/accessible-locations
 * Get user's accessible locations
 */
router.get('/user/accessible-locations', requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res: express.Response) => {
  try {
    const locations = await fileStorageHelpers.getUserAccessibleLocations();

    res.json({
      success: true,
      locations
    });
  } catch (error) {
    console.error('Get accessible locations error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/files/user/can-access/:fileId
 * Check if user can access a file
 */
router.get('/user/can-access/:fileId', requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res: express.Response) => {
  try {
    const { fileId } = req.params;

    const canAccess = await fileStorageHelpers.canUserAccessFile(fileId);

    res.json({
      success: true,
      canAccess
    });
  } catch (error) {
    console.error('Check file access error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ============================================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================================

// Handle multer errors
router.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 50MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files. Maximum is 10 files per request.'
      });
    }
  }
  
  if (error.message === 'Invalid file type') {
    return res.status(400).json({
      success: false,
      error: 'Invalid file type. Allowed types: PDF, DOC, DOCX, JPEG, PNG, HEIC, WEBP'
    });
  }

  next(error);
});

export default router;
