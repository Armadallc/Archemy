# SUPABASE STORAGE IMPLEMENTATION GUIDE
## Multi-Tenant Transportation Management System

This guide provides step-by-step instructions for implementing the complete Supabase Storage system for your multi-tenant transportation management application.

## 📋 IMPLEMENTATION OVERVIEW

The Supabase Storage system provides HIPAA-compliant file storage with role-based access control, integrating seamlessly with your existing database schema. This implementation includes:

- **Two Storage Buckets**: `documents` (50MB) and `photos` (10MB)
- **Comprehensive RLS Policies**: Based on your existing user role hierarchy
- **File Metadata Tracking**: Complete audit trail and retention management
- **TypeScript Helper Functions**: Easy-to-use API for file operations
- **API Endpoints**: RESTful endpoints for all file operations
- **HIPAA Compliance**: Enhanced security for protected health information

## 🚀 IMPLEMENTATION STEPS

### Step 1: Apply Database Migration

1. **Run the SQL Migration**
   ```bash
   # Connect to your Supabase database
   psql -h your-supabase-host -U postgres -d postgres
   
   # Run the migration
   \i migrations/0023_create_supabase_storage_system.sql
   ```

2. **Verify Migration Success**
   ```sql
   -- Check that buckets were created
   SELECT * FROM storage.buckets WHERE id IN ('documents', 'photos');
   
   -- Check that tables were created
   SELECT table_name FROM information_schema.tables 
   WHERE table_name IN ('file_metadata', 'file_access_audit');
   
   -- Check that RLS is enabled
   SELECT tablename, rowsecurity FROM pg_tables 
   WHERE tablename IN ('file_metadata', 'file_access_audit');
   ```

### Step 2: Install Server Dependencies

1. **Add Required Packages**
   ```bash
   cd server
   npm install multer @types/multer
   ```

2. **Update Server Index**
   ```typescript
   // Add to server/index.ts
   import fileStorageRoutes from './file-storage-routes';
   
   // Add route
   app.use('/api/files', fileStorageRoutes);
   ```

### Step 3: Configure Environment Variables

1. **Update .env File**
   ```bash
   # Add to your .env file
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   SESSION_SECRET=your_session_secret
   ```

2. **Verify Configuration**
   ```typescript
   // Test connection
   import { supabase } from './minimal-supabase';
   
   const { data, error } = await supabase.storage.listBuckets();
   console.log('Storage buckets:', data);
   ```

### Step 4: Test the Implementation

1. **Run Basic Tests**
   ```bash
   # Start your server
   npm run dev
   
   # Test file upload
   curl -X POST http://localhost:8081/api/files/upload \
     -H "Authorization: Bearer $YOUR_TOKEN" \
     -F "file=@test.pdf" \
     -F "category=client_document" \
     -F "clientId=test_client_1"
   ```

2. **Verify Permissions**
   ```typescript
   // Test role-based access
   import { fileStorageHelpers } from './file-storage-helpers';
   
   const accessiblePrograms = await fileStorageHelpers.getUserAccessiblePrograms();
   console.log('Accessible programs:', accessiblePrograms);
   ```

## 📁 FILE STRUCTURE

After implementation, your project will have these new files:

```
HALCYON/
├── migrations/
│   └── 0023_create_supabase_storage_system.sql
├── server/
│   ├── file-storage-helpers.ts
│   ├── file-storage-routes.ts
│   └── index.ts (updated)
├── SUPABASE_STORAGE_DOCUMENTATION.md
├── TESTING_CHECKLIST.md
└── SUPABASE_STORAGE_IMPLEMENTATION_GUIDE.md
```

## 🔧 USAGE EXAMPLES

### Basic File Upload

```typescript
import { fileStorageHelpers } from './file-storage-helpers';

// Upload a client document
const result = await fileStorageHelpers.uploadFile({
  file: documentFile,
  category: 'client_document',
  clientId: 'client_123',
  uploadReason: 'Intake form submission',
  isHipaaProtected: true
});

if (result.success) {
  console.log('File uploaded:', result.fileMetadata);
} else {
  console.error('Upload failed:', result.error);
}
```

### File Retrieval

```typescript
// Get all documents for a client
const documents = await fileStorageHelpers.getFilesForEntity({
  clientId: 'client_123',
  category: 'client_document'
});

// Get download URL
const downloadResult = await fileStorageHelpers.getFileDownloadUrl(fileId);
if (downloadResult.success) {
  window.open(downloadResult.url, '_blank');
}
```

### Trip Photo Upload

```typescript
// Upload trip verification photo
const photoResult = await fileStorageHelpers.uploadFile({
  file: photoFile,
  category: 'trip_photo',
  tripId: 'trip_456',
  uploadReason: 'Trip completion verification'
});
```

## 🛡️ SECURITY CONSIDERATIONS

### Role-Based Access Control

The system enforces strict role-based access:

- **Super Admin**: Full system access
- **Corporate Admin**: Corporate-wide access
- **Program Admin**: Program-specific access
- **Program User**: Location-specific access
- **Driver**: Trip-specific access

### HIPAA Compliance

For HIPAA-protected files:

1. **Enhanced Access Controls**: Stricter permission checks
2. **Detailed Audit Logging**: IP address and user agent tracking
3. **Retention Management**: 7-year compliance tracking
4. **Secure Storage**: Supabase handles encryption at rest

### File Organization

Files are organized using a standardized structure:

```
documents/
├── clients/facility-{id}/client-{id}/
├── drivers/driver-{id}/
├── facilities/facility-{id}/
├── vehicles/vehicle-{id}/
└── incidents/incident-{id}/

photos/
├── trips/trip-{id}/
└── vehicles/vehicle-{id}/
```

## 📊 MONITORING AND MAINTENANCE

### Regular Tasks

1. **Monitor File Access Patterns**
   ```sql
   SELECT user_id, action, COUNT(*) as access_count
   FROM file_access_audit
   WHERE accessed_at > NOW() - INTERVAL '7 days'
   GROUP BY user_id, action
   ORDER BY access_count DESC;
   ```

2. **Check Files Nearing Retention**
   ```typescript
   const nearingRetention = await fileStorageHelpers.getFilesNearingRetention(30);
   console.log(`${nearingRetention.files?.length} files nearing retention`);
   ```

3. **Archive Expired Files**
   ```typescript
   const archiveResult = await fileStorageHelpers.archiveExpiredFiles();
   console.log(`Archived ${archiveResult.archivedCount} files`);
   ```

### Performance Monitoring

1. **Monitor Upload Performance**
   ```typescript
   const startTime = Date.now();
   const result = await fileStorageHelpers.uploadFile({...});
   const uploadTime = Date.now() - startTime;
   console.log(`Upload took ${uploadTime}ms`);
   ```

2. **Check Query Performance**
   ```sql
   EXPLAIN ANALYZE SELECT * FROM file_metadata 
   WHERE program_id = 'test_program' 
   ORDER BY created_at DESC 
   LIMIT 50;
   ```

## 🔍 TROUBLESHOOTING

### Common Issues

1. **RLS Policy Errors**
   ```sql
   -- Check if RLS is enabled
   SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'file_metadata';
   
   -- Check policies
   SELECT policyname FROM pg_policies WHERE tablename = 'file_metadata';
   ```

2. **Permission Denied Errors**
   ```typescript
   // Debug user permissions
   const canAccess = await fileStorageHelpers.canUserAccessFile(fileId);
   const accessiblePrograms = await fileStorageHelpers.getUserAccessiblePrograms();
   ```

3. **Upload Failures**
   ```typescript
   // Check file validation
   const validation = validateFileType(file, category);
   if (!validation.valid) {
     console.error('File validation failed:', validation.error);
   }
   ```

### Debug Commands

```sql
-- Check file metadata
SELECT * FROM file_metadata WHERE id = 'file_id';

-- Check user permissions
SELECT * FROM users WHERE user_id = 'user_id';

-- Check audit logs
SELECT * FROM file_access_audit WHERE file_id = 'file_id' ORDER BY accessed_at DESC;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'file_metadata';
```

## 📚 ADDITIONAL RESOURCES

### Documentation Files

- `SUPABASE_STORAGE_DOCUMENTATION.md` - Complete system documentation
- `TESTING_CHECKLIST.md` - Comprehensive testing procedures
- `migrations/0023_create_supabase_storage_system.sql` - Database migration

### API Reference

- `server/file-storage-helpers.ts` - TypeScript helper functions
- `server/file-storage-routes.ts` - REST API endpoints

### Testing

Run the complete testing checklist to verify:

1. Database migration success
2. RLS policy functionality
3. File upload/download operations
4. Role-based access control
5. HIPAA compliance features
6. Audit logging
7. Retention management
8. API endpoint functionality

## 🎯 NEXT STEPS

After successful implementation:

1. **Run Complete Test Suite**: Use the testing checklist to verify all functionality
2. **Configure Monitoring**: Set up alerts for unusual access patterns
3. **Train Users**: Provide documentation for different user roles
4. **Schedule Maintenance**: Set up regular retention compliance checks
5. **Monitor Performance**: Track upload/download performance metrics

## 🚨 IMPORTANT NOTES

- **Always test in development first**: Never apply migrations directly to production
- **Backup your database**: Before running migrations, ensure you have backups
- **Monitor storage usage**: Supabase Storage has usage limits
- **Review audit logs regularly**: For compliance and security monitoring
- **Update retention policies**: As business requirements change

---

## ✅ IMPLEMENTATION COMPLETE

Your Supabase Storage system is now ready for production use! The system provides:

- ✅ HIPAA-compliant file storage
- ✅ Role-based access control
- ✅ Comprehensive audit logging
- ✅ 7-year retention compliance
- ✅ Standardized file organization
- ✅ TypeScript helper functions
- ✅ RESTful API endpoints
- ✅ Complete documentation and testing

For any questions or issues, refer to the documentation files or contact the development team.
