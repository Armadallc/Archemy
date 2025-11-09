/**
 * FILE UPLOAD TEST
 * Test file upload functionality once database tables are created
 */

import { fileStorageHelpers } from './file-storage-helpers';

async function testFileUpload() {
  console.log('🧪 Testing File Upload...');
  
  try {
    // Create a test file
    const testContent = 'This is a test document for HALCYON storage system';
    const testFile = new File([testContent], 'test-document.pdf', {
      type: 'application/pdf'
    });
    
    console.log('📄 Created test file:', testFile.name, testFile.size, 'bytes');
    
    // Test upload
    const result = await fileStorageHelpers.uploadFile({
      file: testFile,
      category: 'other',
      uploadReason: 'Testing file storage system'
    });
    
    if (result.success) {
      console.log('✅ File upload successful!');
      console.log('📋 File metadata:', result.fileMetadata);
      
      // Test download
      const downloadResult = await fileStorageHelpers.getFileDownloadUrl(result.fileMetadata!.id);
      
      if (downloadResult.success) {
        console.log('✅ File download URL generated!');
        console.log('🔗 Download URL:', downloadResult.url);
      } else {
        console.error('❌ Download failed:', downloadResult.error);
      }
      
    } else {
      console.error('❌ Upload failed:', result.error);
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

// Run the test
testFileUpload();
