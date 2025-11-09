# SUPABASE STORAGE TESTING CHECKLIST
## Multi-Tenant Transportation Management System

This document provides a comprehensive testing checklist to verify that the Supabase Storage system works correctly with proper permissions, HIPAA compliance, and role-based access control.

## 📋 TABLE OF CONTENTS

1. [Pre-Testing Setup](#pre-testing-setup)
2. [Database Migration Testing](#database-migration-testing)
3. [Storage Bucket Testing](#storage-bucket-testing)
4. [RLS Policy Testing](#rls-policy-testing)
5. [File Upload Testing](#file-upload-testing)
6. [File Access Testing](#file-access-testing)
7. [Role-Based Access Testing](#role-based-access-testing)
8. [HIPAA Compliance Testing](#hipaa-compliance-testing)
9. [Retention Management Testing](#retention-management-testing)
10. [Audit Logging Testing](#audit-logging-testing)
11. [API Endpoint Testing](#api-endpoint-testing)
12. [Performance Testing](#performance-testing)
13. [Error Handling Testing](#error-handling-testing)
14. [Security Testing](#security-testing)

---

## 🚀 PRE-TESTING SETUP

### Prerequisites Checklist

- [ ] Supabase project is set up and accessible
- [ ] Database migration has been applied successfully
- [ ] Test users with different roles are created
- [ ] Test data (programs, locations, clients, trips, drivers, vehicles) exists
- [ ] API server is running and accessible
- [ ] Test files of various types are prepared

### Test Data Setup

```sql
-- Create test users for each role
INSERT INTO users (user_id, user_name, email, password_hash, role, primary_program_id) VALUES
('test_super_admin', 'Test Super Admin', 'superadmin@test.com', 'hash', 'super_admin', 'test_program_1'),
('test_corporate_admin', 'Test Corporate Admin', 'corpadmin@test.com', 'hash', 'corporate_admin', 'test_program_1'),
('test_program_admin', 'Test Program Admin', 'progadmin@test.com', 'hash', 'program_admin', 'test_program_1'),
('test_program_user', 'Test Program User', 'proguser@test.com', 'hash', 'program_user', 'test_program_1'),
('test_driver', 'Test Driver', 'driver@test.com', 'hash', 'driver', 'test_program_1');

-- Create test entities
INSERT INTO programs (id, corporate_client_id, name) VALUES
('test_program_1', 'test_corporate', 'Test Program 1'),
('test_program_2', 'test_corporate', 'Test Program 2');

INSERT INTO locations (id, program_id, name, address) VALUES
('test_location_1', 'test_program_1', 'Test Location 1', '123 Test St'),
('test_location_2', 'test_program_2', 'Test Location 2', '456 Test Ave');

INSERT INTO clients (id, program_id, location_id, first_name, last_name) VALUES
('test_client_1', 'test_program_1', 'test_location_1', 'John', 'Doe'),
('test_client_2', 'test_program_2', 'test_location_2', 'Jane', 'Smith');

INSERT INTO trips (id, program_id, client_id, pickup_address, dropoff_address, scheduled_pickup_time) VALUES
('test_trip_1', 'test_program_1', 'test_client_1', '123 Pickup St', '456 Dropoff Ave', NOW() + INTERVAL '1 hour'),
('test_trip_2', 'test_program_2', 'test_client_2', '789 Pickup Ave', '012 Dropoff St', NOW() + INTERVAL '2 hours');

INSERT INTO drivers (id, user_id, program_id, license_number) VALUES
('test_driver_1', 'test_driver', 'test_program_1', 'DL123456');

INSERT INTO vehicles (id, program_id, make, model, year, license_plate, capacity, vehicle_type, fuel_type) VALUES
('test_vehicle_1', 'test_program_1', 'Ford', 'Transit', 2020, 'ABC123', 8, 'van', 'gasoline');
```

---

## 🗄️ DATABASE MIGRATION TESTING

### Migration Application

- [ ] **Migration runs without errors**
  ```sql
  -- Run the migration file
  \i migrations/0023_create_supabase_storage_system.sql
  ```

- [ ] **Storage buckets are created**
  ```sql
  SELECT * FROM storage.buckets WHERE id IN ('documents', 'photos');
  -- Should return 2 rows
  ```

- [ ] **File metadata table is created**
  ```sql
  SELECT * FROM information_schema.tables WHERE table_name = 'file_metadata';
  -- Should return 1 row
  ```

- [ ] **File access audit table is created**
  ```sql
  SELECT * FROM information_schema.tables WHERE table_name = 'file_access_audit';
  -- Should return 1 row
  ```

- [ ] **Indexes are created**
  ```sql
  SELECT indexname FROM pg_indexes WHERE tablename = 'file_metadata';
  -- Should return multiple indexes
  ```

- [ ] **RLS is enabled on all tables**
  ```sql
  SELECT schemaname, tablename, rowsecurity 
  FROM pg_tables 
  WHERE tablename IN ('file_metadata', 'file_access_audit');
  -- rowsecurity should be true for all
  ```

- [ ] **Helper functions are created**
  ```sql
  SELECT proname FROM pg_proc WHERE proname IN (
    'get_user_accessible_programs',
    'get_user_accessible_locations',
    'can_user_access_file',
    'get_files_nearing_retention',
    'generate_file_path',
    'log_file_access',
    'archive_expired_files'
  );
  -- Should return 7 functions
  ```

---

## 🪣 STORAGE BUCKET TESTING

### Bucket Configuration

- [ ] **Documents bucket exists with correct settings**
  ```sql
  SELECT id, name, public, file_size_limit, allowed_mime_types 
  FROM storage.buckets 
  WHERE id = 'documents';
  -- file_size_limit should be 52428800 (50MB)
  -- allowed_mime_types should include PDF, DOC, DOCX
  ```

- [ ] **Photos bucket exists with correct settings**
  ```sql
  SELECT id, name, public, file_size_limit, allowed_mime_types 
  FROM storage.buckets 
  WHERE id = 'photos';
  -- file_size_limit should be 10485760 (10MB)
  -- allowed_mime_types should include JPEG, PNG, HEIC, WEBP
  ```

- [ ] **Buckets are private (not public)**
  ```sql
  SELECT id, public FROM storage.buckets WHERE id IN ('documents', 'photos');
  -- public should be false for both
  ```

### Bucket Access Testing

- [ ] **Unauthenticated users cannot access buckets**
  ```javascript
  // Test without authentication
  const { data, error } = await supabase.storage.from('documents').list();
  // Should return error or empty data
  ```

- [ ] **Authenticated users can list buckets**
  ```javascript
  // Test with authentication
  const { data, error } = await supabase.storage.listBuckets();
  // Should return bucket list
  ```

---

## 🔒 RLS POLICY TESTING

### Policy Existence

- [ ] **Storage bucket policies exist**
  ```sql
  SELECT policyname FROM pg_policies WHERE tablename = 'buckets';
  -- Should include 'Documents bucket access policy' and 'Photos bucket access policy'
  ```

- [ ] **Storage object policies exist**
  ```sql
  SELECT policyname FROM pg_policies WHERE tablename = 'objects';
  -- Should include 'Storage objects access policy'
  ```

- [ ] **File metadata policies exist**
  ```sql
  SELECT policyname FROM pg_policies WHERE tablename = 'file_metadata';
  -- Should include read, insert, update, delete policies
  ```

- [ ] **File access audit policies exist**
  ```sql
  SELECT policyname FROM pg_policies WHERE tablename = 'file_access_audit';
  -- Should include read policy
  ```

### Policy Functionality

- [ ] **Super admin can access all files**
  ```sql
  -- Test as super admin
  SET LOCAL role TO authenticated;
  SET LOCAL "request.jwt.claims" TO '{"sub": "test_super_admin"}';
  SELECT COUNT(*) FROM file_metadata;
  -- Should return all files
  ```

- [ ] **Corporate admin can only access their corporate files**
  ```sql
  -- Test as corporate admin
  SET LOCAL "request.jwt.claims" TO '{"sub": "test_corporate_admin"}';
  SELECT COUNT(*) FROM file_metadata;
  -- Should only return files for their corporate client
  ```

- [ ] **Program admin can only access their program files**
  ```sql
  -- Test as program admin
  SET LOCAL "request.jwt.claims" TO '{"sub": "test_program_admin"}';
  SELECT COUNT(*) FROM file_metadata;
  -- Should only return files for their programs
  ```

- [ ] **Program user can only access their location files**
  ```sql
  -- Test as program user
  SET LOCAL "request.jwt.claims" TO '{"sub": "test_program_user"}';
  SELECT COUNT(*) FROM file_metadata;
  -- Should only return files for their location
  ```

- [ ] **Driver can only access their trip files**
  ```sql
  -- Test as driver
  SET LOCAL "request.jwt.claims" TO '{"sub": "test_driver"}';
  SELECT COUNT(*) FROM file_metadata;
  -- Should only return files for their assigned trips
  ```

---

## 📤 FILE UPLOAD TESTING

### Basic Upload Tests

- [ ] **Upload PDF document**
  ```javascript
  const result = await fileStorageHelpers.uploadFile({
    file: pdfFile,
    category: 'client_document',
    clientId: 'test_client_1',
    uploadReason: 'Test upload'
  });
  // Should succeed
  ```

- [ ] **Upload JPEG photo**
  ```javascript
  const result = await fileStorageHelpers.uploadFile({
    file: jpegFile,
    category: 'trip_photo',
    tripId: 'test_trip_1',
    uploadReason: 'Test photo upload'
  });
  // Should succeed
  ```

- [ ] **Upload with HIPAA protection**
  ```javascript
  const result = await fileStorageHelpers.uploadFile({
    file: medicalDocument,
    category: 'client_document',
    clientId: 'test_client_1',
    isHipaaProtected: true,
    uploadReason: 'Medical records'
  });
  // Should succeed with HIPAA flag set
  ```

### Upload Validation Tests

- [ ] **File size validation (documents bucket)**
  ```javascript
  const largeFile = new File(['x'.repeat(60 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });
  const result = await fileStorageHelpers.uploadFile({
    file: largeFile,
    category: 'client_document',
    clientId: 'test_client_1'
  });
  // Should fail with size error
  ```

- [ ] **File size validation (photos bucket)**
  ```javascript
  const largePhoto = new File(['x'.repeat(15 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
  const result = await fileStorageHelpers.uploadFile({
    file: largePhoto,
    category: 'trip_photo',
    tripId: 'test_trip_1'
  });
  // Should fail with size error
  ```

- [ ] **File type validation**
  ```javascript
  const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' });
  const result = await fileStorageHelpers.uploadFile({
    file: invalidFile,
    category: 'trip_photo', // Wrong category for text file
    tripId: 'test_trip_1'
  });
  // Should fail with type error
  ```

- [ ] **Missing required fields**
  ```javascript
  const result = await fileStorageHelpers.uploadFile({
    file: pdfFile,
    // Missing category
    clientId: 'test_client_1'
  });
  // Should fail with validation error
  ```

### Permission-Based Upload Tests

- [ ] **Super admin can upload anywhere**
  ```javascript
  // Authenticate as super admin
  const result = await fileStorageHelpers.uploadFile({
    file: pdfFile,
    category: 'client_document',
    clientId: 'test_client_1'
  });
  // Should succeed
  ```

- [ ] **Corporate admin can upload to their corporate**
  ```javascript
  // Authenticate as corporate admin
  const result = await fileStorageHelpers.uploadFile({
    file: pdfFile,
    category: 'client_document',
    clientId: 'test_client_1' // Belongs to their corporate
  });
  // Should succeed
  ```

- [ ] **Corporate admin cannot upload to other corporate**
  ```javascript
  // Authenticate as corporate admin
  const result = await fileStorageHelpers.uploadFile({
    file: pdfFile,
    category: 'client_document',
    clientId: 'other_corporate_client' // Different corporate
  });
  // Should fail with permission error
  ```

- [ ] **Program user can upload to their location**
  ```javascript
  // Authenticate as program user
  const result = await fileStorageHelpers.uploadFile({
    file: pdfFile,
    category: 'client_document',
    clientId: 'test_client_1' // Belongs to their location
  });
  // Should succeed
  ```

- [ ] **Driver can upload trip photos**
  ```javascript
  // Authenticate as driver
  const result = await fileStorageHelpers.uploadFile({
    file: jpegFile,
    category: 'trip_photo',
    tripId: 'test_trip_1' // Assigned to them
  });
  // Should succeed
  ```

---

## 📥 FILE ACCESS TESTING

### Download URL Generation

- [ ] **Valid file download**
  ```javascript
  const result = await fileStorageHelpers.getFileDownloadUrl('valid_file_id');
  // Should return signed URL
  ```

- [ ] **Invalid file ID**
  ```javascript
  const result = await fileStorageHelpers.getFileDownloadUrl('invalid_file_id');
  // Should fail with not found error
  ```

- [ ] **Access denied for unauthorized user**
  ```javascript
  // Authenticate as user without access
  const result = await fileStorageHelpers.getFileDownloadUrl('restricted_file_id');
  // Should fail with access denied error
  ```

### File Retrieval Tests

- [ ] **Get files for specific entity**
  ```javascript
  const result = await fileStorageHelpers.getFilesForEntity({
    clientId: 'test_client_1',
    category: 'client_document'
  });
  // Should return files for that client
  ```

- [ ] **Get files by category**
  ```javascript
  const result = await fileStorageHelpers.getFilesByCategory('trip_photo');
  // Should return all trip photos user can access
  ```

- [ ] **Pagination works correctly**
  ```javascript
  const result = await fileStorageHelpers.getFilesForEntity({
    programId: 'test_program_1',
    limit: 10,
    offset: 0
  });
  // Should return max 10 files
  ```

---

## 👥 ROLE-BASED ACCESS TESTING

### Super Admin Access

- [ ] **Can access all files**
  ```javascript
  // Authenticate as super admin
  const allFiles = await fileStorageHelpers.getFilesForEntity({});
  // Should return all files in system
  ```

- [ ] **Can upload anywhere**
  ```javascript
  const result = await fileStorageHelpers.uploadFile({
    file: pdfFile,
    category: 'client_document',
    clientId: 'any_client_id'
  });
  // Should succeed
  ```

- [ ] **Can delete any file**
  ```javascript
  const result = await fileStorageHelpers.deleteFile('any_file_id');
  // Should succeed
  ```

### Corporate Admin Access

- [ ] **Can access corporate files only**
  ```javascript
  // Authenticate as corporate admin
  const corporateFiles = await fileStorageHelpers.getFilesForEntity({});
  // Should only return files for their corporate client
  ```

- [ ] **Cannot access other corporate files**
  ```javascript
  const otherCorporateFiles = await fileStorageHelpers.getFilesForEntity({
    programId: 'other_corporate_program'
  });
  // Should return empty or access denied
  ```

### Program Admin Access

- [ ] **Can access program files**
  ```javascript
  // Authenticate as program admin
  const programFiles = await fileStorageHelpers.getFilesForEntity({
    programId: 'test_program_1'
  });
  // Should return files for their programs
  ```

- [ ] **Cannot access other program files**
  ```javascript
  const otherProgramFiles = await fileStorageHelpers.getFilesForEntity({
    programId: 'unauthorized_program'
  });
  // Should return empty or access denied
  ```

### Program User Access

- [ ] **Can access location files**
  ```javascript
  // Authenticate as program user
  const locationFiles = await fileStorageHelpers.getFilesForEntity({
    locationId: 'test_location_1'
  });
  // Should return files for their location
  ```

- [ ] **Cannot access other location files**
  ```javascript
  const otherLocationFiles = await fileStorageHelpers.getFilesForEntity({
    locationId: 'unauthorized_location'
  });
  // Should return empty or access denied
  ```

### Driver Access

- [ ] **Can access assigned trip files**
  ```javascript
  // Authenticate as driver
  const tripFiles = await fileStorageHelpers.getFilesForEntity({
    tripId: 'test_trip_1' // Assigned to them
  });
  // Should return files for their trips
  ```

- [ ] **Cannot access unassigned trip files**
  ```javascript
  const otherTripFiles = await fileStorageHelpers.getFilesForEntity({
    tripId: 'unassigned_trip'
  });
  // Should return empty or access denied
  ```

---

## 🏥 HIPAA COMPLIANCE TESTING

### HIPAA-Protected File Tests

- [ ] **HIPAA files have enhanced security**
  ```javascript
  const result = await fileStorageHelpers.uploadFile({
    file: medicalDocument,
    category: 'client_document',
    clientId: 'test_client_1',
    isHipaaProtected: true
  });
  
  // Verify HIPAA flag is set
  const fileMetadata = result.fileMetadata;
  // fileMetadata.is_hipaa_protected should be true
  ```

- [ ] **HIPAA file access is logged with IP**
  ```javascript
  await fileStorageHelpers.logFileAccess(
    hipaaFileId,
    userId,
    'download',
    '192.168.1.1',
    'Mozilla/5.0...'
  );
  
  const auditLog = await fileStorageHelpers.getFileAccessLog(hipaaFileId);
  // Should include IP address and user agent
  ```

### Audit Logging Tests

- [ ] **All file access is logged**
  ```javascript
  // Upload file
  const uploadResult = await fileStorageHelpers.uploadFile({...});
  
  // Download file
  const downloadResult = await fileStorageHelpers.getFileDownloadUrl(uploadResult.fileMetadata.id);
  
  // Check audit log
  const auditLog = await fileStorageHelpers.getFileAccessLog(uploadResult.fileMetadata.id);
  // Should contain upload and download entries
  ```

- [ ] **Audit log includes all required fields**
  ```javascript
  const auditLog = await fileStorageHelpers.getFileAccessLog(fileId);
  const logEntry = auditLog.logs[0];
  
  // Should have all required fields
  // logEntry.file_id, logEntry.user_id, logEntry.action, logEntry.accessed_at
  ```

---

## 📅 RETENTION MANAGEMENT TESTING

### Retention Tracking

- [ ] **Files have correct retention period**
  ```javascript
  const result = await fileStorageHelpers.uploadFile({
    file: pdfFile,
    category: 'client_document',
    clientId: 'test_client_1'
  });
  
  const fileMetadata = result.fileMetadata;
  const retentionDate = new Date(fileMetadata.retention_until);
  const expectedDate = new Date();
  expectedDate.setFullYear(expectedDate.getFullYear() + 7);
  
  // retentionDate should be approximately 7 years from now
  ```

- [ ] **Files nearing retention are identified**
  ```javascript
  // Create file with near expiry date
  const nearExpiryFile = await supabase
    .from('file_metadata')
    .insert({
      bucket_id: 'documents',
      file_path: 'test/near-expiry.pdf',
      file_name: 'near-expiry.pdf',
      file_size: 1000,
      mime_type: 'application/pdf',
      file_category: 'client_document',
      retention_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      uploaded_by: 'test_user'
    })
    .select()
    .single();
  
  const nearingRetention = await fileStorageHelpers.getFilesNearingRetention(30);
  // Should include the near-expiry file
  ```

### Archive Functionality

- [ ] **Expired files are identified for archival**
  ```javascript
  const archiveResult = await fileStorageHelpers.archiveExpiredFiles();
  // Should return count and list of expired files
  ```

---

## 🔍 AUDIT LOGGING TESTING

### Access Logging

- [ ] **File upload is logged**
  ```javascript
  const uploadResult = await fileStorageHelpers.uploadFile({...});
  const auditLog = await fileStorageHelpers.getFileAccessLog(uploadResult.fileMetadata.id);
  // Should contain upload entry
  ```

- [ ] **File download is logged**
  ```javascript
  const downloadResult = await fileStorageHelpers.getFileDownloadUrl(fileId);
  const auditLog = await fileStorageHelpers.getFileAccessLog(fileId);
  // Should contain download entry
  ```

- [ ] **File deletion is logged**
  ```javascript
  const deleteResult = await fileStorageHelpers.deleteFile(fileId);
  const auditLog = await fileStorageHelpers.getFileAccessLog(fileId);
  // Should contain delete entry
  ```

### Audit Log Integrity

- [ ] **Audit log cannot be modified by non-admin**
  ```javascript
  // Try to insert audit log entry as regular user
  const { error } = await supabase
    .from('file_access_audit')
    .insert({
      file_id: 'test_file',
      user_id: 'test_user',
      action: 'view'
    });
  // Should fail with permission error
  ```

- [ ] **Only super admin can read audit logs**
  ```javascript
  // Try to read audit logs as regular user
  const { data, error } = await supabase
    .from('file_access_audit')
    .select('*');
  // Should fail with permission error
  ```

---

## 🌐 API ENDPOINT TESTING

### Upload Endpoints

- [ ] **POST /api/files/upload - Single file upload**
  ```bash
  curl -X POST http://localhost:8081/api/files/upload \
    -H "Authorization: Bearer $TOKEN" \
    -F "file=@test.pdf" \
    -F "category=client_document" \
    -F "clientId=test_client_1"
  ```

- [ ] **POST /api/files/upload-multiple - Multiple file upload**
  ```bash
  curl -X POST http://localhost:8081/api/files/upload-multiple \
    -H "Authorization: Bearer $TOKEN" \
    -F "files=@test1.pdf" \
    -F "files=@test2.jpg" \
    -F "category=client_document" \
    -F "clientId=test_client_1"
  ```

### Retrieval Endpoints

- [ ] **GET /api/files/:fileId/download - Get download URL**
  ```bash
  curl -X GET http://localhost:8081/api/files/test_file_id/download \
    -H "Authorization: Bearer $TOKEN"
  ```

- [ ] **GET /api/files/entity/client/test_client_1 - Get client files**
  ```bash
  curl -X GET http://localhost:8081/api/files/entity/client/test_client_1 \
    -H "Authorization: Bearer $TOKEN"
  ```

- [ ] **GET /api/files/category/trip_photo - Get files by category**
  ```bash
  curl -X GET http://localhost:8081/api/files/category/trip_photo \
    -H "Authorization: Bearer $TOKEN"
  ```

### Management Endpoints

- [ ] **PUT /api/files/:fileId - Update file metadata**
  ```bash
  curl -X PUT http://localhost:8081/api/files/test_file_id \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"upload_reason": "Updated reason"}'
  ```

- [ ] **DELETE /api/files/:fileId - Delete file**
  ```bash
  curl -X DELETE http://localhost:8081/api/files/test_file_id \
    -H "Authorization: Bearer $TOKEN"
  ```

### Utility Endpoints

- [ ] **GET /api/files/user/accessible-programs - Get accessible programs**
  ```bash
  curl -X GET http://localhost:8081/api/files/user/accessible-programs \
    -H "Authorization: Bearer $TOKEN"
  ```

- [ ] **GET /api/files/user/can-access/:fileId - Check file access**
  ```bash
  curl -X GET http://localhost:8081/api/files/user/can-access/test_file_id \
    -H "Authorization: Bearer $TOKEN"
  ```

---

## ⚡ PERFORMANCE TESTING

### Load Testing

- [ ] **Concurrent file uploads**
  ```javascript
  const uploadPromises = Array.from({ length: 10 }, () => 
    fileStorageHelpers.uploadFile({
      file: testFile,
      category: 'client_document',
      clientId: 'test_client_1'
    })
  );
  
  const results = await Promise.all(uploadPromises);
  // All should succeed
  ```

- [ ] **Large file upload performance**
  ```javascript
  const largeFile = new File(['x'.repeat(40 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });
  const startTime = Date.now();
  
  const result = await fileStorageHelpers.uploadFile({
    file: largeFile,
    category: 'client_document',
    clientId: 'test_client_1'
  });
  
  const uploadTime = Date.now() - startTime;
  // Should complete within reasonable time (< 30 seconds)
  ```

### Query Performance

- [ ] **File listing performance with pagination**
  ```javascript
  const startTime = Date.now();
  
  const result = await fileStorageHelpers.getFilesForEntity({
    programId: 'test_program_1',
    limit: 100,
    offset: 0
  });
  
  const queryTime = Date.now() - startTime;
  // Should complete quickly (< 1 second)
  ```

---

## ❌ ERROR HANDLING TESTING

### Validation Errors

- [ ] **Invalid file type error**
  ```javascript
  const result = await fileStorageHelpers.uploadFile({
    file: invalidFile,
    category: 'trip_photo',
    tripId: 'test_trip_1'
  });
  // Should return validation error
  ```

- [ ] **File too large error**
  ```javascript
  const result = await fileStorageHelpers.uploadFile({
    file: oversizedFile,
    category: 'client_document',
    clientId: 'test_client_1'
  });
  // Should return size error
  ```

- [ ] **Missing required fields error**
  ```javascript
  const result = await fileStorageHelpers.uploadFile({
    file: pdfFile,
    // Missing category
    clientId: 'test_client_1'
  });
  // Should return validation error
  ```

### Permission Errors

- [ ] **Access denied error**
  ```javascript
  const result = await fileStorageHelpers.getFileDownloadUrl('restricted_file_id');
  // Should return access denied error
  ```

- [ ] **Unauthorized upload error**
  ```javascript
  const result = await fileStorageHelpers.uploadFile({
    file: pdfFile,
    category: 'client_document',
    clientId: 'unauthorized_client'
  });
  // Should return permission error
  ```

### System Errors

- [ ] **Network error handling**
  ```javascript
  // Simulate network error
  const result = await fileStorageHelpers.uploadFile({
    file: pdfFile,
    category: 'client_document',
    clientId: 'test_client_1'
  });
  // Should handle gracefully
  ```

---

## 🔐 SECURITY TESTING

### Authentication Tests

- [ ] **Unauthenticated requests are rejected**
  ```javascript
  // Test without authentication
  const result = await fileStorageHelpers.getFilesForEntity({});
  // Should fail with authentication error
  ```

- [ ] **Invalid token is rejected**
  ```javascript
  // Test with invalid token
  const result = await fileStorageHelpers.uploadFile({...});
  // Should fail with authentication error
  ```

### Authorization Tests

- [ ] **Cross-tenant access is prevented**
  ```javascript
  // Authenticate as user from corporate A
  const result = await fileStorageHelpers.getFilesForEntity({
    programId: 'corporate_b_program'
  });
  // Should return empty or access denied
  ```

- [ ] **Role escalation is prevented**
  ```javascript
  // Try to access super admin files as regular user
  const result = await fileStorageHelpers.getFilesForEntity({
    programId: 'super_admin_only_program'
  });
  // Should return empty or access denied
  ```

### Data Integrity Tests

- [ ] **File metadata cannot be tampered with**
  ```javascript
  // Try to update file metadata as unauthorized user
  const result = await fileStorageHelpers.updateFileMetadata('file_id', {
    uploaded_by: 'different_user'
  });
  // Should fail with permission error
  ```

- [ ] **Audit logs cannot be modified**
  ```javascript
  // Try to insert fake audit log
  const { error } = await supabase
    .from('file_access_audit')
    .insert({
      file_id: 'fake_file',
      user_id: 'fake_user',
      action: 'view'
    });
  // Should fail with permission error
  ```

---

## ✅ TESTING COMPLETION CHECKLIST

### Pre-Production Verification

- [ ] All database migrations applied successfully
- [ ] All RLS policies are working correctly
- [ ] All API endpoints are functional
- [ ] File upload/download works for all user roles
- [ ] HIPAA compliance features are working
- [ ] Audit logging is capturing all access
- [ ] Retention management is functioning
- [ ] Performance is acceptable under load
- [ ] Error handling is robust
- [ ] Security measures are effective

### Documentation Verification

- [ ] API documentation is complete
- [ ] Usage examples are accurate
- [ ] Troubleshooting guide is comprehensive
- [ ] Security model is documented
- [ ] Compliance requirements are met

### Deployment Readiness

- [ ] Production environment is configured
- [ ] Environment variables are set
- [ ] Database backups are in place
- [ ] Monitoring is configured
- [ ] Rollback plan is ready

---

## 🎯 CONCLUSION

This comprehensive testing checklist ensures that the Supabase Storage system is fully functional, secure, and compliant with HIPAA requirements. All tests should pass before deploying to production.

For any test failures, refer to the troubleshooting section in the main documentation or contact the development team for assistance.

**Remember**: Always test in a development environment before applying changes to production!
