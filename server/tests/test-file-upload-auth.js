import { supabase } from './minimal-supabase';

async function testFileUploadWithAuth() {
  console.log('🔍 Testing file upload with proper authentication...');
  
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
  console.log('🔑 Token:', authData.session?.access_token?.substring(0, 50) + '...');
  
  // Create a test PDF file
  const testContent = 'This is a test PDF content for HIPAA compliance testing.';
  const testFile = new Blob([testContent], { type: 'application/pdf' });
  
  const formData = new FormData();
  formData.append('file', testFile, 'test-document.pdf');
  formData.append('category', 'documents');
  formData.append('programId', 'monarch_competency');
  formData.append('clientId', 'monarch_competency_patient_001');
  formData.append('uploadReason', 'Testing file upload functionality');
  
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
      return result.fileMetadata?.id;
    } else {
      const error = await response.text();
      console.log('❌ File upload failed:', response.status, response.statusText);
      console.log('Error details:', error);
    }
  } catch (err) {
    console.log('❌ File upload error:', err.message);
  }
}

testFileUploadWithAuth();
