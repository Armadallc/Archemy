# TEST 3: Cross-Corporate Security Test - CORRECTED Command

## Issue Found
The authentication system uses **Supabase sessions**, not localStorage. The token needs to be retrieved from Supabase.

## Corrected Command

Copy and paste this into the browser console:

```javascript
// Get token from Supabase session (not localStorage)
const getSupabaseToken = async () => {
  try {
    // Import Supabase client dynamically
    const { supabase } = await import('@supabase/supabase-js');
    const supabaseUrl = 'https://iuawurdssgbkbavyyvbs.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1YXd1cmRzc2dia2Jhdnl5dmJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NDU1MzEsImV4cCI6MjA3NDQyMTUzMX0.JLcuSTI1mfEMGu_mP9UBnGQyG33vcoU2SzvKo8olkL4';
    const client = supabase.createClient(supabaseUrl, supabaseKey);
    const { data: { session } } = await client.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    console.error('Error getting Supabase token:', error);
    return null;
  }
};

// Run the test
(async () => {
  const token = await getSupabaseToken();
  
  if (!token) {
    console.error('❌ No token found. Make sure you are logged in.');
    return;
  }
  
  console.log('✅ Token found:', token.substring(0, 20) + '...');
  
  const monarchProgramId = 'monarch_competency';
  const halcyonClientId = '6453aaca-3027-41b1-ba02-7022d0d3d261';
  
  // Attempt to create trip for Monarch program (should FAIL)
  fetch('http://localhost:8081/api/trips', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      program_id: monarchProgramId,
      client_id: halcyonClientId,
      pickup_address: '123 Test St, Denver, CO',
      dropoff_address: '456 Test Ave, Denver, CO',
      scheduled_pickup_time: new Date(Date.now() + 86400000).toISOString(),
      passenger_count: 1,
      status: 'scheduled',
      trip_type: 'one_way'
    })
  })
  .then(r => {
    console.log('📊 Response Status:', r.status);
    return r.json().then(data => {
      console.log('📊 Response Data:', data);
      return { status: r.status, data: data };
    });
  })
  .then(result => {
    if (result.status === 403 || result.status === 400) {
      console.log('✅ SECURITY WORKING: Request was blocked');
    } else if (result.status === 201) {
      console.error('❌ SECURITY GAP: Trip was created! This should not happen.');
    } else {
      console.warn('⚠️ Unexpected status:', result.status);
    }
  })
  .catch(error => {
    console.error('❌ Error:', error);
  });
})();
```

## Simpler Alternative (Using Existing Supabase Client)

If the Supabase client is already available in the page, use this simpler version:

```javascript
// Check if Supabase is available in window
(async () => {
  let token = null;
  
  // Try to get from Supabase client if available
  try {
    // This will work if Supabase is already loaded
    const { supabase } = await import('/src/lib/supabase.js');
    const { data: { session } } = await supabase.auth.getSession();
    token = session?.access_token;
  } catch (e) {
    // Fallback: try localStorage
    token = localStorage.getItem('auth_token');
  }
  
  if (!token) {
    console.error('❌ No token found. Make sure you are logged in.');
    return;
  }
  
  console.log('✅ Token found');
  
  const monarchProgramId = 'monarch_competency';
  const halcyonClientId = '6453aaca-3027-41b1-ba02-7022d0d3d261';
  
  fetch('http://localhost:8081/api/trips', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      program_id: monarchProgramId,
      client_id: halcyonClientId,
      pickup_address: '123 Test St, Denver, CO',
      dropoff_address: '456 Test Ave, Denver, CO',
      scheduled_pickup_time: new Date(Date.now() + 86400000).toISOString(),
      passenger_count: 1,
      status: 'scheduled',
      trip_type: 'one_way'
    })
  })
  .then(r => {
    console.log('📊 Status:', r.status);
    return r.json().then(data => ({ status: r.status, data }));
  })
  .then(result => {
    if (result.status === 403 || result.status === 400) {
      console.log('✅ SECURITY WORKING');
    } else if (result.status === 201) {
      console.error('❌ SECURITY GAP - Trip was created!');
    }
  });
})();
```






