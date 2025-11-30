/**
 * SUPABASE STORAGE HELPER FUNCTIONS
 * Multi-Tenant Transportation Management System
 * 
 * This module provides TypeScript helper functions for file upload, retrieval,
 * and management with HIPAA compliance and role-based access control.
 */

import { supabase } from './minimal-supabase';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface FileMetadata {
  id: string;
  bucket_id: string;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  file_category: FileCategory;
  is_hipaa_protected: boolean;
  retention_until: string;
  program_id?: string;
  location_id?: string;
  client_id?: string;
  trip_id?: string;
  driver_id?: string;
  vehicle_id?: string;
  user_id?: string;
  uploaded_by: string;
  upload_reason?: string;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
}

export type FileCategory = 
  | 'intake_form' 
  | 'trip_photo' 
  | 'driver_license' 
  | 'facility_contract' 
  | 'vehicle_maintenance' 
  | 'incident_report' 
  | 'client_document' 
  | 'insurance_document' 
  | 'inspection_report' 
  | 'signature' 
  | 'other';

export interface UploadFileParams {
  file: File;
  category: FileCategory;
  programId?: string;
  locationId?: string;
  clientId?: string;
  tripId?: string;
  driverId?: string;
  vehicleId?: string;
  userId?: string;
  uploadReason?: string;
  isHipaaProtected?: boolean;
}

export interface FileAccessLog {
  id: string;
  file_id: string;
  user_id: string;
  action: 'view' | 'download' | 'upload' | 'update' | 'delete';
  ip_address?: string;
  user_agent?: string;
  accessed_at: string;
}

export interface RetentionFile {
  id: string;
  file_name: string;
  file_path: string;
  retention_until: string;
  days_remaining: number;
  program_id?: string;
  location_id?: string;
  client_id?: string;
  trip_id?: string;
  driver_id?: string;
  vehicle_id?: string;
}

// ============================================================================
// FILE UPLOAD FUNCTIONS
// ============================================================================

/**
 * Upload a file to Supabase Storage with automatic metadata creation
 */
export async function uploadFile(params: UploadFileParams, authenticatedUser?: any): Promise<{
  success: boolean;
  fileMetadata?: FileMetadata;
  error?: string;
}> {
  try {
    const { file, category, programId, locationId, clientId, tripId, driverId, vehicleId, userId, uploadReason, isHipaaProtected = false } = params;

    // Validate file type based on category
    const validationResult = validateFileType(file, category);
    if (!validationResult.valid) {
      return { success: false, error: validationResult.error };
    }

    // Use authenticated user from middleware or get current user
    let user;
    if (authenticatedUser) {
      user = authenticatedUser;
      console.log('🔍 Using authenticatedUser:', authenticatedUser);
    } else {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        return { success: false, error: 'Authentication required' };
      }
      user = authUser;
    }

    // Generate standardized file path
    const filePath = await generateFilePath(category, {
      programId,
      locationId,
      clientId,
      tripId,
      driverId,
      vehicleId,
      userId
    }, file.name);

    // Determine bucket based on file type
    const bucketId = getBucketForCategory(category);

    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketId)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      return { success: false, error: `Upload failed: ${uploadError.message}` };
    }

    // Create file metadata
    const { data: metadataData, error: metadataError } = await supabase
      .from('file_metadata')
      .insert({
        bucket_id: bucketId,
        file_path: filePath,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        file_category: category,
        is_hipaa_protected: isHipaaProtected,
        program_id: programId,
        location_id: locationId,
        client_id: clientId,
        trip_id: tripId,
        driver_id: driverId,
        vehicle_id: vehicleId,
        user_id: userId,
        uploaded_by: authenticatedUser ? authenticatedUser.userId : user.id,
        upload_reason: uploadReason
      })
      .select()
      .single();

    if (metadataError) {
      // Clean up uploaded file if metadata creation fails
      await supabase.storage.from(bucketId).remove([filePath]);
      return { success: false, error: `Metadata creation failed: ${metadataError.message}` };
    }

    // Log file access
    await logFileAccess(metadataData.id, user.id, 'upload');

    return { success: true, fileMetadata: metadataData };
  } catch (error) {
    return { success: false, error: `Upload error: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

/**
 * Upload multiple files in batch
 */
export async function uploadFiles(files: UploadFileParams[], authenticatedUser?: any): Promise<{
  success: boolean;
  results: Array<{ success: boolean; fileMetadata?: FileMetadata; error?: string }>;
}> {
  const results = await Promise.all(
    files.map(file => uploadFile(file, authenticatedUser))
  );

  const allSuccessful = results.every(result => result.success);
  
  return {
    success: allSuccessful,
    results
  };
}

// ============================================================================
// FILE RETRIEVAL FUNCTIONS
// ============================================================================

/**
 * Get file download URL with access validation
 */
export async function getFileDownloadUrl(fileId: string): Promise<{
  success: boolean;
  url?: string;
  error?: string;
}> {
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    // Check if user can access file
    const { data: canAccess, error: accessError } = await supabase
      .rpc('can_user_access_file', {
        user_id_param: user.id,
        file_id_param: fileId
      });

    if (accessError || !canAccess) {
      return { success: false, error: 'Access denied' };
    }

    // Get file metadata
    const { data: fileMetadata, error: metadataError } = await supabase
      .from('file_metadata')
      .select('bucket_id, file_path')
      .eq('id', fileId)
      .single();

    if (metadataError || !fileMetadata) {
      return { success: false, error: 'File not found' };
    }

    // Generate signed URL for download
    const { data: urlData, error: urlError } = await supabase.storage
      .from(fileMetadata.bucket_id)
      .createSignedUrl(fileMetadata.file_path, 3600); // 1 hour expiry

    if (urlError || !urlData?.signedUrl) {
      return { success: false, error: 'Failed to generate download URL' };
    }

    // Log file access
    await logFileAccess(fileId, user.id, 'download');

    return { success: true, url: urlData.signedUrl };
  } catch (error) {
    return { success: false, error: `Download error: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

/**
 * Get files for a specific entity (facility, trip, driver, etc.)
 */
export async function getFilesForEntity(params: {
  programId?: string;
  locationId?: string;
  clientId?: string;
  tripId?: string;
  driverId?: string;
  vehicleId?: string;
  category?: FileCategory;
  limit?: number;
  offset?: number;
}): Promise<{
  success: boolean;
  files?: FileMetadata[];
  error?: string;
}> {
  try {
    const { programId, locationId, clientId, tripId, driverId, vehicleId, category, limit = 50, offset = 0 } = params;

    let query = supabase
      .from('file_metadata')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (programId) query = query.eq('program_id', programId);
    if (locationId) query = query.eq('location_id', locationId);
    if (clientId) query = query.eq('client_id', clientId);
    if (tripId) query = query.eq('trip_id', tripId);
    if (driverId) query = query.eq('driver_id', driverId);
    if (vehicleId) query = query.eq('vehicle_id', vehicleId);
    if (category) query = query.eq('file_category', category);

    const { data: files, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, files: files || [] };
  } catch (error) {
    return { success: false, error: `Query error: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

/**
 * Get files by category across all accessible entities
 */
export async function getFilesByCategory(category: FileCategory): Promise<{
  success: boolean;
  files?: FileMetadata[];
  error?: string;
}> {
  try {
    const { data: files, error } = await supabase
      .from('file_metadata')
      .select('*')
      .eq('file_category', category)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, files: files || [] };
  } catch (error) {
    return { success: false, error: `Query error: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

// ============================================================================
// FILE MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Update file metadata
 */
export async function updateFileMetadata(fileId: string, updates: Partial<FileMetadata>): Promise<{
  success: boolean;
  fileMetadata?: FileMetadata;
  error?: string;
}> {
  try {
    const { data: fileMetadata, error } = await supabase
      .from('file_metadata')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', fileId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, fileMetadata };
  } catch (error) {
    return { success: false, error: `Update error: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

/**
 * Delete file (soft delete by updating metadata)
 */
export async function deleteFile(fileId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    // Check if user can delete file
    const { data: fileMetadata, error: metadataError } = await supabase
      .from('file_metadata')
      .select('bucket_id, file_path, uploaded_by')
      .eq('id', fileId)
      .single();

    if (metadataError || !fileMetadata) {
      return { success: false, error: 'File not found' };
    }

    // Only super admin and corporate admin can delete files
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (userError || !userData) {
      return { success: false, error: 'User not found' };
    }

    if (!['super_admin', 'corporate_admin'].includes(userData.role)) {
      return { success: false, error: 'Insufficient permissions to delete file' };
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(fileMetadata.bucket_id)
      .remove([fileMetadata.file_path]);

    if (storageError) {
      return { success: false, error: `Storage deletion failed: ${storageError.message}` };
    }

    // Delete metadata
    const { error: deleteError } = await supabase
      .from('file_metadata')
      .delete()
      .eq('id', fileId);

    if (deleteError) {
      return { success: false, error: `Metadata deletion failed: ${deleteError.message}` };
    }

    // Log file access
    await logFileAccess(fileId, user.id, 'delete');

    return { success: true };
  } catch (error) {
    return { success: false, error: `Delete error: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

// ============================================================================
// RETENTION AND COMPLIANCE FUNCTIONS
// ============================================================================

/**
 * Get files nearing retention limit
 */
export async function getFilesNearingRetention(daysAhead: number = 30): Promise<{
  success: boolean;
  files?: RetentionFile[];
  error?: string;
}> {
  try {
    const { data: files, error } = await supabase
      .rpc('get_files_nearing_retention', { days_ahead: daysAhead });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, files: files || [] };
  } catch (error) {
    return { success: false, error: `Query error: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

/**
 * Archive expired files
 */
export async function archiveExpiredFiles(): Promise<{
  success: boolean;
  archivedCount?: number;
  archivedFiles?: string[];
  error?: string;
}> {
  try {
    const { data: result, error } = await supabase
      .rpc('archive_expired_files');

    if (error) {
      return { success: false, error: error.message };
    }

    const { archived_count, archived_files } = result[0];
    return { 
      success: true, 
      archivedCount: archived_count, 
      archivedFiles: archived_files 
    };
  } catch (error) {
    return { success: false, error: `Archive error: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

// ============================================================================
// AUDIT AND LOGGING FUNCTIONS
// ============================================================================

/**
 * Log file access for audit compliance
 */
export async function logFileAccess(
  fileId: string, 
  userId: string, 
  action: 'view' | 'download' | 'upload' | 'update' | 'delete',
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    await supabase.rpc('log_file_access', {
      file_id_param: fileId,
      user_id_param: userId,
      action_param: action,
      ip_address_param: ipAddress,
      user_agent_param: userAgent
    });
  } catch (error) {
    console.error('Failed to log file access:', error);
  }
}

/**
 * Get file access audit log
 */
export async function getFileAccessLog(fileId: string): Promise<{
  success: boolean;
  logs?: FileAccessLog[];
  error?: string;
}> {
  try {
    const { data: logs, error } = await supabase
      .from('file_access_audit')
      .select('*')
      .eq('file_id', fileId)
      .order('accessed_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, logs: logs || [] };
  } catch (error) {
    return { success: false, error: `Query error: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Validate file type based on category
 */
function validateFileType(file: File, category: FileCategory): { valid: boolean; error?: string } {
  const allowedTypes = {
    intake_form: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    trip_photo: ['image/jpeg', 'image/png', 'image/heic', 'image/webp'],
    driver_license: ['image/jpeg', 'image/png', 'application/pdf'],
    facility_contract: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    vehicle_maintenance: ['application/pdf', 'image/jpeg', 'image/png'],
    incident_report: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    client_document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    insurance_document: ['application/pdf', 'image/jpeg', 'image/png'],
    inspection_report: ['application/pdf', 'image/jpeg', 'image/png'],
    signature: ['image/jpeg', 'image/png', 'image/webp'],
    other: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png']
  };

  const allowedMimeTypes = allowedTypes[category] || allowedTypes.other;
  
  if (!allowedMimeTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `File type ${file.type} not allowed for category ${category}` 
    };
  }

  return { valid: true };
}

/**
 * Get bucket ID for file category
 */
function getBucketForCategory(category: FileCategory): string {
  const photoCategories = ['trip_photo', 'signature'];
  return photoCategories.includes(category) ? 'photos' : 'documents';
}

/**
 * Generate standardized file path
 */
async function generateFilePath(
  category: FileCategory, 
  entityIds: {
    programId?: string;
    locationId?: string;
    clientId?: string;
    tripId?: string;
    driverId?: string;
    vehicleId?: string;
    userId?: string;
  }, 
  fileName: string
): Promise<string> {
  const { data, error } = await supabase.rpc('generate_file_path', {
    category_param: category,
    entity_type: getEntityType(entityIds),
    entity_id: getPrimaryEntityId(entityIds),
    file_name_param: fileName
  });

  if (error) {
    throw new Error(`Failed to generate file path: ${error.message}`);
  }

  return data;
}

/**
 * Get entity type from entity IDs
 */
function getEntityType(entityIds: {
  programId?: string;
  locationId?: string;
  clientId?: string;
  tripId?: string;
  driverId?: string;
  vehicleId?: string;
  userId?: string;
}): string {
  if (entityIds.tripId) return 'trip';
  if (entityIds.driverId) return 'driver';
  if (entityIds.vehicleId) return 'vehicle';
  if (entityIds.clientId) return 'client';
  if (entityIds.locationId) return 'location';
  if (entityIds.programId) return 'program';
  if (entityIds.userId) return 'user';
  return 'misc';
}

/**
 * Get primary entity ID from entity IDs
 */
function getPrimaryEntityId(entityIds: {
  programId?: string;
  locationId?: string;
  clientId?: string;
  tripId?: string;
  driverId?: string;
  vehicleId?: string;
  userId?: string;
}): string {
  return entityIds.tripId || 
         entityIds.driverId || 
         entityIds.vehicleId || 
         entityIds.clientId || 
         entityIds.locationId || 
         entityIds.programId || 
         entityIds.userId || 
         'unknown';
}

/**
 * Check if user has permission to access file
 */
export async function canUserAccessFile(fileId: string): Promise<boolean> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return false;

    const { data: canAccess, error } = await supabase
      .rpc('can_user_access_file', {
        user_id_param: user.id,
        file_id_param: fileId
      });

    return !error && canAccess === true;
  } catch (error) {
    return false;
  }
}

/**
 * Get user's accessible programs
 */
export async function getUserAccessiblePrograms(): Promise<string[]> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return [];

    const { data: programs, error } = await supabase
      .rpc('get_user_accessible_programs', {
        user_id_param: user.id
      });

    return error ? [] : (programs?.map((p: any) => p.program_id) || []);
  } catch (error) {
    return [];
  }
}

/**
 * Get user's accessible locations
 */
export async function getUserAccessibleLocations(): Promise<string[]> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return [];

    const { data: locations, error } = await supabase
      .rpc('get_user_accessible_locations', {
        user_id_param: user.id
      });

    return error ? [] : (locations?.map((l: any) => l.location_id) || []);
  } catch (error) {
    return [];
  }
}

// ============================================================================
// EXPORT ALL FUNCTIONS
// ============================================================================

export const fileStorageHelpers = {
  // Upload functions
  uploadFile,
  uploadFiles,
  
  // Retrieval functions
  getFileDownloadUrl,
  getFilesForEntity,
  getFilesByCategory,
  
  // Management functions
  updateFileMetadata,
  deleteFile,
  
  // Retention functions
  getFilesNearingRetention,
  archiveExpiredFiles,
  
  // Audit functions
  logFileAccess,
  getFileAccessLog,
  
  // Utility functions
  canUserAccessFile,
  getUserAccessiblePrograms,
  getUserAccessibleLocations
};
