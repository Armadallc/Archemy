# SUPABASE STORAGE SYSTEM DOCUMENTATION
## Multi-Tenant Transportation Management System

This document provides comprehensive documentation for the Supabase Storage system implementation, including RLS policies, usage examples, and security model.

## 📋 TABLE OF CONTENTS

1. [System Overview](#system-overview)
2. [Database Schema](#database-schema)
3. [Row-Level Security (RLS) Policies](#row-level-security-rls-policies)
4. [File Organization Structure](#file-organization-structure)
5. [API Usage Examples](#api-usage-examples)
6. [Security Model](#security-model)
7. [HIPAA Compliance](#hipaa-compliance)
8. [Retention Management](#retention-management)
9. [Audit Logging](#audit-logging)
10. [Troubleshooting](#troubleshooting)

---

## 🏗️ SYSTEM OVERVIEW

The Supabase Storage system provides HIPAA-compliant file storage for the multi-tenant transportation management application with the following key features:

- **Two Storage Buckets**: `documents` (50MB limit) and `photos` (10MB limit)
- **Role-Based Access Control**: Based on existing user hierarchy
- **HIPAA Compliance**: Special handling for protected health information
- **7-Year Retention**: Automatic compliance tracking
- **Audit Logging**: Complete access trail for compliance
- **Standardized Organization**: Consistent folder structure

### User Roles and Access Levels

| Role | Access Level | Description |
|------|-------------|-------------|
| **Super Admin** | System-wide | Full access to all files across all facilities |
| **Corporate Admin** | Corporate-wide | Access to files within their corporate entity |
| **Program Admin** | Program-wide | Access to files within their assigned programs |
| **Program User** | Location-specific | Access to files for their specific facility location |
| **Driver** | Trip-specific | Access to files for trips assigned to them |

---

## 🗄️ DATABASE SCHEMA

### File Metadata Table

```sql
CREATE TABLE file_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- File identification
  bucket_id TEXT NOT NULL REFERENCES storage.buckets(id),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  
  -- File categorization
  file_category TEXT NOT NULL CHECK (file_category IN (
    'intake_form', 'trip_photo', 'driver_license', 'facility_contract', 
    'vehicle_maintenance', 'incident_report', 'client_document', 
    'insurance_document', 'inspection_report', 'signature', 'other'
  )),
  
  -- HIPAA compliance
  is_hipaa_protected BOOLEAN DEFAULT false,
  retention_until DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '7 years'),
  
  -- Entity relationships
  program_id VARCHAR(50) REFERENCES programs(id),
  location_id VARCHAR(50) REFERENCES locations(id),
  client_id VARCHAR(50) REFERENCES clients(id),
  trip_id VARCHAR(50) REFERENCES trips(id),
  driver_id VARCHAR(50) REFERENCES drivers(id),
  vehicle_id VARCHAR(50) REFERENCES vehicles(id),
  user_id VARCHAR(50) REFERENCES users(user_id),
  
  -- Upload tracking
  uploaded_by VARCHAR(50) NOT NULL REFERENCES users(user_id),
  upload_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### File Access Audit Table

```sql
CREATE TABLE file_access_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES file_metadata(id),
  user_id TEXT NOT NULL REFERENCES users(user_id),
  action TEXT NOT NULL CHECK (action IN ('view', 'download', 'upload', 'update', 'delete')),
  ip_address INET,
  user_agent TEXT,
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🔒 ROW-LEVEL SECURITY (RLS) POLICIES

### Storage Buckets Policies

#### Documents Bucket Access
```sql
CREATE POLICY "Documents bucket access policy" ON storage.buckets
FOR ALL USING (id = 'documents');
```

#### Photos Bucket Access
```sql
CREATE POLICY "Photos bucket access policy" ON storage.buckets
FOR ALL USING (id = 'photos');
```

### Storage Objects Policies

#### File Access Policy
Users can only access files they have permission for based on their role:

```sql
CREATE POLICY "Storage objects access policy" ON storage.objects
FOR ALL USING (
  bucket_id IN ('documents', 'photos') AND
  EXISTS (
    SELECT 1 FROM file_metadata fm
    WHERE fm.bucket_id = storage.objects.bucket_id
    AND fm.file_path = storage.objects.name
    AND (
      -- Super admin can access all files
      EXISTS (
        SELECT 1 FROM users u
        WHERE u.user_id = auth.uid()::text
        AND u.role = 'super_admin'
      )
      OR
      -- Corporate admin can access files for their corporate client
      EXISTS (
        SELECT 1 FROM users u
        JOIN programs p ON p.id = fm.program_id
        JOIN corporate_clients cc ON cc.id = p.corporate_client_id
        WHERE u.user_id = auth.uid()::text
        AND u.role = 'corporate_admin'
        AND u.corporate_client_id = cc.id
      )
      OR
      -- Program admin can access files for their programs
      EXISTS (
        SELECT 1 FROM users u
        WHERE u.user_id = auth.uid()::text
        AND u.role = 'program_admin'
        AND (
          fm.program_id = u.primary_program_id
          OR fm.program_id = ANY(u.authorized_programs)
        )
      )
      OR
      -- Program user can access files for their specific location
      EXISTS (
        SELECT 1 FROM users u
        WHERE u.user_id = auth.uid()::text
        AND u.role = 'program_user'
        AND (
          fm.location_id IN (
            SELECT l.id FROM locations l
            WHERE l.program_id = u.primary_program_id
            OR l.program_id = ANY(u.authorized_programs)
          )
        )
      )
      OR
      -- Driver can access files for trips assigned to them
      EXISTS (
        SELECT 1 FROM users u
        JOIN drivers d ON d.user_id = u.user_id
        WHERE u.user_id = auth.uid()::text
        AND u.role = 'driver'
        AND fm.trip_id IN (
          SELECT t.id FROM trips t
          WHERE t.driver_id = d.id
        )
      )
      OR
      -- Users can access files they uploaded
      fm.uploaded_by = auth.uid()::text
    )
  )
);
```

### File Metadata Policies

#### Read Policy
```sql
CREATE POLICY "File metadata read policy" ON file_metadata
FOR SELECT USING (
  -- Same access logic as storage objects policy
  -- [Implementation details in migration file]
);
```

#### Insert Policy
```sql
CREATE POLICY "File metadata insert policy" ON file_metadata
FOR INSERT WITH CHECK (
  -- Users can only upload files for entities they have access to
  -- [Implementation details in migration file]
);
```

#### Update Policy
```sql
CREATE POLICY "File metadata update policy" ON file_metadata
FOR UPDATE USING (
  -- Users can only update files they uploaded or have admin access to
  -- [Implementation details in migration file]
);
```

#### Delete Policy
```sql
CREATE POLICY "File metadata delete policy" ON file_metadata
FOR DELETE USING (
  -- Only super admin and corporate admin can delete files
  -- [Implementation details in migration file]
);
```

---

## 📁 FILE ORGANIZATION STRUCTURE

### Folder Path Convention

Files are organized using a standardized folder structure:

```
documents/
├── clients/
│   └── facility-{facility_id}/
│       └── client-{client_id}/
│           ├── intake_form.pdf
│           └── client_document.pdf
├── drivers/
│   └── driver-{driver_id}/
│       ├── driver_license.pdf
│       └── insurance_document.pdf
├── facilities/
│   └── facility-{facility_id}/
│       └── facility_contract.pdf
├── vehicles/
│   └── vehicle-{vehicle_id}/
│       ├── vehicle_maintenance.pdf
│       └── inspection_report.pdf
└── incidents/
    └── incident-{incident_id}/
        └── incident_report.pdf

photos/
├── trips/
│   └── trip-{trip_id}/
│       ├── trip_photo.jpg
│       └── signature.png
└── vehicles/
    └── vehicle-{vehicle_id}/
        └── vehicle_photo.jpg
```

### File Categories and Allowed Types

| Category | Allowed MIME Types | Bucket | Max Size |
|----------|-------------------|--------|----------|
| `intake_form` | PDF, DOC, DOCX | documents | 50MB |
| `trip_photo` | JPEG, PNG, HEIC, WEBP | photos | 10MB |
| `driver_license` | JPEG, PNG, PDF | documents | 50MB |
| `facility_contract` | PDF, DOC, DOCX | documents | 50MB |
| `vehicle_maintenance` | PDF, JPEG, PNG | documents | 50MB |
| `incident_report` | PDF, DOC, DOCX | documents | 50MB |
| `client_document` | PDF, DOC, DOCX | documents | 50MB |
| `insurance_document` | PDF, JPEG, PNG | documents | 50MB |
| `inspection_report` | PDF, JPEG, PNG | documents | 50MB |
| `signature` | JPEG, PNG, WEBP | photos | 10MB |
| `other` | All allowed types | documents | 50MB |

---

## 🔧 API USAGE EXAMPLES

### 1. Upload a Trip Photo

```typescript
import { fileStorageHelpers } from './file-storage-helpers';

// Upload trip verification photo
const uploadResult = await fileStorageHelpers.uploadFile({
  file: photoFile,
  category: 'trip_photo',
  tripId: 'trip_123',
  uploadReason: 'Trip completion verification',
  isHipaaProtected: true
});

if (uploadResult.success) {
  console.log('Photo uploaded:', uploadResult.fileMetadata);
} else {
  console.error('Upload failed:', uploadResult.error);
}
```

### 2. Get Client Documents

```typescript
// Get all documents for a specific client
const documentsResult = await fileStorageHelpers.getFilesForEntity({
  clientId: 'client_456',
  category: 'client_document'
});

if (documentsResult.success) {
  documentsResult.files?.forEach(file => {
    console.log(`Document: ${file.file_name} (${file.file_size} bytes)`);
  });
}
```

### 3. Download File with Access Validation

```typescript
// Get download URL for a file
const downloadResult = await fileStorageHelpers.getFileDownloadUrl('file_uuid_123');

if (downloadResult.success) {
  // Redirect user to download URL or use in iframe
  window.open(downloadResult.url, '_blank');
} else {
  console.error('Access denied:', downloadResult.error);
}
```

### 4. Upload Multiple Files

```typescript
// Upload multiple files for a driver
const files = [
  { file: licenseFile, category: 'driver_license' as FileCategory },
  { file: insuranceFile, category: 'insurance_document' as FileCategory }
];

const uploadParams: UploadFileParams[] = files.map(file => ({
  ...file,
  driverId: 'driver_789',
  uploadReason: 'Driver credential verification'
}));

const result = await fileStorageHelpers.uploadFiles(uploadParams);
```

### 5. Check Retention Compliance

```typescript
// Get files nearing retention limit
const retentionResult = await fileStorageHelpers.getFilesNearingRetention(30);

if (retentionResult.success) {
  retentionResult.files?.forEach(file => {
    console.log(`${file.file_name} expires in ${file.days_remaining} days`);
  });
}
```

---

## 🛡️ SECURITY MODEL

### Access Control Matrix

| User Role | Program Files | Location Files | Client Files | Trip Files | Driver Files | Vehicle Files |
|-----------|---------------|----------------|--------------|------------|--------------|---------------|
| **Super Admin** | ✅ All | ✅ All | ✅ All | ✅ All | ✅ All | ✅ All |
| **Corporate Admin** | ✅ Own Corporate | ✅ Own Corporate | ✅ Own Corporate | ✅ Own Corporate | ✅ Own Corporate | ✅ Own Corporate |
| **Program Admin** | ✅ Own Programs | ✅ Own Programs | ✅ Own Programs | ✅ Own Programs | ✅ Own Programs | ✅ Own Programs |
| **Program User** | ✅ Own Location | ✅ Own Location | ✅ Own Location | ✅ Own Location | ❌ No Access | ❌ No Access |
| **Driver** | ❌ No Access | ❌ No Access | ❌ No Access | ✅ Assigned Trips | ✅ Own Files | ❌ No Access |

### HIPAA Protection Levels

#### Standard Files
- Basic access control based on role hierarchy
- Standard audit logging
- 7-year retention

#### HIPAA-Protected Files
- Enhanced access controls
- Detailed audit logging with IP tracking
- Stricter retention policies
- Additional encryption considerations

### Permission Validation Flow

1. **Authentication**: User must be authenticated
2. **Role Check**: Verify user role and permissions
3. **Entity Access**: Check access to specific entity (program, location, etc.)
4. **File Access**: Validate access to specific file
5. **Audit Log**: Record access attempt
6. **Action**: Allow or deny based on validation

---

## 🏥 HIPAA COMPLIANCE

### Key Compliance Features

1. **Access Controls**: Role-based access with audit trails
2. **Data Minimization**: Users only see files they need
3. **Audit Logging**: Complete access history
4. **Retention Management**: 7-year compliance tracking
5. **Secure Storage**: Supabase Storage with encryption

### HIPAA-Protected File Handling

```typescript
// Upload HIPAA-protected file
const result = await fileStorageHelpers.uploadFile({
  file: medicalDocument,
  category: 'client_document',
  clientId: 'client_123',
  isHipaaProtected: true, // Enhanced security
  uploadReason: 'Medical records'
});

// Access is automatically logged with IP tracking
await fileStorageHelpers.logFileAccess(
  result.fileMetadata?.id,
  userId,
  'download',
  clientIP,
  userAgent
);
```

### Compliance Checklist

- ✅ **Access Controls**: Role-based permissions implemented
- ✅ **Audit Logging**: All access logged with timestamps
- ✅ **Data Encryption**: Supabase handles encryption at rest
- ✅ **Retention Policies**: 7-year compliance tracking
- ✅ **Access Monitoring**: Real-time access validation
- ✅ **Secure Transmission**: HTTPS for all file operations

---

## 📅 RETENTION MANAGEMENT

### Automatic Retention Tracking

All files are automatically assigned a 7-year retention period:

```sql
retention_until DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '7 years')
```

### Retention Monitoring

```typescript
// Get files nearing retention limit
const nearingExpiry = await fileStorageHelpers.getFilesNearingRetention(30);

// Archive expired files
const archiveResult = await fileStorageHelpers.archiveExpiredFiles();
console.log(`Archived ${archiveResult.archivedCount} files`);
```

### Retention Categories

| File Type | Retention Period | Notes |
|-----------|------------------|-------|
| Client Documents | 7 years | HIPAA requirement |
| Trip Photos | 7 years | Medicaid billing |
| Driver Licenses | 7 years | Employment records |
| Vehicle Maintenance | 7 years | Safety compliance |
| Incident Reports | 7 years | Legal requirement |

---

## 📊 AUDIT LOGGING

### Access Logging

Every file access is automatically logged:

```sql
INSERT INTO file_access_audit (
  file_id,
  user_id,
  action,
  ip_address,
  user_agent
) VALUES (
  file_id_param,
  user_id_param,
  action_param,
  ip_address_param,
  user_agent_param
);
```

### Audit Query Examples

```sql
-- Get all access for a specific file
SELECT * FROM file_access_audit 
WHERE file_id = 'file_uuid_123' 
ORDER BY accessed_at DESC;

-- Get user's file access history
SELECT * FROM file_access_audit 
WHERE user_id = 'user_456' 
ORDER BY accessed_at DESC;

-- Get HIPAA-protected file access
SELECT faa.*, fm.file_name, fm.is_hipaa_protected
FROM file_access_audit faa
JOIN file_metadata fm ON fm.id = faa.file_id
WHERE fm.is_hipaa_protected = true
ORDER BY faa.accessed_at DESC;
```

### Audit Report Generation

```typescript
// Generate audit report for compliance
const auditLog = await fileStorageHelpers.getFileAccessLog(fileId);

const report = {
  fileId,
  totalAccesses: auditLog.logs?.length || 0,
  uniqueUsers: new Set(auditLog.logs?.map(log => log.user_id)).size,
  hipaaAccesses: auditLog.logs?.filter(log => 
    log.action === 'download' || log.action === 'view'
  ).length || 0,
  lastAccessed: auditLog.logs?.[0]?.accessed_at
};
```

---

## 🔧 TROUBLESHOOTING

### Common Issues and Solutions

#### 1. Access Denied Errors

**Problem**: User gets "Access denied" when trying to access files

**Solutions**:
- Verify user role and permissions
- Check if user has access to the specific entity (program, location, etc.)
- Ensure file exists and is not deleted
- Check RLS policies are correctly applied

```typescript
// Debug access permissions
const canAccess = await fileStorageHelpers.canUserAccessFile(fileId);
console.log('Can access file:', canAccess);

const accessiblePrograms = await fileStorageHelpers.getUserAccessiblePrograms();
console.log('Accessible programs:', accessiblePrograms);
```

#### 2. Upload Failures

**Problem**: File upload fails with validation errors

**Solutions**:
- Check file size limits (50MB for documents, 10MB for photos)
- Verify file type is allowed for the category
- Ensure user has permission to upload to the target entity
- Check if file already exists (duplicate prevention)

```typescript
// Validate file before upload
const validation = validateFileType(file, category);
if (!validation.valid) {
  console.error('File validation failed:', validation.error);
}
```

#### 3. RLS Policy Issues

**Problem**: RLS policies not working as expected

**Solutions**:
- Verify policies are enabled on tables
- Check policy conditions match user role hierarchy
- Ensure foreign key relationships are correct
- Test policies with different user roles

```sql
-- Test RLS policy
SELECT * FROM file_metadata 
WHERE id = 'file_uuid_123';
-- This will only return rows the current user can access
```

#### 4. Performance Issues

**Problem**: Slow file operations

**Solutions**:
- Check database indexes are created
- Optimize queries with proper WHERE clauses
- Use pagination for large result sets
- Monitor Supabase Storage performance

```typescript
// Use pagination for large file lists
const files = await fileStorageHelpers.getFilesForEntity({
  programId: 'program_123',
  limit: 20,
  offset: 0
});
```

### Debugging Tools

#### 1. Permission Checker

```typescript
// Check user permissions
const userPrograms = await fileStorageHelpers.getUserAccessiblePrograms();
const userLocations = await fileStorageHelpers.getUserAccessibleLocations();
const canAccessFile = await fileStorageHelpers.canUserAccessFile(fileId);
```

#### 2. Audit Trail

```typescript
// Check file access history
const auditLog = await fileStorageHelpers.getFileAccessLog(fileId);
console.log('Access history:', auditLog.logs);
```

#### 3. Database Queries

```sql
-- Check file metadata
SELECT * FROM file_metadata WHERE id = 'file_uuid_123';

-- Check user permissions
SELECT * FROM users WHERE user_id = 'user_456';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'file_metadata';
```

---

## 📚 ADDITIONAL RESOURCES

### Migration Files
- `migrations/0023_create_supabase_storage_system.sql` - Complete migration
- `server/file-storage-helpers.ts` - TypeScript helper functions
- `server/file-storage-routes.ts` - API endpoints

### Testing
- See `TESTING_CHECKLIST.md` for comprehensive testing procedures
- Use the provided test cases to verify permissions work correctly

### Monitoring
- Monitor file access patterns through audit logs
- Set up alerts for unusual access patterns
- Regular retention compliance checks

---

## 🎯 CONCLUSION

This Supabase Storage system provides a robust, HIPAA-compliant file management solution that integrates seamlessly with your existing multi-tenant transportation management schema. The system ensures data security, compliance, and efficient file operations while maintaining the role-based access control that your application requires.

For additional support or questions, refer to the testing checklist or contact the development team.
