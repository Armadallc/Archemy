# TEST 3: Simple Console Command (Copy-Paste Ready)

## Step-by-Step Instructions

1. **Make sure you're logged in as `admin@halcyon.com`**

2. **Open DevTools → Console tab**

3. **Copy and paste this ENTIRE block (including the await):**

```javascript
(async () => {
  try {
    // Get token from Supabase
    const supabaseUrl = 'https://iuawurdssgbkbavyyvbs.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1YXd1cmRzc2dia2Jhdnl5dmJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NDU1MzEsImV4cCI6MjA3NDQyMTUzMX0.JLcuSTI1mfEMGu_mP9UBnGQyG33vcoU2SzvKo8olkL4';
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    if (!token) {
      console.error('❌ No token found');
      return;
    }
    
    console.log('✅ Token found');
    
    // Test data
    const monarchProgramId = 'monarch_competency';
    const halcyonClientId = '6453aaca-3027-41b1-ba02-7022d0d3d261';
    
    // Make the request
    const response = await fetch('http://localhost:8081/api/trips', {
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
    });
    
    // Get response data
    const data = await response.json();
    
    // Log everything
    console.log('═══════════════════════════════════════');
    console.log('📊 RESPONSE STATUS:', response.status);
    console.log('📊 RESPONSE DATA:', data);
    console.log('═══════════════════════════════════════');
    
    // Show detailed error if it's an error
    if (response.status >= 400) {
      console.error('❌ ERROR DETECTED');
      console.error('   Status:', response.status);
      console.error('   Message:', data.message);
      console.error('   Error:', data.error);
      console.error('   Code:', data.code);
      console.error('   Details:', data.details);
      console.error('   Hint:', data.hint);
      console.error('   Request Body:', data.requestBody);
      console.error('   Full Error:', data.fullError);
      
      if (response.status === 403 || response.status === 400) {
        console.log('✅ SECURITY WORKING: Request was blocked');
      } else if (response.status === 500) {
        console.warn('⚠️ Server Error - Check details above');
      }
    } else if (response.status === 201) {
      console.error('❌ SECURITY GAP: Trip was created!');
    }
    
    return data;
  } catch (error) {
    console.error('❌ CATCH ERROR:', error);
    throw error;
  }
})();
```

4. **Press Enter**

5. **Look for the output** - you should see:
   - `📊 RESPONSE STATUS:`
   - `📊 RESPONSE DATA:` (with full error details)
   - Error details if it's an error

## What You Should See

**If Security is Working:**
```
📊 RESPONSE STATUS: 403
📊 RESPONSE DATA: {message: "Access denied...", ...}
✅ SECURITY WORKING: Request was blocked
```

**If Security Gap:**
```
📊 RESPONSE STATUS: 201
📊 RESPONSE DATA: {id: "...", program_id: "monarch_competency", ...}
❌ SECURITY GAP: Trip was created!
```

**If Database Constraint Blocked It:**
```
📊 RESPONSE STATUS: 500
📊 RESPONSE DATA: {message: "Failed to create trip", error: "...", details: "...", ...}
⚠️ Server Error - Check details above
```

The `details` field will show if it's a database constraint (foreign key violation, etc.)






