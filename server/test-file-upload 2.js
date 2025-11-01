import { supabase } from './minimal-supabase';

async function testFileUpload() {
  console.log('🔍 Testing file upload with authentication...');
  
  // Test authentication
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@monarch.com',
    password: 'admin123'
  });
  
  if (authError) {
    console.log('❌ Auth failed:', authError.message);
    return;
  }
  
  console.log('✅ Authentication successful');
  
  // Test file upload API endpoint
  console.log('\n📝 Testing file upload API...');
  
  // Create a test file (simulate PDF content)
  const testFileContent = 'This is a test PDF content for HIPAA compliance testing.';
  const testFile = new Blob([testFileContent], { type: 'application/pdf' });
  
  const formData = new FormData();
  formData.append('file', testFile, 'test-document.pdf');
  formData.append('category', 'documents');
  formData.append('programId', 'monarch_competency');
  formData.append('clientId', 'monarch_competency_patient_001');
  
  try {
    const response = await fetch('http://localhost:8081/api/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authData.session?.access_token}`
      },
      body: formData
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ File upload successful!');
      console.log('📋 Upload result:', result);
    } else {
      const error = await response.text();
      console.log('❌ File upload failed:', response.status, response.statusText);
      console.log('Error details:', error);
    }
  } catch (err) {
    console.log('❌ File upload error:', err.message);
  }
  
  // Test file listing
  console.log('\n📥 Testing file listing...');
  
  try {
    const listResponse = await fetch('http://localhost:8081/api/files/entity/client/monarch_competency_patient_001', {
      headers: {
        'Authorization': `Bearer ${authData.session?.access_token}`
      }
    });
    
    if (listResponse.ok) {
      const files = await listResponse.json();
      console.log(`✅ File listing successful! Found ${files?.files?.length || 0} files`);
      if (files && files.files && files.files.length > 0) {
        console.log('📋 Files:', files.files);
      }
    } else {
      const error = await listResponse.text();
      console.log('❌ File listing failed:', listResponse.status, error);
    }
  } catch (err) {
    console.log('❌ File listing error:', err.message);
  }
}

testFileUpload();
